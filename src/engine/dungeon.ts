import type { Item, LifeState, Rarity, Tone } from '../types';
import { ARMORS, BIOMES, WEAPONS, biomeOf, bossLoot, bossOf, makeItem, makeLoot } from '../data/items';
import { combatPower, floorPower, winChance } from './combat';
import { fmtGold, maxHp } from './economy';
import { applyEffect, gainStat, kill, type Rng } from './life';
import { bagCap } from './economy';
import { bump, earn, rec } from './record';
import { statOf } from './trinket';
import { randomTrinket } from '../data/trinkets';

/**
 * 던전: 시간이 흐르지 않는 별도 모드. 100계층, 5층씩 내려간다.
 * 앞의 4층은 무작위 조우, 5번째 층은 보스. 구간마다 내려갈지 귀환할지 직접 정한다.
 */
export const DUNGEON_DEPTH = 100;
export const DUNGEON_MIN_AGE = 12;

/** 던전에서 처음 쓰러진 뒤 다시 들어가기까지 (년) */
export const DUNGEON_BAN_YEARS = 10;
/** 처음 쓰러진 뒤 악몽에 시달리는 기간 (달) */
export const TRAUMA_MONTHS = 36;

/** 던전은 2년에 한 번 (돈 → 장비 → 던전을 끝없이 되풀이하지 못하게) */
export const DUNGEON_COOLDOWN = 2;

/** 다시 들어갈 수 있는 나이 */
export const dungeonOpenAge = (s: LifeState) => Math.max(DUNGEON_MIN_AGE, s.dgBanUntil ?? 0, s.dgNextAge ?? 0);

export const canEnterDungeon = (s: LifeState) =>
  !s.death && !s.pendingEventId && s.age >= dungeonOpenAge(s);

/** 시작할 수 있는 계층 (입구 + 클리어한 5층 단위 지점) */
export function startFloors(s: LifeState): number[] {
  const out = [0];
  for (let f = 5; f <= Math.min(s.dgBest ?? 0, DUNGEON_DEPTH - 5); f += 5) out.push(f);
  return out;
}

export function beginDive(s: LifeState, start: number) {
  const allowed = startFloors(s);
  const floor = allowed.includes(start) ? start : 0;
  s.hp = Math.min(s.hp ?? maxHp(s), maxHp(s));
  s.dive = { floor, loot: [], log: [], gold: 0, last: null };
  s.dgNextAge = s.age + DUNGEON_COOLDOWN;
  s.dgNotified = false;
  rec(s).dives++;
  note(s, floor ? `${floor}층의 귀환 포탈로 내려왔다. 서늘한 공기가 감돈다.` : '던전 입구에 섰다. 횃불이 일렁인다.', 'milestone');
}

/** 다음 구간 미리보기 (내려가기 전에 보여준다) */
export function preview(s: LifeState) {
  const from = (s.dive?.floor ?? 0) + 1;
  const to = from + 4;
  const ep = floorPower(to, true);
  const cp = combatPower(s);
  return { from, to, boss: bossOf(to), biome: biomeOf(from).name, cp, ep, p: winChance(cp, ep), hp: s.hp ?? 0, maxHp: maxHp(s) };
}

const note = (s: LifeState, text: string, tone: Tone = 'normal') => s.dive?.log.push({ text, tone });

function rarityRoll(rng: Rng, floor: number, boss: boolean): Rarity {
  // 깊을수록, 보스일수록 좋은 물건이 나온다 (100층 보스: 전설 약 8%, 영웅 약 27%)
  const legend = 0.01 + floor / 2000 + (boss ? 0.02 : 0);
  const epic = legend + 0.05 + floor / 600 + (boss ? 0.05 : 0);
  const rare = epic + 0.25;
  const r = rng();
  return r < legend ? 'legend' : r < epic ? 'epic' : r < rare ? 'rare' : 'common';
}

/** 계층에 맞는 장비 하나 */
function gearDrop(rng: Rng, floor: number, boss: boolean): Item {
  const tier = Math.max(1, Math.min(8, Math.ceil(floor / 12.5) + (boss ? 1 : 0) - (rng() < 0.5 ? 1 : 0)));
  const pool = rng() < 0.5 ? WEAPONS : ARMORS;
  return makeItem(pool[tier - 1], rarityRoll(rng, floor, boss), rng);
}

/** 장신구 드롭: 깊을수록, 보스일수록 희귀하다 */
function trinketDrop(rng: Rng, floor: number, boss: boolean): Item {
  return randomTrinket(rarityRoll(rng, floor, boss), rng);
}

function materialDrop(rng: Rng, floor: number): Item {
  const b = biomeOf(floor);
  const [name, value] = b.loot[Math.floor(rng() * b.loot.length)];
  const depth = 1 + ((floor - 1) % 20) / 20; // 같은 지대라도 깊을수록 비싸다
  return makeLoot(name, Math.round(value * depth), rarityRoll(rng, floor, false), rng);
}

/**
 * HP 를 깎는다. 0 이 되면:
 *  - 불굴의 육체가 있으면 버티고 강제 귀환
 *  - 처음이면 살아남지만 장비·소지품·돈을 모두 잃고, 3년 악몽 + 10년 출입 금지
 *  - 두 번째면 진짜 죽음
 */
function hurt(s: LifeState, dmg: number, floor: number): 'ok' | 'dead' | 'saved' | 'fallen' {
  s.hp = Math.max(0, (s.hp ?? 0) - Math.max(1, Math.round(dmg)));
  return s.hp > 0 ? 'ok' : knockout(s, floor);
}

/** HP 가 바닥났을 때 */
function knockout(s: LifeState, floor: number): 'dead' | 'saved' | 'fallen' {
  const cause = floor > 50 ? 'abyss' : 'dungeon';
  if (!s.dgFallen && s.extraLives <= 0) {
    fall(s, floor);
    return 'fallen';
  }
  if (kill(s, cause)) {
    note(s, `${floor}층에서 쓰러졌다… 다시는 지상의 햇빛을 보지 못했다.`, 'death');
    return 'dead';
  }
  s.hp = Math.round(maxHp(s) * 0.25);
  note(s, '불굴의 육체가 당신을 일으켜 세웠다! 하지만 더는 무리다. 지상으로 돌아가자.', 'good');
  return 'saved';
}

let fallNotes: [string, Tone][] = [];

/** 처음 쓰러짐: 모든 것을 잃고 지상으로 실려 나간다 */
function fall(s: LifeState, floor: number) {
  const d = s.dive!;
  // 차고 있던 장신구는 절반을 잃는다 (하나뿐이면 그것마저). 나머지는 모두 잃는다
  const worn = [...(s.equip?.trinkets ?? [])];
  const lostTrinkets = Math.ceil(worn.length / 2);
  for (let i = 0; i < lostTrinkets; i++) worn.splice(Math.floor(Math.random() * worn.length), 1);
  const lostItems = (s.bag ?? []).length + d.loot.length + (s.equip?.weapon ? 1 : 0) + (s.equip?.armor ? 1 : 0) + lostTrinkets;
  const lostGold = Math.max(0, s.gold ?? 0) + d.gold;
  s.dgFallen = true;
  s.dgBanUntil = s.age + DUNGEON_BAN_YEARS;
  s.trauma = TRAUMA_MONTHS;
  s.stress = 100;
  s.mood = 'fear';
  s.bag = [];
  s.equip = { weapon: null, armor: null, trinkets: worn };
  if ((s.gold ?? 0) > 0) s.gold = 0;
  d.loot = [];
  d.gold = 0;
  d.fallen = true;
  d.last = 'fled';
  s.hp = Math.max(1, Math.round(maxHp(s) * 0.1));
  rec(s).nearDeaths.push(floor > 50 ? 'abyss' : 'dungeon');
  // 원정 기록은 그 층의 마지막 일(함정·패배)을 적은 뒤에 남긴다 (finish)
  fallNotes = [
    [`${floor}층에서 쓰러졌다… 정신을 차려 보니 지상의 진료소였다. 누군가 끌고 나와 준 모양이다.`, 'death'],
    [`장비·소지품 ${lostItems}개와 ${fmtGold(lostGold)}를 모두 잃었다.${lostTrinkets ? ` 차고 있던 장신구 ${lostTrinkets}개도 사라졌다${worn.length ? ` (${worn.length}개는 무사)` : ''}.` : ''} 3년간 악몽에 시달리고, ${s.dgBanUntil}세까지 던전에 들어갈 수 없다. 다음에 또 쓰러지면… 정말 끝이다.`, 'bad'],
  ];
  s.log.push({ age: s.age, m: Math.max(1, s.month ?? 0), text: `던전 ${floor}층에서 쓰러졌다! 목숨은 건졌지만 장비·소지품과 ${fmtGold(lostGold)}를 모두 잃었다.${lostTrinkets ? ` 장신구도 ${lostTrinkets}개 잃었다.` : ''} 3년간 악몽에 시달린다. (${s.dgBanUntil}세까지 던전 출입 불가 · 다음엔 진짜 죽음)`, tone: 'bad' });
}

export type DescendResult = 'cleared' | 'fled' | 'dead' | 'conquered' | 'fallen';

/** 5층을 내려간다: 앞의 4층 + 보스까지 자동으로 (자동 플레이·시뮬레이션용) */
export function descend(s: LifeState, rng: Rng = Math.random): DescendResult {
  const r = descendPath(s, rng, true);
  return r === 'boss' ? bossAuto(s, rng) : r === 'mob' ? 'fled' : r;
}

/** 지금 구간의 보스 */
export function bossAhead(s: LifeState) {
  const floor = (s.dive?.floor ?? 0) + 5;
  return { floor, name: bossOf(floor), ep: floorPower(floor, true) };
}

/** 길에서 마물과 마주칠 확률 (나머지는 함정·보물상자·샘물·조용한 통로) */
export const MOB_CHANCE = 0.2;

/**
 * 앞의 4층을 한 층씩 지나간다.
 *  - 마물(20%)을 만나면 'mob' 을 돌려주고 멈춘다 → 턴제 전투 후 settleMob, 다시 descendPath 로 이어 간다
 *  - auto 면 마물도 승률로 바로 처리한다 (자동 플레이·시뮬레이션)
 *  - 4층을 다 지나면 보스 방 앞에서 'boss' (가방을 점검하고 도전한다)
 */
export function descendPath(s: LifeState, rng: Rng = Math.random, auto = false): DescendResult | 'boss' | 'mob' {
  const d = s.dive;
  if (!d || s.death || d.fallen || d.floor >= DUNGEON_DEPTH) return 'fled';
  if (d.atBoss) return 'boss';
  if (d.mob) return 'mob';
  const cp = combatPower(s);
  for (let f = (d.cursor ?? d.floor) + 1; f <= d.floor + 4; f++) {
    d.cursor = f;
    rec(s).maxFloor = Math.max(rec(s).maxFloor, f);
    const b = biomeOf(f);
    const r = rng();
    if (r < MOB_CHANCE) {
      const mon = b.monsters[Math.floor(rng() * b.monsters.length)];
      const ep = floorPower(f);
      if (!auto) {
        d.mob = { floor: f, name: mon, ep };
        note(s, `${f}층 · ${mon}이(가) 길을 막았다!`, 'bad');
        return 'mob';
      }
      const p = winChance(cp, ep) / 100;
      if (rng() < p) {
        mobLoot(s, f, mon, rng);
        const res = hurt(s, ep * 0.12 * (1.2 - p), f);
        if (res !== 'ok') return finish(s, res);
      } else {
        const res = hurt(s, ep * 0.32, f);
        note(s, `${f}층 · ${mon}에게 크게 당했다! 간신히 도망쳤다. (HP ${s.hp})`, 'bad');
        if (res !== 'ok') return finish(s, res);
      }
    } else if (r < 0.45) {
      if (rng() * 100 < 35 + statOf(s, 'luck') / 2) note(s, `${f}층 · 발밑의 함정을 아슬아슬하게 피했다.`);
      else {
        const res = hurt(s, floorPower(f) * 0.2, f);
        note(s, `${f}층 · 함정에 걸렸다! (HP ${s.hp})`, 'bad');
        if (res !== 'ok') return finish(s, res);
      }
    } else if (r < 0.75) {
      const g = Math.round(f * 8 * (0.5 + rng()));
      d.gold += g;
      const gear = rng() < 0.15 ? gearDrop(rng, f, false) : null;
      if (gear) d.loot.push(gear);
      note(s, `${f}층 · 보물상자 발견! ${fmtGold(g)}${gear ? `와 「${gear.name}」` : ''}을(를) 챙겼다.`, 'good');
    } else if (r < 0.85) {
      const heal = Math.round(maxHp(s) * 0.25);
      s.hp = Math.min(maxHp(s), (s.hp ?? 0) + heal);
      note(s, `${f}층 · 맑은 샘물을 마셨다. HP +${heal}`, 'good');
    } else {
      const m = rng() < 0.6 ? materialDrop(rng, f) : null;
      if (m) d.loot.push(m);
      note(s, `${f}층 · 조용한 통로를 지났다.${m ? ` 바닥에서 「${m.name}」을(를) 주웠다.` : ''}`);
    }
  }
  d.atBoss = true;
  note(s, `${d.floor + 5}층 · 보스 「${bossOf(d.floor + 5)}」의 방 앞에 섰다. 숨을 고르자.`, 'milestone');
  return 'boss';
}

/** 마물을 쓰러뜨린 전리품 */
function mobLoot(s: LifeState, f: number, mon: string, rng: Rng) {
  const d = s.dive!;
  // 마물은 가끔(6%) 장신구를 떨어뜨린다
  const it = rng() < 0.06 ? trinketDrop(rng, f, false) : rng() < 0.8 ? materialDrop(rng, f) : null;
  if (it) d.loot.push(it);
  bump(rec(s).slain, mon);
  note(s, `${f}층 · ${mon} 처치!${it ? ` 「${it.name}」 획득.` : ''}`, 'good');
}

/** 턴제 마물전이 끝났다. 'continue' 면 계속 내려갈 수 있다 */
export function settleMob(s: LifeState, result: 'win' | 'lose' | 'fled', hpLeft: number, rng: Rng = Math.random): DescendResult | 'continue' {
  const d = s.dive;
  if (!d?.mob) return 'continue';
  const { floor: f, name } = d.mob;
  d.mob = null;
  if (result === 'lose') {
    s.hp = 0;
    const res = knockout(s, f);
    if (res === 'saved') {
      d.last = 'fled';
      return 'fled';
    }
    return finish(s, res);
  }
  s.hp = Math.max(1, Math.min(hpLeft, maxHp(s)));
  if (result === 'win') mobLoot(s, f, name, rng);
  else note(s, `${f}층 · ${name}에게서 달아났다. (HP ${s.hp})`, 'bad');
  return 'continue';
}

/** 보스를 쓰러뜨렸다: 전리품, 귀환 포탈, 기록 */
function winBoss(s: LifeState, rng: Rng): DescendResult {
  const d = s.dive!;
  const { floor: bf, name: boss } = bossAhead(s);
  const [ln, lv] = bossLoot(bf);
  d.loot.push(makeLoot(ln, lv, rarityRoll(rng, bf, true), rng));
  if (rng() < 0.5) d.loot.push(gearDrop(rng, bf, true));
  if (rng() < 0.35) d.loot.push(trinketDrop(rng, bf, true));
  d.gold += bf * 20;
  gainStat(s, 'vit', 1, rng);
  gainStat(s, 'mana', 1, rng);
  d.floor = bf;
  d.cursor = undefined;
  d.atBoss = false;
  s.dgBest = Math.max(s.dgBest ?? 0, bf);
  bump(rec(s).bosses, boss);
  rec(s).maxFloor = Math.max(rec(s).maxFloor, bf);
  note(s, `${bf}층 보스 「${boss}」 격파! 귀환 포탈이 열렸다.`, 'milestone');
  if (bf >= DUNGEON_DEPTH) return conquer(s);
  d.last = 'cleared';
  return 'cleared';
}

/** 보스전 자동 판정 (승률) */
function bossAuto(s: LifeState, rng: Rng): DescendResult {
  const d = s.dive!;
  const { floor: bf, name: boss, ep } = bossAhead(s);
  const p = winChance(combatPower(s), ep) / 100;
  if (rng() < p) {
    const out = winBoss(s, rng);
    const res = hurt(s, ep * 0.22 * (1.1 - p), bf);
    return res === 'ok' ? out : finish(s, res);
  }
  const res = hurt(s, ep * 0.6, bf);
  if (res === 'dead' || res === 'fallen') return finish(s, res);
  note(s, `${bf}층 보스 「${boss}」에게 패배… 도망쳐 나왔다.`, 'bad');
  d.last = 'fled';
  return 'fled';
}

/** 턴제 보스전이 끝났다: 결과와 남은 HP 를 반영한다 */
export function settleBoss(s: LifeState, result: 'win' | 'lose' | 'fled', hpLeft: number, rng: Rng = Math.random): DescendResult {
  const d = s.dive;
  if (!d) return 'fled';
  const { floor: bf, name: boss } = bossAhead(s);
  if (result === 'win') {
    s.hp = Math.max(1, hpLeft);
    return winBoss(s, rng);
  }
  if (result === 'fled') {
    s.hp = Math.max(1, hpLeft);
    note(s, `${bf}층 보스 「${boss}」에게서 간신히 도망쳤다. (HP ${s.hp})`, 'bad');
    d.last = 'fled';
    return 'fled';
  }
  s.hp = 0;
  const res = knockout(s, bf);
  if (res === 'saved') {
    d.last = 'fled';
    return 'fled';
  }
  return finish(s, res);
}

function finish(s: LifeState, res: 'dead' | 'saved' | 'fallen'): DescendResult {
  if (s.dive) s.dive.last = 'fled';
  for (const [t, tone] of fallNotes) note(s, t, tone);
  fallNotes = [];
  return res === 'dead' ? 'dead' : res === 'fallen' ? 'fallen' : 'fled';
}

/** 100층 마왕 토벌 */
function conquer(s: LifeState): DescendResult {
  const first = !s.flags.includes('dungeon_conquered');
  applyEffect(s, { flags: ['slew_demon_lord', 'dungeon_conquered', 'dragonslayer'], stats: { fame: first ? 40 : 5 }, karma: first ? 20 : 0 }, Math.random);
  if (s.dive) {
    s.dive.gold += first ? 100000 : 5000;
    s.dive.last = 'cleared';
  }
  note(s, first
    ? '마왕이 쓰러졌다!! 던전 100층 완전 공략! 세계가 당신의 이름을 외친다. 명성과 막대한 부가 쏟아진다!'
    : '마왕의 그림자를 다시 한번 쓰러뜨렸다. 이제 이 던전은 당신의 정원이다.', 'milestone');
  return 'conquered';
}

/** 귀환: 전리품을 가방에 넣고, 원정 기록을 연대기에 남긴다 */
export function retreat(s: LifeState): string {
  const d = s.dive;
  if (!d) return '';
  if (d.fallen) {
    s.dive = null;
    return '빈손으로 지상에 돌아왔다…';
  }
  const room = bagCap(s) - (s.bag ?? []).length;
  const keep = d.loot.slice(0, Math.max(0, room));
  const over = d.loot.slice(keep.length);
  const overGold = over.reduce((a, it) => a + Math.round(it.value * 0.5), 0);
  s.bag = [...(s.bag ?? []), ...keep];
  s.gold = (s.gold ?? 0) + d.gold + overGold;
  earn(s, d.gold + overGold);
  rec(s).loot += d.loot.length;
  const deepest = d.floor;
  // 모험가 길드 랭크는 도달 계층으로 오른다
  if (s.jobId === 'adventurer') {
    const rank = deepest >= 80 ? 5 : deepest >= 50 ? 4 : deepest >= 30 ? 3 : deepest >= 10 ? 2 : 1;
    if (rank > s.jobRank) s.jobRank = rank;
  }
  // 20층 단위 도달 기록: 한 번에 여러 지대를 넘어도 빠짐없이 남긴다 (길드 초청 등 후속 사건이 읽는다)
  for (let d20 = 20; d20 <= deepest; d20 += 20) {
    if (s.flags.includes(`depth_${d20}`)) continue;
    s.flags.push(`depth_${d20}`);
    applyEffect(s, { stats: { fame: d20 / 10 } }, Math.random);
  }
  const summary = `던전 원정: ${deepest}층까지 도달. 전리품 ${d.loot.length}개, ${fmtGold(d.gold + overGold)} 획득${over.length ? ` (가방이 넘쳐 ${over.length}개는 헐값에 처분)` : ''}.`;
  s.log.push({ age: s.age, text: summary, tone: d.gold || d.loot.length ? 'good' : 'normal' });
  s.dive = null;
  return summary;
}

/** 죽어서 끝난 원정도 연대기에 남긴다 */
export function endDiveOnDeath(s: LifeState) {
  const d = s.dive;
  if (!d) return;
  s.log.push({ age: s.age, text: `던전 ${d.floor}층 아래에서 원정이 끝났다…`, tone: 'death' });
  for (const l of d.log.slice(-3)) s.log.push({ age: s.age, text: l.text, tone: l.tone });
  s.dive = null;
}

export { BIOMES };
