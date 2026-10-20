import type { YearNote } from './types';

/** 직업별 기록: cond.jobs 로 직업을, cond.minJobRank 로 직급을 건다 */
export const JOB_NOTES: YearNote[] = [
  { id: 'nj_mage_lecture', minAge: 25, maxAge: 70, cond: { jobs: ['mage'], minJobRank: 3 }, text: '3등급 모험가들을 상대로 마법 이론 강의를 했다. 반응이 뜨거워 질문이 밤까지 이어졌다.', effect: { stats: { fame: 1 } } },
  { id: 'nj_knight_polish', minAge: 18, maxAge: 60, cond: { jobs: ['knight'] }, text: '새벽마다 갑옷을 닦는 게 습관이 되었다. 반짝이는 흉갑에 비친 얼굴이 조금 늠름해졌다.' },
  { id: 'nj_farmer_rain', minAge: 16, maxAge: 80, cond: { jobs: ['farmer'] }, text: '가뭄 끝에 단비가 내렸다. 논두렁에 서서 한참 동안 비를 맞았다.' },
];
