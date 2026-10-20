import { describe, expect, it } from 'vitest';
import { MONTHS, STAT_MAX, advanceMonth, applyEffect, createLife } from '../src/engine/life';
import { PEER_HARD, PEER_MID, contemporaries, seededRng, simulateLife } from '../src/engine/sim';
import { attackMul, magicMul } from '../src/engine/duel';
import { chaDeal } from '../src/data/market';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('v1.4 시간', () => {
  it('11월 → 12월 → (한 살 먹고) 1월', () => {
    const s = createLife(base, seededRng(1));
    const rng = seededRng(2);
    const seen: string[] = [];
    while (s.age < 2 && !s.death) {
      s.pendingEventId = null;
      advanceMonth(s, rng);
      seen.push(`${s.age}:${(s.month ?? 0) + 1}`);
    }
    expect(seen).toContain('0:12');
    expect(seen.indexOf('1:1')).toBe(seen.indexOf('0:12') + 1);
    expect(seen.filter((x) => x.startsWith('1:')).length).toBe(MONTHS);
  });

  it('그해의 기록·이정표 달은 1~4월', () => {
    const s = createLife(base, seededRng(3));
    const rng = seededRng(4);
    for (let i = 0; i < 12 * 20; i++) {
      s.pendingEventId = null;
      advanceMonth(s, rng);
      expect(s.yearMark ?? 0).toBeLessThan(4);
    }
  });
});

describe('v1.4 능력치 상한', () => {
  it('상한은 280', () => {
    const s = createLife(base, seededRng(5));
    applyEffect(s, { stats: { int: 999 } }, seededRng(6));
    expect(s.stats.int).toBe(STAT_MAX);
  });

  it('공격력과 마력이 같으면 마법이 공격보다 30% 세다', () => {
    const s = createLife(base, seededRng(7));
    s.equip = { weapon: null, armor: null, trinkets: [] };
    s.stats.atk = 140;
    s.stats.mana = 140;
    s.stats.int = 140;
    expect(magicMul(s) / attackMul(s)).toBeCloseTo(1.3, 2);
  });

  it('매력 50부터 10마다 3%, 최대 45%', () => {
    const s = createLife(base, seededRng(8));
    s.equip = { weapon: null, armor: null, trinkets: [] };
    s.stats.cha = 49;
    expect(chaDeal(s)).toBe(0);
    s.stats.cha = 80;
    expect(chaDeal(s)).toBeCloseTo(0.09);
    s.stats.cha = 200;
    expect(chaDeal(s)).toBeCloseTo(0.45);
  });
});

describe('v1.4 동시대 환생자', () => {
  it('둘은 보통, 둘은 어려움', () => {
    const peers = contemporaries(42, '세라');
    expect(peers.map((p) => p.injuryCap)).toEqual([PEER_MID.injuryCap, PEER_MID.injuryCap, PEER_HARD.injuryCap, PEER_HARD.injuryCap]);
  });

  it('어려운 삶은 평균 수명이 더 짧다', () => {
    const avg = (opt: object) => {
      let a = 0;
      for (let i = 0; i < 40; i++) a += simulateLife(i * 101 + 3, opt).age;
      return a / 40;
    };
    expect(avg(PEER_HARD)).toBeLessThan(avg({}) - 5);
  });
});
