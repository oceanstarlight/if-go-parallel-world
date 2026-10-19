import type {
  Check, Choice, Effect, Focus, GameEvent, LifeState, Outcome, RelKey, Resolution, StatKey,
} from '../types';
import { houseById } from '../data/houses';
import { cheatById } from '../data/cheats';
import { jobById } from '../data/jobs';
import { NPC_NAMES, pick } from '../data/names';
import { STAT_KEYS } from '../data/stats';
import { ALL_EVENTS, eventById } from '../data/events';
import { BIRTH_TEXT, QUIET_YEAR } from '../data/flavor';
import { matches } from './cond';
import { fill } from './text';

export type Rng = () => number;

export interface NewLifeOptions {
  name: string;
  houseId: string;
  cheatId: string;
  upgrades: Record<string, number>;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

/** 소수 성장값을 확률적으로 반올림한다 (1.4 → 40% 확률로 2) */
const stochastic = (v: number, rng: Rng) => Math.floor(v) + (rng() < v - Math.floor(v) ? 1 : 0);

export function createLife(opt: NewLifeOptions): LifeState {
  const house = houseById(opt.houseId);
  const cheat = cheatById(opt.cheatId);
  const stats = { vit: 10, mana: 10, int: 10, cha: 10, fame: 0, luck: 10 };
  for (const k of STAT_KEYS) {
    stats[k] = (house.stats[k] ?? stats[k]) + (cheat.stats?.[k] ?? 0);
    if (k !== 'fame') stats[k] += 2 * (opt.upgrades.echo ?? 0);
  }
  stats.luck += 5 * (opt.upgrades.fortune ?? 0);
  for (const k of STAT_KEYS) stats[k] = clamp(stats[k], 0, 100);

  const s: LifeState = {
    name: opt.name,
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
    extraLives: cheat.extraLives ?? 0,
    death: null,
  };
  log(s, fill(BIRTH_TEXT[house.id] ?? BIRTH_TEXT.farm, s), 'milestone');
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
  const mul = amount > 0 ? cheatById(s.cheatId).growthMul?.[k] ?? 1 : 1;
  s.stats[k] = clamp(s.stats[k] + stochastic(amount * dim * mul, rng), 0, 100);
}

function grow(s: LifeState, rng: Rng) {
  const m = ageMul(s.age);
  if (s.age < 3) {
    gainStat(s, 'vit', 1, rng);
    gainStat(s, pick(STAT_KEYS.filter((k) => k !== 'fame'), rng), 1, rng);
  } else {
    for (const [k, [lo, hi]] of Object.entries(FOCUS_GAINS[s.focus])) {
      gainStat(s, k as StatKey, randInt(rng, lo, hi) * m, rng);
    }
    if (s.focus === 'explore') {
      gainStat(s, pick(['vit', 'mana', 'int', 'cha'] as StatKey[], rng), randInt(rng, 1, 3) * m, rng);
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
  // 노화
  if (s.age >= 40 && rng() < 0.6) s.stats.vit = Math.max(1, s.stats.vit - 1);
  if (s.age >= 60) s.stats.vit = Math.max(1, s.stats.vit - 1);
  if (s.age >= 70 && rng() < 0.5) s.stats.vit = Math.max(1, s.stats.vit - 1);
}

/** 자연사 확률 */
export function naturalDeathChance(s: LifeState): number {
  if (s.age >= 100) return 1;
  if (s.age < 55) return 0;
  const t = (s.age - 55) / 40;
  return clamp((0.004 + t * t * 0.35) * (1.3 - s.stats.vit / 100), 0, 1);
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
  const bonus = cheatById(s.cheatId).checkBonus?.[check.stat] ?? 0;
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
    const name = pick(NPC_NAMES.filter((n) => !used.has(n)), rng);
    const base: Record<RelKey, number> = { friend: 40, rival: 25, mentor: 50, spouse: 65 };
    s.rels[e.addRel] = { name, affection: base[e.addRel] };
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
  if (e.job) {
    s.jobId = e.job;
    s.jobRank = 1;
  }
  if (e.jobRank && s.jobId) s.jobRank = clamp(s.jobRank + e.jobRank, 1, 5);
  if (e.death) kill(s, e.death);
  else if (s.stats.vit <= 0) kill(s, e.zeroCause ?? 'illness');
}

function resolve(s: LifeState, r: Resolution, rng: Rng): { outcome: Outcome; passed: boolean | null } {
  if (!r.check) return { outcome: r.success, passed: null };
  const passed = rng() * 100 < successChance(s, r.check);
  return { outcome: passed ? r.success : r.fail ?? r.success, passed };
}

function applyOutcome(s: LifeState, o: Outcome, passed: boolean | null, rng: Rng) {
  const before = { ...s.rels };
  applyEffect(s, o.effect, rng);
  const tone = s.death ? 'death' : o.tone ?? (passed === false ? 'bad' : passed ? 'good' : 'normal');
  log(s, fill(o.text, s, before), tone);
}

// ───────────────────────── 사건 ─────────────────────────

export function eligible(s: LifeState, ev: GameEvent): boolean {
  if ((ev.once || ev.milestone) && s.seen.includes(ev.id)) return false;
  return matches(ev.cond, s);
}

export function visibleChoices(s: LifeState, ev: GameEvent): Choice[] {
  return (ev.choices ?? []).filter((c) => matches(c.cond, s));
}

function pickEvent(s: LifeState, rng: Rng): GameEvent | null {
  const milestone = ALL_EVENTS.find((e) => e.milestone && eligible(s, e));
  if (milestone) return milestone;
  if (rng() > (s.age < 3 ? 0.35 : 0.7)) return null;
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
  log(s, `「${ev.title}」 ${fill(ev.text, s)}`, ev.milestone ? 'milestone' : 'normal');
  if (ev.auto) {
    const { outcome, passed } = resolve(s, ev.auto, rng);
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

  if (rng() < naturalDeathChance(s)) {
    kill(s, 'old_age');
    return;
  }

  const ev = pickEvent(s, rng);
  if (ev) startEvent(s, ev, rng);
  else {
    // 직전 해와 같은 문장은 피한다
    const lines = QUIET_YEAR[s.age < 3 ? 'infant' : s.focus];
    const prev = s.log[s.log.length - 1]?.text;
    log(s, fill(pick(lines.filter((l) => l !== prev), rng), s));
  }
}

export interface ChoiceResult {
  choice: Choice;
  /** 판정 결과. 판정이 없는 선택지는 null */
  passed: boolean | null;
}

export function choose(s: LifeState, index: number, rng: Rng = Math.random): ChoiceResult | null {
  const ev = currentEvent(s);
  if (!ev || s.death) return null;
  const choice = visibleChoices(s, ev)[index];
  if (!choice) return null;
  s.pendingEventId = null;
  log(s, `▸ ${choice.label}`);
  const { outcome, passed } = resolve(s, choice, rng);
  applyOutcome(s, outcome, passed, rng);
  return { choice, passed };
}
