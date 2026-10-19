import type { Cheat } from '../types';

export const CHEATS: Cheat[] = [
  {
    id: 'growth',
    name: '성장 가속',
    desc: '모든 성장이 1.5배가 된다. 평범하지만 배신하지 않는 권능.',
    growthMul: { vit: 1.5, mana: 1.5, int: 1.5, cha: 1.5, fame: 1.5, luck: 1.5 },
  },
  {
    id: 'memory',
    name: '전생의 기억',
    desc: '다른 세계에서 살았던 기억. 지성 +20, 학문 성장 1.5배, 지성 판정 +10.',
    stats: { int: 20 },
    growthMul: { int: 1.5 },
    checkBonus: { int: 10 },
  },
  {
    id: 'allmagic',
    name: '전속성 마법 적성',
    desc: '모든 속성의 마법에 닿는다. 마력 +25, 마력 성장 2배, 마력 판정 +15. 어린 몸에는 버거울 수 있다.',
    stats: { mana: 25 },
    growthMul: { mana: 2 },
    checkBonus: { mana: 15 },
  },
  {
    id: 'affection',
    name: '호감의 눈',
    desc: '타인의 마음이 숫자로 보인다. 매력 판정 +15, 호감도 변화 1.5배.',
    checkBonus: { cha: 15 },
    relMul: 1.5,
    showAffection: true,
  },
  {
    id: 'undying',
    name: '불굴의 육체',
    desc: '노환을 제외한 죽음을 한 번 거부한다. 체력 +10.',
    stats: { vit: 10 },
    extraLives: 1,
  },
];

export const cheatById = (id: string) => CHEATS.find((c) => c.id === id) ?? CHEATS[0];
