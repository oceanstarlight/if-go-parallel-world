import { describe, expect, it } from 'vitest';
import { MAX_INJURY, MONTHS, advanceMonth, applyEffect, canAdvance, createLife, kill, visibleChoices } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { monthlyEconomy } from '../src/engine/economy';
import { eventById } from '../src/data/events';
import { rec } from '../src/engine/record';

const base = { name: '세라', gender: 'f' as const, houseId: 'merchant', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('v1.0 시간: 한 해 = 12달', () => {
  it('12달이 지나면 한 살 먹고, 사건이 뜨면 거기서 멈춘다', () => {
    const s = createLife(base, seededRng(1));
    const rng = seededRng(2);
    let ticks = 0;
    while (s.age < 10 && ticks < 2000) {
      if (s.pendingEventId) s.pendingEventId = null;
      const before = s.month ?? 0;
      advanceMonth(s, rng);
      ticks++;
      if (!s.death) expect(s.month).toBe((before + 1) % MONTHS);
      if (s.pendingEventId) expect(canAdvance(s)).toBe(false);
      if (s.death) break;
    }
    expect(s.age).toBe(10);
    expect(ticks).toBe(9 * MONTHS + 1); // 새해 첫 달에 나이를 먹는다
    // 한 해에 여러 사건이 일어날 수 있다 (연대기에 몇 월인지 남는다)
    expect(s.log.some((l) => (l.m ?? 0) > 1)).toBe(true);
  });

  it('월급은 연봉을 12로 나눠 매달 들어온다', () => {
    const s = createLife(base, seededRng(3));
    applyEffect(s, { job: 'court' }, seededRng(4));
    s.age = 25;
    const g = s.gold!;
    monthlyEconomy(s, 0, seededRng(5));
    expect(s.gold! - g).toBe(30); // 서기관 연봉 360G
    expect(s.lastPay).toBe(30);
  });
});

describe('v1.0 중상 누적제', () => {
  it('급사는 두 번까지 중상으로 버티고, 세 번째에 죽는다', () => {
    const s = createLife(base, seededRng(6));
    s.age = 30;
    s.gold = 1000;
    for (let i = 1; i < MAX_INJURY; i++) {
      expect(kill(s, 'carriage')).toBe(false);
      expect(s.death).toBeNull();
      expect(s.injuries).toBe(i);
      expect(s.recover).toBe(12);
    }
    expect(s.gold).toBeLessThan(1000);
    expect(rec(s).nearDeaths).toEqual(['carriage', 'carriage']);
    expect(kill(s, 'carriage')).toBe(true);
    expect(s.death?.causeId).toBe('carriage');
  });

  it('노환·교수대·던전은 그대로 죽음이다', () => {
    for (const cause of ['old_age', 'gallows', 'dungeon', 'abyss']) {
      const s = createLife(base, seededRng(7));
      expect(kill(s, cause), cause).toBe(true);
    }
  });

  it('체력이 0이 되어도 중상이면 체력 10으로 살아난다', () => {
    const s = createLife(base, seededRng(8));
    applyEffect(s, { stats: { vit: -200 }, zeroCause: 'illness' }, seededRng(9));
    expect(s.death).toBeNull();
    expect(s.stats.vit).toBe(10);
  });
});

describe('v1.0 남쪽 무역로', () => {
  const ev = eventById('e_merchant_deal')!;
  it('돈이 있으면 전 재산 올인, 빚이면 빚을 내서 올인', () => {
    const s = createLife(base, seededRng(10));
    s.gold = 500;
    expect(visibleChoices(s, ev).map((c) => c.label)).toContain('전 재산을 올인한다');
    expect(visibleChoices(s, ev).map((c) => c.label)).not.toContain('빚을 내서 올인한다');
    s.gold = -200;
    expect(visibleChoices(s, ev).map((c) => c.label)).toContain('빚을 내서 올인한다');
    expect(visibleChoices(s, ev).map((c) => c.label)).not.toContain('전 재산을 올인한다');
  });
  it('불어나는 돈에는 상한이 있다', () => {
    const s = createLife(base, seededRng(11));
    s.gold = 1_000_000;
    applyEffect(s, { goldPct: 2, goldCap: 30000 }, seededRng(12));
    expect(s.gold).toBe(1_030_000);
  });
});
