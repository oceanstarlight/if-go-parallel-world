import type { Job } from '../types';

/**
 * 직업. income 은 직급(1~5)별 연간 수입(골드), combat 은 직급당 전투력 보너스.
 * 도둑은 고정 수입이 없고 '한탕' 사건으로 번다.
 */
export const JOBS: Job[] = [
  { id: 'farmer', name: '농부', primary: 'vit', passive: { vit: 1 },
    ranks: ['', '소작농', '자작농', '마을 원로', '촌장', '변경의 지주'],
    income: [0, 30, 50, 80, 120, 200],
    desc: '밭 갈고 씨 뿌리는 슬로우 라이프. 수입은 적어도 꾸준하다. 농지를 사면 더 번다.' },
  { id: 'knight', name: '기사', primary: 'vit', passive: { vit: 1, fame: 1 }, combat: 10,
    ranks: ['', '종자', '정기사', '백인대장', '기사단 부단장', '기사단장'],
    income: [0, 50, 100, 160, 250, 400],
    desc: '왕국을 지키는 반짝이는 기사님. 출정이 잦다.' },
  { id: 'mage', name: '궁정 마법사', primary: 'mana', passive: { mana: 1, int: 1 }, combat: 6,
    ranks: ['', '견습 마법사', '정식 마법사', '수석 연구원', '궁정 마법사장', '대마법사'],
    income: [0, 60, 110, 180, 280, 450],
    desc: '마탑의 엘리트! 연구에 빠지면 금단의 영역까지 가버린다.' },
  { id: 'court', name: '궁정 문관', primary: 'int', passive: { int: 1, cha: 1 },
    ranks: ['', '서기관', '사무관', '재무관', '재상 보좌', '재상'],
    income: [0, 90, 170, 300, 500, 900],
    desc: '왕궁의 두뇌. 수입은 최고지만 궁정 암투는 목숨을 건 게임이다.' },
  { id: 'merchant', name: '상인', primary: 'int', passive: { int: 1, cha: 1 },
    ranks: ['', '행상', '점주', '상회 간부', '상회주', '대상회 연합 의장'],
    income: [0, 40, 90, 160, 280, 500],
    desc: '돈이 곧 힘! 투자에 성공하면 대박, 망하면 빚더미.' },
  { id: 'adventurer', name: '모험가', primary: 'luck', passive: { luck: 1, vit: 1 }, combat: 6,
    ranks: ['', 'F급 모험가', 'D급 모험가', 'B급 모험가', 'A급 모험가', 'S급 모험가'],
    income: [0, 10, 20, 40, 70, 120],
    desc: 'F랭크에서 S랭크까지! 진짜 수입은 던전에서 나온다. 깊이 내려갈수록 랭크가 오른다.' },
  { id: 'thief', name: '도둑', primary: 'luck', passive: { luck: 1, cha: 1 }, combat: 3,
    ranks: ['', '좀도둑', '소매치기 두목', '도적 길드 간부', '도적 길드장', '전설의 괴도'],
    income: [0, 0, 0, 0, 0, 0],
    desc: '한탕이면 큰돈! 하지만 붙잡히면 전 재산 몰수, 세 번째엔 교수대가 기다린다.' },
  { id: 'priest', name: '성직자', primary: 'cha', passive: { cha: 1, mana: 1 },
    ranks: ['', '수련 사제', '사제', '주교', '대주교', '교황'],
    income: [0, 30, 60, 110, 200, 380],
    desc: '여신님을 모시며 치유 마법으로 사람들을 돕는다.' },
  { id: 'demon_officer', name: '마왕군', primary: 'mana', passive: { mana: 1, vit: 1 }, combat: 10,
    ranks: ['', '마왕군 병사', '마왕군 백부장', '마왕군 군단장', '사천왕', '마왕'],
    income: [0, 40, 90, 170, 300, 600],
    desc: '어둠의 간부 루트! 정점은 마왕의 자리. 그리고 언젠가 용사가 온다.' },
  { id: 'hero', name: '용사', primary: 'vit', passive: { vit: 1, mana: 1, fame: 1 }, combat: 15,
    ranks: ['', '견습 용사', '성검의 계승자', '왕국의 용사', '대륙의 용사', '마왕을 벤 자'],
    income: [0, 40, 80, 150, 250, 500],
    desc: '세계를 구할 주인공! 목표는 마왕성이다.' },
];

export const jobById = (id: string | null) => JOBS.find((j) => j.id === id) ?? null;

export function jobTitle(jobId: string | null, rank: number): string {
  const job = jobById(jobId);
  if (!job) return '무직';
  return job.ranks[Math.max(1, Math.min(5, rank))];
}
