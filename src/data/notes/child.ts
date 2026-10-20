import type { YearNote } from './types';

/** 6~12세: 마을 학교, 친구, 놀이, 집안일 … */
export const CHILD_NOTES: YearNote[] = [
  { id: 'n1_first_tooth', minAge: 6, maxAge: 8, once: true, text: '앞니가 쏙 빠졌다. 지붕 위로 던지며 튼튼한 이가 나기를 빌었다.' },
  { id: 'n1_errand', minAge: 6, maxAge: 10, text: '처음으로 혼자 시장 심부름을 다녀왔다. 거스름돈을 한 닢도 안 틀렸다!', effect: { stats: { int: 1 } } },
];
