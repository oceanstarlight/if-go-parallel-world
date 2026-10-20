import { statOf } from '../engine/trinket';
import type { Effect, Focus, LifeState } from '../types';
import { ARMORS, POTIONS, WEAPONS, type ItemDef } from './items';

/** 마을 상점 분류 */
export type MarketCat = 'weapon' | 'armor' | 'potion' | 'life' | 'study' | 'fame' | 'elixir';

export const MARKET_CATS: { id: MarketCat; name: string }[] = [
  { id: 'weapon', name: '무기' }, { id: 'armor', name: '방어구' }, { id: 'potion', name: '소모품' },
  { id: 'life', name: '생활' }, { id: 'study', name: '교육' }, { id: 'fame', name: '명성·신앙' }, { id: 'elixir', name: '영약' },
];

/**
 * 상점 품목.
 * - gear: 가방에 물건이 들어온다
 * - owned: 한 번만 살 수 있는 영구 소유물 (집, 농지 …)
 * - service: 여러 번 살 수 있고, 살 때마다 값이 오른다 (교육, 연회 …)
 */
export interface MarketItem {
  id: string;
  cat: MarketCat;
  name: string;
  desc: string;
  price: number;
  type: 'gear' | 'owned' | 'service';
  gear?: ItemDef;
  effect?: Effect;
  /** 살 수 있는 조건 */
  minAge?: number;
}

const gearItem = (cat: MarketCat, d: ItemDef): MarketItem => ({
  id: d.base, cat, name: d.name, price: d.price, type: 'gear', gear: d,
  desc: d.kind === 'weapon' ? `공격력 +${d.power}` : d.kind === 'armor' ? `방어력 +${d.power} (최대 체력도 오른다)` : d.power >= 9999 ? '던전 HP 완전 회복' : `던전 HP +${d.power}`,
});

export const MARKET: MarketItem[] = [
  ...WEAPONS.map((d) => gearItem('weapon', d)),
  ...ARMORS.map((d) => gearItem('armor', d)),
  ...POTIONS.map((d) => gearItem('potion', d)),

  // 생활: 한 번 사면 평생 효과
  { id: 'house', cat: 'life', type: 'owned', name: '내 집 마련', price: 3000, minAge: 16, desc: '생활비 면제, 매년 스트레스 -8' },
  { id: 'land', cat: 'life', type: 'owned', name: '농지', price: 1500, minAge: 16, desc: '매년 +60G (농부면 +150G)' },
  { id: 'horse', cat: 'life', type: 'owned', name: '애마', price: 800, minAge: 10, desc: '탐험 성장 ×1.2' },
  { id: 'cat', cat: 'life', type: 'owned', name: '고양이', price: 120, desc: '매년 스트레스 -4. 가끔 기분이 좋아진다' },
  { id: 'big_bag', cat: 'life', type: 'owned', name: '큰 가방', price: 400, desc: '가방 +20칸' },
  { id: 'library', cat: 'life', type: 'owned', name: '개인 서재', price: 2500, minAge: 12, desc: '학업 성장 ×1.2' },
  { id: 'dojo', cat: 'life', type: 'owned', name: '개인 수련장', price: 2500, minAge: 12, desc: '수련 성장 ×1.2' },
  { id: 'salon', cat: 'life', type: 'owned', name: '살롱', price: 3000, minAge: 16, desc: '교류 성장 ×1.2' },
  { id: 'villa', cat: 'life', type: 'owned', name: '호숫가 별장', price: 20000, minAge: 20, desc: '매년 스트레스 -15, 매력 +10', effect: { stats: { cha: 10 } } },
  { id: 'castle', cat: 'life', type: 'owned', name: '나만의 성', price: 300000, minAge: 20, desc: '명성 +60. 이세계 인생의 정점', effect: { stats: { fame: 60 }, flags: ['own_castle'] } },

  // 교육: 살 때마다 값이 오른다
  { id: 'tutor', cat: 'study', type: 'service', name: '가정교사', price: 400, desc: '지성 +10' , effect: { stats: { int: 10 } } },
  { id: 'sword_lesson', cat: 'study', type: 'service', name: '검술 도장', price: 400, desc: '체력 +10', effect: { stats: { vit: 10 } } },
  { id: 'magic_lesson', cat: 'study', type: 'service', name: '마법 과외', price: 400, desc: '마력 +10', effect: { stats: { mana: 10 } } },
  { id: 'etiquette', cat: 'study', type: 'service', name: '예절 수업', price: 300, desc: '매력 +10', effect: { stats: { cha: 10 } } },

  // 명성·신앙
  { id: 'banquet', cat: 'fame', type: 'service', name: '연회 개최', price: 1500, minAge: 16, desc: '명성 +12, 매력 +4', effect: { stats: { fame: 12, cha: 4 }, mood: 'joy' } },
  { id: 'donation', cat: 'fame', type: 'service', name: '신전 헌금', price: 500, desc: '업보 +8', effect: { karma: 8 } },
  { id: 'statue', cat: 'fame', type: 'owned', name: '내 동상 세우기', price: 10000, minAge: 20, desc: '명성 +20. 광장에 내 동상이!', effect: { stats: { fame: 20 } } },
  { id: 'title', cat: 'fame', type: 'owned', name: '작위 구입', price: 60000, minAge: 20, desc: '명성 +50. 돈으로 귀족이 된다', effect: { stats: { fame: 50 }, flags: ['noble_title'] } },

  // 영약
  { id: 'charm', cat: 'elixir', type: 'owned', name: '행운의 부적', price: 3000, desc: '행운 +20', effect: { stats: { luck: 20 } } },
  { id: 'vigor', cat: 'elixir', type: 'service', name: '활력의 영약', price: 6000, desc: '체력 +20', effect: { stats: { vit: 20 } } },
  { id: 'wisdom', cat: 'elixir', type: 'service', name: '지혜의 영약', price: 6000, desc: '지성 +20', effect: { stats: { int: 20 } } },
  { id: 'mana_elixir', cat: 'elixir', type: 'service', name: '마력의 영약', price: 6000, desc: '마력 +20', effect: { stats: { mana: 20 } } },
  { id: 'youth', cat: 'elixir', type: 'owned', name: '젊음의 영약', price: 50000, desc: '노화가 30% 느려진다' },
];

export const marketById = (id: string) => MARKET.find((m) => m.id === id);

const count = (s: LifeState, id: string) => (s.owned ?? []).filter((o) => o === id).length;
export const owns = (s: LifeState, id: string) => count(s, id) > 0;

/** 지금 가격: 서비스는 살 때마다 50%씩 오른다 */
export function marketPrice(s: LifeState, m: MarketItem): number {
  const base = m.type === 'service' ? m.price * (1 + 0.5 * count(s, m.id)) : m.price;
  return Math.round(base * (1 - chaDeal(s)));
}

/** 매력 흥정: 매력 50부터 10마다 3% (최대 45%). 살 때 할인, 팔 때 같은 비율로 더 받는다 */
export const chaDeal = (s: LifeState) => Math.min(0.45, Math.max(0, Math.floor((statOf(s, 'cha') - 50) / 10)) * 0.03);

/** 소유물이 주는 성장 배율 */
export const OWNED_FOCUS: Record<string, Partial<Record<Focus, number>>> = {
  horse: { explore: 1.2 }, library: { study: 1.2 }, dojo: { train: 1.2 }, salon: { social: 1.2 },
};

/** 소유물이 줄여주는 연간 스트레스 */
export const OWNED_CALM: Record<string, number> = { house: 8, cat: 4, villa: 15 };
