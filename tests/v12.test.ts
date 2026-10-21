import { describe, expect, it } from 'vitest';
import { applyEffect, createLife, successChance } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { equip, unequipTrinket } from '../src/engine/economy';
import { statOf, trinketSlots } from '../src/engine/trinket';
import { makeTrinket, randomTrinket, TRINKETS } from '../src/data/trinkets';
import { combatPower } from '../src/engine/combat';
import { beginDive, descend } from '../src/engine/dungeon';
import { ALL_EVENTS } from '../src/data/events';
import { STAT_KEYS } from '../src/data/stats';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('v1.2 장신구', () => {
  it('희귀도가 높을수록 오르는 능력치가 크고 많다', () => {
    const rng = seededRng(1);
    const sum = (r: 'common' | 'rare' | 'epic' | 'legend') => {
      let t = 0;
      for (let i = 0; i < 50; i++) t += Object.values(randomTrinket(r, rng).stats!).reduce((a, b) => a + (b ?? 0), 0);
      return t / 50;
    };
    const [c, r, e, l] = [sum('common'), sum('rare'), sum('epic'), sum('legend')];
    expect(c).toBeLessThan(r);
    expect(r).toBeLessThan(e);
    expect(e).toBeLessThan(l);
    expect(Object.keys(makeTrinket(TRINKETS[0], 'legend', rng).stats!).length).toBe(3);
    expect(Object.keys(makeTrinket(TRINKETS[0], 'common', rng).stats!).length).toBe(1);
  });

  it('여러 개를 찰 수 있고, 칸은 3 → 20세 4 → 40세 5칸', () => {
    const s = createLife(base, seededRng(2));
    s.age = 15;
    expect(trinketSlots(s)).toBe(3);
    s.bag = Array.from({ length: 5 }, () => randomTrinket('rare', seededRng(3), 'int'));
    for (const it of [...s.bag]) equip(s, it.uid);
    expect(s.equip?.trinkets?.length).toBe(3);
    expect(equip(s, s.bag![0].uid).ok).toBe(false);
    s.age = 40;
    expect(trinketSlots(s)).toBe(5);
    for (const it of [...s.bag!]) equip(s, it.uid);
    expect(s.equip?.trinkets?.length).toBe(5);
  });

  it('찬 장신구만큼 판정·전투력이 오르고, 풀면 원래대로', () => {
    const s = createLife(base, seededRng(4));
    s.stats.atk = 20;
    const cp = combatPower(s);
    const chance = successChance(s, { stat: 'atk', dc: 30 });
    const t = makeTrinket(TRINKETS.find((x) => x.stat === 'atk')!, 'common', seededRng(5));
    s.bag = [t];
    equip(s, t.uid);
    const add = t.stats!.atk!;
    expect(statOf(s, 'atk')).toBe(20 + add);
    expect(s.stats.atk).toBe(20); // 원래 능력치는 그대로
    expect(combatPower(s)).toBeGreaterThan(cp);
    expect(successChance(s, { stat: 'atk', dc: 30 })).toBeGreaterThan(chance);
    unequipTrinket(s, t.uid);
    expect(statOf(s, 'atk')).toBe(20);
    expect(combatPower(s)).toBe(cp);
  });

  it('사건 보상 장신구: 빈 칸이 있으면 바로 찬다', () => {
    const s = createLife(base, seededRng(6));
    applyEffect(s, { trinket: { base: 't_mother', rarity: 'rare' } }, seededRng(7));
    expect(s.equip?.trinkets?.[0].name).toContain('어머니의 손수건');
    expect(s.log[s.log.length - 1].text).toContain('장신구');
  });

  it('던전에서 쓰러지면 찬 장신구의 절반을 잃는다 (하나면 전부)', () => {
    for (const [n, left] of [[1, 0], [2, 1], [3, 1], [4, 2], [5, 2]] as const) {
      const s = createLife(base, seededRng(8 + n));
      s.age = 40;
      s.equip = { ...s.equip, trinkets: Array.from({ length: n }, () => randomTrinket('rare', seededRng(9))) };
      beginDive(s, 0);
      s.hp = 1;
      expect(descend(s, seededRng(10))).toBe('fallen');
      expect(s.equip?.trinkets?.length, `${n}개`).toBe(left);
    }
  });

  it('능력치마다 키우는 사건이 있다', () => {
    // 공격력·방어력 사건은 3단계(직업별 사건 묶음)에서 채운다
    for (const k of STAT_KEYS.filter((x) => x !== 'atk' && x !== 'def')) {
      const n = ALL_EVENTS.filter((e) => e.id.startsWith('s_') && JSON.stringify(e.choices ?? []).includes(`"${k}":`)).length;
      expect(n, k).toBeGreaterThanOrEqual(3);
    }
  });
});
