import type { House } from '../types';

export const HOUSES: House[] = [
  {
    id: 'farm',
    name: '변경의 농가',
    desc: '북부 변경 마을, 소작농의 아이로 태어난다. 가진 것은 튼튼한 몸과 질긴 운뿐이다.',
    stats: { vit: 22, mana: 6, int: 8, cha: 10, fame: 0, luck: 18 },
    karma: 5,
    flags: ['commoner'],
    growth: { vit: 1 },
  },
  {
    id: 'merchant',
    name: '자유도시 상인가',
    desc: '항구도시 리벨의 중견 상회. 걸음마보다 셈과 흥정을 먼저 배운다.',
    stats: { vit: 12, mana: 8, int: 18, cha: 18, fame: 5, luck: 12 },
    flags: ['commoner'],
    growth: { int: 1 },
  },
  {
    id: 'noble',
    name: '발렌하르트 대공가',
    desc: '왕국 서부를 다스리는 대공가의 막내. 모든 것이 주어지지만, 모든 것이 노려진다.',
    stats: { vit: 14, mana: 14, int: 20, cha: 22, fame: 25, luck: 10 },
    flags: ['noble'],
    growth: { cha: 1, fame: 1 },
  },
  {
    id: 'demon',
    name: '마왕군 간부의 핏줄',
    desc: '마왕군 제3군단장의 자식. 인간의 땅에서 그 피는 곧 사형 선고다.',
    stats: { vit: 20, mana: 26, int: 14, cha: 10, fame: 0, luck: 8 },
    karma: -20,
    flags: ['demonblood'],
    growth: { mana: 1 },
  },
  {
    id: 'hero',
    name: '용사의 혈통',
    desc: '삼백 년 전 마왕을 봉인한 용사의 후예. 성검은 아직 잠들어 있다.',
    stats: { vit: 20, mana: 18, int: 14, cha: 16, fame: 15, luck: 14 },
    karma: 10,
    flags: ['heroblood'],
    growth: { vit: 1, mana: 1 },
  },
];

export const houseById = (id: string) => HOUSES.find((h) => h.id === id) ?? HOUSES[0];
