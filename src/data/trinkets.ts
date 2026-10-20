import type { Item, Rarity, StatKey, Stats } from '../types';
import { nextUid } from './items';

/**
 * 장신구: 여러 개를 동시에 찬다. 희귀도가 높을수록 주 능력치가 크게 오르고, 다른 능력치도 함께 오른다.
 *  - 일반: 주 능력치 +2~3
 *  - 희귀: 주 능력치 +4~6
 *  - 영웅: 주 능력치 +7~9, 보조 1개 +2~4
 *  - 전설: 주 능력치 +11~14, 보조 2개 +3~5
 */
export interface TrinketDef {
  base: string;
  name: string;
  /** 주 능력치 */
  stat: StatKey;
}

export const TRINKETS: TrinketDef[] = [
  { base: 't_vit1', name: '곰 이빨 목걸이', stat: 'vit' },
  { base: 't_vit2', name: '강철 팔찌', stat: 'vit' },
  { base: 't_mana1', name: '달빛 펜던트', stat: 'mana' },
  { base: 't_mana2', name: '마정석 귀걸이', stat: 'mana' },
  { base: 't_int1', name: '현자의 외알 안경', stat: 'int' },
  { base: 't_int2', name: '부엉이 깃털 핀', stat: 'int' },
  { base: 't_cha1', name: '장미 브로치', stat: 'cha' },
  { base: 't_cha2', name: '진주 머리장식', stat: 'cha' },
  { base: 't_fame1', name: '용기의 훈장', stat: 'fame' },
  { base: 't_fame2', name: '왕실 인장 반지', stat: 'fame' },
  { base: 't_luck1', name: '네잎클로버 부적', stat: 'luck' },
  { base: 't_luck2', name: '황금 고양이 방울', stat: 'luck' },
];

/** 사건 보상 전용 (이야기가 있는 장신구) */
export const STORY_TRINKETS: TrinketDef[] = [
  { base: 't_mother', name: '어머니의 손수건', stat: 'cha' },
  { base: 't_mentor', name: '스승의 낡은 반지', stat: 'int' },
  { base: 't_fairy', name: '요정의 은방울', stat: 'luck' },
  { base: 't_hero', name: '용사의 깨진 견장', stat: 'vit' },
  { base: 't_star', name: '별똥별 조각', stat: 'mana' },
  { base: 't_crown', name: '축제 왕관', stat: 'fame' },
];

const ALL = [...TRINKETS, ...STORY_TRINKETS];
export const trinketDef = (base: string) => ALL.find((t) => t.base === base);

const MAIN: Record<Rarity, [number, number]> = { common: [4, 6], rare: [8, 12], epic: [14, 18], legend: [22, 28] };
const SUB: Record<Rarity, { n: number; range: [number, number] }> = {
  common: { n: 0, range: [0, 0] }, rare: { n: 0, range: [0, 0] }, epic: { n: 1, range: [4, 8] }, legend: { n: 2, range: [6, 10] },
};
const VALUE: Record<Rarity, number> = { common: 60, rare: 220, epic: 800, legend: 3000 };
const PREFIX: Record<Rarity, string> = { common: '', rare: '빛나는 ', epic: '영웅의 ', legend: '전설의 ' };
const STATS: StatKey[] = ['vit', 'mana', 'int', 'cha', 'fame', 'luck'];

export function makeTrinket(def: TrinketDef, rarity: Rarity, rng: () => number = Math.random): Item {
  const roll = ([lo, hi]: [number, number]) => lo + Math.floor(rng() * (hi - lo + 1));
  const stats: Partial<Stats> = { [def.stat]: roll(MAIN[rarity]) };
  const others = STATS.filter((k) => k !== def.stat);
  for (let i = 0; i < SUB[rarity].n; i++) {
    const k = others.splice(Math.floor(rng() * others.length), 1)[0];
    stats[k] = roll(SUB[rarity].range);
  }
  return {
    uid: nextUid(), base: def.base, name: PREFIX[rarity] + def.name, kind: 'trinket', rarity,
    power: Object.values(stats).reduce((a, b) => a + (b ?? 0), 0), value: VALUE[rarity], stats,
  };
}

/** 무작위 장신구 (stat 을 주면 그 능력치 장신구 중에서) */
export function randomTrinket(rarity: Rarity, rng: () => number = Math.random, stat?: StatKey): Item {
  const pool = stat ? TRINKETS.filter((t) => t.stat === stat) : TRINKETS;
  return makeTrinket(pool[Math.floor(rng() * pool.length)], rarity, rng);
}
