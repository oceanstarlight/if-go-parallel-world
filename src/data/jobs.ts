import type { Job } from '../types';

export const JOBS: Job[] = [
  { id: 'farmer', name: '농부', primary: 'vit', passive: { vit: 1 },
    ranks: ['', '소작농', '자작농', '마을 원로', '촌장', '변경의 지주'],
    desc: '땅은 정직하다. 그러나 하늘은 그렇지 않다.' },
  { id: 'knight', name: '기사', primary: 'vit', passive: { vit: 1, fame: 1 },
    ranks: ['', '종자', '정기사', '백인대장', '기사단 부단장', '기사단장'],
    desc: '왕국의 검. 전장이 가장 가까운 직업.' },
  { id: 'mage', name: '궁정 마법사', primary: 'mana', passive: { mana: 1, int: 1 },
    ranks: ['', '견습 마법사', '정식 마법사', '수석 연구원', '궁정 마법사장', '대마법사'],
    desc: '진리를 좇는 자. 금기는 언제나 한 발짝 앞에 있다.' },
  { id: 'merchant', name: '상인', primary: 'int', passive: { int: 1, cha: 1 },
    ranks: ['', '행상', '점주', '상회 간부', '상회주', '대상회 연합 의장'],
    desc: '금화는 칼보다 멀리 닿는다.' },
  { id: 'adventurer', name: '모험가', primary: 'luck', passive: { luck: 1, vit: 1 },
    ranks: ['', 'F급 모험가', 'D급 모험가', 'B급 모험가', 'A급 모험가', 'S급 모험가'],
    desc: '던전과 황야가 일터. 동료가 곧 목숨줄이다.' },
  { id: 'priest', name: '성직자', primary: 'cha', passive: { cha: 1, mana: 1 },
    ranks: ['', '수련 사제', '사제', '주교', '대주교', '교황'],
    desc: '신의 이름으로 사람을 구하고, 신의 이름으로 사람을 심판한다.' },
  { id: 'demon_officer', name: '마왕군', primary: 'mana', passive: { mana: 1, vit: 1 },
    ranks: ['', '마왕군 병사', '마왕군 백부장', '마왕군 군단장', '사천왕', '마왕'],
    desc: '인간의 적. 정점에는 왕좌가 있고, 왕좌에는 용사가 찾아온다.' },
  { id: 'hero', name: '용사', primary: 'vit', passive: { vit: 1, mana: 1, fame: 1 },
    ranks: ['', '견습 용사', '성검의 계승자', '왕국의 용사', '대륙의 용사', '마왕을 벤 자'],
    desc: '세계의 기대를 짊어진 자. 그 끝은 마왕성이다.' },
];

export const jobById = (id: string | null) => JOBS.find((j) => j.id === id) ?? null;

export function jobTitle(jobId: string | null, rank: number): string {
  const job = jobById(jobId);
  if (!job) return '무직';
  return job.ranks[Math.max(1, Math.min(5, rank))];
}
