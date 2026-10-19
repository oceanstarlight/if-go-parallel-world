import type { House } from '../types';

export const HOUSES: House[] = [
  {
    id: 'farm',
    name: '변경의 농가',
    desc: '시골 마을 농가에서 태어난다. 튼튼한 몸과 질긴 운이 무기! 슬로우 라이프의 정석.',
    stats: { vit: 22, mana: 6, int: 8, cha: 10, fame: 0, luck: 18 },
    karma: 5,
    flags: ['commoner'],
    growth: { vit: 1 },
  },
  {
    id: 'merchant',
    name: '자유도시 상인가',
    desc: '항구도시의 상인 집안. 걸음마보다 주판을 먼저 배운다. 돈 버는 이세계 생활!',
    stats: { vit: 12, mana: 8, int: 18, cha: 18, fame: 5, luck: 12 },
    flags: ['commoner'],
    growth: { int: 1 },
  },
  {
    id: 'noble',
    name: '발렌하르트 대공가',
    desc: '대공가의 막내로 태어난다. 금수저지만 음모와 독살 플래그도 함께 따라온다.',
    stats: { vit: 14, mana: 14, int: 20, cha: 22, fame: 25, luck: 10 },
    flags: ['noble'],
    growth: { cha: 1, fame: 1 },
  },
  {
    id: 'demon',
    name: '마왕군 간부의 핏줄',
    desc: '마왕군 간부의 자녀. 작은 뿔이 귀엽지만, 인간들에게 들키면 큰일!',
    stats: { vit: 20, mana: 26, int: 14, cha: 10, fame: 0, luck: 8 },
    karma: -20,
    flags: ['demonblood'],
    growth: { mana: 1 },
  },
  {
    id: 'hero',
    name: '용사의 혈통',
    desc: '전설의 용사 혈통! 지하실의 성검이 당신을 기다리고 있다. 주인공 확정 루트.',
    stats: { vit: 20, mana: 18, int: 14, cha: 16, fame: 15, luck: 14 },
    karma: 10,
    flags: ['heroblood'],
    growth: { vit: 1, mana: 1 },
  },
];

export const houseById = (id: string) => HOUSES.find((h) => h.id === id) ?? HOUSES[0];
