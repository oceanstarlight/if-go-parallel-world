import type { YearNote } from './types';

/** 0~5세: 걸음마, 첫마디, 첫 친구 … */
export const INFANT_NOTES: YearNote[] = [
  { id: 'n0_first_step', minAge: 1, maxAge: 2, once: true, text: '처음으로 두 발로 섰다! 세 걸음 만에 엉덩방아를 찧었지만 집안이 박수로 떠들썩했다.', tone: 'good' },
  { id: 'n0_first_word', minAge: 1, maxAge: 3, once: true, text: '첫마디를 뗐다. 엄마도 아빠도 아닌 「밥」이었다.' },
  { id: 'n0_doljabi', minAge: 1, maxAge: 1, once: true, text: '돌잔치 날, 눈앞에 검·지팡이·책·금화가 놓였다. 작은 손이 망설임 없이 뻗어 갔다.' },
];
