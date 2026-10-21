import morphdom from 'morphdom';
import { Music } from '../audio/music';
import { moodFor } from '../audio/compose';
import type { Focus, LifeState, MetaSave, RelKey, StatKey } from '../types';
import { HOUSES, houseById } from '../data/houses';
import { CHEATS, cheatById } from '../data/cheats';
import { jobById, jobTitle } from '../data/jobs';
import { DEATHS, deathById } from '../data/deaths';
import { type Gender, namesOf, pick } from '../data/names';
import { SHOP, itemCost } from '../data/shop';
import { goalById } from '../data/goals';
import { FOCUS_DESC, FOCUS_NAMES, MOOD_HINT, MOOD_NAMES, REL_NAMES, GRADED, STAT_INFO, STAT_KEYS, STAT_NAMES, affectionWord } from '../data/stats';
import {
  MAX_INJURY, MONTHS, STAT_MAX, gradeOf, STRESS_HIGH, advanceMonth, applyOracle, canAdvance, genderOf, choiceLocked, choose, createLife, jobReqMissing, currentEvent, focusMul,
  successChance, traitsOf, visibleChoices, rollHouse, rollCheat,
} from '../engine/life';
import { RARITY_NAME } from '../data/traits';
import { type OracleAnswer, oracleById, pickOracle } from '../data/oracle';
import { fill } from '../engine/text';
import { cloudEnabled, connectAuth, getChoice, setChoice, signIn, signOut, startCloud, type CloudUser, type Provider, type SyncState } from '../cloud';
import { buy, isUnlocked, loadMeta, loadRun, saveRun, settleLife, type SettleResult } from '../meta';
import { GfxStage } from '../gfx/stage';
import { drawPortrait, specFromLife } from '../gfx/portrait';
import { ENEMY_HP, battleFor, graveWeather, sceneFor, timeFor } from '../gfx/mapping';
import { enemySprite, playerSprite, type EnemyKind } from '../gfx/sprites';
import { hashStr } from '../gfx/painter';
import { lifeTitle, makeShareCard, shareOrDownload } from './sharecard';
import { icon, type IconName } from './icons';
import { econRow, viewDungeon, viewTown } from './world';
import type { MarketCat } from '../data/market';
import { branchPaths } from '../data/branches';
import { BATTLE_ENEMY, CP_WEIGHT, ENEMY_NAME, battleOdds, combatPower, isCombat } from '../engine/combat';
import { MAGIC_COST, attackMul, autoDuel, critChance, duelTurn, fleeChance, magicMul, startDuel, type Duel, type DuelAction } from '../engine/duel';
import { beginDive, bossAhead, canEnterDungeon, descendPath, endDiveOnDeath, retreat, settleBoss, settleMob } from '../engine/dungeon';
import { clampHp, maxHp, buy as marketBuy, drink, drinkBest, equip, fmtGold, innRest, payLabel, repairItems, sell, sellAllLoot, unequipTrinket } from '../engine/economy';
import { statOf, trinketBonus } from '../engine/trinket';
import { rec } from '../engine/record';
import { bossEnemy, mobEnemy } from '../gfx/mapping';
import { biomeOf } from '../data/items';
import { ENEMY_HP as BOSS_HP } from '../gfx/mapping';

type Screen = 'gate' | 'title' | 'setup' | 'oracle' | 'life' | 'dungeon' | 'town' | 'credits' | 'death' | 'altar' | 'codex' | 'lives';
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
  /** name 이 비어 있으면 태어날 때 성별에 맞는 이름을 무작위로 짓는다 */
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
  /** 성장을 고르지 않고 한 해를 넘기려 했다 (성장 카드를 강조) */
  focusNudge: boolean;
  /** 시간 흐름: 일시 정지 · 한 해의 길이(초) */
  paused: boolean;
  pace: Pace;
  /** 이번 달이 얼마나 지났나 (0~1) */
  monthFrac: number;
  /** 설명을 펼친 능력치 (cp = 전투력) */
  statInfo: StatKey | 'cp' | null;
  /** 진행 중인 턴제 전투 */
  duel: DuelState | null;
  /** 던전 입장 안내창 */
  dgConfirm: boolean;
  /** 능력치 변화 잔상: 누적 변화량과 남은 틱 */
  ghost: Partial<Record<StatKey, { d: number; ttl: number }>>;
  statSnap: Partial<Record<StatKey, number>> | null;
  /** 마지막으로 알린 스트레스 단계 (0 · 80 · 90 · 100) */
  stressTier: number;
  townTab: 'shop' | 'bag';
  townCat: MarketCat;
  music: Music;
  cloud: CloudView;
}

/** 로그인·클라우드 저장 상태 */
interface CloudView {
  user: CloudUser | null;
  /** 이전 로그인이 이어지는지 확인 중 */
  checking: boolean;
  /** 로그인 창이 열려 있다 */
  busy: boolean;
  error: string;
  sync: SyncState;
  /** 게스트로 계속하기 안내창 */
  guestAsk: boolean;
  /** 이 기기와 계정의 저장이 달라서 고르는 중 */
  conflict: { local: string; cloud: string; resolve: (pick: 'local' | 'cloud') => void } | null;
}

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const FOCI: Focus[] = ['train', 'study', 'social', 'explore', 'rest'];

export async function mount(root: HTMLElement) {
  const choice = getChoice();
  const app: App = {
    // 아직 고른 적이 없는 첫 방문이면 로그인 화면부터 (Firebase 설정이 없어도 화면은 보인다)
    screen: choice === null ? 'gate' : 'title',
    meta: loadMeta(),
    life: loadRun(),
    setup: { name: '', cheatId: 'growth', fated: true },
    settlement: null,
    notice: '',
    gfx: await GfxStage.create(),
    battleLogFrom: null,
    tab: 'none',
    dismissedEvent: null,
    oracle: null,
    focusNudge: false,
    paused: false,
    pace: loadPace(),
    monthFrac: 0,
    statInfo: null,
    duel: null,
    dgConfirm: false,
    ghost: {},
    statSnap: null,
    stressTier: 0,
    townTab: 'shop',
    townCat: 'weapon',
    music: new Music(),
    cloud: { user: null, checking: cloudEnabled && choice === 'user', busy: false, error: '', sync: 'idle', guestAsk: false, conflict: null },
  };
  if (app.life) repairItems(app.life);
  // 사망 상태로 저장된 삶이 있으면 (정산 직전 새로고침) 바로 정산
  if (app.life?.death) settle(app);

  const render = () => {
    // 바뀐 부분만 고친다: 통째로 갈아 끼우면 달이 넘어갈 때마다 글자가 깜빡이고 등장 애니메이션이 다시 돈다
    morphdom(root, `<div>${view(app)}</div>`, {
      childrenOnly: true,
      // 도트 캔버스가 붙는 자리는 속을 건드리지 않는다
      onBeforeElChildrenUpdated: (from, to) => !((from as HTMLElement).dataset?.gfx && (to as HTMLElement).dataset?.gfx),
      // 입력 중인 칸은 그대로 둔다
      onBeforeElUpdated: (from, to) => {
        if (from === document.activeElement && from.tagName === 'INPUT') return false;
        // 캔버스 크기에서 정한 장면 높이(--ch)는 다시 그려도 유지
        if (from.classList.contains('scene-host') && from.getAttribute('style')) to.setAttribute('style', from.getAttribute('style')!);
        return true;
      },
    });
    syncGfx(app, root); // 캔버스가 붙어 높이가 정해진 뒤에 스크롤
    app.music.setMood(moodFor(app.screen));
    const log = root.querySelector('.chronicle');
    if (log) log.scrollTop = log.scrollHeight;
    bindSwipe(root, (act, i) => run(act, String(i)));
  };
  if (cloudEnabled) {
    startCloud({
      onUser: (user) => {
        app.cloud.user = user;
        app.cloud.checking = false;
        if (user) {
          setChoice('user');
          if (app.screen === 'gate') app.screen = 'title';
        } else if (getChoice() === 'user') {
          // 로그아웃했거나 로그인이 풀렸다
          setChoice(null);
          app.cloud.sync = 'idle';
          app.screen = 'gate';
        }
        render();
      },
      onSync: (state) => {
        app.cloud.sync = state;
        render();
      },
      onConflict: (local, cloud) =>
        new Promise((resolve) => {
          app.cloud.conflict = { local, cloud, resolve };
          render();
        }),
    });
    if (choice !== 'guest') connectAuth();
  }
  const run = (action: string, arg?: string) => {
    if (app.battleLogFrom !== null) {
      app.gfx?.skipBattle();
      return;
    }
    const pending = act(app, action, arg);
    afterStep(app);
    render();
    pending?.then(() => {
      afterStep(app);
      render();
    });
  };

  root.addEventListener('click', (ev) => {
    if (app.duel?.busy && (ev.target as HTMLElement).closest('.scene-host')) {
      app.gfx?.skipBattle();
      return;
    }
    if (app.battleLogFrom !== null && (ev.target as HTMLElement).closest('.scene-host, .action, .underbar')) {
      app.gfx?.skipBattle();
      return;
    }
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el || el.hasAttribute('disabled')) return;
    run(el.dataset.act!, el.dataset.arg);
  });
  // 크레딧이 끝까지 올라가면 묘비로
  root.addEventListener('animationend', (ev) => {
    if ((ev.target as HTMLElement).classList?.contains('credits-roll')) run('credits-end');
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
    if (app.duel) {
      const acts: DuelAction[] = ['attack', 'magic', 'guard', 'flee'];
      if (/^Digit[1-4]$/.test(ev.code)) run('duel', acts[Number(ev.code.slice(5)) - 1]);
      else if ((ev.code === 'Enter' || ev.code === 'Space') && app.duel.done) {
        ev.preventDefault();
        run('duel-end');
      }
      return;
    }
    if (app.screen !== 'life' || !app.life) return;
    const ev2 = currentEvent(app.life);
    if (ev.code === 'Space') {
      ev.preventDefault();
      run('pause');
    } else if (/^Digit[1-9]$/.test(ev.code)) {
      const i = Number(ev.code.slice(5)) - 1;
      if (ev2) run('choose', String(i));
      else if (FOCI[i]) run('focus', FOCI[i]);
    } else if (ev2 && (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight') && visibleChoices(app.life, ev2).length === 2) {
      run('choose', ev.code === 'ArrowLeft' ? '0' : '1');
    }
  });
  // ── 시간: 한 해 = pace 초. 한 달씩 저절로 흐르고, 선택이 필요한 사건이 뜨면 멈춘다 ──
  // 진행도는 app.monthFrac 하나로 관리한다 (화면을 다시 그려도 같은 값 → 막대가 되감기지 않는다)
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(250, now - last);
    last = now;
    const s = app.life;
    if (s && timeFlows(app)) {
      app.monthFrac += dt / ((app.pace * 1000) / MONTHS);
      if (app.monthFrac >= 1) {
        app.monthFrac = Math.min(0.99, app.monthFrac - 1);
        advanceMonth(s);
        tickGhost(app);
        afterStep(app);
        render();
        popPay(root, s);
      }
      const bar = root.querySelector<HTMLElement>('.year-bar > i');
      if (bar) bar.style.width = yearPct(s, app.monthFrac);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  render();
}

type Pace = 10 | 15 | 25;

/** 올해 진행도 (%) */
const yearPct = (s: LifeState, frac: number) => `${(((s.month ?? 0) + frac) / MONTHS) * 100}%`;
const PACE_KEY = 'igpw-pace-v1';
const PACES: { v: Pace; name: string }[] = [{ v: 25, name: '느리게' }, { v: 15, name: '보통' }, { v: 10, name: '빠르게' }];

function loadPace(): Pace {
  try {
    const v = Number(localStorage.getItem(PACE_KEY));
    return v === 10 || v === 25 ? v : 15;
  } catch {
    return 15;
  }
}

/** 지금 시간이 흐르는가: 인생 화면에서, 사건·전투·죽음·일시 정지가 없을 때 */
const timeFlows = (app: App) =>
  app.screen === 'life' && !!app.life && canAdvance(app.life) && !app.paused && app.battleLogFrom === null && !document.hidden;

/** 이번 달 들어온 돈을 골드 옆에 잠깐 띄운다 */
function popPay(root: HTMLElement, s: LifeState) {
  const pay = s.lastPay ?? 0;
  const gold = root.querySelector('.econ .gold');
  if (!pay || !gold) return;
  const el = document.createElement('span');
  el.className = 'pay-pop';
  el.textContent = `+${fmtGold(pay)} ${payLabel(s)}`;
  gold.appendChild(el);
  window.setTimeout(() => el.remove(), 1400);
}

function settle(app: App) {
  const life = app.life!;
  const r = settleLife(app.meta, life);
  const peerImgs = r.peers.map((p) => drawPortrait({ ...specFromLife(p), dead: false }).toCanvas().toDataURL());
  app.settlement = { life, ...r, peerImgs };
  app.life = null;
}

/** 비동기 연출(전투·공유)이 있으면 끝날 때 resolve 되는 Promise 를 돌려준다 */
/** 전투 중에도 되는 일 */
const DUEL_OK = new Set(['duel', 'duel-end', 'music', 'stat', 'pause', 'tab', 'pace']);

function act(app: App, action: string, arg?: string): Promise<void> | void {
  if (app.duel && !DUEL_OK.has(action)) return;
  app.notice = '';
  app.focusNudge = false;
  switch (action) {
    case 'music':
      app.music.toggle();
      break;
    case 'login': {
      if (app.cloud.busy) break;
      app.cloud.busy = true;
      app.cloud.error = '';
      return signIn(arg as Provider).then((err) => {
        app.cloud.busy = false;
        app.cloud.error = err ?? '';
      });
    }
    case 'login-open':
      connectAuth();
      app.screen = 'gate';
      break;
    case 'logout':
      app.cloud.busy = true;
      return signOut().finally(() => {
        app.cloud.busy = false;
      });
    case 'guest-ask':
      app.cloud.guestAsk = true;
      break;
    case 'guest-ask-close':
      app.cloud.guestAsk = false;
      break;
    case 'guest-go':
      setChoice('guest');
      app.cloud.guestAsk = false;
      app.screen = 'title';
      break;
    case 'conflict': {
      const c = app.cloud.conflict;
      app.cloud.conflict = null;
      c?.resolve(arg === 'cloud' ? 'cloud' : 'local');
      break;
    }
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
      const s = app.life;
      if (!s) break;
      // 성장은 언제든 바꿀 수 있다. 시간은 저절로 흐른다
      s.focus = arg as Focus;
      app.tab = 'none';
      afterStep(app);
      break;
    }
    case 'pause':
      app.paused = !app.paused;
      break;
    case 'stat':
      // 같은 것을 다시 누르면 닫는다
      app.statInfo = app.statInfo === arg ? null : ((arg ?? null) as App['statInfo']);
      break;
    case 'pace': {
      const v = Number(arg);
      if (v === 10 || v === 15 || v === 25) {
        app.pace = v;
        app.paused = false;
        try {
          localStorage.setItem(PACE_KEY, String(v));
        } catch { /* 무시 */ }
      }
      break;
    }
    case 'choose': {
      const s = app.life;
      const ev = s && currentEvent(s);
      if (!s || !ev) break;
      const picked = visibleChoices(s, ev)[Number(arg)];
      if (!picked || choiceLocked(s, picked)) break;
      // 전투 선택지는 턴제 전투로 승패를 가린다
      if (app.gfx && isCombat(ev.id, picked) && !app.duel) {
        const look = battleFor(ev.id, picked);
        const d = startDuel(s, 'event', ENEMY_NAME[BATTLE_ENEMY[ev.id]] ?? '적', battleOdds(s, picked).ep);
        app.tab = 'none';
        return openDuel(app, d, { kind: 'event', choice: Number(arg) }, look?.enemy ?? 'bandit', !!look?.magic);
      }
      const battle = app.gfx ? battleFor(ev.id, picked) : null;
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
        // 먼저 엔딩 크레딧, 끝나거나 건너뛰면 묘비
        app.screen = 'credits';
        app.tab = 'none';
      }
      break;
    case 'credits-end':
      if (app.screen === 'credits') app.screen = 'death';
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
      if (!app.life) break;
      // 원정 중이 아니고 들어갈 수 있으면 먼저 안내창
      if (!app.life.dive && canEnterDungeon(app.life) && app.screen !== 'dungeon') {
        app.dgConfirm = true;
        break;
      }
      app.screen = 'dungeon';
      app.tab = 'none';
      break;
    case 'dungeon-enter':
      app.dgConfirm = false;
      if (app.life) {
        app.screen = 'dungeon';
        app.tab = 'none';
      }
      break;
    case 'dg-cancel':
      app.dgConfirm = false;
      break;
    case 'dive':
      if (app.life && canEnterDungeon(app.life) && !app.life.dive) beginDive(app.life, Number(arg));
      afterStep(app);
      break;
    case 'descend': {
      const s = app.life;
      if (!s?.dive || app.duel) break;
      const res = descendPath(s);
      afterStep(app);
      if (res === 'mob') {
        // 길을 막은 마물과 턴제 전투
        const m = s.dive!.mob!;
        const d = startDuel(s, 'mob', m.name, m.ep);
        if (!app.gfx) {
          const r = settleMob(s, autoDuel(d, s, Math.random), d.hp);
          if (r === 'dead') endDiveOnDeath(s);
          afterStep(app);
          break;
        }
        return openDuel(app, d, { kind: 'mob' }, mobEnemy(m.floor), statOf(s, 'mana') > statOf(s, 'vit'));
      }
      // 보스 방 앞에 서면 멈춘다 (가방을 점검하고 「보스에게 도전」)
      if (res === 'dead') endDiveOnDeath(s);
      break;
    }
    case 'boss': {
      const s = app.life;
      if (!s?.dive?.atBoss || app.duel) break;
      const boss = bossAhead(s);
      const d = startDuel(s, 'boss', boss.name, boss.ep);
      if (!app.gfx) {
        // 그래픽이 없으면 자동 전투
        const r = settleBoss(s, autoDuel(d, s, Math.random), d.hp);
        if (r === 'dead') endDiveOnDeath(s);
        afterStep(app);
        break;
      }
      return openDuel(app, d, { kind: 'boss' }, bossEnemy(boss.floor), statOf(s, 'mana') > statOf(s, 'vit'));
    }
    case 'duel': {
      const du = app.duel;
      const s = app.life;
      if (!du || !s || du.busy || du.done) break;
      const blows = duelTurn(du.d, s, arg as DuelAction, Math.random);
      du.busy = true;
      const g = app.gfx;
      const after = () => {
        if (!du.d.result) {
          du.busy = false;
          return;
        }
        // 보스에게 지면: 한 번 쓰러진 적이 있으면 진짜 죽음
        const anim = du.d.result === 'win' ? 'win' : du.d.result === 'fled' ? 'fled'
          : du.ctx.kind !== 'event' && s.dgFallen && s.extraLives <= 0 ? 'died' : 'lose';
        return (g ? g.closeBattle(anim) : Promise.resolve()).then(() => {
          du.busy = false;
          du.done = true;
        });
      };
      return g ? g.battleTurn(blows).then(after) : (after() ?? undefined);
    }
    case 'duel-end': {
      const du = app.duel;
      const s = app.life;
      if (!du || !s || !du.done || !du.d.result) break;
      app.duel = null;
      if (du.ctx.kind === 'event') {
        // 사건 전투가 끝나면 체력은 다시 차오른다 (던전 안에서만 깎인 채로 남는다)
        s.hp = maxHp(s);
        choose(s, du.ctx.choice, Math.random, du.d.result === 'win');
      } else if (du.ctx.kind === 'mob') {
        const r = settleMob(s, du.d.result, du.d.hp);
        if (r === 'dead') endDiveOnDeath(s);
      } else {
        const r = settleBoss(s, du.d.result, du.d.hp);
        if (r === 'dead') endDiveOnDeath(s);
      }
      afterStep(app);
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
      // 원정 중에는 가방만: 상점에는 갈 수 없다
      if (app.life?.dive && !app.life.death) {
        if (arg === 'shop') app.notice = '던전 원정 중에는 상점에 갈 수 없다. 귀환하자.';
        app.screen = 'town';
        app.townTab = 'bag';
        app.tab = 'none';
        app.dgConfirm = false;
        break;
      }
      if (app.life && !app.life.death) {
        app.dgConfirm = false;
        app.screen = 'town';
        app.townTab = arg === 'bag' ? 'bag' : 'shop';
        app.tab = 'none';
      }
      break;
    case 'town-cat':
      app.townCat = arg as MarketCat;
      break;
    case 'mbuy':
      if (app.life?.dive) break;
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
    case 'unequip-trinket':
      if (app.life) app.notice = unequipTrinket(app.life, Number(arg)).msg;
      afterStep(app);
      break;
    case 'drink-item':
      if (app.life) app.notice = drink(app.life, Number(arg)).msg;
      afterStep(app);
      break;
    case 'inn':
      if (app.life?.dive) break;
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

/** 문답을 마치고 태어난다 */
function birth(app: App) {
  app.monthFrac = 0;
  // 성별은 매 생 무작위. 이름을 비워 두면 그 성별의 이름 목록에서 짓는다
  const gender: Gender = Math.random() < 0.5 ? 'm' : 'f';
  const name = app.setup.name.trim().slice(0, 12) || pick(namesOf(gender), Math.random);
  const fated = app.setup.fated;
  // 출신은 해금한 것 중 운명이 정하고, 권능은 직접 고르거나 운명에 맡긴다
  const origin = {
    houseId: rollHouse(Math.random, app.meta.unlocked),
    cheatId: fated ? rollCheat() : app.setup.cheatId,
  };
  app.ghost = {};
  app.statSnap = null;
  app.stressTier = 0;
  app.life = createLife({
    ...origin,
    name,
    gender,
    upgrades: app.meta.upgrades,
    npcPast: app.meta.npcMet ?? {},
    lifeNo: app.meta.totalLives + 1,
    loop: app.meta.worldEnds ?? 0,
    hints: app.meta.hintsHeard ?? 0,
    afterHappy: app.meta.lastHappy,
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
  const s = app.life;
  if (!s) return;
  clampHp(s);
  // 스트레스 경고: 단계가 올라갈 때 한 번씩
  const tier = STRESS_TIERS.filter(([t]) => (s.stress ?? 0) >= t).pop();
  if ((tier?.[0] ?? 0) > app.stressTier && !s.death) app.notice = tier![1];
  app.stressTier = tier?.[0] ?? 0;
  // 한 번만 뜨는 알림 (던전 개방 등)
  if (s.toast) {
    app.notice = s.toast;
    s.toast = null;
  }
  // 능력치 변화 → 잔상 (겹치면 누적하고 4틱 다시 센다)
  if (app.statSnap) {
    for (const k of STAT_KEYS) {
      const dv = statOf(s, k) - (app.statSnap[k] ?? statOf(s, k));
      if (!dv) continue;
      const g = app.ghost[k];
      const d = (g?.d ?? 0) + dv;
      if (d) app.ghost[k] = { d, ttl: GHOST_TICKS };
      else delete app.ghost[k];
    }
  }
  app.statSnap = Object.fromEntries(STAT_KEYS.map((k) => [k, statOf(s, k)]));
  saveRun(s);
}

const STRESS_TIERS: [number, string][] = [
  [80, '머리가 아프다…'],
  [90, '휴식이 필요해… 성장을 「휴식」으로 바꾸자.'],
  [100, '스트레스가 너무 높다! 이대로면 쓰러진다.'],
];

const GHOST_TICKS = 4;
function tickGhost(app: App) {
  for (const k of STAT_KEYS) {
    const g = app.ghost[k];
    if (g && --g.ttl <= 0) delete app.ghost[k];
  }
}

// ───────────────────────── 화면 ─────────────────────────

function view(app: App): string {
  if (app.screen === 'gate') {
    return `<main class="screen view-gate">${viewGate(app)}</main>${app.cloud.guestAsk ? guestConfirm() : ''}${app.cloud.conflict ? conflictConfirm(app.cloud.conflict) : ''}`;
  }
  const body = {
    gate: viewGate, title: viewTitle, setup: viewSetup, oracle: viewOracle, life: viewLife, death: viewDeath,
    dungeon: (a: App) => (a.life ? viewDungeon(a.life, a.duel ? duelPanel(a) : '') : viewTitle(a)),
    town: (a: App) => (a.life ? viewTown(a.life, a.townTab, a.townCat) : viewTitle(a)),
    altar: viewAltar, codex: viewCodex, lives: viewLives, credits: viewCredits,
  }[app.screen](app);
  return `
    <header class="topbar">
      <button class="brand" data-act="go" data-arg="title">환생록</button>
      <div class="top-right">
        <button class="music-btn ${app.music.on ? 'on' : ''}" data-act="music" title="배경 음악 ${app.music.on ? '끄기' : '켜기'}" aria-label="배경 음악">${icon(app.music.on ? 'volume-2' : 'volume-x')}</button>
        <div class="stones" title="환생석">${icon('diamond-gem')} ${app.meta.soulStones}</div>
      </div>
    </header>
    <main class="screen view-${app.screen} ${app.duel ? 'dueling' : ''} ${app.screen === 'life' && app.life && !app.duel && currentEvent(app.life) ? 'evt' : ''}">${body}</main>
    ${underbar(app)}
    ${app.notice ? `<div class="toast">${esc(app.notice)}</div>` : ''}
    ${app.dgConfirm ? dungeonConfirm() : ''}
    ${app.cloud.conflict ? conflictConfirm(app.cloud.conflict) : ''}
  `;
}

/** 모바일 하단 고정 바 (데스크톱에서는 CSS 로 숨긴다) */
function underbar(app: App): string {
  if (app.screen === 'credits' || app.screen === 'gate') return '';
  const item = (act: string, arg: string, ic: IconName, label: string, on = false, extra = '') =>
    `<button class="ub-item ${on ? 'on' : ''}" data-act="${act}" data-arg="${arg}" ${extra}><span class="ub-icon">${icon(ic)}</span><span class="ub-label">${label}</span></button>`;
  if ((app.screen === 'dungeon' || app.screen === 'town') && app.life) {
    const s = app.life;
    let center = `<button class="ub-main" data-act="go" data-arg="life"><span>인생</span></button>`;
    if (s.death) center = `<button class="ub-main danger" data-act="see-grave"><span>묘비로</span></button>`;
    else if (app.screen === 'dungeon' && !app.duel && s.dive?.atBoss) center = `<button class="ub-main danger" data-act="boss"><span>보스</span><small>도전</small></button>`;
    else if (app.screen === 'dungeon' && !app.duel && s.dive && !s.dive.fallen && s.dive.floor < 100) center = `<button class="ub-main pulse" data-act="descend"><span>하강</span><small>${(s.dive.cursor ?? s.dive.floor) > s.dive.floor ? '계속' : '5층'}</small></button>`;
    else if (app.screen === 'town' && s.dive) center = `<button class="ub-main" data-act="dungeon"><span>던전</span></button>`;
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
        ${item('town', 'bag', 'backpack', '가방', app.screen === 'town')}
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
    else center = `<button class="ub-main ${app.paused ? 'paused' : ''}" data-act="pause"><span>${app.paused ? '▶' : 'Ⅱ'}</span><small>${app.paused ? '재생' : `${(s.month ?? 0) + 1}월`}</small></button>`;
    const busy = !!(ev || s.death);
    return `
      <nav class="underbar">
        ${item('dungeon', '', 'sword', '던전', false, busy || s.age < 12 ? 'disabled' : '')}
        ${item('tab', 'action', ev ? 'warning-diamond' : 'target', ev ? '사건' : '성장', tab === 'action')}
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
      ${accountRow(app.cloud)}
    </section>
  `;
}

const SYNC_TEXT: Record<SyncState, string> = { idle: '', saving: '저장 중…', saved: '클라우드에 저장됨', error: '저장 대기 중 (연결 확인)' };

/** 타이틀 아래 작은 계정 줄 */
function accountRow(c: CloudView): string {
  if (c.user) {
    return `<p class="account small muted">${esc(c.user.name)} 님 · ${SYNC_TEXT[c.sync] || '연결됨'}
      <button class="link inline" data-act="logout" ${c.busy ? 'disabled' : ''}>로그아웃</button></p>`;
  }
  if (c.checking) return '<p class="account small muted">로그인 확인 중…</p>';
  return `<p class="account small muted"><button class="link inline" data-act="login-open">로그인하고 어느 기기에서나 이어하기</button></p>`;
}

const GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const GITHUB_MARK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

/** 첫 방문 로그인 화면 */
function viewGate(app: App): string {
  const { busy, error } = app.cloud;
  return `
    <section class="title-card gate">
      <div class="scene-host title-scene" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.5)}"></div>
      <p class="eyebrow">이세계 인생 연대기</p>
      <h1>환생록</h1>
      <p class="lede">로그인하면 기록이 계정에 저장돼서,<br>어느 기기에서나 이어서 플레이할 수 있어요.</p>
      <div class="menu">
        <button class="btn login" data-act="login" data-arg="google" ${busy ? 'disabled' : ''}>${GOOGLE_G}<span>Google로 로그인</span></button>
        <button class="btn login" data-act="login" data-arg="github" ${busy ? 'disabled' : ''}>${GITHUB_MARK}<span>GitHub로 로그인</span></button>
      </div>
      ${busy ? '<p class="small muted gate-note">로그인 창을 확인해 주세요…</p>' : ''}
      ${error ? `<p class="small gate-note gate-error">${esc(error)}</p>` : ''}
      <button class="link guest-link" data-act="guest-ask">게스트로 계속하기</button>
    </section>
  `;
}

/** 게스트로 계속하기 안내창 */
function guestConfirm(): string {
  return `
    <div class="modal-back" data-act="guest-ask-close"></div>
    <div class="modal" role="dialog" aria-label="게스트로 계속하기">
      <h3>로그인하면 어느 기기에서나 플레이 할 수 있어요</h3>
      <div class="modal-actions">
        <button class="btn" data-act="guest-go">계속하기</button>
        <button class="btn primary" data-act="guest-ask-close">로그인하기</button>
      </div>
    </div>`;
}

/** 이 기기의 기록과 계정의 기록이 서로 다를 때 고르는 창 */
function conflictConfirm(c: NonNullable<CloudView['conflict']>): string {
  return `
    <div class="modal-back"></div>
    <div class="modal" role="dialog" aria-label="기록 선택">
      <h3>${icon('cloud')} 어느 기록으로 이어갈까요?</h3>
      <ul class="small">
        <li><b>이 기기</b> · ${esc(c.local)}</li>
        <li><b>내 계정</b> · ${esc(c.cloud)}</li>
      </ul>
      <p class="small muted">고르지 않은 쪽 기록은 사라져요.</p>
      <div class="modal-actions">
        <button class="btn" data-act="conflict" data-arg="local">이 기기 기록 사용</button>
        <button class="btn primary" data-act="conflict" data-arg="cloud">내 계정 기록 사용</button>
      </div>
    </div>`;
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
      <input id="name-input" maxlength="12" value="${esc(setup.name)}" placeholder="비우면 운명이 짓는다" autocomplete="off" />
    </div>
    <p class="gender-note muted small">성별은 태어날 때 운명이 정한다 (여·남 반반). 연인은 이성으로 만난다.</p>
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
      <div class="year-body">${g.items.map((l, i) => `<p class="tone-${l.tone}">${l.m && l.m !== g.items[i - 1]?.m ? `<i class="mon">${l.m}월</i>` : ''}${esc(l.text)}</p>`).join('')}</div>
    </div>`).join('');

  const bonus = trinketBonus(s);
  const pct = (v: number) => (Math.min(STAT_MAX, v) / STAT_MAX) * 100;
  const stats = GRADED.map((k) => `
    <button class="stat ${app.statInfo === k ? 'on' : ''}" data-act="stat" data-arg="${k}" title="${STAT_NAMES[k]}: 누르면 설명">
      <span class="stat-name">${STAT_NAMES[k]}${s.talents?.includes(k) ? '<i class="talent">★</i>' : ''}</span>
      <div class="bar"><div class="fill fill-${k}" style="width:${pct(s.stats[k])}%"></div>${bonus[k] ? `<div class="fill-bonus" style="left:${pct(s.stats[k])}%;width:${pct(statOf(s, k)) - pct(s.stats[k])}%"></div>` : ''}</div>
      <span class="stat-val ${bonus[k] ? 'boosted' : ''}" ${bonus[k] ? `title="원래 ${s.stats[k]} + 장신구 ${bonus[k]}"` : ''}><b class="grade g-${gradeOf(statOf(s, k))}">${gradeOf(statOf(s, k))}</b>${statOf(s, k)}${app.ghost[k] ? `<i class="ghost ${app.ghost[k]!.d > 0 ? 'up' : 'down'}">${app.ghost[k]!.d > 0 ? '+' : ''}${app.ghost[k]!.d}</i>` : ''}</span>
    </button>`).join('');

  const rels = (['friend', 'rival', 'mentor', 'spouse'] as RelKey[]).map((k) => relLine(s, k)).join('');
  const relBlock = `<ul class="rels">${rels || '<li class="muted small">아직 아무도 없다. 인연을 만들어 보자!</li>'}</ul>`;
  const badges = [
    s.extraLives ? `불굴 ×${s.extraLives}` : '',
    s.injuries ? `중상 ${s.injuries}/${MAX_INJURY}` : '',
    s.fated ? '운명' : '',
  ].filter(Boolean).join(' · ');

  let centerPanel = '';
  let sidePanel = '';
  if (app.duel) {
    centerPanel = duelPanel(app);
  } else if (app.battleLogFrom !== null) {
    centerPanel = `
      <div class="death-call">
        <p class="eyebrow">전투</p>
        <p class="muted small">화면을 누르거나 Space 를 누르면 건너뛴다.</p>
      </div>`;
  } else if (s.death) {
    centerPanel = `
      <div class="death-call">
        <p class="death-cause">${esc(deathById(s.death.causeId).name)}</p>
        <p class="muted">${esc(s.name)}의 이번 생은 여기까지! 다음 생을 기약하자.</p>
        <button class="btn primary wide" data-act="see-grave">묘비 앞에 선다</button>
      </div>`;
  } else if (ev) {
    const choices = visibleChoices(s, ev);
    const duo = choices.length === 2;
    const swipe = duo && !choices.some((c) => choiceLocked(s, c));
    centerPanel = `
      <div class="event-card ${swipe ? 'swipeable' : ''}" ${swipe ? `data-swipe="choose" data-left="${esc(fill(choices[0].label, s))}" data-right="${esc(fill(choices[1].label, s))}"` : ''}>
        ${swipe ? '<div class="swipe-label"></div>' : ''}
        <p class="eyebrow">${s.age}세 ${(s.month ?? 0) + 1}월의 사건 · 시간이 멈췄다</p>
        <h3>${esc(fill(ev.title, s))}</h3>
        <p class="event-text">${esc(fill(ev.text, s))}</p>
        ${swipe ? '<p class="swipe-guide"><b class="l">← 왼쪽</b> · 카드를 밀어서 선택 · <b class="r">오른쪽 →</b></p>' : ''}
        <div class="choices ${duo ? 'duo' : ''}">
          ${choices.map((c, i) => {
            const locked = choiceLocked(s, c) && choices.some((x) => !choiceLocked(s, x));
            const notes = [
              c.check && !isCombat(ev.id, c) && cheat.showChance ? `${icon('search')}성공률 ${successChance(s, c.check)}%` : '',
              c.will ? `${icon('zap')}의지력 ${c.will}${locked ? ` (부족: ${s.will ?? 0})` : ''}` : '',
              jobReqMissing(s, c.success.effect?.job) ? `${icon('lock')}${jobReqMissing(s, c.success.effect?.job)}` : '',
            ].filter(Boolean).join(' · ');
            const odds = isCombat(ev.id, c) ? battleOdds(s, c) : null;
            return `
            <button class="choice ${duo ? (i === 0 ? 'left' : 'right') : ''} ${c.will ? 'defy' : ''}" data-act="choose" data-arg="${i}" ${locked ? 'disabled' : ''}>
              <kbd>${duo ? (i === 0 ? '←' : '→') : i + 1}</kbd>
              <span>${esc(fill(c.label, s))}</span>
              ${odds ? `<em class="odds-line">${icon('sword')}전투력 <b>${odds.cp}</b> vs 적 <b>${odds.ep}</b> · <span class="winp ${odds.p >= 60 ? 'good' : odds.p >= 35 ? 'mid' : 'bad'}">승률 ${odds.p}%</span></em>` : ''}
              ${notes ? `<em>${notes}</em>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>`;
  } else {
    const young = s.age < 2;
    sidePanel = `
      <div class="focus-card">
        <p class="eyebrow">성장</p>
        ${young ? '' : '<p class="muted small focus-hint">시간은 저절로 흐른다. 성장은 언제든 바꿀 수 있다. <kbd>1</kbd>~<kbd>5</kbd> · 정지 <kbd>Space</kbd></p>'}
        <div class="focus-grid">
          ${FOCI.map((f) => {
            const mul = f === 'rest' ? 1 : focusMul(s, f);
            const tag = Math.abs(mul - 1) < 0.05 ? '' : `<em class="${mul > 1 ? 'up' : 'down'}">×${mul.toFixed(1)}</em>`;
            return `
            <button class="focus focus-${f} ${s.focus === f ? 'selected' : ''}" data-act="focus" data-arg="${f}" ${young ? 'disabled' : ''}>
              <strong>${FOCUS_NAMES[f]} ${tag}</strong>
              <span>${FOCUS_DESC[f]}</span>
            </button>`;
          }).join('')}
        </div>
        ${!young && (s.stress ?? 0) >= STRESS_HIGH && s.focus !== 'rest' ? '<p class="warn small">스트레스가 높아 성장이 떨어지고 있다. 한 해 쉬어 가자!</p>' : ''}
        ${young ? '<p class="muted small">아직 너무 어리다. 세 살이 되면 성장을 정할 수 있다.</p>' : ''}
        ${(s.trauma ?? 0) > 0 ? `<p class="warn small">${icon('skull')} 던전의 악몽 (${s.trauma}달 남음) — 스트레스가 100에 묶여 있다.</p>` : ''}
        ${(s.recover ?? 0) > 0 ? `<p class="warn small">${icon('heart')} 요양 중 (${s.recover}달 남음) — 성장과 수입이 절반이다.</p>` : ''}
      </div>`;
  }

  return `
    <aside class="sheet">
      <div class="sheet-top">
        <div class="portrait-host" data-gfx="portrait"></div>
        <div class="sheet-main">
          <div class="sheet-head">
            <h2>${esc(s.name)} <span class="sex sex-${genderOf(s)}" title="${genderOf(s) === 'f' ? '여성' : '남성'}">${genderOf(s) === 'f' ? '♀' : '♂'}</span></h2>
            <p class="age">${s.age}세 · ${esc(job ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '미성년' : '무직')}</p>
            <p class="muted small">${esc(houseById(s.houseId).name)} · ${esc(cheat.name)}${badges ? ` · ${badges}` : ''}</p>
          </div>
          <div class="stats">${stats}</div>
          ${statInfoBox(app, s)}
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
    <section class="center ${centerPanel ? 'has-panel' : ''}">
      <div class="scene-host ${s.omen ? `omen omen-${s.omen}` : ''}" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.45)}"></div>
      ${s.death ? '' : timeBar(app, s, !!ev)}
      ${centerPanel ? `<div class="center-panel">${centerPanel}</div>` : ''}
      <div class="chronicle">${chronicle}</div>
    </section>
    <section class="action ${tab === 'action' && sidePanel ? 'open' : ''}">
      <button class="sheet-handle" data-act="tab" data-arg="none" aria-label="접기"></button>
      <div class="quick">
        <button class="btn" data-act="dungeon" ${ev || s.death || s.age < 12 ? 'disabled' : ''}>${icon('sword')} 던전${s.age < 12 ? ' (12세~)' : ''}</button>
        <button class="btn" data-act="town" ${ev || s.death ? 'disabled' : ''}>${icon('store')} 마을</button>
      </div>
      ${sidePanel}
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

/** 던전 입장 안내창 */
function dungeonConfirm(): string {
  return `
    <div class="modal-back" data-act="dg-cancel"></div>
    <div class="modal" role="dialog" aria-label="던전 입장">
      <h3>${icon('sword')} 던전에 들어간다</h3>
      <ul class="small">
        <li>한 번 들어가면 <b>귀환할 때까지 상점·여관에 갈 수 없다.</b> 가방은 열 수 있다.</li>
        <li>던전은 <b>2년에 한 번</b>만 들어갈 수 있다.</li>
        <li>쓰러지면 장비·소지품·돈을 잃는다. 두 번째는 진짜 죽음이다.</li>
      </ul>
      <div class="modal-actions">
        <button class="btn primary" data-act="dungeon-enter">${icon('sword')} 던전으로 가기</button>
        <button class="btn" data-act="town" data-arg="shop">${icon('store')} 상점으로 가기</button>
        <button class="btn" data-act="dg-cancel">다시 생각하기</button>
      </div>
    </div>`;
}

/** 능력치·전투력 설명 상자 */
function statInfoBox(app: App, s: LifeState): string {
  const k = app.statInfo;
  if (!k) return '';
  if (k === 'cp') {
    const { atk, def, mana, vit, int } = s.stats;
    const w = CP_WEIGHT;
    const gear = (s.equip?.weapon?.power ?? 0) + (s.equip?.armor?.power ?? 0);
    const job = (jobById(s.jobId)?.combat ?? 0) * s.jobRank;
    const parts = [
      ['공격력', (atk * w.atk) / 2.8], ['마력', (mana * w.mana) / 2.8], [atk >= mana ? '주력(공격력)' : '주력(마력)', (w.main * Math.max(atk, mana)) / 2.8],
      ['방어력', (def * w.def) / 2.8], ['체력', (vit * w.vit) / 2.8], ['지능', (int * w.int) / 2.8], ['장비', gear], ['직업', job],
    ] as [string, number][];
    return `
      <div class="stat-info" data-act="stat" data-arg="cp">
        <b>${icon('sword')} 전투력 ${combatPower(s)}</b>
        <p>${parts.filter(([, v]) => v).map(([n, v]) => `${n} ${Math.round(v)}`).join(' + ')}</p>
        <p class="muted small">사건 전투·던전의 승률을 정한다. 턴제 전투에서 공격력은 공격, 마력은 마법(같은 수치면 30% 더 셈), 방어력은 받는 피해 감소, 지능은 치명타·피해 계수에 쓰인다.</p>
      </div>`;
  }
  return `
    <div class="stat-info" data-act="stat" data-arg="${k}">
      <b>${STAT_NAMES[k]} ${statOf(s, k)}</b>${trinketBonus(s)[k] ? ` <span class="muted small">(원래 ${s.stats[k]} + 장신구 ${trinketBonus(s)[k]})</span>` : ''}
      <ul>${STAT_INFO[k].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>`;
}

interface DuelState {
  d: Duel;
  ctx: { kind: 'event'; choice: number } | { kind: 'boss' } | { kind: 'mob' };
  /** 연출 중 (행동 버튼 잠금) */
  busy: boolean;
  /** 승패가 나고 연출도 끝났다 → 「계속」 */
  done: boolean;
}

/** 턴제 전투 시작: 두 인물을 세운다 */
function openDuel(app: App, d: Duel, ctx: DuelState['ctx'], enemy: EnemyKind, magic: boolean): Promise<void> {
  const s = app.life!;
  const du: DuelState = { d, ctx, busy: true, done: false };
  app.duel = du;
  return app.gfx!
    .openBattle({
      player: playerSprite(specFromLife(s), magic),
      enemy: enemySprite(enemy),
      magic,
      glow: magic ? 0x7ad0ff : s.jobId === 'hero' ? 0xfff0a0 : undefined,
      enemyHp: ctx.kind === 'event' ? ENEMY_HP[enemy] : BOSS_HP[enemy],
      groundY: app.gfx!.groundY,
      hpP: d.hp / d.hpMax,
      hpE: 1,
    })
    .then(() => {
      du.busy = false;
    });
}

/** 턴제 전투 패널 */
function duelPanel(app: App): string {
  const du = app.duel!;
  const d = du.d;
  const s = app.life!;
  const bar = (label: string, v: number, max: number, cls: string) =>
    `<div class="du-bar ${cls}"><span>${label}</span><i><u style="width:${Math.round((v / max) * 100)}%"></u></i><b>${v}/${max}</b></div>`;
  const acts: [DuelAction, string, IconName, string, boolean][] = [
    ['attack', '공격', 'sword', `×${attackMul(s).toFixed(1)} · 치명 ${Math.round(critChance(s) * 100)}%`, false],
    ['magic', '마법', 'wand', `MP ${MAGIC_COST} · ×${magicMul(s).toFixed(1)}`, d.mp < MAGIC_COST],
    ['guard', '방어', 'shield', d.counter ? '반격 준비됨' : '피해↓ 반격 준비', false],
    ['flee', '도주', 'arrow-left', `${Math.round(fleeChance(s) * 100)}%${du.ctx.kind === 'event' ? ' · 패배 처리' : ''}`, false],
  ];
  const resultText = d.result === 'win' ? `${esc(d.foe)}을(를) 쓰러뜨렸다!` : d.result === 'fled' ? '전투에서 벗어났다.' : '쓰러졌다…';
  return `
    <div class="duel ${du.done ? `done ${d.result}` : ''}">
      <div class="du-head">
        <p class="eyebrow">${du.ctx.kind === 'boss' ? '보스전' : du.ctx.kind === 'mob' ? '마물' : '전투'} · ${d.turn + 1}턴</p>
        <h3>VS ${esc(d.foe)}</h3>
        <span class="du-cp">${icon('sword')} ${d.cp} vs ${d.ep}</span>
      </div>
      ${bar(esc(d.foe), d.eHp, d.eMax, 'enemy')}
      ${bar('체력', d.hp, d.hpMax, 'hp')}
      ${bar('MP', d.mp, d.mpMax, 'mp')}
      <ol class="du-log">${d.log.slice(-4).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>
      ${du.done
        ? `<p class="du-result">${resultText}</p><button class="btn primary wide" data-act="duel-end">계속 <kbd>Enter</kbd></button>`
        : `<div class="du-acts">${acts.map(([a, label, ic, sub, off], i) => `
            <button class="du-act" data-act="duel" data-arg="${a}" ${du.busy || off || d.result ? 'disabled' : ''}>
              <kbd>${i + 1}</kbd>${icon(ic)}<strong>${label}</strong><small>${sub}</small>
            </button>`).join('')}</div>`}
    </div>`;
}

/** 시간 막대: 올해 진행도, 일시 정지, 속도 */
function timeBar(app: App, s: LifeState, held: boolean): string {
  const month = s.month ?? 0;
  return `
    <div class="timebar ${held ? 'held' : app.paused ? 'paused' : ''}">
      <button class="tb-play" data-act="pause" ${held ? 'disabled' : ''} aria-label="${app.paused ? '재생' : '일시 정지'}">${app.paused || held ? '▶' : 'Ⅱ'}</button>
      <span class="tb-month">${s.age}세 ${month + 1}월</span>
      <div class="year-bar"><i style="width:${yearPct(s, app.monthFrac)}"></i></div>
      <span class="tb-state">${held ? '사건!' : app.paused ? '정지' : ''}</span>
      <div class="tb-pace">${PACES.map((p) => `<button class="chip ${app.pace === p.v ? 'on' : ''}" data-act="pace" data-arg="${p.v}" title="한 해 ${p.v}초">${p.name}</button>`).join('')}</div>
    </div>`;
}

/** 엔딩 크레딧: 검은 화면에 이번 생의 행적이 아래에서 위로 흐른다 */
function viewCredits(app: App): string {
  const st = app.settlement;
  if (!st) return viewTitle(app);
  const s = st.life;
  const r = rec(s);
  const d = deathById(s.death!.causeId);
  const line = (k: string, v: string) => `<p class="cr-line"><span>${k}</span><b>${v}</b></p>`;
  const top = (m: Record<string, number>, n: number) =>
    Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${esc(k)} ×${v}`).join(' · ');
  // 행적: 이정표·좋은 일·죽을 뻔한 일 중에서 골라 나이순으로
  const deeds = s.log
    .filter((l) => (l.tone === 'milestone' || l.tone === 'good' || l.tone === 'death') && l.text.length < 90 && !l.text.startsWith('환생의 여신') && !l.text.startsWith('여신의 문답'))
    .filter((_, i, a) => a.length <= 18 || i % Math.ceil(a.length / 18) === 0)
    .slice(0, 18);
  const rels = (['spouse', 'friend', 'rival', 'mentor'] as RelKey[]).filter((k) => s.rels[k])
    .map((k) => line(REL_NAMES[k], esc(s.rels[k]!.name)));
  const slain = Object.values(r.slain).reduce((a, b) => a + b, 0);
  const section = (title: string, body: string) => (body ? `<h3 class="cr-sec">${title}</h3>${body}` : '');
  const roll = [
    `<p class="cr-eyebrow">환생록</p>`,
    `<h1 class="cr-name">${esc(s.name)}</h1>`,
    `<p class="cr-sub">${esc(lifeTitle(s))} · ${esc(houseById(s.houseId).name)}</p>`,
    `<p class="cr-years">0 — ${s.age}</p>`,
    `<p class="cr-cause">${esc(d.name)}</p>`,
    section('걸어온 길', deeds.map((l) => `<p class="cr-deed"><i>${l.age}세</i>${esc(l.text)}</p>`).join('')),
    section('인연', rels.join('')),
    section('기록', [
      line('겪은 사건', `${r.events}건`),
      r.nearDeaths.length ? line('죽을 뻔한 일', `${r.nearDeaths.length}번`) : '',
      r.battles ? line('사건 전투', `${r.battles}전 ${r.wins}승`) : '',
      r.battles ? line('맞선 적', top(r.foes, 3)) : '',
      r.dives ? line('던전', `${r.dives}번 원정 · 최고 ${r.maxFloor}층`) : '',
      slain ? line('쓰러뜨린 마물', `${slain}마리`) : '',
      Object.keys(r.bosses).length ? line('격파한 보스', top(r.bosses, 3)) : '',
      line('번 돈', fmtGold(r.earned)),
      line('남긴 재산', fmtGold(s.gold ?? 0)),
      r.jobs.length ? line('직업', r.jobs.map((j) => esc(jobById(j)?.name ?? j)).join(' → ')) : '',
    ].join('')),
    section('능력치', STAT_KEYS.map((k) => line(STAT_NAMES[k], String(s.stats[k]))).join('')),
    section('함께한 힘', [line('여신의 권능', esc(cheatById(s.cheatId).name)), ...traitsOf(s).map((t) => line('타고난 특성', esc(t.name)))].join('')),
    `<p class="cr-epitaph">${esc(d.epitaph)}</p>`,
    `<p class="cr-end">${esc(d.endLine ?? '— 그리고, 다음 생으로 —')}</p>`,
  ].join('');
  // 줄 수에 맞춰 흐르는 시간을 정한다
  const secs = Math.max(20, Math.min(48, 14 + deeds.length * 1.2 + rels.length));
  return `
    <div class="credits">
      <div class="credits-roll" style="animation-duration:${secs}s">${roll}</div>
      <button class="btn cr-skip" data-act="credits-end">건너뛰기 ${icon('arrow-right')}</button>
    </div>`;
}

/** 사망 화면의 생애 기록 */
function lifeRecord(s: LifeState): string {
  const r = rec(s);
  const top = (m: Record<string, number>, n: number) =>
    Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${esc(k)} ×${v}`).join(', ');
  const slain = Object.values(r.slain).reduce((a, b) => a + b, 0);
  const bosses = Object.values(r.bosses).reduce((a, b) => a + b, 0);
  const row = (label: string, value: string, sub = '') =>
    `<li><span>${label}</span><b>${value}</b>${sub ? `<small class="muted">${sub}</small>` : ''}</li>`;
  return `
    <ul class="life-record">
      ${row('겪은 사건', `${r.events}건`)}
      ${row('죽을 뻔한 일', `${r.nearDeaths.length}번`, r.nearDeaths.map((c) => esc(deathById(c).name)).join(', '))}
      ${row('사건 전투', r.battles ? `${r.battles}전 ${r.wins}승 ${r.battles - r.wins}패` : '없음', top(r.foes, 4))}
      ${row('던전 원정', r.dives ? `${r.dives}번 · 최고 ${r.maxFloor}층` : '안 갔다')}
      ${slain ? row('쓰러뜨린 마물', `${slain}마리`, top(r.slain, 4)) : ''}
      ${bosses ? row('격파한 보스', `${bosses}번`, top(r.bosses, 4)) : ''}
      ${r.loot ? row('주운 전리품', `${r.loot}개`) : ''}
      ${row('번 돈', fmtGold(r.earned))}
      ${row('쓴 돈', fmtGold(r.spent))}
      ${row('남긴 재산', fmtGold(s.gold ?? 0))}
      ${row('거쳐 간 직업', r.jobs.length ? r.jobs.map((j) => esc(jobById(j)?.name ?? j)).join(' → ') : s.jobId ? esc(jobById(s.jobId)?.name ?? '') : '무직')}
    </ul>`;
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
        <h3>생애 기록</h3>
        ${lifeRecord(s)}
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

const swipeBound = new WeakSet<HTMLElement>();

function bindSwipe(root: HTMLElement, pickChoice: (act: string, i: number) => void) {
  const card = root.querySelector<HTMLElement>('.event-card.swipeable');
  // 화면을 고쳐 그려도 같은 카드가 남으므로 한 번만 붙인다
  if (!card || swipeBound.has(card)) return;
  swipeBound.add(card);
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
  } else if (app.screen === 'title' || app.screen === 'gate') {
    g.setScene('title', 3);
  }
  g.mountScene(sceneHost);
  g.mountPortrait(portraitHost);
}
