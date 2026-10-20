import type { YearNote } from './types';

/** 13~19세: 사춘기, 진로 고민, 첫 일자리 … */
export const TEEN_NOTES: YearNote[] = [
  { id: 'n2_voice', minAge: 13, maxAge: 15, once: true, cond: { gender: 'm' }, text: '목소리가 갈라지기 시작했다. 노래를 부르다 삑사리가 나서 동네 꼬마들이 웃었다.' },
  { id: 'n2_mirror', minAge: 13, maxAge: 17, text: '거울 앞에 서 있는 시간이 부쩍 늘었다. 앞머리 한 가닥이 마음에 안 든다.' },
];
