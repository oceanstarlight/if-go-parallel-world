import type { YearNote } from './types';

/** 20~30세: 독립, 일, 연애, 결혼 … */
export const YOUNG_NOTES: YearNote[] = [
  { id: 'n3_own_room', minAge: 20, maxAge: 26, once: true, text: '작은 다락방을 빌려 처음으로 독립했다. 창문이 하나뿐이지만 세상에서 제일 좋은 방이다.', tone: 'good' },
  { id: 'n3_spouse_dinner', minAge: 20, maxAge: 30, cond: { hasRel: ['spouse'] }, text: '{spouse:와} 서툰 솜씨로 저녁을 차렸다. 조금 탔지만 둘 다 남김없이 먹었다.' },
];
