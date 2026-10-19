import type { Focus, LifeState } from '../types';
import { NPC_NAMES, PLAYER_NAMES } from '../data/names';
import { advanceYear, choose, createLife, currentEvent, rollFate, visibleChoices, type Rng } from './life';

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
export function simulateLife(seed: number, opt: { name?: string; houseId?: string; cheatId?: string } = {}): LifeState {
  const rng = seededRng(seed);
  const fate = rollFate(rng);
  const s = createLife({
    name: opt.name ?? PLAYER_NAMES[Math.floor(rng() * PLAYER_NAMES.length)],
    houseId: opt.houseId ?? fate.houseId,
    cheatId: opt.cheatId ?? fate.cheatId,
    upgrades: {},
  }, rng);
  for (let guard = 0; guard < 600 && !s.death; guard++) {
    if (rng() < 0.15) s.focus = FOCI[Math.floor(rng() * 4)];
    const ev = currentEvent(s);
    if (ev) choose(s, Math.floor(rng() * visibleChoices(s, ev).length), rng);
    else advanceYear(s, rng);
  }
  return s;
}

/** 같은 해에 함께 환생한 네 사람 */
export function contemporaries(seed: number, exclude: string): LifeState[] {
  const rng = seededRng(seed ^ 0x9e3779b9);
  const names = [...PLAYER_NAMES, ...NPC_NAMES].filter((n) => n !== exclude);
  const out: LifeState[] = [];
  for (let i = 0; i < 4; i++) {
    const name = names.splice(Math.floor(rng() * names.length), 1)[0];
    out.push(simulateLife(Math.floor(rng() * 2 ** 31), { name }));
  }
  return out;
}
