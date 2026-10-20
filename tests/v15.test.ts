import { describe, expect, it } from 'vitest';
import { advanceMonth, applyEffect, choiceLocked, createLife, gradeOf, jobReqMissing, statCap } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { GRADED } from '../src/data/stats';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };
const liveTo = (s: ReturnType<typeof createLife>, age: number, rng = seededRng(2)) => {
  while (s.age < age && !s.death) {
    s.pendingEventId = null;
    advanceMonth(s, rng);
  }
};

describe('v1.5 등급', () => {
  it('40점마다 한 등급: F~S', () => {
    expect([0, 40, 41, 80, 81, 120, 121, 160, 161, 200, 201, 240, 241, 280].map(gradeOf).join('')).toBe('FFEEDDCCBBAASS');
  });

  it('유년기 선택이 재능으로 쌓여 13세에 각성한다', () => {
    const s = createLife(base, seededRng(1));
    s.age = 8;
    applyEffect(s, { stats: { mana: 40 } }, seededRng(3));
    liveTo(s, 13);
    expect(s.talents?.[0]).toBe('mana');
  });

  it('성인식에서 등급을 받고, 이후로는 +2등급까지만 오른다', () => {
    const s = createLife(base, seededRng(4));
    liveTo(s, 18);
    expect(s.grade18).toBeDefined();
    expect(Object.keys(s.grade18!).sort()).toEqual([...GRADED].sort());
    expect(s.log.some((l) => l.text.includes('대마검사협회'))).toBe(true);
    const cap = statCap(s, 'int');
    applyEffect(s, { stats: { int: 999 } }, seededRng(5));
    expect(s.stats.int).toBe(cap);
    expect(cap).toBe(Math.min(280, 40 * (s.grade18!.int! + 3)));
  });

  it('특수 직업은 해당 능력치 D 이상', () => {
    const s = createLife(base, seededRng(6));
    s.stats.mana = 60;
    expect(jobReqMissing(s, 'mage')).toContain('마력');
    expect(choiceLocked(s, { label: 'x', success: { text: 'x', effect: { job: 'mage' } } })).toBe(true);
    s.stats.mana = 81;
    expect(jobReqMissing(s, 'mage')).toBeNull();
    expect(jobReqMissing(s, 'farmer')).toBeNull();
  });
});
