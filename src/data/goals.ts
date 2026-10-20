import type { LifeState } from '../types';

/** 이번 생의 목표. 태어날 때 3개를 뽑고, 죽을 때 달성 여부를 정산한다. */
export interface Goal {
  id: string;
  name: string;
  /** 이 출신·조건에서만 뽑힌다 */
  canAssign?: (s: LifeState) => boolean;
  /** 달성했는가 (살아 있는 동안에도 진행 상황 표시에 쓴다) */
  done: (s: LifeState) => boolean;
  /** 보상 환생석 */
  reward: number;
}

const has = (s: LifeState, f: string) => s.flags.includes(f);

export const GOALS: Goal[] = [
  { id: 'age40', name: '마흔 살까지 살아남기', done: (s) => s.age >= 40, reward: 6 },
  { id: 'age70', name: '일흔 살까지 장수하기', done: (s) => s.age >= 70, reward: 10 },
  { id: 'age100', name: '백 살 생일 맞이하기', canAssign: (s) => s.houseId === 'elf' || s.cheatId === 'ageless', done: (s) => s.age >= 100, reward: 18 },
  { id: 'married', name: '결혼하기', done: (s) => !!s.rels.spouse || has(s, 'has_child'), reward: 6 },
  { id: 'child', name: '아이 낳기', done: (s) => has(s, 'has_child'), reward: 8 },
  { id: 'friend_marry', name: '소꿉친구와 결혼하기', done: (s) => !!s.rels.spouse && !s.rels.friend && s.seen.includes('a_friend_confess') && !has(s, 'friend_obsessed'), reward: 12 },
  { id: 'academy', name: '왕립 아카데미 입학하기', done: (s) => has(s, 'academy'), reward: 6 },
  { id: 'top_student', name: '아카데미 수석 차지하기', done: (s) => has(s, 'top_student'), reward: 12 },
  { id: 'rank3', name: '직업에서 3단계까지 승진하기', done: (s) => s.jobRank >= 3, reward: 8 },
  { id: 'rank5', name: '직업 최고 직위에 오르기', done: (s) => s.jobRank >= 5, reward: 15 },
  { id: 'fame60', name: '명성 170 넘기기 (유명인 되기)', done: (s) => s.stats.fame >= 170, reward: 10 },
  { id: 'saint', name: '업보 +60 (성인 군자)', done: (s) => s.karma >= 60, reward: 10 },
  { id: 'villain', name: '업보 -60 (희대의 악당)', canAssign: (s) => has(s, 'demonblood') || has(s, 'witchblood'), done: (s) => s.karma <= -60, reward: 10 },
  { id: 'stat90', name: '능력치 하나를 90 이상으로', done: (s) => Object.values(s.stats).some((v) => v >= 90), reward: 10 },
  { id: 'dragon', name: '드래곤 슬레이어 되기', done: (s) => has(s, 'dragonslayer'), reward: 18 },
  { id: 'treasure', name: '던전 보물 손에 넣기', done: (s) => has(s, 'treasure'), reward: 8 },
  { id: 'rival_friend', name: '라이벌과 절친 되기', done: (s) => has(s, 'rival_friend'), reward: 10 },
  { id: 'mentor', name: '스승 만나기', done: (s) => !!s.rels.mentor || s.seen.includes('a_mentor_death'), reward: 5 },
  { id: 'demon_lord', name: '마왕의 자리에 오르기', canAssign: (s) => has(s, 'demonblood'), done: (s) => s.jobId === 'demon_officer' && s.jobRank >= 5, reward: 20 },
  { id: 'hero_win', name: '마왕을 쓰러뜨리기', canAssign: (s) => has(s, 'heroblood'), done: (s) => has(s, 'slew_demon_lord') || has(s, 'peace'), reward: 20 },
  { id: 'heir', name: '대공가의 후계자 되기', canAssign: (s) => has(s, 'noble'), done: (s) => has(s, 'heir'), reward: 15 },
  { id: 'accepted', name: '마족임을 밝히고 받아들여지기', canAssign: (s) => has(s, 'demonblood'), done: (s) => has(s, 'accepted'), reward: 15 },
  { id: 'lulu', name: '마녀 루루를 만나기', done: (s) => (s.npcMet ?? []).includes('lulu'), reward: 5 },
  { id: 'grim_chess', name: '사신을 체스로 이기기', done: (s) => has(s, 'grim_win'), reward: 12 },
  { id: 'momo_jackpot', name: '모모의 뽑기에서 대박 내기', done: (s) => has(s, 'momo_jackpot'), reward: 10 },
];

export const goalById = (id: string) => GOALS.find((g) => g.id === id);

/** 모든 목표를 달성하면 받는 추가 보상 */
export const ALL_GOALS_BONUS = 10;
