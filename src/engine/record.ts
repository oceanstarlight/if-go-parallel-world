import type { LifeRecord, LifeState } from '../types';

/** 이번 생의 기록 (없으면 만든다. 예전 저장 데이터 대비) */
export function rec(s: LifeState): LifeRecord {
  s.record ??= {
    battles: 0, wins: 0, foes: {}, slain: {}, bosses: {}, dives: 0, maxFloor: 0,
    earned: 0, spent: 0, events: 0, nearDeaths: [], jobs: [], loot: 0,
  };
  return s.record;
}

export const bump = (m: Record<string, number>, k: string, n = 1) => {
  m[k] = (m[k] ?? 0) + n;
};

/** 돈이 들어오고 나간 기록 */
export function earn(s: LifeState, g: number) {
  if (g > 0) rec(s).earned += Math.round(g);
  else if (g < 0) rec(s).spent += Math.round(-g);
}
