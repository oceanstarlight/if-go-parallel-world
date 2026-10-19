export interface ShopItem {
  id: string;
  kind: 'house' | 'cheat' | 'upgrade';
  cost: number | ((level: number) => number);
  maxLevel?: number;
  name?: string;
  desc?: string;
}

/** 처음부터 열려 있는 항목 */
export const DEFAULT_UNLOCKED = ['farm', 'merchant', 'growth', 'memory'];

export const SHOP: ShopItem[] = [
  { id: 'noble', kind: 'house', cost: 40 },
  { id: 'demon', kind: 'house', cost: 60 },
  { id: 'hero', kind: 'house', cost: 120 },
  { id: 'allmagic', kind: 'cheat', cost: 30 },
  { id: 'affection', kind: 'cheat', cost: 30 },
  { id: 'undying', kind: 'cheat', cost: 50 },
  { id: 'echo', kind: 'upgrade', name: '전생의 잔향', desc: '모든 시작 능력치 +2 (명성 제외)',
    cost: (lv) => 20 * (lv + 1), maxLevel: 5 },
  { id: 'fortune', kind: 'upgrade', name: '행운의 각인', desc: '시작 행운 +5',
    cost: (lv) => 25 * (lv + 1), maxLevel: 3 },
];

export const itemCost = (item: ShopItem, level: number) =>
  typeof item.cost === 'function' ? item.cost(level) : item.cost;
