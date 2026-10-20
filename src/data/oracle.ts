import type { Effect } from '../types';

/** 환생 전 여신의 문답 (Alter Ego 의 성격 검사). 답에 따라 시작 성향이 정해진다. */
export interface OracleAnswer {
  label: string;
  reply: string;
  effect: Effect;
}

export interface OracleQuestion {
  id: string;
  text: string;
  answers: [OracleAnswer, OracleAnswer];
}

export const ORACLE: OracleQuestion[] = [
  { id: 'wish', text: '다시 태어나면 뭘 하고 싶어?', answers: [
    { label: '마음껏 싸우고 싶어!', reply: '피가 끓는 타입이구나♪', effect: { stats: { vit: 6 } } },
    { label: '세상의 비밀을 알고 싶어', reply: '오, 학구파! 책 좋아하지?', effect: { stats: { int: 6 } } },
  ] },
  { id: 'fallen', text: '길에 누가 쓰러져 있어. 어떡할래?', answers: [
    { label: '당연히 돕지!', reply: '착하네~ 이세계엔 그런 사람이 부족해.', effect: { karma: 10, stats: { cha: 4 } } },
    { label: '못 본 척 지나간다', reply: '현실적이네. 뭐, 그것도 생존 전략이지.', effect: { karma: -5, stats: { luck: 6 } } },
  ] },
  { id: 'power', text: '강한 힘이랑 좋은 친구, 하나만 고른다면?', answers: [
    { label: '힘!', reply: '솔직해서 좋아. 마력을 조금 더 얹어줄게.', effect: { stats: { mana: 6 } } },
    { label: '친구!', reply: '그 대답, 마음에 들어.', effect: { stats: { cha: 6 }, will: 5 } },
  ] },
  { id: 'fate', text: '운명이 정해져 있다면, 따를 거야?', answers: [
    { label: '따르는 게 편하지', reply: '흘러가는 대로~ 행운이 따를 거야.', effect: { stats: { luck: 10 } } },
    { label: '거스를 거야!', reply: '후후, 반골 기질! 의지력을 듬뿍 줄게.', effect: { will: 20 } },
  ] },
  { id: 'fear', text: '무서운 거 있어?', answers: [
    { label: '없어!', reply: '용감하네! …진짜야?', effect: { stats: { vit: 4 }, will: 5 } },
    { label: '사실 많아…', reply: '겁이 많은 건 오래 사는 비결이야.', effect: { stats: { luck: 6, int: 2 } } },
  ] },
  { id: 'memory', text: '전생의 이름, 기억나?', answers: [
    { label: '응, 기억나', reply: '그 기억, 소중히 가져가.', effect: { will: 10 } },
    { label: '잊어버렸어', reply: '괜찮아. 새 이름으로 새 출발!', effect: { stats: { luck: 6 }, stress: -10 } },
  ] },
  { id: 'life', text: '짧고 굵게? 길고 가늘게?', answers: [
    { label: '짧고 굵게!', reply: '불꽃 같은 인생이구나. 이름을 떨쳐봐!', effect: { stats: { fame: 6, cha: 2 } } },
    { label: '길고 가늘게~', reply: '장수 지향! 몸 튼튼하게 해줄게.', effect: { stats: { vit: 6 } } },
  ] },
  { id: 'pretty', text: '마지막 질문! …나, 예뻐?', answers: [
    { label: '당연하지!', reply: '꺄아~ 기분 좋아! 행운 서비스♪', effect: { stats: { luck: 10 }, mood: 'joy' } },
    { label: '글쎄…', reply: '…흥. (여신이 삐쳤다)', effect: { stats: { int: 4 }, will: 5 } },
  ] },
];

export const oracleById = (id: string) => ORACLE.find((q) => q.id === id)!;

/** 이번 생의 문답 3개. '예뻐?' 질문이 뽑히면 항상 마지막에 둔다 */
export function pickOracle(rng: () => number): string[] {
  const ids = ORACLE.map((q) => q.id);
  const out: string[] = [];
  while (out.length < 3) {
    const id = ids[Math.floor(rng() * ids.length)];
    if (!out.includes(id)) out.push(id);
  }
  return out.sort((a, b) => (a === 'pretty' ? 1 : b === 'pretty' ? -1 : 0));
}
