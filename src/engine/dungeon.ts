import type { Item, LifeState, Rarity, Tone } from '../types';
import { ARMORS, BIOMES, WEAPONS, biomeOf, bossLoot, bossOf, makeItem, makeLoot } from '../data/items';
import { combatPower, floorPower, winChance } from './combat';
import { fmtGold, maxHp } from './economy';
import { applyEffect, gainStat, kill, type Rng } from './life';
import { bagCap } from './economy';
import { bump, earn, rec } from './record';

/**
 * 던전: 시간이 흐르지 않는 별도 모드. 100계층, 5층씩 내려간다.
 * 앞의 4층은 무작위 조우, 5번째 층은 보스. 구간마다 내려갈지 귀환할지 직접 정한다.
 */
export const DUNGEON_DEPTH = 100;
export const DUNGEON_MIN_AGE = 12;

export const canEnterDungeon = (s: LifeState) => !s.death && !s.pendingEventId && s.age >= DUNGEON_MIN_AGE;

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

function materialDrop(rng: Rng, floor: number): Item {
  const b = biomeOf(floor);
  const [name, value] = b.loot[Math.floor(rng() * b.loot.length)];
  const depth = 1 + ((floor - 1) % 20) / 20; // 같은 지대라도 깊을수록 비싸다
  return makeLoot(name, Math.round(value * depth), rarityRoll(rng, floor, false), rng);
}

/** HP 를 깎는다. 0 이 되면 죽음 (불굴이면 버티고 강제 귀환) */
function hurt(s: LifeState, dmg: number, floor: number): 'ok' | 'dead' | 'saved' {
  s.hp = Math.max(0, (s.hp ?? 0) - Math.max(1, Math.round(dmg)));
  if (s.hp > 0) return 'ok';
  const cause = floor > 50 ? 'abyss' : 'dungeon';
  if (kill(s, cause)) {
    note(s, `${floor}층에서 쓰러졌다… 다시는 지상의 햇빛을 보지 못했다.`, 'death');
    return 'dead';
  }
  s.hp = Math.round(maxHp(s) * 0.25);
  note(s, '불굴의 육체가 당신을 일으켜 세웠다! 하지만 더는 무리다. 지상으로 돌아가자.', 'good');
  return 'saved';
}

export type DescendResult = 'cleared' | 'fled' | 'dead' | 'conquered';

/** 5층을 내려간다 */
export function descend(s: LifeState, rng: Rng = Math.random): DescendResult {
  const d = s.dive;
  if (!d || s.death || d.floor >= DUNGEON_DEPTH) return 'fled';
  const cp = combatPower(s);
  for (let f = d.floor + 1; f <= d.floor + 4; f++) {
    rec(s).maxFloor = Math.max(rec(s).maxFloor, f);
    const b = biomeOf(f);
    const r = rng();
    if (r < 0.55) {
      const mon = b.monsters[Math.floor(rng() * b.monsters.length)];
      const ep = floorPower(f);
      const p = winChance(cp, ep) / 100;
      if (rng() < p) {
        const it = rng() < 0.75 ? materialDrop(rng, f) : null;
        if (it) d.loot.push(it);
        const res = hurt(s, ep * 0.12 * (1.2 - p), f);
        bump(rec(s).slain, mon);
        note(s, `${f}층 · ${mon} 처치!${it ? ` 「${it.name}」 획득.` : ''}`, 'good');
        if (res !== 'ok') return finish(s, res);
      } else {
        const res = hurt(s, ep * 0.32, f);
        note(s, `${f}층 · ${mon}에게 크게 당했다! 간신히 도망쳤다. (HP ${s.hp})`, 'bad');
        if (res !== 'ok') return finish(s, res);
      }
    } else if (r < 0.7) {
      if (rng() * 100 < 35 + s.stats.luck / 2) note(s, `${f}층 · 발밑의 함정을 아슬아슬하게 피했다.`);
      else {
        const res = hurt(s, floorPower(f) * 0.2, f);
        note(s, `${f}층 · 함정에 걸렸다! (HP ${s.hp})`, 'bad');
        if (res !== 'ok') return finish(s, res);
      }
    } else if (r < 0.87) {
      const g = Math.round(f * 8 * (0.5 + rng()));
      d.gold += g;
      const gear = rng() < 0.18 ? gearDrop(rng, f, false) : null;
      if (gear) d.loot.push(gear);
      note(s, `${f}층 · 보물상자 발견! ${fmtGold(g)}${gear ? `와 「${gear.name}」` : ''}을(를) 챙겼다.`, 'good');
    } else {
      const heal = Math.round(maxHp(s) * 0.25);
      s.hp = Math.min(maxHp(s), (s.hp ?? 0) + heal);
      note(s, `${f}층 · 맑은 샘물을 마셨다. HP +${heal}`, 'good');
    }
  }
  // 보스
  const bf = d.floor + 5;
  const boss = bossOf(bf);
  const ep = floorPower(bf, true);
  const p = winChance(cp, ep) / 100;
  if (rng() < p) {
    const [ln, lv] = bossLoot(bf);
    d.loot.push(makeLoot(ln, lv, rarityRoll(rng, bf, true), rng));
    if (rng() < 0.5) d.loot.push(gearDrop(rng, bf, true));
    d.gold += bf * 20;
    gainStat(s, 'vit', 1, rng);
    gainStat(s, 'mana', 1, rng);
    const res = hurt(s, ep * 0.22 * (1.1 - p), bf);
    d.floor = bf;
    s.dgBest = Math.max(s.dgBest ?? 0, bf);
    bump(rec(s).bosses, boss);
    rec(s).maxFloor = Math.max(rec(s).maxFloor, bf);
    note(s, `${bf}층 보스 「${boss}」 격파! 귀환 포탈이 열렸다. (HP ${s.hp})`, 'milestone');
    if (res !== 'ok') return finish(s, res);
    if (bf >= DUNGEON_DEPTH) return conquer(s);
    d.last = 'cleared';
    return 'cleared';
  }
  const res = hurt(s, ep * 0.6, bf);
  if (res === 'dead') return finish(s, res);
  note(s, `${bf}층 보스 「${boss}」에게 패배… 도망쳐 나왔다.`, 'bad');
  d.last = 'fled';
  return 'fled';
}

function finish(s: LifeState, res: 'dead' | 'saved'): DescendResult {
  if (s.dive) s.dive.last = 'fled';
  return res === 'dead' ? 'dead' : 'fled';
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
