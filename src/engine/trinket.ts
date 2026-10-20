import type { Item, LifeState, StatKey, Stats } from '../types';

/** 장신구 칸: 3칸에서 20세·40세에 하나씩 늘어 최대 5칸 */
export const trinketSlots = (s: LifeState) => 3 + (s.age >= 20 ? 1 : 0) + (s.age >= 40 ? 1 : 0);

export const wornTrinkets = (s: LifeState): Item[] => s.equip?.trinkets ?? [];

/** 장신구가 올려 주는 능력치 합 */
export function trinketBonus(s: LifeState): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const t of wornTrinkets(s)) for (const [k, v] of Object.entries(t.stats ?? {})) out[k as StatKey] = (out[k as StatKey] ?? 0) + (v ?? 0);
  return out;
}

/**
 * 실제로 쓰이는 능력치 = 타고난·키운 능력치 + 장신구 (최대 200).
 * 판정·전투력·HP·사건 조건에 쓴다. 성장·환생석·목표·전설은 장신구 없이 원래 능력치로 센다.
 */
export function statOf(s: LifeState, k: StatKey): number {
  let v = s.stats[k];
  for (const t of wornTrinkets(s)) v += t.stats?.[k] ?? 0;
  return Math.min(200, v);
}

export function effStats(s: LifeState): Stats {
  return { vit: statOf(s, 'vit'), mana: statOf(s, 'mana'), int: statOf(s, 'int'), cha: statOf(s, 'cha'), fame: statOf(s, 'fame'), luck: statOf(s, 'luck') };
}
