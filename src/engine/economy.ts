import type { Item, LifeState } from '../types';
import { jobById } from '../data/jobs';
import { gearByBase, makeItem, nextUid, sellPrice } from '../data/items';
import { OWNED_CALM, chaDeal, marketById, marketPrice, owns } from '../data/market';
import { applyEffect, type Rng } from './life';
import { earn } from './record';
import { statOf, trinketSlots } from './trinket';

/** 가방 크기 */
export const bagCap = (s: LifeState) => 30 + (owns(s, 'big_bag') ? 20 : 0);

/** 던전 최대 HP */
export const maxHp = (s: LifeState) => 60 + statOf(s, 'vit') * 2 + (s.equip?.armor?.power ?? 0);
/** 능력치·장비가 줄어 최대 체력이 내려가면 현재 체력도 맞춘다 */
export function clampHp(s: LifeState) {
  if (s.hp !== undefined && s.hp > maxHp(s)) s.hp = maxHp(s);
}

export const goldOf = (s: LifeState) => s.gold ?? 0;

/** 1,234G */
export const fmtGold = (g: number) => `${g < 0 ? '-' : ''}${Math.abs(Math.round(g)).toLocaleString('ko-KR')}G`;

/** 연봉의 이름 (UI 팝업) */
export function payLabel(s: LifeState): string {
  if (s.jobId === 'merchant') return '장사 수익';
  if (s.jobId === 'farmer') return '수확';
  return '연봉';
}

/** 연봉을 받는 나이 (미성년은 없다) */
export const PAY_AGE = 19;

/**
 * 돈벌이: 한 해가 끝나면 1월에 지난 한 해치를 연봉으로 받는다.
 * 직업이 있고 성인(19세~)일 때만. 그 밖의 달에는 아무것도 들어오지 않는다.
 */
export function monthlyEconomy(s: LifeState, month: number, rng: Rng): string | null {
  s.lastPay = 0;
  if (month !== 0) return null;
  const job = jobById(s.jobId);
  if (!job || s.age < PAY_AGE) return null;
  let note: string | null = null;
  let pay = job.income[Math.max(1, Math.min(5, s.jobRank))] ?? 0;
  if (job.id === 'farmer') {
    const r = rng();
    if (r < 0.12) {
      pay = Math.round(pay * 0.4);
      note = '지난해는 흉년이었다… 수확은 형편없었다.';
    } else if (r > 0.9) {
      pay = Math.round(pay * 1.6);
      note = '지난해는 대풍년! 곳간이 넘쳐난다.';
    }
  } else if (job.id === 'merchant') {
    pay = Math.round(pay * (0.4 + rng() * 1.2));
    // 밑천이 돈을 번다: 가진 돈의 6% (직급에 따라 한도)
    if (goldOf(s) > 0) pay += Math.min(Math.round(goldOf(s) * 0.06), 720 * s.jobRank);
  }
  if (owns(s, 'land')) pay += job.id === 'farmer' ? 600 : 240;
  if ((s.recover ?? 0) > 0) pay = Math.round(pay / 2);
  s.gold = goldOf(s) + pay;
  s.lastPay = pay;
  s.yearIncome = (s.yearIncome ?? 0) + pay;
  earn(s, pay);
  return note ?? `${payLabel(s)} ${fmtGold(pay)}를 받았다.`;
}

/**
 * 한 해 마무리: 생활비, 빚 이자, 소유물이 주는 안정.
 * 돌려주는 문장이 있으면 연대기에 남긴다.
 */
export function yearEndEconomy(s: LifeState, rng: Rng): string | null {
  let note: string | null = null;
  // 생활비는 가진 만큼만 나간다 (빈털터리를 빚더미로 만들지 않는다)
  const living = s.age >= 18 && !owns(s, 'house') && !owns(s, 'villa') ? Math.min(60, Math.max(0, goldOf(s))) : 0;
  let net = (s.yearIncome ?? 0) - living;
  s.gold = goldOf(s) - living;
  earn(s, -living);
  const gold = goldOf(s);
  if (gold < 0) {
    const interest = Math.ceil(-gold * 0.1);
    s.gold = gold - interest;
    net -= interest;
    note = `빚 이자로 ${fmtGold(interest)}가 나갔다. 빚이 눈덩이처럼 불어난다…`;
  }
  s.lastIncome = net;
  s.yearIncome = 0;
  // 집·고양이·별장은 마음을 편하게 한다
  const calm = (s.owned ?? []).reduce((a, o) => a + (OWNED_CALM[o] ?? 0), 0);
  if (calm) s.stress = Math.max(0, (s.stress ?? 0) - calm);
  if (owns(s, 'cat') && rng() < 0.2 && s.mood === 'calm') s.mood = 'joy';
  return note;
}

/** 한 해 살림을 한꺼번에 (시뮬레이션·테스트용) */
export function yearlyEconomy(s: LifeState, rng: Rng): string | null {
  let note: string | null = null;
  for (let m = 0; m < 12; m++) note = monthlyEconomy(s, m, rng) ?? note;
  return yearEndEconomy(s, rng) ?? note;
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
  earn(s, -price);
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
  const price = sellPrice(it, chaDeal(s));
  s.gold = goldOf(s) + price;
  earn(s, price);
  return { ok: true, msg: `「${it.name}」을(를) ${fmtGold(price)}에 팔았다.` };
}

/** 재료(전리품)를 한꺼번에 판다 */
export function sellAllLoot(s: LifeState): Result {
  const loot = (s.bag ?? []).filter((it) => it.kind === 'loot');
  if (!loot.length) return { ok: false, msg: '팔 전리품이 없다.' };
  const total = loot.reduce((a, it) => a + sellPrice(it, chaDeal(s)), 0);
  s.bag = (s.bag ?? []).filter((it) => it.kind !== 'loot');
  s.gold = goldOf(s) + total;
  earn(s, total);
  return { ok: true, msg: `전리품 ${loot.length}개를 ${fmtGold(total)}에 팔았다!` };
}

/** 장비를 착용한다 (끼고 있던 것은 가방으로). 장신구는 빈 칸에 찬다 */
export function equip(s: LifeState, uid: number): Result {
  const it = (s.bag ?? []).find((x) => x.uid === uid);
  if (it?.kind === 'trinket') {
    const worn = s.equip?.trinkets ?? [];
    if (worn.length >= trinketSlots(s)) return { ok: false, msg: `장신구 칸이 꽉 찼다. (${trinketSlots(s)}칸 · 20세·40세에 한 칸씩 늘어난다)` };
    takeFromBag(s, uid);
    s.equip = { ...(s.equip ?? {}), trinkets: [...worn, it] };
    s.hp = Math.min(s.hp ?? maxHp(s), maxHp(s));
    return { ok: true, msg: `「${it.name}」을(를) 찼다.` };
  }
  if (!it || (it.kind !== 'weapon' && it.kind !== 'armor')) return { ok: false, msg: '장착할 수 없다.' };
  takeFromBag(s, uid);
  const slot = it.kind;
  const prev = s.equip?.[slot];
  s.equip = { ...(s.equip ?? {}), [slot]: it };
  if (prev) s.bag = [...(s.bag ?? []), prev];
  s.hp = Math.min(s.hp ?? maxHp(s), maxHp(s));
  return { ok: true, msg: `「${it.name}」을(를) 장착했다.` };
}

/** 장신구를 풀어 가방에 넣는다 */
export function unequipTrinket(s: LifeState, uid: number): Result {
  const worn = s.equip?.trinkets ?? [];
  const it = worn.find((x) => x.uid === uid);
  if (!it) return { ok: false, msg: '차고 있지 않다.' };
  if ((s.bag ?? []).length >= bagCap(s)) return { ok: false, msg: '가방이 꽉 찼다.' };
  s.equip = { ...(s.equip ?? {}), trinkets: worn.filter((x) => x.uid !== uid) };
  s.bag = [...(s.bag ?? []), it];
  s.hp = Math.min(s.hp ?? maxHp(s), maxHp(s));
  return { ok: true, msg: `「${it.name}」을(를) 풀었다.` };
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

/** 여관비: 회복할 HP 3당 1골드 (나머지가 있으면 1골드 더) */
export const innPrice = (s: LifeState) => Math.ceil(Math.max(0, maxHp(s) - (s.hp ?? maxHp(s))) / 3);

/** 여관에서 쉰다: HP 완전 회복 */
export function innRest(s: LifeState): Result {
  if ((s.hp ?? maxHp(s)) >= maxHp(s)) return { ok: false, msg: '이미 HP가 가득하다.' };
  const price = innPrice(s);
  if (goldOf(s) < price) return { ok: false, msg: `여관비가 모자라다. (${fmtGold(price)})` };
  s.gold = goldOf(s) - price;
  earn(s, -price);
  s.hp = maxHp(s);
  return { ok: true, msg: `여관에서 푹 쉬었다. 체력 가득! (-${fmtGold(price)})` };
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
  for (const it of s.equip?.trinkets ?? []) fix(it);
  for (const it of s.bag ?? []) fix(it);
  for (const it of s.dive?.loot ?? []) fix(it);
}
