import type { Cheat } from '../types';

export const CHEATS: Cheat[] = [
  {
    id: 'growth',
    name: '성장 가속',
    desc: '모든 성장이 1.5배! 화려하진 않지만 절대 배신하지 않는 국민 치트.',
    growthMul: { vit: 1.5, mana: 1.5, int: 1.5, cha: 1.5, fame: 1.5, luck: 1.5 },
  },
  {
    id: 'memory',
    name: '전생의 기억',
    desc: '전생의 지식 그대로! 지성 +20, 학문 성장 1.5배, 지성 판정 +10.',
    stats: { int: 20 },
    growthMul: { int: 1.5 },
    checkBonus: { int: 10 },
  },
  {
    id: 'allmagic',
    name: '전속성 마법 적성',
    desc: '모든 속성 마법을 쓸 수 있는 사기 치트! 마력 +25, 성장 2배, 판정 +15. 어릴 땐 폭주 주의.',
    stats: { mana: 25 },
    growthMul: { mana: 2 },
    checkBonus: { mana: 15 },
  },
  {
    id: 'affection',
    name: '호감의 눈',
    desc: '상대의 호감도가 숫자로 보인다! 매력 판정 +15, 호감도 변화 1.5배. 연애 시뮬 모드.',
    checkBonus: { cha: 15 },
    relMul: 1.5,
    showAffection: true,
  },
  {
    id: 'undying',
    name: '불굴의 육체',
    desc: '한 번 죽어도 벌떡! 노환을 제외한 죽음을 1회 무효화. 체력 +10.',
    stats: { vit: 10 },
    extraLives: 1,
  },
];

export const cheatById = (id: string) => CHEATS.find((c) => c.id === id) ?? CHEATS[0];
