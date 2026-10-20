import type { Cond, Effect, Text, Tone } from '../../types';

/**
 * 한 해 기록: 선택지 없이 연대기에 한 줄 남는 삶의 순간.
 * 매년 새해에 나이대별 확률로 하나가 뽑힌다 (src/engine/notes.ts).
 */
export interface YearNote {
  /** 유일한 id. 접두사: n0_ 영유아 · n1_ 어린이 · n2_ 소년 · n3_ 청년 · n4_ 중년 · n5_ 노년 · nj_ 직업 */
  id: string;
  /** 이 나이 범위에서만 (양 끝 포함) */
  minAge: number;
  maxAge: number;
  /** {name} {friend} {house} {title} 등 토큰을 쓸 수 있다 */
  text: Text;
  /** 직업·출신·성별·인연·플래그 등 (사건 조건과 같다. 나이는 위의 minAge/maxAge 로) */
  cond?: Cond;
  /** 한 생에 한 번 (첫걸음마, 첫 흰머리 같은 이정표). 범위 안에서 우선 뽑힌다 */
  once?: boolean;
  /** 뽑힐 가중치 (기본 1) */
  weight?: number;
  /** 연대기 색 (기본 normal) */
  tone?: Tone;
  /** 아주 작은 효과만 (능력치 ±1, 기분 등). 큰 효과는 사건으로 */
  effect?: Effect;
}
