import type { LifeState } from '../types';
import { YEAR_NOTES, type YearNote } from '../data/notes';
import { matches } from './cond';

/** 같은 기록이 다시 나오기까지 최소 몇 년 */
export const NOTE_GAP = 8;

/** 이 나이에 한 해 기록이 남을 확률: 어릴수록 자주 (생존자 수에 맞춰 나이 들수록 줄인다) */
export function noteChance(age: number): number {
  if (age <= 30) return 0.85;
  if (age <= 50) return 0.55;
  return 0.35;
}

/** 지금 남을 수 있는 기록들 */
export function noteCandidates(s: LifeState): YearNote[] {
  const at = s.notesAt ?? {};
  return YEAR_NOTES.filter((n) => {
    if (s.age < n.minAge || s.age > n.maxAge) return false;
    const last = at[n.id];
    if (last !== undefined && (n.once || s.age - last < NOTE_GAP)) return false;
    return matches(n.cond, s);
  });
}

/**
 * 한 해 기록 하나를 고른다 (없으면 null).
 * 한 번뿐인 이정표(once)는 범위 끝에 가까울수록 꼭 뽑히도록 가중치를 크게 준다.
 */
export function pickNote(s: LifeState, rng: () => number): YearNote | null {
  const pool = noteCandidates(s);
  if (!pool.length) return null;
  const urgent = pool.find((n) => n.once && s.age === n.maxAge);
  if (urgent) return urgent;
  if (rng() > noteChance(s.age)) return null;
  const w = pool.map((n) => (n.weight ?? 1) * (n.once ? 4 : 1));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
