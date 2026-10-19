import type { Item, LifeState } from '../types';
import { jobById } from '../data/jobs';
import { gearByBase, makeItem, nextUid, sellPrice } from '../data/items';
import { OWNED_CALM, marketById, marketPrice, owns } from '../data/market';
import { applyEffect, type Rng } from './life';

/** 가방 크기 */
export const bagCap = (s: LifeState) => 30 + (owns(s, 'big_bag') ? 20 : 0);

/** 던전 최대 HP */
export const maxHp = (s: LifeState) => 60 + s.stats.vit * 2 + (s.equip?.armor?.power ?? 0);

export const goldOf = (s: LifeState) => s.gold ?? 0;

/** 1,234G */
export const fmtGold = (g: number) => `${g < 0 ? '-' : ''}${Math.abs(Math.round(g)).toLocaleString('ko-KR')}G`;

/**
 * 한 해의 살림: 직업 수입 + 농지 − 생활비 − 빚 이자.
 * 돌려주는 문장이 있으면 연대기에 남긴다 (풍년·흉년·빚 등 눈에 띄는 일만).
 */
export function yearlyEconomy(s: LifeState, rng: Rng): string | null {
  let note: string | null = null;
  let income = 0;
  const job = jobById(s.jobId);
  if (job) {
    let base = job.income[Math.max(1, Math.min(5, s.jobRank))] ?? 0;
    if (job.id === 'merchant') base = Math.round(base * (0.6 + rng() * 0.8));
    if (job.id === 'farmer') {
      const r = rng();
      if (r < 0.12) {
        base = Math.round(base * 0.4);
        note = '흉년이 들었다… 올해 수확은 형편없다.';
      } else if (r > 0.9) {
        base = Math.round(base * 1.6);
        note = '대풍년! 곳간이 넘쳐난다.';
      }
    }
    income += base;
  } else if (s.age >= 16) {
    income += 10; // 잡일
  }
  if (owns(s, 'land')) income += s.jobId === 'farmer' ? 150 : 60;
  const living = s.age >= 18 && !owns(s, 'house') && !owns(s, 'villa') ? 15 : 0;
  let net = income - living;
  const gold = goldOf(s);
  if (gold < 0) {
    const interest = Math.ceil(-gold * 0.1);
    net -= interest;
    note = `빚 이자로 ${fmtGold(interest)}가 나갔다. 빚이 눈덩이처럼 불어난다…`;
  }
  s.gold = gold + net;
  s.lastIncome = net;
  // 집·고양이·별장은 마음을 편하게 한다
  const calm = (s.owned ?? []).reduce((a, o) => a + (OWNED_CALM[o] ?? 0), 0);
  if (calm) s.stress = Math.max(0, (s.stress ?? 0) - calm);
  if (owns(s, 'cat') && rng() < 0.2 && s.mood === 'calm') s.mood = 'joy';
  return note;
}

export interface Result {
  ok: boolean;
  msg: string;
}

/** 상점에서 산다 */
export function buy(s: LifeState, id: string): Result {
  const m = marketById(id);
  if (!m) return { ok: false, msg: '없는 물건이다.' };
  if (m.minAge && s.age < m.minAge) return { ok: false, msg: `${m.minAge}세부터 살 수 있다.` };
  if (m.type === 'owned' && owns(s, m.id)) return { ok: false, msg: '이미 가지고 있다.' };
  if (m.type === 'gear' && (s.bag ?? []).length >= bagCap(s)) return { ok: false, msg: '가방이 꽉 찼다.' };
  const price = marketPrice(s, m);
  if (goldOf(s) < price) return { ok: false, msg: '골드가 모자라다.' };
  s.gold = goldOf(s) - price;
  if (m.type === 'gear' && m.gear) {
    s.bag = [...(s.bag ?? []), makeItem(m.gear)];
  } else {
    s.owned = [...(s.owned ?? []), m.id];
    applyEffect(s, m.effect, Math.random);
  }
  return { ok: true, msg: `「${m.name}」을(를) 샀다! (-${fmtGold(price)})` };
}

const takeFromBag = (s: LifeState, uid: number): Item | null => {
  const bag = s.bag ?? [];
  const i = bag.findIndex((it) => it.uid === uid);
  if (i < 0) return null;
  const [it] = bag.splice(i, 1);
  s.bag = bag;
  return it;
};

/** 판다 */
export function sell(s: LifeState, uid: number): Result {
  const it = takeFromBag(s, uid);
  if (!it) return { ok: false, msg: '가방에 없다.' };
  s.gold = goldOf(s) + sellPrice(it);
  return { ok: true, msg: `「${it.name}」을(를) ${fmtGold(sellPrice(it))}에 팔았다.` };
}

/** 재료(전리품)를 한꺼번에 판다 */
export function sellAllLoot(s: LifeState): Result {
  const loot = (s.bag ?? []).filter((it) => it.kind === 'loot');
  if (!loot.length) return { ok: false, msg: '팔 전리품이 없다.' };
  const total = loot.reduce((a, it) => a + sellPrice(it), 0);
  s.bag = (s.bag ?? []).filter((it) => it.kind !== 'loot');
  s.gold = goldOf(s) + total;
  return { ok: true, msg: `전리품 ${loot.length}개를 ${fmtGold(total)}에 팔았다!` };
}

/** 장비를 착용한다 (끼고 있던 것은 가방으로) */
export function equip(s: LifeState, uid: number): Result {
  const it = (s.bag ?? []).find((x) => x.uid === uid);
  if (!it || (it.kind !== 'weapon' && it.kind !== 'armor')) return { ok: false, msg: '장착할 수 없다.' };
  takeFromBag(s, uid);
  const slot = it.kind;
  const prev = s.equip?.[slot];
  s.equip = { ...(s.equip ?? {}), [slot]: it };
  if (prev) s.bag = [...(s.bag ?? []), prev];
  s.hp = Math.min(s.hp ?? maxHp(s), maxHp(s));
  return { ok: true, msg: `「${it.name}」을(를) 장착했다.` };
}

/** 회복약을 마신다 */
export function drink(s: LifeState, uid: number): Result {
  const it = (s.bag ?? []).find((x) => x.uid === uid);
  if (!it || it.kind !== 'potion') return { ok: false, msg: '마실 수 없다.' };
  if ((s.hp ?? maxHp(s)) >= maxHp(s)) return { ok: false, msg: '이미 HP가 가득하다.' };
  takeFromBag(s, uid);
  s.hp = Math.min(maxHp(s), (s.hp ?? 0) + it.power);
  return { ok: true, msg: `「${it.name}」을(를) 마셨다. HP ${s.hp}/${maxHp(s)}` };
}

/** 가방에서 가장 약한 회복약부터 꺼내 마신다 */
export function drinkBest(s: LifeState): Result {
  const potions = (s.bag ?? []).filter((x) => x.kind === 'potion').sort((a, b) => a.power - b.power);
  if (!potions.length) return { ok: false, msg: '회복약이 없다.' };
  return drink(s, potions[0].uid);
}

export const INN_PRICE = 30;

/** 여관에서 쉰다: HP 완전 회복 */
export function innRest(s: LifeState): Result {
  if ((s.hp ?? maxHp(s)) >= maxHp(s)) return { ok: false, msg: '이미 HP가 가득하다.' };
  if (goldOf(s) < INN_PRICE) return { ok: false, msg: '여관비가 모자라다.' };
  s.gold = goldOf(s) - INN_PRICE;
  s.hp = maxHp(s);
  return { ok: true, msg: `여관에서 푹 쉬었다. HP 가득! (-${fmtGold(INN_PRICE)})` };
}

/** 시작 장비 (출신에 관계없이 천 옷 한 벌) */
export function starterKit(): { armor: Item } {
  return { armor: makeItem(gearByBase('a1')!) };
}

/** 저장된 삶을 불러올 때: 겹치는 물건 번호를 새로 매긴다 (예전 버전 저장 데이터 복구) */
export function repairItems(s: LifeState) {
  const seen = new Set<number>();
  const fix = (it: Item | null | undefined) => {
    if (!it) return;
    if (seen.has(it.uid)) it.uid = nextUid();
    seen.add(it.uid);
  };
  fix(s.equip?.weapon);
  fix(s.equip?.armor);
  for (const it of s.bag ?? []) fix(it);
  for (const it of s.dive?.loot ?? []) fix(it);
}
