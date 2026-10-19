import type { Focus, LifeState } from '../types';
import { FEMALE_NAMES, PLAYER_NAMES, namesOf, type Gender } from '../data/names';

const FEMALE = new Set(FEMALE_NAMES);
import { STRESS_HIGH, advanceYear, choiceLocked, choose, createLife, currentEvent, rollFate, visibleChoices, type Rng } from './life';
import { beginDive, canEnterDungeon, descend, endDiveOnDeath, preview, retreat, startFloors } from './dungeon';
import { buy, equip, maxHp, sellAllLoot } from './economy';
import { MARKET, marketPrice, owns } from '../data/market';

/** 재현 가능한 난수 (mulberry32) */
export function seededRng(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FOCI: Focus[] = ['train', 'study', 'social', 'explore'];

/**
 * 한 생을 끝까지 자동으로 살아본다. 선택은 무작위.
 * houseId/cheatId 를 주지 않으면 운명 모드처럼 뽑는다.
 */
export function simulateLife(seed: number, opt: { name?: string; houseId?: string; cheatId?: string; gender?: Gender } = {}): LifeState {
  const rng = seededRng(seed);
  const fate = rollFate(rng);
  const gender: Gender = opt.gender ?? (rng() < 0.5 ? 'm' : 'f');
  const pool = namesOf(gender);
  const s = createLife({
    gender,
    name: opt.name ?? pool[Math.floor(rng() * pool.length)],
    houseId: opt.houseId ?? fate.houseId,
    cheatId: opt.cheatId ?? fate.cheatId,
    upgrades: {},
  }, rng);
  for (let guard = 0; guard < 600 && !s.death; guard++) autoStep(s, rng);
  return s;
}

/**
 * 자동 플레이 한 걸음: 사건이 있으면 고를 수 있는 선택지 중 무작위, 없으면 한 해를 보낸다.
 * 가끔 방침을 바꾸고, 스트레스가 높으면 쉰다.
 */
export function autoStep(s: LifeState, rng: Rng) {
  const ev = currentEvent(s);
  if (ev) {
    const open = visibleChoices(s, ev).map((c, i) => [c, i] as const).filter(([c]) => !choiceLocked(s, c));
    // 확정 사망 선택지(대신 죽기 등)는 사람도 잘 고르지 않는다
    const safe = open.filter(([c]) => !c.success.effect?.death);
    const pool = safe.length && rng() < 0.9 ? safe : open;
    choose(s, pool[Math.floor(rng() * pool.length)][1], rng);
    return;
  }
  if (s.age >= 14 && rng() < 0.3) autoDive(s, rng);
  if (s.death) return;
  if (s.age >= 10 && rng() < 0.4) autoTown(s, rng);
  if ((s.stress ?? 0) >= STRESS_HIGH && rng() < 0.7) s.focus = 'rest';
  else if (s.focus === 'rest' || rng() < 0.15) s.focus = FOCI[Math.floor(rng() * 4)];
  advanceYear(s, rng);
}

/** 같은 해에 함께 환생한 네 사람 */
export function contemporaries(seed: number, exclude: string): LifeState[] {
  const rng = seededRng(seed ^ 0x9e3779b9);
  const names = PLAYER_NAMES.filter((n) => n !== exclude);
  const out: LifeState[] = [];
  for (let i = 0; i < 4; i++) {
    const name = names.splice(Math.floor(rng() * names.length), 1)[0];
    // 이름이 성별을 정한다 (이름 목록이 성별로 나뉘어 있다)
    out.push(simulateLife(Math.floor(rng() * 2 ** 31), { name, gender: FEMALE.has(name) ? 'f' : 'm' }));
  }
  return out;
}

/** 자동 플레이의 마을 볼일: 전리품 팔기 → 좋은 장비 끼기 → 가끔 하나 사기 */
function autoTown(s: LifeState, rng: Rng) {
  sellAllLoot(s);
  for (const it of [...(s.bag ?? [])]) {
    if (it.kind !== 'weapon' && it.kind !== 'armor') continue;
    if (it.power > (s.equip?.[it.kind]?.power ?? 0)) equip(s, it.uid);
  }
  const affordable = MARKET.filter((m) => marketPrice(s, m) <= (s.gold ?? 0) * 0.6 && !(m.type === 'owned' && owns(s, m.id)) && (!m.minAge || s.age >= m.minAge));
  if (affordable.length && rng() < 0.6) {
    const m = affordable[Math.floor(rng() * affordable.length)];
    buy(s, m.id);
    const it = s.bag?.[s.bag.length - 1];
    if (it && (it.kind === 'weapon' || it.kind === 'armor') && it.power > (s.equip?.[it.kind]?.power ?? 0)) equip(s, it.uid);
  }
}

/** 자동 플레이의 던전 원정: 승률 72% 이상, HP 70% 이상일 때만 내려간다 */
function autoDive(s: LifeState, rng: Rng) {
  if (!canEnterDungeon(s)) return;
  const floors = startFloors(s);
  beginDive(s, floors[floors.length - 1]);
  for (let k = 0; k < 20 && s.dive; k++) {
    // 한 번 쓰러진 뒤에는 (다음은 진짜 죽음) 훨씬 조심한다
    if (s.dive.fallen || preview(s).p < (s.dgFallen ? 88 : 72) || (s.hp ?? 0) < maxHp(s) * (s.dgFallen ? 0.9 : 0.7) || s.dive.floor >= 100) break;
    if (descend(s, rng) !== 'cleared') break;
  }
  if (s.death) endDiveOnDeath(s);
  else retreat(s);
}
