import type { LifeState } from '../types';
import { MASKED_HINTS, TRUTH_LOOP, doomOf } from '../data/world';
import type { Rng } from './life';

/** 멸망이 오는 나이: 48~52세 중 하나 (그 1년 전부터 하늘이 물든다) */
export const DOOM_AGES = [48, 52] as const;
/** 가면 쓴 사람이 찾아오는 나이 */
export const HINT_AGES = [20, 22] as const;

export interface WorldOptions {
  /** 지금까지 겪은 멸망 수 (= 이번 생의 회차 - 1) */
  loop?: number;
  /** 가면 쓴 사람의 노래를 들은 수 */
  hints?: number;
}

/** 새 삶: 이번 생의 멸망·힌트 시기와 진실 루트 여부를 정한다 */
export function setupWorld(s: LifeState, opt: WorldOptions, rng: Rng) {
  s.loop = opt.loop ?? 0;
  s.doomAge = DOOM_AGES[0] + Math.floor(rng() * (DOOM_AGES[1] - DOOM_AGES[0] + 1));
  if (s.loop < MASKED_HINTS.length) s.hintAge = HINT_AGES[0] + Math.floor(rng() * (HINT_AGES[1] - HINT_AGES[0] + 1));
  if (s.loop >= TRUTH_LOOP && (opt.hints ?? 0) >= MASKED_HINTS.length) s.flags.push('truth_open');
}

/** 진실 루트를 끝까지 밟았는가 (궁정 마법사: 진리자의 말 / 용사: 동료 셋 + 마왕 토벌) */
export const truthDone = (s: LifeState) =>
  s.flags.includes('truth_open') && (s.flags.includes('tr_truth') || (s.flags.includes('tr_comp3') && s.flags.includes('slew_demon_lord')));

/** 새해마다: 가면 쓴 사람, 하늘의 전조, 멸망의 날. 로그를 남길 문장을 돌려준다 */
export function worldYear(s: LifeState): string | null {
  const loop = s.loop ?? 0;
  if (s.hintAge === s.age) s.flags.push(`masked_${loop + 1}`);
  if (!s.doomAge) return null;
  if (s.age === s.doomAge - 1) {
    s.omen = doomOf(loop).sky;
    return doomOf(loop).omen;
  }
  if (s.age === s.doomAge) {
    s.flags.push(truthDone(s) ? 'white_dragon' : `${doomOf(loop).id}_now`);
    s.yearMark = 0;
  }
  return null;
}

/** 세계의 끝 (멸망 5종) */
export const isDoom = (causeId: string) => causeId.startsWith('doom_');
/** 생을 끝맺는 엔딩 (멸망·해피·베드) — 불굴의 목숨도 막지 못한다 */
export const isWorldEnd = (causeId: string) => isDoom(causeId) || causeId === 'happy_end' || causeId === 'bad_end';
