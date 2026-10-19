import { describe, expect, it } from 'vitest';
import { createLife, rollFate } from '../src/engine/life';
import { contemporaries, seededRng, simulateLife } from '../src/engine/sim';
import { computeStones, sumStones } from '../src/engine/score';
import { GOALS, goalById } from '../src/data/goals';
import { HOUSES } from '../src/data/houses';
import { CHEATS } from '../src/data/cheats';
import { BIRTH_TEXT } from '../src/data/flavor';
import { SHOP } from '../src/data/shop';
import type { MetaSave } from '../src/types';

const emptyMeta = (): MetaSave => ({ soulStones: 0, totalLives: 0, unlocked: [], upgrades: {}, codex: {}, lives: [] }) as unknown as MetaSave;

describe('v0.5 콘텐츠', () => {
  it('모든 출신·권능은 가중치·탄생 문장·제단 항목을 가진다', () => {
    for (const h of HOUSES) {
      expect(h.weight).toBeGreaterThan(0);
      expect(BIRTH_TEXT[h.id], h.id).toBeTruthy();
    }
    for (const c of CHEATS) expect(c.weight).toBeGreaterThan(0);
    const shopIds = new Set(SHOP.map((i) => i.id));
    for (const id of [...HOUSES, ...CHEATS].map((x) => x.id)) {
      if (!['farm', 'merchant', 'growth', 'memory'].includes(id)) expect(shopIds.has(id), id).toBe(true);
    }
  });

  it('운명의 주사위는 인구 비율에 가깝게 출신을 고른다', () => {
    const rng = seededRng(7);
    const count: Record<string, number> = {};
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const f = rollFate(rng);
      count[f.houseId] = (count[f.houseId] ?? 0) + 1;
      expect(CHEATS.some((c) => c.id === f.cheatId)).toBe(true);
    }
    const total = HOUSES.reduce((a, h) => a + h.weight, 0);
    for (const h of HOUSES) expect(Math.abs((count[h.id] ?? 0) / N - h.weight / total)).toBeLessThan(0.02);
  });

  it('태어날 때 서로 다른 목표 3개를 받는다', () => {
    for (let seed = 1; seed < 60; seed++) {
      const f = rollFate(seededRng(seed));
      const s = createLife({ name: '목표', ...f, upgrades: {} }, seededRng(seed + 1000));
      expect(s.goals).toHaveLength(3);
      expect(new Set(s.goals).size).toBe(3);
      for (const id of s.goals!) {
        const g = goalById(id)!;
        expect(g).toBeTruthy();
        if (g.canAssign) expect(g.canAssign(s)).toBe(true);
      }
    }
    expect(new Set(GOALS.map((g) => g.id)).size).toBe(GOALS.length);
  });

  it('운명 모드는 환생석 보너스를 준다', () => {
    const s = simulateLife(42, { houseId: 'farm', cheatId: 'growth' });
    const base = sumStones(computeStones({ ...s, fated: false }, emptyMeta()));
    const fated = sumStones(computeStones({ ...s, fated: true }, emptyMeta()));
    expect(fated).toBeGreaterThan(base);
  });

  it('동시대 환생자 4명은 결정적으로 시뮬레이션되고 모두 죽는다', () => {
    const a = contemporaries(1234, '나');
    const b = contemporaries(1234, '나');
    expect(a).toHaveLength(4);
    expect(a.map((p) => [p.name, p.age, p.death?.causeId])).toEqual(b.map((p) => [p.name, p.age, p.death?.causeId]));
    for (const p of a) {
      expect(p.death).toBeTruthy();
      expect(p.name).not.toBe('나');
    }
  });
});
