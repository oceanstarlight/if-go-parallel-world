import type { Item, ItemKind, Rarity } from '../types';

/** 장비·소모품 원형. 상점과 던전 드롭이 같은 원형을 공유한다 */
export interface ItemDef {
  base: string;
  name: string;
  kind: ItemKind;
  power: number;
  /** 상점 가격 (판매가는 이 값의 40%) */
  price: number;
  /** 장비 단계 1~8 (드롭 계층 결정에 쓴다) */
  tier?: number;
}

export const WEAPONS: ItemDef[] = [
  { base: 'w1', name: '나무 검', kind: 'weapon', power: 6, price: 40, tier: 1 },
  { base: 'w2', name: '철검', kind: 'weapon', power: 14, price: 180, tier: 2 },
  { base: 'w3', name: '강철 대검', kind: 'weapon', power: 26, price: 600, tier: 3 },
  { base: 'w4', name: '미스릴 검', kind: 'weapon', power: 42, price: 1800, tier: 4 },
  { base: 'w5', name: '화염 마검', kind: 'weapon', power: 62, price: 5000, tier: 5 },
  { base: 'w6', name: '빙결 마창', kind: 'weapon', power: 88, price: 12000, tier: 6 },
  { base: 'w7', name: '용살검', kind: 'weapon', power: 120, price: 30000, tier: 7 },
  { base: 'w8', name: '성검 엑스칼리버', kind: 'weapon', power: 160, price: 80000, tier: 8 },
];

export const ARMORS: ItemDef[] = [
  { base: 'a1', name: '천 옷', kind: 'armor', power: 5, price: 30, tier: 1 },
  { base: 'a2', name: '가죽 갑옷', kind: 'armor', power: 12, price: 150, tier: 2 },
  { base: 'a3', name: '사슬 갑옷', kind: 'armor', power: 22, price: 500, tier: 3 },
  { base: 'a4', name: '미스릴 갑옷', kind: 'armor', power: 36, price: 1500, tier: 4 },
  { base: 'a5', name: '화룡 비늘 갑옷', kind: 'armor', power: 54, price: 4200, tier: 5 },
  { base: 'a6', name: '서리 기사 갑주', kind: 'armor', power: 76, price: 10000, tier: 6 },
  { base: 'a7', name: '용왕의 갑주', kind: 'armor', power: 104, price: 26000, tier: 7 },
  { base: 'a8', name: '여신의 가호 갑옷', kind: 'armor', power: 140, price: 70000, tier: 8 },
];

export const POTIONS: ItemDef[] = [
  { base: 'p1', name: '회복약', kind: 'potion', power: 60, price: 25 },
  { base: 'p2', name: '상급 회복약', kind: 'potion', power: 200, price: 120 },
  { base: 'p3', name: '엘릭서', kind: 'potion', power: 9999, price: 600 },
];

/** 던전 지대 (20층씩) */
export interface Biome {
  name: string;
  monsters: string[];
  /** 몬스터 재료: [이름, 기본 가치] */
  loot: [string, number][];
  /** 지대 장면 연출 */
  scene: 'dungeon' | 'demon_castle';
  weather?: 'embers' | 'snow' | 'sparkles';
}

export const BIOMES: Biome[] = [
  { name: '초록 동굴', monsters: ['슬라임', '고블린', '동굴 박쥐'], scene: 'dungeon',
    loot: [['슬라임 젤리', 6], ['고블린 귀걸이', 10], ['박쥐 날개', 8], ['반짝이는 이끼', 12]] },
  { name: '해골 미궁', monsters: ['스켈레톤', '구울', '오크 전사'], scene: 'dungeon',
    loot: [['낡은 뼈', 20], ['구울의 손톱', 30], ['오크 엄니', 40], ['녹슨 왕관 조각', 60]] },
  { name: '용암 심층', monsters: ['샐러맨더', '용암 골렘', '화염 정령'], scene: 'dungeon', weather: 'embers',
    loot: [['화염석', 90], ['골렘 핵', 140], ['정령의 불씨', 180], ['용암 진주', 260]] },
  { name: '얼음 심연', monsters: ['설인', '레이스', '와이번'], scene: 'dungeon', weather: 'snow',
    loot: [['빙결 수정', 300], ['레이스의 베일', 420], ['와이번 비늘', 550], ['영구 동토의 꽃', 800]] },
  { name: '마계 회랑', monsters: ['악마 기사', '서큐버스', '마족 장군'], scene: 'demon_castle', weather: 'embers',
    loot: [['마족의 뿔', 900], ['타락한 성배', 1300], ['어둠의 보석', 1800], ['마왕군 훈장', 2500]] },
];

export const biomeOf = (floor: number) => BIOMES[Math.min(4, Math.floor((Math.max(1, floor) - 1) / 20))];

/** 5층마다 나오는 보스 (index = 계층/5 - 1) */
export const BOSSES: string[] = [
  '킹 슬라임', '고블린 족장', '박쥐 여왕', '동굴 트롤',
  '해골 기사', '구울 군주', '오크 대족장', '리치',
  '화염 골렘', '이프리트', '용암 거북', '레드 드래곤',
  '설원의 거인', '레이스 왕', '빙룡', '서리 여왕',
  '마족 장군 벨', '서큐버스 퀸', '사천왕 아즈라', '마왕',
];

export const bossOf = (floor: number) => BOSSES[Math.max(0, Math.min(19, Math.floor(floor / 5) - 1))];

/** 보스가 남기는 재료 */
export const bossLoot = (floor: number): [string, number] => [`${bossOf(floor)}의 전리품`, Math.round(40 + floor * floor * 1.2)];

const RARITY_MUL: Record<Rarity, number> = { common: 1, rare: 1.3, epic: 1.7, legend: 2.3 };
export const RARITY_NAME: Record<Rarity, string> = { common: '일반', rare: '희귀', epic: '영웅', legend: '전설' };

/**
 * 물건 고유 번호. 예전에는 무작위 값을 더해서 같은 번호가 나올 수 있었고,
 * 그러면 다른 물건을 집어 「장착할 수 없다」가 뜨는 버그가 있었다. 이제는 단조 증가만 한다.
 */
let uidSeq = 0;
let uidBase = 0;
export function nextUid(): number {
  if (!uidBase) uidBase = (Date.now() % 1e9) * 1000;
  return uidBase + uidSeq++;
}
/** 원형으로 물건을 만든다. 희귀도가 높으면 성능과 가치가 오른다 */
export function makeItem(def: ItemDef, rarity: Rarity = 'common', _rng?: () => number): Item {
  const mul = RARITY_MUL[rarity];
  const names = def.kind === 'loot' ? ['', '빛나는 ', '진귀한 ', '전설의 '] : ['', '빛나는 ', '영웅의 ', '전설의 '];
  const prefix = names[['common', 'rare', 'epic', 'legend'].indexOf(rarity)];
  return {
    uid: nextUid(),
    base: def.base,
    name: prefix + def.name,
    kind: def.kind,
    rarity,
    power: Math.round(def.power * mul),
    value: Math.round(def.price * 0.4 * mul),
  };
}

/** 재료 루트 */
export function makeLoot(name: string, value: number, rarity: Rarity = 'common', rng: () => number = Math.random): Item {
  return makeItem({ base: `loot:${name}`, name, kind: 'loot', power: 0, price: value / 0.4 }, rarity, rng);
}

export const ALL_GEAR = [...WEAPONS, ...ARMORS, ...POTIONS];
export const gearByBase = (base: string) => ALL_GEAR.find((d) => d.base === base);

/** 판매가 */
export const sellPrice = (it: Item) => it.value;
