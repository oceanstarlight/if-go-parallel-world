import type { Focus, LifeState, MetaSave, RelKey } from '../types';
import { HOUSES, houseById } from '../data/houses';
import { CHEATS, cheatById } from '../data/cheats';
import { jobById, jobTitle } from '../data/jobs';
import { DEATHS, deathById } from '../data/deaths';
import { PLAYER_NAMES, pick } from '../data/names';
import { SHOP, itemCost } from '../data/shop';
import { FOCUS_DESC, FOCUS_NAMES, REL_NAMES, STAT_KEYS, STAT_NAMES, affectionWord } from '../data/stats';
import { advanceYear, canAdvance, choose, createLife, currentEvent, visibleChoices } from '../engine/life';
import { fill } from '../engine/text';
import type { StoneLine } from '../engine/score';
import { buy, isUnlocked, loadMeta, loadRun, saveRun, settleLife } from '../meta';
import { GfxStage } from '../gfx/stage';
import { specFromLife } from '../gfx/portrait';
import { ENEMY_HP, battleFor, graveWeather, sceneFor, timeFor } from '../gfx/mapping';
import { enemySprite, playerSprite } from '../gfx/sprites';
import { hashStr } from '../gfx/painter';

type Screen = 'title' | 'setup' | 'life' | 'death' | 'altar' | 'codex' | 'lives';

interface Settlement {
  life: LifeState;
  lines: StoneLine[];
  total: number;
  firstDeath: boolean;
}

interface App {
  screen: Screen;
  meta: MetaSave;
  life: LifeState | null;
  setup: { name: string; houseId: string; cheatId: string };
  settlement: Settlement | null;
  notice: string;
  gfx: GfxStage | null;
  /** 전투 연출 중: 이 인덱스부터의 연대기는 아직 숨긴다 */
  battleLogFrom: number | null;
}

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const FOCI: Focus[] = ['train', 'study', 'social', 'explore'];

export async function mount(root: HTMLElement) {
  const app: App = {
    screen: 'title',
    meta: loadMeta(),
    life: loadRun(),
    setup: { name: pick(PLAYER_NAMES, Math.random), houseId: 'farm', cheatId: 'growth' },
    settlement: null,
    notice: '',
    gfx: await GfxStage.create(),
    battleLogFrom: null,
  };
  // 사망 상태로 저장된 삶이 있으면 (정산 직전 새로고침) 바로 정산
  if (app.life?.death) settle(app);

  const render = () => {
    root.innerHTML = view(app);
    syncGfx(app, root); // 캔버스가 붙어 높이가 정해진 뒤에 스크롤
    const log = root.querySelector('.chronicle');
    if (log) log.scrollTop = log.scrollHeight;
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
    if (app.battleLogFrom !== null && (ev.target as HTMLElement).closest('.scene-host, .action')) {
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
    if (app.screen !== 'life' || !app.life) return;
    if ((ev.target as HTMLElement).tagName === 'INPUT') return;
    if (ev.code === 'Space') {
      ev.preventDefault();
      run('advance');
    } else if (/^Digit[1-9]$/.test(ev.code) && currentEvent(app.life)) {
      run('choose', String(Number(ev.code.slice(5)) - 1));
    }
  });
  render();
}

function settle(app: App) {
  const life = app.life!;
  const r = settleLife(app.meta, life);
  app.settlement = { life, ...r };
  app.life = null;
}

/** 비동기 연출(전투)이 있으면 끝날 때 resolve 되는 Promise 를 돌려준다 */
function act(app: App, action: string, arg?: string): Promise<void> | void {
  app.notice = '';
  switch (action) {
    case 'go':
      app.screen = arg as Screen;
      if (arg === 'setup') {
        if (!isUnlocked(app.meta, app.setup.houseId)) app.setup.houseId = 'farm';
        if (!isUnlocked(app.meta, app.setup.cheatId)) app.setup.cheatId = 'growth';
      }
      break;
    case 'continue':
      if (app.life) app.screen = 'life';
      break;
    case 'house':
      if (arg && isUnlocked(app.meta, arg)) app.setup.houseId = arg;
      break;
    case 'cheat':
      if (arg && isUnlocked(app.meta, arg)) app.setup.cheatId = arg;
      break;
    case 'reroll-name':
      app.setup.name = pick(PLAYER_NAMES, Math.random);
      break;
    case 'begin': {
      const name = app.setup.name.trim().slice(0, 12) || pick(PLAYER_NAMES, Math.random);
      app.life = createLife({ ...app.setup, name, upgrades: app.meta.upgrades });
      saveRun(app.life);
      app.screen = 'life';
      break;
    }
    case 'focus':
      if (app.life) app.life.focus = arg as Focus;
      saveRun(app.life);
      break;
    case 'advance':
      if (app.life && canAdvance(app.life)) advanceYear(app.life);
      afterStep(app);
      break;
    case 'choose': {
      const s = app.life;
      const ev = s && currentEvent(s);
      if (!s || !ev) break;
      const picked = visibleChoices(s, ev)[Number(arg)];
      const battle = picked && app.gfx ? battleFor(ev.id, picked) : null;
      const logFrom = s.log.length;
      const res = choose(s, Number(arg));
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
      }
      break;
    case 'buy': {
      const ok = buy(app.meta, arg!);
      app.notice = ok ? '해금되었다.' : '환생석이 부족하다.';
      break;
    }
    case 'abandon':
      if (app.life && confirm('이 삶을 포기하고 윤회의 문으로 돌아갈까? (기록과 환생석은 남지 않는다)')) {
        app.life = null;
        saveRun(null);
        app.screen = 'title';
      }
      break;
  }
}

function afterStep(app: App) {
  if (app.life) saveRun(app.life);
}

// ───────────────────────── 화면 ─────────────────────────

function view(app: App): string {
  const body = {
    title: viewTitle, setup: viewSetup, life: viewLife, death: viewDeath,
    altar: viewAltar, codex: viewCodex, lives: viewLives,
  }[app.screen](app);
  return `
    <header class="topbar">
      <button class="brand" data-act="go" data-arg="title">환생록</button>
      <div class="stones" title="환생석">◆ ${app.meta.soulStones}</div>
    </header>
    <main class="screen view-${app.screen}">${body}</main>
    ${app.notice ? `<div class="toast">${esc(app.notice)}</div>` : ''}
  `;
}

function viewTitle(app: App): string {
  const m = app.meta;
  const found = Object.keys(m.codex).length;
  return `
    <section class="title-card">
      <div class="scene-host title-scene" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.5)}"></div>
      <p class="eyebrow">이세계 인생 연대기</p>
      <h1>환생록</h1>
      <p class="lede">눈을 뜨면 낯선 세계. 태어날 곳도, 쥐고 갈 권능도 고를 수 있다.<br>
      그러나 어떻게 죽을지는, 아무도 고를 수 없다.</p>
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
  const card = (kind: 'house' | 'cheat', id: string, name: string, desc: string) => {
    const unlocked = isUnlocked(meta, id);
    const selected = (kind === 'house' ? setup.houseId : setup.cheatId) === id;
    const cost = SHOP.find((i) => i.id === id);
    return `
      <button class="pick ${selected ? 'selected' : ''} ${unlocked ? '' : 'locked'}"
        data-act="${kind}" data-arg="${id}" ${unlocked ? '' : 'disabled'}>
        <strong>${esc(name)}</strong>
        <span>${esc(desc)}</span>
        ${unlocked ? '' : `<em>🔒 윤회의 제단 · ◆ ${cost ? itemCost(cost, 0) : '?'}</em>`}
      </button>`;
  };
  const echo = meta.upgrades.echo ?? 0;
  const fortune = meta.upgrades.fortune ?? 0;
  return `
    <h2 class="screen-title">환생 설정</h2>
    <div class="setup-name">
      <label for="name-input">이름</label>
      <input id="name-input" maxlength="12" value="${esc(setup.name)}" autocomplete="off" />
      <button class="btn small" data-act="reroll-name">무작위</button>
    </div>
    <h3>태어날 곳</h3>
    <div class="pick-grid">${HOUSES.map((h) => card('house', h.id, h.name, h.desc)).join('')}</div>
    <h3>환생 권능</h3>
    <div class="pick-grid">${CHEATS.map((c) => card('cheat', c.id, c.name, c.desc)).join('')}</div>
    ${echo || fortune ? `<p class="muted">전생의 잔향: 시작 능력치 +${echo * 2}${fortune ? ` · 행운 +${fortune * 5}` : ''}</p>` : ''}
    <div class="setup-actions">
      <button class="btn" data-act="go" data-arg="title">돌아간다</button>
      <button class="btn primary" data-act="begin">환생한다</button>
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

function viewLife(app: App): string {
  const s = app.life;
  if (!s) return viewTitle(app);
  const ev = currentEvent(s);
  const job = jobById(s.jobId);

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

  let panel: string;
  if (app.battleLogFrom !== null) {
    panel = `
      <div class="death-call">
        <p class="eyebrow">전투</p>
        <p class="muted small">클릭하거나 Space 를 누르면 건너뛴다.</p>
      </div>`;
  } else if (s.death) {
    panel = `
      <div class="death-call">
        <p class="death-cause">${esc(deathById(s.death.causeId).name)}</p>
        <p class="muted">${esc(s.name)}의 두 번째 삶이 끝났다.</p>
        <button class="btn primary wide" data-act="see-grave">묘비 앞에 선다</button>
      </div>`;
  } else if (ev) {
    const choices = visibleChoices(s, ev);
    panel = `
      <div class="event-card">
        <p class="eyebrow">${s.age}세의 사건</p>
        <h3>${esc(ev.title)}</h3>
        <p class="event-text">${esc(fill(ev.text, s))}</p>
        <div class="choices">
          ${choices.map((c, i) => `
            <button class="choice" data-act="choose" data-arg="${i}">
              <kbd>${i + 1}</kbd>
              <span>${esc(c.label)}</span>
              ${c.check ? `<em>${STAT_NAMES[c.check.stat]} 판정</em>` : ''}
            </button>`).join('')}
        </div>
      </div>`;
  } else {
    const young = s.age < 2;
    panel = `
      <div class="focus-card">
        <p class="eyebrow">올해의 방침</p>
        <div class="focus-grid">
          ${FOCI.map((f) => `
            <button class="focus ${s.focus === f ? 'selected' : ''}" data-act="focus" data-arg="${f}" ${young ? 'disabled' : ''}>
              <strong>${FOCUS_NAMES[f]}</strong>
              <span>${FOCUS_DESC[f]}</span>
            </button>`).join('')}
        </div>
        ${young ? '<p class="muted small">아직 너무 어리다. 세 살이 되면 방침을 정할 수 있다.</p>' : ''}
        <button class="btn primary wide advance" data-act="advance">한 해를 보낸다 <kbd>Space</kbd></button>
      </div>`;
  }

  return `
    <aside class="sheet">
      <div class="portrait-host" data-gfx="portrait"></div>
      <div class="sheet-head">
        <h2>${esc(s.name)}</h2>
        <p class="age">${s.age}세 · ${esc(job ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '미성년' : '무직')}</p>
        <p class="muted small">${esc(houseById(s.houseId).name)} · ${esc(cheatById(s.cheatId).name)}${s.extraLives ? ' · 불굴 ♥' : ''}</p>
      </div>
      <div class="stats">${stats}</div>
      <h4>인연</h4>
      <ul class="rels">${rels || '<li class="muted small">아직 아무도 없다.</li>'}</ul>
      <button class="link" data-act="abandon">이 삶을 포기한다</button>
    </aside>
    <section class="center">
      <div class="scene-host" data-gfx="scene" data-maxh="${Math.floor(window.innerHeight * 0.45)}"></div>
      <div class="chronicle">${chronicle}</div>
    </section>
    <section class="action">${panel}</section>
  `;
}

function viewDeath(app: App): string {
  const st = app.settlement;
  if (!st) return viewTitle(app);
  const s = st.life;
  const d = deathById(s.death!.causeId);
  const title = s.jobId ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '어린 영혼' : '이름 없는 자';
  return `
    <div class="grave-wrap">
      <div class="grave-left">
      <div class="scene-host" data-gfx="scene"></div>
      <div class="tombstone">
        <div class="portrait-host small" data-gfx="portrait"></div>
        <p class="grave-title">${esc(title)}</p>
        <h2>${esc(s.name)}</h2>
        <p class="grave-years">0 — ${s.age}</p>
        <p class="grave-cause">${esc(d.name)}</p>
        <p class="grave-epitaph">${esc(d.epitaph)}</p>
      </div>
      </div>
      <div class="settle">
        ${st.firstDeath ? '<p class="new-death">새로운 죽음이 도감에 기록되었다.</p>' : ''}
        <h3>환생석 정산</h3>
        <ul>${st.lines.map((l) => `<li><span>${esc(l.label)}</span><span>+${l.value}</span></li>`).join('')}</ul>
        <p class="settle-total">합계 <strong>◆ ${st.total}</strong></p>
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
    <p class="muted">지나온 삶이 남긴 환생석을 바쳐, 다음 삶의 문을 넓힌다.</p>
    ${section('가문', 'house')}
    ${section('권능', 'cheat')}
    ${section('잔향', 'upgrade')}
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
    ${lives.length === 0 ? '<p class="muted">아직 아무 삶도 끝나지 않았다.</p>' : `
    <table class="lives">
      <thead><tr><th>이름</th><th>가문</th><th>칭호</th><th>향년</th><th>사인</th><th>환생석</th></tr></thead>
      <tbody>${lives.map((l) => `
        <tr><td>${esc(l.name)}</td><td>${esc(houseById(l.houseId).name)}</td><td>${esc(l.title)}</td>
        <td>${l.age}</td><td>${esc(deathById(l.causeId).name)}</td><td>◆ ${l.stones}</td></tr>`).join('')}
      </tbody>
    </table>`}
    <div class="setup-actions"><button class="btn" data-act="go" data-arg="title">돌아간다</button></div>
  `;
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
  } else if (app.screen === 'title') {
    g.setScene('title', 3);
  }
  g.mountScene(sceneHost);
  g.mountPortrait(portraitHost);
}
