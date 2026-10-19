import type { Focus, LifeState, MetaSave, RelKey } from '../types';
import { HOUSES, houseById } from '../data/houses';
import { CHEATS, cheatById } from '../data/cheats';
import { jobById, jobTitle } from '../data/jobs';
import { DEATHS, deathById } from '../data/deaths';
import { PLAYER_NAMES, pick } from '../data/names';
import { SHOP, itemCost } from '../data/shop';
import { goalById } from '../data/goals';
import { FOCUS_DESC, FOCUS_NAMES, MOOD_HINT, MOOD_NAMES, REL_NAMES, STAT_KEYS, STAT_NAMES, affectionWord } from '../data/stats';
import {
  STRESS_HIGH, advanceYear, applyOracle, canAdvance, choiceLocked, choose, createLife, currentEvent, focusMul,
  successChance, traitsOf, visibleChoices, rollHouse, rollCheat,
} from '../engine/life';
import { RARITY_NAME } from '../data/traits';
import { type OracleAnswer, oracleById, pickOracle } from '../data/oracle';
import { fill } from '../engine/text';
import { buy, isUnlocked, loadMeta, loadRun, saveRun, settleLife, type SettleResult } from '../meta';
import { GfxStage } from '../gfx/stage';
import { drawPortrait, specFromLife } from '../gfx/portrait';
import { ENEMY_HP, battleFor, graveWeather, sceneFor, timeFor } from '../gfx/mapping';
import { enemySprite, playerSprite } from '../gfx/sprites';
import { hashStr } from '../gfx/painter';
import { lifeTitle, makeShareCard, shareOrDownload } from './sharecard';
import { icon, type IconName } from './icons';
import { econRow, viewDungeon, viewTown } from './world';
import type { MarketCat } from '../data/market';
import { branchPaths } from '../data/branches';
import { battleOdds, isCombat } from '../engine/combat';
import { beginDive, canEnterDungeon, descend, endDiveOnDeath, retreat } from '../engine/dungeon';
import { buy as marketBuy, drink, drinkBest, equip, innRest, repairItems, sell, sellAllLoot } from '../engine/economy';
import { bossEnemy } from '../gfx/mapping';
import { biomeOf } from '../data/items';
import { ENEMY_HP as BOSS_HP } from '../gfx/mapping';

type Screen = 'title' | 'setup' | 'oracle' | 'life' | 'dungeon' | 'town' | 'death' | 'altar' | 'codex' | 'lives';
/** 모바일 바텀시트 탭 */
type Tab = 'none' | 'action' | 'menu';

const MOOD_ICON: Record<string, IconName> = { calm: 'leaf', joy: 'smile', gloom: 'frown', anger: 'angry', fear: 'annoyed' };

interface Settlement extends SettleResult {
  life: LifeState;
  /** 동시대 환생자 초상화 (data URL) */
  peerImgs: string[];
}

/** 환생 전 여신의 문답 진행 상태 */
interface Oracle {
  ids: string[];
  answers: OracleAnswer[];
  /** 직전 답에 대한 여신의 반응 */
  reply: string;
}

interface App {
  screen: Screen;
  meta: MetaSave;
  life: LifeState | null;
  setup: { name: string; cheatId: string; fated: boolean };
  settlement: Settlement | null;
  notice: string;
  gfx: GfxStage | null;
  /** 전투 연출 중: 이 인덱스부터의 연대기는 아직 숨긴다 */
  battleLogFrom: number | null;
  tab: Tab;
  /** 사용자가 접어둔 사건 (같은 사건이면 다시 자동으로 올리지 않는다) */
  dismissedEvent: string | null;
  oracle: Oracle | null;
  /** 방침을 고르지 않고 한 해를 넘기려 했다 (방침 카드를 강조) */
  focusNudge: boolean;
  townTab: 'shop' | 'bag';
  townCat: MarketCat;
}

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const FOCI: Focus[] = ['train', 'study', 'social', 'explore', 'rest'];

export async function mount(root: HTMLElement) {
  const app: App = {
    screen: 'title',
    meta: loadMeta(),
    life: loadRun(),
    setup: { name: pick(PLAYER_NAMES, Math.random), cheatId: 'growth', fated: true },
    settlement: null,
    notice: '',
    gfx: await GfxStage.create(),
    battleLogFrom: null,
    tab: 'none',
    dismissedEvent: null,
    oracle: null,
    focusNudge: false,
    townTab: 'shop',
    townCat: 'weapon',
  };
  if (app.life) repairItems(app.life);
  // 사망 상태로 저장된 삶이 있으면 (정산 직전 새로고침) 바로 정산
  if (app.life?.death) settle(app);

  const render = () => {
    root.innerHTML = view(app);
    syncGfx(app, root); // 캔버스가 붙어 높이가 정해진 뒤에 스크롤
    const log = root.querySelector('.chronicle');
    if (log) log.scrollTop = log.scrollHeight;
    bindSwipe(root, (act, i) => run(act, String(i)));
  };
  const run = (action: string, arg?: string) => {
    if (app.battleLogFrom !== null) {
      app.gfx?.skipBattle();
      return;
    }
    const pending = act(app, action, arg);
    render();
    pending?.then(render);
  };

  root.addEventListener('click', (ev) => {
    if (app.battleLogFrom !== null && (ev.target as HTMLElement).closest('.scene-host, .action, .underbar')) {
      app.gfx?.skipBattle();
      return;
    }
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el || el.hasAttribute('disabled')) return;
    run(el.dataset.act!, el.dataset.arg);
  });
  root.addEventListener('input', (ev) => {
    const el = ev.target as HTMLInputElement;
    if (el.id === 'name-input') app.setup.name = el.value;
  });
  window.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).tagName === 'INPUT') return;
    if (app.screen === 'oracle') {
      if (ev.code === 'Digit1' || ev.code === 'ArrowLeft') run('oracle', '0');
      else if (ev.code === 'Digit2' || ev.code === 'ArrowRight') run('oracle', '1');
      return;
    }
    if (app.screen !== 'life' || !app.life) return;
    const ev2 = currentEvent(app.life);
    if (ev.code === 'Space') {
      ev.preventDefault();
      run('advance');
    } else if (/^Digit[1-9]$/.test(ev.code)) {
      const i = Number(ev.code.slice(5)) - 1;
      if (ev2) run('choose', String(i));
      else if (FOCI[i]) run('focus', FOCI[i]);
    } else if (ev2 && (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight') && visibleChoices(app.life, ev2).length === 2) {
      run('choose', ev.code === 'ArrowLeft' ? '0' : '1');
    }
  });
  render();
}

function settle(app: App) {
  const life = app.life!;
  const r = settleLife(app.meta, life);
  const peerImgs = r.peers.map((p) => drawPortrait({ ...specFromLife(p), dead: false }).toCanvas().toDataURL());
  app.settlement = { life, ...r, peerImgs };
  app.life = null;
}

/** 비동기 연출(전투·공유)이 있으면 끝날 때 resolve 되는 Promise 를 돌려준다 */
function act(app: App, action: string, arg?: string): Promise<void> | void {
  app.notice = '';
  app.focusNudge = false;
  switch (action) {
    case 'go':
      if (arg === 'life' && !app.life) break;
      app.screen = arg as Screen;
      app.tab = 'none';
      if (arg === 'setup') {
        if (!isUnlocked(app.meta, app.setup.cheatId)) app.setup.cheatId = 'growth';
      }
      break;
    case 'continue':
      if (app.life) app.screen = 'life';
      app.tab = 'none';
      break;
    case 'tab':
      // 같은 탭을 다시 누르면 닫는다
      app.tab = app.tab === arg ? 'none' : (arg as Tab);
      if (app.tab !== 'action' && app.life?.pendingEventId) app.dismissedEvent = app.life.pendingEventId;
      if (app.tab === 'action') app.dismissedEvent = null;
      break;
    case 'fate':
      app.setup.fated = arg === 'on';
      break;
    case 'cheat':
      if (arg && isUnlocked(app.meta, arg)) app.setup.cheatId = arg;
      break;
    case 'reroll-name':
      app.setup.name = pick(PLAYER_NAMES, Math.random);
      break;
    case 'begin':
      // 태어나기 전에 여신의 문답 3개
      app.oracle = { ids: pickOracle(Math.random), answers: [], reply: '' };
      app.screen = 'oracle';
      break;
    case 'oracle': {
      const o = app.oracle;
      if (!o) break;
      if (arg === 'skip') {
        birth(app);
        break;
      }
      const a = oracleById(o.ids[o.answers.length]).answers[Number(arg)];
      if (!a) break;
      o.answers.push(a);
      o.reply = a.reply;
      if (o.answers.length >= o.ids.length) birth(app);
      break;
    }
    case 'focus': {
      // 방침을 고르면 그 방침으로 바로 한 해를 보낸다 (고정 중이면 바꾸기만 한다)
      const s = app.life;
      if (!s) break;
      s.focus = arg as Focus;
      if (!s.focusLocked && canAdvance(s)) advanceYear(s);
      app.tab = 'none';
      afterStep(app);
      break;
    }
    case 'lock':
      if (app.life) app.life.focusLocked = !app.life.focusLocked;
      afterStep(app);
      break;
    case 'advance': {
      const s = app.life;
      if (!s || !canAdvance(s)) break;
      if (needsFocus(s)) {
        // 매년 방침을 직접 고른다: 방침 시트를 띄운다
        app.tab = 'action';
        app.focusNudge = true;
        break;
      }
      advanceYear(s);
      if (app.tab === 'action') app.tab = 'none';
      afterStep(app);
      break;
    }
    case 'choose': {
      const s = app.life;
      const ev = s && currentEvent(s);
      if (!s || !ev) break;
      const picked = visibleChoices(s, ev)[Number(arg)];
      const battle = picked && app.gfx ? battleFor(ev.id, picked) : null;
      const logFrom = s.log.length;
      const res = choose(s, Number(arg));
      app.tab = 'none';
      afterStep(app);
      if (battle && res && res.passed !== null && app.gfx) {
        app.battleLogFrom = logFrom;
        return app.gfx
          .playBattle({
            player: playerSprite(specFromLife(s), battle.magic),
            enemy: enemySprite(battle.enemy),
            magic: battle.magic,
            glow: battle.magic ? 0x7ad0ff : s.jobId === 'hero' ? 0xfff0a0 : undefined,
            enemyHp: ENEMY_HP[battle.enemy],
            win: res.passed,
            died: !!s.death,
            groundY: app.gfx.groundY,
          })
          .then(() => {
            app.battleLogFrom = null;
          });
      }
      break;
    }
    case 'see-grave':
      if (app.life?.death) {
        settle(app);
        app.screen = 'death';
        app.tab = 'none';
      }
      break;
    case 'share':
    case 'save-card': {
      const st = app.settlement;
      if (!st) break;
      return makeShareCard(st.life, st.total, st.peers)
        .then((cv) => shareOrDownload(cv, st.life.name, action === 'share'))
        .then((msg) => {
          app.notice = msg;
        });
    }
    case 'buy': {
      const ok = buy(app.meta, arg!);
      app.notice = ok ? '해금되었다!' : '환생석이 부족하다.';
      break;
    }
    // ───── 던전 (시간이 흐르지 않는다) ─────
    case 'dungeon':
      if (app.life && (app.life.dive || canEnterDungeon(app.life))) {
        app.screen = 'dungeon';
        app.tab = 'none';
      }
      break;
    case 'dive':
      if (app.life && canEnterDungeon(app.life) && !app.life.dive) beginDive(app.life, Number(arg));
      afterStep(app);
      break;
    case 'descend': {
      const s = app.life;
      if (!s?.dive) break;
      const bossFloor = s.dive.floor + 5;
      const res = descend(s);
      if (res === 'dead') endDiveOnDeath(s);
      afterStep(app);
      // 보스전 연출
      if (app.gfx) {
        const kind = bossEnemy(bossFloor);
        const magic = s.stats.mana > s.stats.vit;
        app.battleLogFrom = s.log.length;
        return app.gfx
          .playBattle({
            player: playerSprite(specFromLife(s), magic),
            enemy: enemySprite(kind),
            magic,
            glow: magic ? 0x7ad0ff : undefined,
            enemyHp: BOSS_HP[kind],
            win: res === 'cleared' || res === 'conquered',
            died: res === 'dead',
            groundY: app.gfx.groundY,
          })
          .then(() => {
            app.battleLogFrom = null;
          });
      }
      break;
    }
    case 'retreat':
      if (app.life?.dive) {
        app.notice = retreat(app.life);
        app.screen = 'life';
      }
      afterStep(app);
      break;
    case 'drink':
      if (app.life) app.notice = drinkBest(app.life).msg;
      afterStep(app);
      break;

    // ───── 마을 (상점 · 가방 · 여관) ─────
    case 'town':
    case 'town-tab':
      // 상점·가방은 각각의 버튼으로 바로 간다 (어디서 누르든 해당 탭만 켜진다)
      if (app.life && !app.life.dive && !app.life.death) {
        app.screen = 'town';
        app.townTab = arg === 'bag' ? 'bag' : 'shop';
        app.tab = 'none';
      }
      break;
    case 'town-cat':
      app.townCat = arg as MarketCat;
      break;
    case 'mbuy':
      if (app.life) app.notice = marketBuy(app.life, arg!).msg;
      afterStep(app);
      break;
    case 'sell':
      if (app.life) app.notice = sell(app.life, Number(arg)).msg;
      afterStep(app);
      break;
    case 'sell-loot':
      if (app.life) app.notice = sellAllLoot(app.life).msg;
      afterStep(app);
      break;
    case 'equip':
      if (app.life) app.notice = equip(app.life, Number(arg)).msg;
      afterStep(app);
      break;
    case 'drink-item':
      if (app.life) app.notice = drink(app.life, Number(arg)).msg;
      afterStep(app);
      break;
    case 'inn':
      if (app.life) app.notice = innRest(app.life).msg;
      afterStep(app);
      break;

    case 'abandon':
      if (app.life && confirm('이 삶을 포기하고 윤회의 문으로 돌아갈까? (기록과 환생석은 남지 않는다)')) {
        app.life = null;
        saveRun(null);
        app.screen = 'title';
        app.tab = 'none';
      }
      break;
  }
}

/** 한 해를 보내기 전에 방침을 물어야 하는가 (세 살부터, 고정하지 않았을 때) */
const needsFocus = (s: LifeState) => s.age >= 2 && !s.focusLocked;

/** 문답을 마치고 태어난다 */
function birth(app: App) {
  const name = app.setup.name.trim().slice(0, 12) || pick(PLAYER_NAMES, Math.random);
  const fated = app.setup.fated;
  // 출신은 해금한 것 중 운명이 정하고, 권능은 직접 고르거나 운명에 맡긴다
  const origin = {
    houseId: rollHouse(Math.random, app.meta.unlocked),
    cheatId: fated ? rollCheat() : app.setup.cheatId,
  };
  app.life = createLife({
    ...origin,
    name,
    upgrades: app.meta.upgrades,
    npcPast: app.meta.npcMet ?? {},
    lifeNo: app.meta.totalLives + 1,
    fated,
    legends: app.meta.legends ?? [],
  });
  applyOracle(app.life, app.oracle?.answers ?? []);
  app.oracle = null;
  saveRun(app.life);
  app.screen = 'life';
  app.tab = 'none';
  app.dismissedEvent = null;
}

function afterStep(app: App) {
  if (app.life) saveRun(app.life);
}

// ───────────────────────── 화면 ─────────────────────────

function view(app: App): string {
  const body = {
    title: viewTitle, setup: viewSetup, oracle: viewOracle, life: viewLife, death: viewDeath,
    dungeon: (a: App) => (a.life ? viewDungeon(a.life) : viewTitle(a)),
    town: (a: App) => (a.life ? viewTown(a.life, a.townTab, a.townCat) : viewTitle(a)),
    altar: viewAltar, codex: viewCodex, lives: viewLives,
  }[app.screen](app);
  return `
    <header class="topbar">
      <button class="brand" data-act="go" data-arg="title">환생록</button>
      <div class="stones" title="환생석">${icon('diamond-gem')} ${app.meta.soulStones}</div>
    </header>
    <main class="screen view-${app.screen}">${body}</main>
    ${underbar(app)}
    ${app.notice ? `<div class="toast">${esc(app.notice)}</div>` : ''}
  `;
}

/** 모바일 하단 고정 바 (데스크톱에서는 CSS 로 숨긴다) */
function underbar(app: App): string {
  const item = (act: string, arg: string, ic: IconName, label: string, on = false, extra = '') =>
    `<button class="ub-item ${on ? 'on' : ''}" data-act="${act}" data-arg="${arg}" ${extra}><span class="ub-icon">${icon(ic)}</span><span class="ub-label">${label}</span></button>`;
  if ((app.screen === 'dungeon' || app.screen === 'town') && app.life) {
    const s = app.life;
    let center = `<button class="ub-main" data-act="go" data-arg="life"><span>인생</span></button>`;
    if (s.death) center = `<button class="ub-main danger" data-act="see-grave"><span>묘비로</span></button>`;
    else if (app.screen === 'dungeon' && s.dive && s.dive.floor < 100) center = `<button class="ub-main pulse" data-act="descend"><span>하강</span><small>5층</small></button>`;
    const inDive = !!s.dive;
    const inShop = app.screen === 'town' && app.townTab === 'shop';
    const inBag = app.screen === 'town' && app.townTab === 'bag';
    if (inDive) {
      return `
      <nav class="underbar">
        ${item('drink', '', 'potion', '회복약')}
        ${item('dungeon', '', 'sword', '던전', true)}
        ${center}
        ${item('retreat', '', 'door-closed', '귀환')}
        ${item('town', 'bag', 'backpack', '가방', false, 'disabled')}
      </nav>`;
    }
    return `
      <nav class="underbar">
        ${app.screen === 'town' ? item('inn', '', 'bed', '여관') : item('dungeon', '', 'sword', '던전', app.screen === 'dungeon')}
        ${app.screen === 'town' ? item('dungeon', '', 'sword', '던전') : item('drink', '', 'potion', '회복약')}
        ${center}
        ${item('town', 'shop', 'store', '상점', inShop)}
        ${item('town', 'bag', 'backpack', '가방', inBag)}
      </nav>`;
  }
  if (app.screen === 'life' && app.life) {
    const s = app.life;
    const ev = currentEvent(s);
    const tab = effectiveTab(app);
    let center: string;
    if (s.death) center = `<button class="ub-main danger" data-act="see-grave"><span>묘비로</span></button>`;
    else if (ev) center = `<button class="ub-main pulse" data-act="tab" data-arg="action"><span>선택!</span></button>`;
    else if (needsFocus(s)) center = `<button class="ub-main" data-act="advance"><span>한 해</span><small>방침?</small></button>`;
    else center = `<button class="ub-main" data-act="advance"><span>한 해</span><small>▶</small></button>`;
    const busy = !!(ev || s.death);
    return `
      <nav class="underbar">
        ${item('dungeon', '', 'sword', '던전', false, busy || s.age < 12 ? 'disabled' : '')}
        ${item('tab', 'action', ev ? 'warning-diamond' : 'target', ev ? '사건' : '방침', tab === 'action')}
        ${center}
        ${item('town', 'shop', 'store', '상점', false, busy ? 'disabled' : '')}
        ${item('tab', 'menu', 'menu', '정보', tab === 'menu')}
      </nav>`;
  }
  const scr = app.screen;
  return `
    <nav class="underbar">
      ${item('go', 'title', 'home', '홈', scr === 'title')}
      ${app.life ? item('continue', '', 'arrow-right', '이어하기') : item('go', 'setup', 'sparkles', '새 삶', scr === 'setup')}
      ${item('go', 'altar', 'diamond-gem', '제단', scr === 'altar')}
      ${item('go', 'codex', 'book-open', '도감', scr === 'codex')}
      ${item('go', 'lives', 'hourglass', '생애', scr === 'lives')}
    </nav>`;
}

/** 사건·죽음·전투가 있으면 행동 시트를 자동으로 올린다 */
function effectiveTab(app: App): Tab {
  const s = app.life;
  if (!s) return app.tab;
  if (app.battleLogFrom !== null || s.death) return 'action';
  if (s.pendingEventId && app.dismissedEvent !== s.pendingEventId) return 'action';
  return app.tab;
}

function viewTitle(app: App): string {
  const m = app.meta;
  const found = Object.keys(m.codex).length;
  return `
    <section class="title-card">
      <div class="scene-host title-scene" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.5)}"></div>
      <p class="eyebrow">이세계 인생 연대기</p>
      <h1>환생록</h1>
      <p class="lede">눈을 뜨니 이세계! 어느 나라, 어떤 치트로 태어날지는 운명의 주사위가 정한다.<br>
      어떻게 죽을지는… 아무도 모른다. 몇 번이고 다시 태어나 보자!</p>
      <div class="menu">
        ${app.life ? `<button class="btn primary" data-act="continue">이어서 살아간다 · ${esc(app.life.name)} ${app.life.age}세</button>` : ''}
        <button class="btn ${app.life ? '' : 'primary'}" data-act="go" data-arg="setup">새로운 삶</button>
        <button class="btn" data-act="go" data-arg="altar">윤회의 제단</button>
        <button class="btn" data-act="go" data-arg="codex">사인 도감 <span class="muted">${found}/${DEATHS.length}</span></button>
        <button class="btn" data-act="go" data-arg="lives">지난 생애 <span class="muted">${m.totalLives}</span></button>
      </div>
    </section>
  `;
}

function viewSetup(app: App): string {
  const { setup, meta } = app;
  const cheatCard = (id: string, name: string, desc: string) => {
    const unlocked = isUnlocked(meta, id);
    const cost = SHOP.find((i) => i.id === id);
    return `
      <button class="pick ${setup.cheatId === id ? 'selected' : ''} ${unlocked ? '' : 'locked'}"
        data-act="cheat" data-arg="${id}" ${unlocked ? '' : 'disabled'}>
        <strong>${esc(name)}</strong>
        <span>${esc(desc)}</span>
        ${unlocked ? '' : `<em>${icon('lock')} 윤회의 제단 · ${cost ? itemCost(cost, 0) : '?'}</em>`}
      </button>`;
  };
  const echo = meta.upgrades.echo ?? 0;
  const fortune = meta.upgrades.fortune ?? 0;
  // 출신은 언제나 운명: 해금한 출신 중에서 인구 비중대로 태어난다
  const born = HOUSES.filter((h) => isUnlocked(meta, h.id));
  const total = born.reduce((a, h) => a + h.weight, 0);
  const odds = [...born].sort((a, b) => b.weight - a.weight).map((h) =>
    `<li><span>${esc(h.name)}</span><b>${((h.weight / total) * 100).toFixed(1)}%</b></li>`).join('');
  return `
    <h2 class="screen-title">환생 설정</h2>
    <div class="setup-name">
      <label for="name-input">이름</label>
      <input id="name-input" maxlength="12" value="${esc(setup.name)}" autocomplete="off" />
      <button class="btn small" data-act="reroll-name">무작위</button>
    </div>
    <h3>태어날 곳 <span class="muted small">— 운명이 정한다</span></h3>
    <div class="fate-card">
      <p>어느 나라, 어떤 핏줄로 태어날지는 고를 수 없다. 해금한 출신 ${born.length}/${HOUSES.length}종 중에서 인구만큼의 확률로 정해진다.
      윤회의 제단에서 출신을 해금하면 더 다양한 곳에 태어날 수 있다.</p>
      <ul class="odds">${odds}</ul>
    </div>
    <h3>여신의 권능</h3>
    <div class="fate-toggle">
      <button class="fate-opt ${setup.fated ? 'selected' : ''}" data-act="fate" data-arg="on">
        <strong>${icon('sparkles')} 운명에 맡기기</strong><span>권능 ${CHEATS.length}종 전체 중 무작위 · 환생석 +20%</span>
      </button>
      <button class="fate-opt ${setup.fated ? '' : 'selected'}" data-act="fate" data-arg="off">
        <strong>${icon('target')} 직접 고르기</strong><span>해금한 권능 중에서 고른다</span>
      </button>
    </div>
    ${setup.fated ? '' : `<div class="pick-grid">${CHEATS.map((c) => cheatCard(c.id, c.name, c.desc)).join('')}</div>`}
    ${echo || fortune ? `<p class="muted">전생의 잔향: 시작 능력치 +${echo * 2}${fortune ? ` · 행운 +${fortune * 5}` : ''}</p>` : ''}
    <div class="setup-actions">
      <button class="btn" data-act="go" data-arg="title">돌아간다</button>
      <button class="btn primary" data-act="begin">${icon('sparkles')} 환생한다</button>
    </div>
  `;
}

function relLine(s: LifeState, key: RelKey): string {
  const r = s.rels[key];
  if (!r) return '';
  const show = cheatById(s.cheatId).showAffection;
  const word = affectionWord(key, r.affection);
  return `
    <li>
      <span class="rel-role">${REL_NAMES[key]}</span>
      <span class="rel-name">${esc(r.name)}</span>
      <span class="rel-aff ${word === '집착' ? 'danger' : ''}">${show ? `${r.affection} · ` : ''}${word}</span>
    </li>`;
}

function goalList(s: LifeState): string {
  const goals = (s.goals ?? []).map(goalById).filter((g) => !!g);
  if (!goals.length) return '';
  return `<ul class="goals">${goals.map((g) => {
    const ok = g.done(s);
    return `<li class="${ok ? 'done' : ''}"><span>${ok ? icon('check') : '○'}</span>${esc(g.name)}<em>${icon('diamond-gem')}${g.reward}</em></li>`;
  }).join('')}</ul>`;
}

/** 인생 트리에서 지금 서 있는 가지 */
function branchLine(s: LifeState): string {
  const paths = branchPaths(s);
  if (!paths.length) return '';
  return `<div class="branch-line">${icon('map')}<div>${paths.map((p) => `<span>인생 › ${p.map(esc).join(' › ')}</span>`).join('')}</div></div>`;
}

/** 기분 · 스트레스 · 의지력 한 줄 */
function mindRow(s: LifeState): string {
  const mood = s.mood ?? 'calm';
  const stress = s.stress ?? 0;
  const will = s.will ?? 0;
  return `
    <div class="mind">
      <span class="mood-chip" title="${esc(MOOD_HINT[mood])}">${icon(MOOD_ICON[mood])} ${MOOD_NAMES[mood]}</span>
      <span class="meter ${stress >= STRESS_HIGH ? 'hot' : ''}" title="스트레스: 높으면 성장이 떨어지고 과로로 쓰러진다">
        <b><span class="lbl">스트레스</span><span class="ico">${icon('fire')}</span></b><i><u style="width:${stress}%"></u></i><small>${stress}</small>
      </span>
      <span class="meter will" title="의지력: 숙명을 거스르는 선택에 쓴다. 휴식으로 회복">
        <b><span class="lbl">의지력</span><span class="ico">${icon('zap')}</span></b><i><u style="width:${will}%"></u></i><small>${will}</small>
      </span>
    </div>`;
}

function traitList(s: LifeState): string {
  const ts = traitsOf(s);
  if (!ts.length) return '<p class="muted small">평범하게 태어났다. 평범한 게 최고!</p>';
  return `<ul class="traits">${ts.map((t) => `
    <li class="r${t.rarity}"><strong>${esc(t.name)}</strong><em>${RARITY_NAME[t.rarity]}</em><span>${esc(t.desc)}</span></li>`).join('')}</ul>`;
}

function viewOracle(app: App): string {
  const o = app.oracle;
  if (!o) return viewTitle(app);
  const q = oracleById(o.ids[Math.min(o.answers.length, o.ids.length - 1)]);
  return `
    <section class="oracle">
      <p class="eyebrow">환생 전 · 여신의 문답 ${o.answers.length + 1}/${o.ids.length}</p>
      <div class="goddess-bubble">
        <span class="goddess-icon">${icon('sparkles')}</span>
        <div>
          ${o.reply ? `<p class="muted small">"${esc(o.reply)}"</p>` : '<p class="muted small">"잠깐! 태어나기 전에 몇 가지만 물어볼게♪"</p>'}
          <p class="goddess-q">"${esc(q.text)}"</p>
        </div>
      </div>
      <div class="event-card swipeable" data-swipe="oracle" data-left="${esc(q.answers[0].label)}" data-right="${esc(q.answers[1].label)}">
        <div class="swipe-label"></div>
        <p class="swipe-guide"><b class="l">← 왼쪽</b> · 카드를 밀어서 대답 · <b class="r">오른쪽 →</b></p>
        <div class="choices duo">
          ${q.answers.map((a, i) => `
            <button class="choice ${i === 0 ? 'left' : 'right'}" data-act="oracle" data-arg="${i}"><kbd>${i === 0 ? '←' : '→'}</kbd><span>${esc(a.label)}</span></button>`).join('')}
        </div>
      </div>
      <button class="link" data-act="oracle" data-arg="skip">건너뛰고 바로 태어난다</button>
    </section>`;
}

function viewLife(app: App): string {
  const s = app.life;
  if (!s) return viewTitle(app);
  const ev = currentEvent(s);
  const job = jobById(s.jobId);
  const tab = effectiveTab(app);
  const cheat = cheatById(s.cheatId);

  // 연대기: 나이별로 묶는다
  const groups: { age: number; items: LifeState['log'] }[] = [];
  const shown = app.battleLogFrom === null ? s.log : s.log.slice(0, app.battleLogFrom);
  for (const l of shown) {
    const last = groups[groups.length - 1];
    if (last && last.age === l.age) last.items.push(l);
    else groups.push({ age: l.age, items: [l] });
  }
  const chronicle = groups.map((g) => `
    <div class="year">
      <div class="year-age">${g.age}세</div>
      <div class="year-body">${g.items.map((l) => `<p class="tone-${l.tone}">${esc(l.text)}</p>`).join('')}</div>
    </div>`).join('');

  const stats = STAT_KEYS.map((k) => `
    <div class="stat">
      <span class="stat-name">${STAT_NAMES[k]}</span>
      <div class="bar"><div class="fill fill-${k}" style="width:${s.stats[k]}%"></div></div>
      <span class="stat-val">${s.stats[k]}</span>
    </div>`).join('');

  const rels = (['friend', 'rival', 'mentor', 'spouse'] as RelKey[]).map((k) => relLine(s, k)).join('');
  const relBlock = `<ul class="rels">${rels || '<li class="muted small">아직 아무도 없다. 인연을 만들어 보자!</li>'}</ul>`;
  const badges = [
    s.extraLives ? `불굴 ×${s.extraLives}` : '',
    s.fated ? '운명' : '',
  ].filter(Boolean).join(' · ');

  let panel: string;
  if (app.battleLogFrom !== null) {
    panel = `
      <div class="death-call">
        <p class="eyebrow">전투</p>
        <p class="muted small">화면을 누르거나 Space 를 누르면 건너뛴다.</p>
      </div>`;
  } else if (s.death) {
    panel = `
      <div class="death-call">
        <p class="death-cause">${esc(deathById(s.death.causeId).name)}</p>
        <p class="muted">${esc(s.name)}의 이번 생은 여기까지! 다음 생을 기약하자.</p>
        <button class="btn primary wide" data-act="see-grave">묘비 앞에 선다</button>
      </div>`;
  } else if (ev) {
    const choices = visibleChoices(s, ev);
    const duo = choices.length === 2;
    const swipe = duo && !choices.some((c) => choiceLocked(s, c));
    panel = `
      <div class="event-card ${swipe ? 'swipeable' : ''}" ${swipe ? `data-swipe="choose" data-left="${esc(choices[0].label)}" data-right="${esc(choices[1].label)}"` : ''}>
        ${swipe ? '<div class="swipe-label"></div>' : ''}
        <p class="eyebrow">${s.age}세의 사건</p>
        <h3>${esc(ev.title)}</h3>
        <p class="event-text">${esc(fill(ev.text, s))}</p>
        ${swipe ? '<p class="swipe-guide"><b class="l">← 왼쪽</b> · 카드를 밀어서 선택 · <b class="r">오른쪽 →</b></p>' : ''}
        <div class="choices ${duo ? 'duo' : ''}">
          ${choices.map((c, i) => {
            const locked = choiceLocked(s, c);
            const notes = [
              c.check && !isCombat(ev.id, c) && cheat.showChance ? `${icon('search')}성공률 ${successChance(s, c.check)}%` : '',
              c.will ? `${icon('zap')}의지력 ${c.will}${locked ? ` (부족: ${s.will ?? 0})` : ''}` : '',
            ].filter(Boolean).join(' · ');
            const odds = isCombat(ev.id, c) ? battleOdds(s, c) : null;
            return `
            <button class="choice ${duo ? (i === 0 ? 'left' : 'right') : ''} ${c.will ? 'defy' : ''}" data-act="choose" data-arg="${i}" ${locked ? 'disabled' : ''}>
              <kbd>${duo ? (i === 0 ? '←' : '→') : i + 1}</kbd>
              <span>${esc(c.label)}</span>
              ${odds ? `<em class="odds-line">${icon('sword')}전투력 <b>${odds.cp}</b> vs 적 <b>${odds.ep}</b> · <span class="winp ${odds.p >= 60 ? 'good' : odds.p >= 35 ? 'mid' : 'bad'}">승률 ${odds.p}%</span></em>` : ''}
              ${notes ? `<em>${notes}</em>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>`;
  } else {
    const young = s.age < 2;
    panel = `
      <div class="focus-card ${app.focusNudge ? 'nudge' : ''}">
        <p class="eyebrow">올해의 방침</p>
        ${young ? '' : s.focusLocked
          ? '<p class="muted small focus-hint">방침이 고정되어 있다. 누르면 방침만 바뀐다.</p>'
          : '<p class="muted small focus-hint">방침을 누르면 그 방침으로 한 해가 지나간다. <kbd>1</kbd>~<kbd>5</kbd></p>'}
        <div class="focus-grid">
          ${FOCI.map((f) => {
            const mul = f === 'rest' ? 1 : focusMul(s, f);
            const tag = Math.abs(mul - 1) < 0.05 ? '' : `<em class="${mul > 1 ? 'up' : 'down'}">×${mul.toFixed(1)}</em>`;
            return `
            <button class="focus focus-${f} ${s.focus === f && (s.focusLocked || young) ? 'selected' : ''} ${s.focus === f && !s.focusLocked && !young ? 'last' : ''}" data-act="focus" data-arg="${f}" ${young ? 'disabled' : ''}>
              <strong>${FOCUS_NAMES[f]} ${tag}</strong>
              <span>${FOCUS_DESC[f]}</span>
            </button>`;
          }).join('')}
        </div>
        ${!young && (s.stress ?? 0) >= STRESS_HIGH && s.focus !== 'rest' ? '<p class="warn small">스트레스가 높아 성장이 떨어지고 있다. 한 해 쉬어 가자!</p>' : ''}
        ${young ? '<p class="muted small">아직 너무 어리다. 세 살이 되면 방침을 정할 수 있다.</p>' : ''}
        ${young ? '' : `<label class="focus-lock"><input type="checkbox" data-act="lock" ${s.focusLocked ? 'checked' : ''} /> 이 방침으로 계속 (매년 묻지 않기)</label>`}
        ${young || s.focusLocked ? '<button class="btn primary wide advance" data-act="advance">한 해를 보낸다 <kbd>Space</kbd></button>' : ''}
      </div>`;
  }

  return `
    <aside class="sheet">
      <div class="sheet-top">
        <div class="portrait-host" data-gfx="portrait"></div>
        <div class="sheet-main">
          <div class="sheet-head">
            <h2>${esc(s.name)}</h2>
            <p class="age">${s.age}세 · ${esc(job ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '미성년' : '무직')}</p>
            <p class="muted small">${esc(houseById(s.houseId).name)} · ${esc(cheat.name)}${badges ? ` · ${badges}` : ''}</p>
          </div>
          <div class="stats">${stats}</div>
          ${mindRow(s)}
          ${econRow(s)}
        </div>
      </div>
      <div class="sheet-extra">
        ${branchLine(s)}
        <h4>타고난 특성</h4>
        ${traitList(s)}
        <h4>이번 생의 목표</h4>
        ${goalList(s)}
        <h4>인연</h4>
        ${relBlock}
        <button class="link" data-act="abandon">이 삶을 포기한다</button>
      </div>
    </aside>
    <section class="center">
      <div class="scene-host" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.45)}"></div>
      <div class="chronicle">${chronicle}</div>
    </section>
    <section class="action ${tab === 'action' ? 'open' : ''}">
      <button class="sheet-handle" data-act="tab" data-arg="none" aria-label="접기"></button>
      <div class="quick">
        <button class="btn" data-act="dungeon" ${ev || s.death || s.age < 12 ? 'disabled' : ''}>${icon('sword')} 던전${s.age < 12 ? ' (12세~)' : ''}</button>
        <button class="btn" data-act="town" ${ev || s.death ? 'disabled' : ''}>${icon('store')} 마을</button>
      </div>
      ${panel}
    </section>
    <section class="m-panel ${tab === 'menu' ? 'open' : ''}">
      <button class="sheet-handle" data-act="tab" data-arg="none" aria-label="접기"></button>
      ${branchLine(s)}
      <h4>기분</h4>
      <p class="small mood-line">${icon(MOOD_ICON[s.mood ?? 'calm'])} ${MOOD_NAMES[s.mood ?? 'calm']} — <span class="muted">${MOOD_HINT[s.mood ?? 'calm']}</span></p>
      <h4>타고난 특성</h4>
      ${traitList(s)}
      <h4>이번 생의 목표</h4>
      ${goalList(s)}
      <h4>인연</h4>
      ${relBlock}
      <h4>메뉴</h4>
      <div class="menu">
        <button class="btn" data-act="go" data-arg="title">${icon('home')} 윤회의 문 (삶은 저장된다)</button>
        <button class="btn" data-act="go" data-arg="altar">${icon('diamond-gem')} 윤회의 제단</button>
        <button class="btn" data-act="go" data-arg="codex">${icon('book-open')} 사인 도감</button>
        <button class="btn" data-act="go" data-arg="lives">${icon('hourglass')} 지난 생애</button>
        <button class="btn danger" data-act="abandon">이 삶을 포기한다</button>
      </div>
    </section>
  `;
}

function viewDeath(app: App): string {
  const st = app.settlement;
  if (!st) return viewTitle(app);
  const s = st.life;
  const d = deathById(s.death!.causeId);
  const peers = st.peers.map((p, i) => `
    <li class="peer">
      <img class="pixel" src="${st.peerImgs[i]}" alt="" width="64" height="64" />
      <div>
        <strong>${esc(p.name)}</strong>
        <span class="muted small">${esc(houseById(p.houseId).name)} · ${esc(lifeTitle(p))}</span>
        <span class="small">향년 ${p.age}세 · <b class="tone-death">${esc(deathById(p.death?.causeId ?? 'old_age').name)}</b></span>
      </div>
    </li>`).join('');
  return `
    <div class="grave-wrap">
      <div class="grave-left">
        <div class="scene-host" data-gfx="scene"></div>
        <div class="tombstone">
          <div class="portrait-host small" data-gfx="portrait"></div>
          <p class="grave-title">${esc(lifeTitle(s))}</p>
          <h2>${esc(s.name)}</h2>
          <p class="grave-years">0 — ${s.age} · ${esc(houseById(s.houseId).name)}</p>
          <p class="grave-cause">${esc(d.name)}</p>
          <p class="grave-epitaph">${esc(d.epitaph)}</p>
          ${st.deed ? `<p class="grave-deed">${icon('crown')} 전설이 되었다 — 「${esc(st.deed)} ${esc(s.name)}」<br><span class="muted small">다음 생에서 다시 만나게 될지도?</span></p>` : ''}
          ${goalList(s)}
        </div>
      </div>
      <div class="settle">
        <div class="goddess-bubble">
          <span class="goddess-icon">${icon('sparkles')}</span>
          <div><p class="eyebrow">환생의 여신</p>${st.goddess.map((l) => `<p>"${esc(l)}"</p>`).join('')}</div>
        </div>
        ${st.firstDeath ? '<p class="new-death">새로운 죽음이 도감에 기록되었다!</p>' : ''}
        <h3>환생석 정산</h3>
        <ul>${st.lines.map((l) => `<li><span>${esc(l.label)}</span><span>+${l.value}</span></li>`).join('')}</ul>
        <p class="settle-total">합계 <strong>◆ ${st.total}</strong></p>
        <h3>같은 해 환생한 이들</h3>
        <p class="muted small">당신과 같은 해, 같은 여신에게 등을 떠밀린 네 사람의 일생.</p>
        <ul class="peers">${peers}</ul>
        <div class="share-row">
          <button class="btn" data-act="save-card">${icon('download')} 결과 카드 저장</button>
          <button class="btn" data-act="share">${icon('share')} 공유하기</button>
        </div>
        <div class="setup-actions">
          <button class="btn" data-act="go" data-arg="altar">윤회의 제단</button>
          <button class="btn primary" data-act="go" data-arg="setup">다시 태어난다</button>
        </div>
      </div>
    </div>
  `;
}

function viewAltar(app: App): string {
  const m = app.meta;
  const row = (id: string) => {
    const item = SHOP.find((i) => i.id === id)!;
    let name: string, desc: string, state: string, cost: number | null;
    if (item.kind === 'upgrade') {
      const lv = m.upgrades[id] ?? 0;
      name = `${item.name} <span class="muted">${lv}/${item.maxLevel}</span>`;
      desc = item.desc ?? '';
      cost = lv >= (item.maxLevel ?? 1) ? null : itemCost(item, lv);
      state = cost === null ? '최대' : '';
    } else {
      const def = item.kind === 'house' ? houseById(id) : cheatById(id);
      name = esc(def.name);
      desc = def.desc;
      cost = isUnlocked(m, id) ? null : itemCost(item, 0);
      state = cost === null ? '해금됨' : '';
    }
    return `
      <li class="altar-item">
        <div><strong>${name}</strong><p class="muted small">${esc(desc)}</p></div>
        ${cost === null
          ? `<span class="muted">${state}</span>`
          : `<button class="btn small" data-act="buy" data-arg="${id}" ${m.soulStones < cost ? 'disabled' : ''}>◆ ${cost}</button>`}
      </li>`;
  };
  const section = (title: string, kind: string) =>
    `<h3>${title}</h3><ul class="altar">${SHOP.filter((i) => i.kind === kind).map((i) => row(i.id)).join('')}</ul>`;
  return `
    <h2 class="screen-title">윤회의 제단</h2>
    <p class="muted">환생석으로 다음 생을 준비하자. 권능을 해금하면 직접 고를 수 있고, 출신을 해금하면 그곳에서도 태어날 수 있게 된다.</p>
    ${section('잔향 (영구 강화)', 'upgrade')}
    ${section('권능 (직접 고르기 해금)', 'cheat')}
    ${section('출신 (태어날 수 있는 곳 추가)', 'house')}
    <div class="setup-actions">
      <button class="btn" data-act="go" data-arg="title">돌아간다</button>
      <button class="btn primary" data-act="go" data-arg="setup">새로운 삶</button>
    </div>
  `;
}

function viewCodex(app: App): string {
  const m = app.meta;
  return `
    <h2 class="screen-title">사인 도감 <span class="muted">${Object.keys(m.codex).length}/${DEATHS.length}</span></h2>
    <div class="codex">
      ${DEATHS.map((d) => {
        const n = m.codex[d.id];
        return n
          ? `<div class="codex-item"><strong>${esc(d.name)}</strong><p>${esc(d.epitaph)}</p><span class="muted small">${n}회</span></div>`
          : `<div class="codex-item locked"><strong>???</strong><p class="muted">${esc(d.hint)}</p></div>`;
      }).join('')}
    </div>
    <div class="setup-actions"><button class="btn" data-act="go" data-arg="title">돌아간다</button></div>
  `;
}

function viewLives(app: App): string {
  const lives = app.meta.lives;
  return `
    <h2 class="screen-title">지난 생애</h2>
    ${lives.length === 0 ? '<p class="muted">아직 끝난 삶이 없다. 첫 번째 이세계 인생을 시작해 보자!</p>' : `
    <ul class="life-list">${lives.map((l) => `
      <li>
        <div class="l-top"><strong>${esc(l.name)}</strong><em>${icon('diamond-gem')} ${l.stones}</em></div>
        <span class="muted small">${esc(houseById(l.houseId).name)} · ${esc(l.title)}</span>
        <span class="small">향년 ${l.age}세 · <b class="tone-death">${esc(deathById(l.causeId).name)}</b>${l.goalsDone !== undefined ? ` · 목표 ${l.goalsDone}/3` : ''}</span>
        ${l.deed ? `<span class="small deed">${icon('crown')} ${esc(l.deed)} 전설</span>` : ''}
      </li>`).join('')}
    </ul>`}
    <div class="setup-actions"><button class="btn" data-act="go" data-arg="title">돌아간다</button></div>
  `;
}

// ───────────────────────── 스와이프 (2지선다) ─────────────────────────

function bindSwipe(root: HTMLElement, pickChoice: (act: string, i: number) => void) {
  const card = root.querySelector<HTMLElement>('.event-card.swipeable');
  if (!card) return;
  let startX = 0, dx = 0, dragging = false;
  // 밀고 있는 방향의 선택지를 카드 위에 띄운다 (Reigns 방식)
  const label = card.querySelector<HTMLElement>('.swipe-label')!;
  const reset = () => {
    card.style.transform = '';
    card.classList.remove('dragging');
    label.style.opacity = '0';
  };
  card.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragging = true;
    startX = e.clientX;
    dx = 0;
    card.setPointerCapture(e.pointerId);
    card.classList.add('dragging');
  });
  card.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
    label.textContent = (dx < 0 ? `← ${card.dataset.left}` : `${card.dataset.right} →`);
    label.classList.toggle('right', dx > 0);
    label.style.opacity = String(Math.min(1, Math.abs(dx) / 90));
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dx) > 90) {
      card.style.transform = `translateX(${Math.sign(dx) * 500}px) rotate(${Math.sign(dx) * 20}deg)`;
      setTimeout(() => pickChoice(card.dataset.swipe ?? 'choose', dx < 0 ? 0 : 1), 160);
    } else reset();
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}

// ───────────────────────── 도트 그래픽 동기화 ─────────────────────────

function syncGfx(app: App, root: HTMLElement) {
  const g = app.gfx;
  if (!g) return;
  const sceneHost = root.querySelector<HTMLElement>('[data-gfx="scene"]');
  const portraitHost = root.querySelector<HTMLElement>('[data-gfx="portrait"]');
  if (app.screen === 'life' && app.life) {
    const s = app.life;
    g.setPortrait(specFromLife(s));
    // 전투 중에는 장면을 바꾸지 않는다
    if (app.battleLogFrom === null) {
      const kind = sceneFor(s);
      g.setScene(kind, hashStr(s.name) % 97, undefined, timeFor(s, kind));
    }
  } else if (app.screen === 'death' && app.settlement) {
    const s = app.settlement.life;
    g.setPortrait(specFromLife(s));
    g.setScene('grave', hashStr(s.name) % 97, graveWeather(s.death!.causeId));
  } else if (app.screen === 'dungeon' && app.life) {
    const s = app.life;
    if (app.battleLogFrom === null) {
      const b = biomeOf(Math.max(1, s.dive?.floor ?? 1));
      g.setPortrait(specFromLife(s));
      g.setScene(b.scene, (s.dive?.floor ?? 0) + 7, b.weather, 'night');
    }
  } else if (app.screen === 'town' && app.life) {
    g.setPortrait(specFromLife(app.life));
    g.setScene('village', hashStr(app.life.name) % 97);
  } else if (app.screen === 'title') {
    g.setScene('title', 3);
  }
  g.mountScene(sceneHost);
  g.mountPortrait(portraitHost);
}
