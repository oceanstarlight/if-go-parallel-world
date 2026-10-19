export interface ShopItem {
  id: string;
  kind: 'house' | 'cheat' | 'upgrade';
  cost: number | ((level: number) => number);
  maxLevel?: number;
  name?: string;
  desc?: string;
}

/** 처음부터 직접 고를 수 있는 항목 (운명 모드에서는 모든 출신·권능이 나올 수 있다) */
export const DEFAULT_UNLOCKED = ['farm', 'merchant', 'growth', 'memory'];

export const SHOP: ShopItem[] = [
  { id: 'noble', kind: 'house', cost: 40 },
  { id: 'demon', kind: 'house', cost: 60 },
  { id: 'hero', kind: 'house', cost: 120 },
  { id: 'allmagic', kind: 'cheat', cost: 30 },
  { id: 'affection', kind: 'cheat', cost: 30 },
  { id: 'undying', kind: 'cheat', cost: 50 },
  { id: 'elf', kind: 'house', cost: 35 },
  { id: 'dwarf', kind: 'house', cost: 25 },
  { id: 'beastkin', kind: 'house', cost: 25 },
  { id: 'eastern', kind: 'house', cost: 25 },
  { id: 'mermaid', kind: 'house', cost: 45 },
  { id: 'sky', kind: 'house', cost: 55 },
  { id: 'witch', kind: 'house', cost: 45 },
  { id: 'slime', kind: 'house', cost: 80 },
  { id: 'appraisal', kind: 'cheat', cost: 25 },
  { id: 'goddess', kind: 'cheat', cost: 35 },
  { id: 'swordsaint', kind: 'cheat', cost: 40 },
  { id: 'sage', kind: 'cheat', cost: 40 },
  { id: 'idol', kind: 'cheat', cost: 40 },
  { id: 'ageless', kind: 'cheat', cost: 50 },
  { id: 'echo', kind: 'upgrade', name: '전생의 잔향', desc: '모든 시작 능력치 +2 (명성 제외)',
    cost: (lv) => 20 * (lv + 1), maxLevel: 5 },
  { id: 'fortune', kind: 'upgrade', name: '행운의 각인', desc: '시작 행운 +5',
    cost: (lv) => 25 * (lv + 1), maxLevel: 3 },
  { id: 'deep_start', kind: 'upgrade', name: '심층의 각인', desc: '던전을 5층 더 깊은 곳에서 시작할 수 있다',
    cost: (lv) => 30 * (lv + 1), maxLevel: 6 },
  { id: 'heirloom', kind: 'upgrade', name: '전생의 비상금', desc: '시작 골드 +100',
    cost: (lv) => 15 * (lv + 1), maxLevel: 5 },
];

export const itemCost = (item: ShopItem, level: number) =>
  typeof item.cost === 'function' ? item.cost(level) : item.cost;
