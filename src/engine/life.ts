import type {
  Check, Choice, Effect, Focus, GameEvent, Legend, LifeState, MoodKey, Outcome, RelKey, Resolution, StatKey, Trait,
} from '../types';
import { rollTraits, traitById } from '../data/traits';
import { battleOdds, isCombat } from './combat';
import { maxHp, starterKit, yearlyEconomy } from './economy';
import { OWNED_FOCUS } from '../data/market';
import { inBranch } from '../data/branches';
import { HOUSES, houseById } from '../data/houses';
import { GOALS } from '../data/goals';
import { CHEATS, cheatById } from '../data/cheats';
import { jobById } from '../data/jobs';
import { type Gender, genderOfName, namesOf, opposite, pick } from '../data/names';
import { STAT_KEYS } from '../data/stats';
import { ALL_EVENTS, eventById } from '../data/events';
import { BIRTH_TEXT, QUIET_YEAR } from '../data/flavor';
import { matches } from './cond';
import { fill } from './text';

export type Rng = () => number;

const TIRED_LINES = [
  '몸이 천근만근이다. 책을 펴도 글자가 머리에 안 들어온다… (스트레스가 높다)',
  '하품만 나온다. 이러다 쓰러지겠다. 한 해쯤 쉬어 갈까? (스트레스가 높다)',
  '무엇을 해도 재미가 없다. 번아웃이 다가오고 있다. (스트레스가 높다)',
];

export interface NewLifeOptions {
  name: string;
  houseId: string;
  cheatId: string;
  upgrades: Record<string, number>;
  /** 지난 생들에서 고정 캐릭터를 만난 횟수 */
  npcPast?: Record<string, number>;
  /** 몇 번째 삶인지 (1부터) */
  lifeNo?: number;
  /** 운명에 맡겨 태어났는가 */
  fated?: boolean;
  /** 전설이 된 전생들 */
  legends?: Legend[];
  /** 특성을 직접 지정 (테스트용). 없으면 무작위 */
  traits?: string[];
  /** 성별. 없으면 이름으로 짐작한다 */
  gender?: Gender;
}

/** 가중치에 따라 하나를 뽑는다 */
export function weightedPick<T extends { weight: number }>(items: T[], rng: Rng): T {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

/** 출신은 언제나 운명이 정한다: 해금한 출신 중 인구 비중대로 (목록이 없으면 전체) */
export function rollHouse(rng: Rng = Math.random, unlocked?: string[]): string {
  const pool = unlocked ? HOUSES.filter((h) => unlocked.includes(h.id)) : HOUSES;
  return weightedPick(pool.length ? pool : HOUSES, rng).id;
}

/** 운명에 맡긴 권능: 전체 권능 중 무작위 (해금 여부와 무관) */
export const rollCheat = (rng: Rng = Math.random) => weightedPick(CHEATS, rng).id;

/** 출신과 권능을 모두 운명에 맡긴다 (동시대 환생자 시뮬레이션용) */
export function rollFate(rng: Rng = Math.random, unlocked?: string[]): { houseId: string; cheatId: string } {
  return { houseId: rollHouse(rng, unlocked), cheatId: rollCheat(rng) };
}

function pickGoals(s: LifeState, rng: Rng): string[] {
  const pool = GOALS.filter((g) => !g.canAssign || g.canAssign(s));
  const out: string[] = [];
  while (out.length < 3 && out.length < pool.length) {
    const g = pool[Math.floor(rng() * pool.length)];
    if (!out.includes(g.id)) out.push(g.id);
  }
  return out;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const traitsOf = (s: LifeState): Trait[] =>
  (s.traits ?? []).map(traitById).filter((t): t is Trait => !!t);

/** 기분별 방침 성장 배율 (Long Live the Queen 방식) */
export const MOOD_MUL: Record<MoodKey, Partial<Record<Focus, number>>> = {
  calm: {},
  joy: { social: 1.5, explore: 1.2 },
  gloom: { study: 1.3, social: 0.6 },
  anger: { train: 1.5, study: 0.7 },
  fear: { study: 1.2, explore: 0.6, train: 0.8 },
};

/** 스트레스가 이 이상이면 성장이 떨어진다 */
export const STRESS_HIGH = 60;
/** 이 이상이면 과로로 쓰러질 수 있다 */
export const STRESS_DANGER = 85;
const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

/** 소수 성장값을 확률적으로 반올림한다 (1.4 → 40% 확률로 2) */
const stochastic = (v: number, rng: Rng) => Math.floor(v) + (rng() < v - Math.floor(v) ? 1 : 0);

export function createLife(opt: NewLifeOptions, rng: Rng = Math.random): LifeState {
  const house = houseById(opt.houseId);
  const cheat = cheatById(opt.cheatId);
  const stats = { vit: 10, mana: 10, int: 10, cha: 10, fame: 0, luck: 10 };
  for (const k of STAT_KEYS) {
    stats[k] = (house.stats[k] ?? stats[k]) + (cheat.stats?.[k] ?? 0);
    if (k !== 'fame') stats[k] += 2 * (opt.upgrades.echo ?? 0);
  }
  stats.luck += 5 * (opt.upgrades.fortune ?? 0);
  for (const k of STAT_KEYS) stats[k] = clamp(stats[k], 0, 100);

  const traitIds = opt.traits ?? rollTraits(rng);
  const traits = traitIds.map(traitById).filter((t): t is Trait => !!t);
  for (const t of traits) for (const [k, v] of Object.entries(t.stats ?? {})) stats[k as StatKey] += v;
  for (const k of STAT_KEYS) stats[k] = clamp(stats[k], 0, 100);

  const s: LifeState = {
    name: opt.name,
    gender: opt.gender ?? genderOfName(opt.name),
    age: 0,
    houseId: house.id,
    cheatId: cheat.id,
    stats,
    karma: house.karma ?? 0,
    flags: [...(house.flags ?? [])],
    seen: [],
    rels: {},
    jobId: null,
    jobRank: 0,
    focus: 'train',
    log: [],
    pendingEventId: null,
    lastEventId: null,
    extraLives: (cheat.extraLives ?? 0) + traits.reduce((a, t) => a + (t.extraLives ?? 0), 0),
    death: null,
    npcMet: [],
    npcPast: { ...(opt.npcPast ?? {}) },
    lifeNo: opt.lifeNo ?? 1,
    fated: !!opt.fated,
    traits: traitIds,
    stress: 0,
    mood: 'calm',
    will: clamp(30 + traits.reduce((a, t) => a + (t.will ?? 0), 0), 0, 100),
    legends: (opt.legends ?? []).slice(0, 5),
    gold: (house.gold ?? 30) + 100 * (opt.upgrades.heirloom ?? 0),
    lastIncome: 0,
    bag: [],
    equip: { weapon: null, armor: starterKit().armor },
    owned: [],
    // 심층의 각인: 이 계층부터 시작할 수 있다
    dgBest: 5 * (opt.upgrades.deep_start ?? 0),
    caught: 0,
  };
  s.hp = maxHp(s);
  s.goals = pickGoals(s, rng);
  if ((opt.lifeNo ?? 1) > 1) {
    // 매 생마다 다시 만나는 환생의 여신
    log(s, `환생의 여신이 하품을 하며 손을 흔들었다. "어머, 벌써 ${opt.lifeNo}번째 인생이네? 이번엔 「${cheat.name}」 권능으로 해줄게~"`, 'milestone');
  } else {
    log(s, `환생의 여신이 반짝이는 손가락으로 당신을 콕 찔렀다. "축하해, 이세계 환생이야! 선물로 「${cheat.name}」 권능을 줄게♪"`, 'milestone');
  }
  log(s, fill(BIRTH_TEXT[house.id] ?? BIRTH_TEXT.farm, s), 'milestone');
  if (traits.length) {
    log(s, `타고난 특성: ${traits.map((t) => `「${t.name}」`).join(' ')}. 산파가 "어머, 이 아이는 좀 특별하네요" 하고 웃었다.`, 'milestone');
  }
  return s;
}

function log(s: LifeState, text: string, tone: LifeState['log'][number]['tone'] = 'normal') {
  s.log.push({ age: s.age, text, tone });
}

// ───────────────────────── 성장 ─────────────────────────

const FOCUS_GAINS: Record<Focus, Partial<Record<StatKey, [number, number]>>> = {
  train: { vit: [1, 3], mana: [0, 2] },
  study: { int: [1, 3], mana: [0, 2] },
  social: { cha: [1, 3], fame: [0, 2] },
  explore: { luck: [1, 3] },
  rest: {},
};

function ageMul(age: number) {
  if (age < 6) return 0.6;
  if (age <= 40) return 1;
  if (age <= 60) return 0.5;
  return 0.25;
}

export function gainStat(s: LifeState, k: StatKey, amount: number, rng: Rng) {
  // 높을수록 오르기 어렵다
  const dim = amount > 0 ? Math.max(0.1, 1 - s.stats[k] / 115) : 1;
  let mul = amount > 0 ? cheatById(s.cheatId).growthMul?.[k] ?? 1 : 1;
  if (amount > 0) for (const t of traitsOf(s)) mul *= t.growthMul?.[k] ?? 1;
  s.stats[k] = clamp(s.stats[k] + stochastic(amount * dim * mul, rng), 0, 100);
}

function grow(s: LifeState, rng: Rng) {
  const m = ageMul(s.age);
  if (s.age < 3) {
    gainStat(s, 'vit', 1, rng);
    gainStat(s, pick(STAT_KEYS.filter((k) => k !== 'fame'), rng), 1, rng);
  } else if (s.focus === 'rest') {
    // 휴식: 성장은 없지만 몸이 조금 회복된다
    if (rng() < 0.5) gainStat(s, 'vit', 1, rng);
  } else {
    const fm = focusMul(s, s.focus);
    for (const [k, [lo, hi]] of Object.entries(FOCUS_GAINS[s.focus])) {
      gainStat(s, k as StatKey, randInt(rng, lo, hi) * m * fm, rng);
    }
    if (s.focus === 'explore') {
      gainStat(s, pick(['vit', 'mana', 'int', 'cha'] as StatKey[], rng), randInt(rng, 1, 3) * m * fm, rng);
    }
  }
  for (const [k, v] of Object.entries(houseById(s.houseId).growth ?? {})) {
    if (rng() < 0.5) gainStat(s, k as StatKey, v, rng);
  }
  const job = jobById(s.jobId);
  if (job) {
    for (const [k, v] of Object.entries(job.passive)) {
      if (rng() < 0.6) gainStat(s, k as StatKey, v * (1 + s.jobRank * 0.2), rng);
    }
  }
  // 노화 (엘프·불로 체질은 느리다)
  const am = agingMul(s);
  if (s.age >= 40 && rng() < 0.6 * am) s.stats.vit = Math.max(1, s.stats.vit - 1);
  if (s.age >= 60 && rng() < am) s.stats.vit = Math.max(1, s.stats.vit - 1);
  if (s.age >= 70 && rng() < 0.5 * am) s.stats.vit = Math.max(1, s.stats.vit - 1);
}

/** 방침 성장 배율: 특성 × 기분 × 스트레스 */
export function focusMul(s: LifeState, f: Focus): number {
  let mul = 1;
  for (const t of traitsOf(s)) mul *= t.focusMul?.[f] ?? 1;
  mul *= MOOD_MUL[s.mood ?? 'calm'][f] ?? 1;
  for (const o of s.owned ?? []) mul *= OWNED_FOCUS[o]?.[f] ?? 1;
  if ((s.stress ?? 0) >= STRESS_HIGH) mul *= 0.6;
  return mul;
}

/** 한 해의 스트레스·의지력·기분 변화 (Princess Maker 의 피로 관리) */
function updateMind(s: LifeState, rng: Rng) {
  if (s.age < 3) return;
  const stressMul = traitsOf(s).reduce((a, t) => a * (t.stressMul ?? 1), 1);
  let stress = s.stress ?? 0;
  if (s.focus === 'rest') {
    stress -= 35;
    s.will = clamp((s.will ?? 50) + 20, 0, 100);
    s.mood = 'calm';
  } else {
    let gain = 4 + (s.prevFocus === s.focus ? 3 : 0);
    if (s.age < 13) gain *= 0.5;
    if (s.mood === 'joy') gain *= 0.7;
    stress += gain * stressMul;
    s.will = clamp((s.will ?? 50) + 2, 0, 100);
    // 기분은 시간이 지나면 가라앉는다
    if (s.mood !== 'calm' && rng() < 0.5) s.mood = 'calm';
  }
  s.stress = clamp(Math.round(stress), 0, 100);
  s.prevFocus = s.focus;
}

/** 과로: 스트레스가 위험 수준이면 쓰러질 수 있다 */
function overwork(s: LifeState, rng: Rng): boolean {
  if ((s.stress ?? 0) < STRESS_DANGER || rng() > 0.3) return false;
  s.stats.vit = Math.max(0, s.stats.vit - 12);
  s.stress = Math.max(0, (s.stress ?? 0) - 25);
  s.mood = 'gloom';
  if (s.stats.vit <= 0) {
    log(s, '쉬지 않고 달리던 어느 날, 그대로 쓰러져 다시 일어나지 못했다…', 'death');
    kill(s, 'overwork');
  } else {
    log(s, '과로로 쓰러졌다! 한 달 내내 앓아누웠다. 가끔은 쉬어야 한다. (체력 -12)', 'bad');
  }
  return true;
}

/** 노화 속도 배율 */
function agingMul(s: LifeState): number {
  const t = traitsOf(s).reduce((a, x) => a * (x.agingMul ?? 1), 1);
  const youth = (s.owned ?? []).includes('youth') ? 0.7 : 1;
  return (houseById(s.houseId).agingMul ?? 1) * (cheatById(s.cheatId).agingMul ?? 1) * t * youth;
}

export function naturalDeathChance(s: LifeState): number {
  const am = agingMul(s);
  const limit = am < 1 ? 140 : 100;
  if (s.age >= limit) return 1;
  // 노화가 느리면 '체감 나이'가 젊다
  const age = 55 + (s.age - 55) * am;
  if (age < 55) return 0;
  const t = (age - 55) / 40;
  const grim = s.flags.includes('grim_win') ? 0.5 : 1;
  return clamp((0.004 + t * t * 0.35) * (1.3 - s.stats.vit / 100) * grim, 0, 1);
}

// ───────────────────────── 죽음 ─────────────────────────

/** 죽음을 시도한다. 불굴의 육체가 막으면 false */
export function kill(s: LifeState, causeId: string): boolean {
  if (s.death) return true;
  if (causeId !== 'old_age' && s.extraLives > 0) {
    s.extraLives--;
    s.stats.vit = Math.max(s.stats.vit, 25);
    log(s, '눈앞이 하얘졌다… 그런데 불굴의 육체가 발동! "아직 안 끝났어!" 당신은 벌떡 일어났다.', 'good');
    return false;
  }
  s.death = { causeId, age: s.age };
  s.pendingEventId = null;
  return true;
}

// ───────────────────────── 판정 / 효과 ─────────────────────────

export function successChance(s: LifeState, check: Check): number {
  const bonus = (cheatById(s.cheatId).checkBonus?.[check.stat] ?? 0)
    + traitsOf(s).reduce((a, t) => a + (t.checkBonus?.[check.stat] ?? 0), 0);
  const raw = 50 + (s.stats[check.stat] - check.dc) * 3 + (s.stats.luck - 20) * 0.3 + bonus;
  return clamp(Math.round(raw), 5, 95);
}

export function applyEffect(s: LifeState, e: Effect | undefined, rng: Rng) {
  if (!e) return;
  if (e.stats) {
    for (const [k, v] of Object.entries(e.stats)) {
      // 사건의 직접 보상은 체감 없이 반영 (배율만 적용)
      const mul = v > 0 ? cheatById(s.cheatId).growthMul?.[k as StatKey] ?? 1 : 1;
      s.stats[k as StatKey] = clamp(s.stats[k as StatKey] + Math.round(v * Math.min(mul, 1.3)), 0, 100);
    }
  }
  if (e.karma) s.karma = clamp(s.karma + e.karma, -100, 100);
  if (e.addRel && !s.rels[e.addRel]) {
    const used = new Set(Object.values(s.rels).map((r) => r!.name));
    const gender = relGender(s, e.addRel, rng);
    const name = pick(namesOf(gender).filter((n) => n !== s.name && !used.has(n)), rng);
    const base: Record<RelKey, number> = { friend: 40, rival: 25, mentor: 50, spouse: 65 };
    s.rels[e.addRel] = { name, affection: base[e.addRel], gender };
  }
  if (e.promoteToSpouse && s.rels[e.promoteToSpouse]) {
    const r = s.rels[e.promoteToSpouse]!;
    s.rels.spouse = { name: r.name, affection: Math.max(r.affection, 70) };
    delete s.rels[e.promoteToSpouse];
  }
  if (e.rel) {
    const mul = cheatById(s.cheatId).relMul ?? 1;
    for (const [k, v] of Object.entries(e.rel)) {
      const r = s.rels[k as RelKey];
      if (r) r.affection = clamp(Math.round(r.affection + v * mul), 0, 100);
    }
  }
  for (const k of e.removeRel ?? []) delete s.rels[k];
  for (const f of e.flags ?? []) if (!s.flags.includes(f)) s.flags.push(f);
  if (e.unflags) s.flags = s.flags.filter((f) => !e.unflags!.includes(f));
  if (e.meet) {
    s.npcMet = s.npcMet ?? [];
    if (!s.npcMet.includes(e.meet)) s.npcMet.push(e.meet);
  }
  if (e.job) {
    s.jobId = e.job;
    s.jobRank = 1;
  }
  if (e.jobRank && s.jobId) s.jobRank = clamp(s.jobRank + e.jobRank, 1, 5);
  if (e.mood) s.mood = e.mood;
  if (e.stress) s.stress = clamp((s.stress ?? 0) + e.stress, 0, 100);
  if (e.will) s.will = clamp((s.will ?? 50) + e.will, 0, 100);
  if (e.extraLives) s.extraLives = Math.max(0, s.extraLives + e.extraLives);
  if (e.gold) s.gold = (s.gold ?? 0) + e.gold;
  if (e.goldPct && (s.gold ?? 0) > 0) s.gold = Math.round((s.gold ?? 0) * (1 + e.goldPct));
  if (e.goldSet !== undefined) s.gold = e.goldSet;
  if (e.own && !(s.owned ?? []).includes(e.own)) s.owned = [...(s.owned ?? []), e.own];
  if (e.caught) {
    s.caught = (s.caught ?? 0) + 1;
    if ((s.gold ?? 0) > 0) s.gold = 0;
    s.stress = clamp((s.stress ?? 0) + 30, 0, 100);
    if (!s.flags.includes('jailed')) s.flags.push('jailed');
    if (s.caught >= 3) kill(s, 'gallows');
  }
  if (e.death) kill(s, e.death);
  else if (s.stats.vit <= 0) kill(s, e.zeroCause ?? 'illness');
}

/** 판정 성공 확률. 전투 사건이면 전투력 승부 */
export function choiceChance(s: LifeState, eventId: string | null | undefined, c: Resolution & { label?: string }): number {
  if (!c.check) return 100;
  return isCombat(eventId, c as Choice) ? battleOdds(s, c as Choice).p : successChance(s, c.check);
}

/** 내 성별 (예전 저장 데이터는 이름으로 짐작) */
export const genderOf = (s: LifeState): Gender => s.gender ?? genderOfName(s.name);

/**
 * 인연의 성별: 반려와 소꿉친구(연인 후보)는 이성, 숙적은 동성, 스승은 무작위.
 * 소꿉친구가 반려가 되는 사건이 있어서 둘을 같은 규칙으로 맞춘다.
 */
function relGender(s: LifeState, key: RelKey, rng: Rng): Gender {
  const me = genderOf(s);
  if (key === 'spouse' || key === 'friend') return opposite(me);
  if (key === 'rival') return me;
  return rng() < 0.5 ? 'm' : 'f';
}

function resolve(s: LifeState, r: Resolution, rng: Rng, eventId?: string): { outcome: Outcome; passed: boolean | null } {
  if (!r.check) return { outcome: r.success, passed: null };
  const chance = choiceChance(s, eventId, r);
  const passed = rng() * 100 < chance;
  return { outcome: passed ? r.success : r.fail ?? r.success, passed };
}

function applyOutcome(s: LifeState, o: Outcome, passed: boolean | null, rng: Rng) {
  const before = { ...s.rels };
  applyEffect(s, o.effect, rng);
  const tone = s.death ? 'death' : o.tone ?? (passed === false ? 'bad' : passed ? 'good' : 'normal');
  // 사건 결과가 기분을 바꾼다 (효과에 기분이 명시되어 있으면 그것을 따른다)
  if (!o.effect?.mood && !s.death) {
    if (tone === 'good' && rng() < 0.5) s.mood = 'joy';
    else if (tone === 'bad' && rng() < 0.6) s.mood = pick(['gloom', 'anger', 'fear'] as MoodKey[], rng);
  }
  log(s, fill(o.text, s, before), tone);
}

// ───────────────────────── 사건 ─────────────────────────

export function eligible(s: LifeState, ev: GameEvent): boolean {
  if ((ev.once || ev.milestone) && s.seen.includes(ev.id)) return false;
  if (ev.branch && !inBranch(s, ev.branch)) return false;
  return matches(ev.cond, s);
}

export function visibleChoices(s: LifeState, ev: GameEvent): Choice[] {
  return (ev.choices ?? []).filter((c) => matches(c.cond, s));
}

function pickEvent(s: LifeState, rng: Rng): GameEvent | null {
  const milestone = ALL_EVENTS.find((e) => e.milestone && eligible(s, e));
  if (milestone) return milestone;
  const rate = traitsOf(s).reduce((a, t) => a * (t.eventRate ?? 1), 1);
  if (rng() > Math.min(0.95, (s.age < 3 ? 0.35 : 0.7) * rate)) return null;
  const pool = ALL_EVENTS.filter((e) => !e.milestone && eligible(s, e));
  const weights = pool.map((e) => (e.weight ?? 1) * (e.focus && e.focus === s.focus ? 3 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function startEvent(s: LifeState, ev: GameEvent, rng: Rng) {
  s.seen.push(ev.id);
  s.lastEventId = ev.id;
  log(s, `「${fill(ev.title, s)}」 ${fill(ev.text, s)}`, ev.milestone ? 'milestone' : 'normal');
  if (ev.auto) {
    const { outcome, passed } = resolve(s, ev.auto, rng, ev.id);
    applyOutcome(s, outcome, passed, rng);
  } else if (visibleChoices(s, ev).length > 0) {
    s.pendingEventId = ev.id;
  }
}

export function currentEvent(s: LifeState): GameEvent | null {
  return s.pendingEventId ? eventById(s.pendingEventId) ?? null : null;
}

// ───────────────────────── 진행 ─────────────────────────

export function canAdvance(s: LifeState) {
  return !s.death && !s.pendingEventId;
}

export function advanceYear(s: LifeState, rng: Rng = Math.random) {
  if (!canAdvance(s)) return;
  s.age++;
  s.lastEventId = null;
  grow(s, rng);
  updateMind(s, rng);
  const money = yearlyEconomy(s, rng);
  if (money) log(s, money, (s.gold ?? 0) < 0 ? 'bad' : 'normal');
  s.hp = maxHp(s);
  if (overwork(s, rng) && s.death) return;

  if (rng() < naturalDeathChance(s)) {
    kill(s, 'old_age');
    return;
  }

  const ev = pickEvent(s, rng);
  if (ev) startEvent(s, ev, rng);
  else {
    // 직전 해와 같은 문장은 피한다
    const lines = QUIET_YEAR[s.age < 3 ? 'infant' : s.focus];
    if ((s.stress ?? 0) >= STRESS_HIGH && s.focus !== 'rest' && rng() < 0.5) {
      log(s, pick(TIRED_LINES, rng), 'bad');
      return;
    }
    const prev = s.log[s.log.length - 1]?.text;
    log(s, fill(pick(lines.filter((l) => l !== prev), rng), s));
  }
}

export interface ChoiceResult {
  choice: Choice;
  /** 판정 결과. 판정이 없는 선택지는 null */
  passed: boolean | null;
}

/** 환생 전 여신의 문답 결과를 새 삶에 반영한다 */
export function applyOracle(s: LifeState, answers: { label: string; effect: Effect }[], rng: Rng = Math.random) {
  if (!answers.length) return;
  for (const a of answers) applyEffect(s, a.effect, rng);
  log(s, `여신의 문답: ${answers.map((a) => `「${a.label}」`).join(' ')} — "좋아, 네 대답대로 빚어줄게♪"`, 'milestone');
}

/** 의지력이 모자라 고를 수 없는 선택지인가 */
export const choiceLocked = (s: LifeState, c: Choice) => (c.will ?? 0) > (s.will ?? 50);

export function choose(s: LifeState, index: number, rng: Rng = Math.random): ChoiceResult | null {
  const ev = currentEvent(s);
  if (!ev || s.death) return null;
  const choice = visibleChoices(s, ev)[index];
  if (!choice || choiceLocked(s, choice)) return null;
  s.pendingEventId = null;
  if (choice.will) s.will = clamp((s.will ?? 50) - choice.will, 0, 100);
  log(s, `▸ ${fill(choice.label, s)}`);
  const { outcome, passed } = resolve(s, choice, rng, ev.id);
  applyOutcome(s, outcome, passed, rng);
  return { choice, passed };
}
