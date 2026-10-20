import { describe, expect, it } from 'vitest';
import { REPEAT_GAP, advanceMonth, choose, createLife, currentEvent } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { MAGIC_COST, autoDuel, duelTurn, startDuel } from '../src/engine/duel';
import { beginDive, bossAhead, descendPath, settleBoss, settleMob } from '../src/engine/dungeon';
import { combatPower } from '../src/engine/combat';
import { STAT_INFO } from '../src/data/stats';
import { STAT_KEYS } from '../src/data/stats';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('v1.1 사건 반복 방지', () => {
  it(`같은 사건은 ${REPEAT_GAP}년 안에 다시 일어나지 않는다`, () => {
    for (let seed = 1; seed <= 15; seed++) {
      const s = createLife(base, seededRng(seed));
      const rng = seededRng(seed + 100);
      const last: Record<string, number> = {};
      for (let i = 0; i < 12 * 60 && !s.death; i++) {
        if (s.pendingEventId) choose(s, 0, rng);
        const n = s.seen.length;
        advanceMonth(s, rng);
        for (const id of s.seen.slice(n)) {
          if (id in last) expect(s.age - last[id], `${id} @${s.age}`).toBeGreaterThanOrEqual(REPEAT_GAP);
          last[id] = s.age;
        }
      }
    }
  });
});

describe('v1.1 능력치와 전투력', () => {
  it('모든 능력치에 설명이 있다', () => {
    for (const k of STAT_KEYS) expect(STAT_INFO[k].length).toBeGreaterThan(0);
  });
  it('마력과 행운이 전투력을 올린다', () => {
    const s = createLife(base, seededRng(1));
    const cp = combatPower(s);
    s.stats.luck += 20;
    expect(combatPower(s)).toBeGreaterThan(cp);
    const cp2 = combatPower(s);
    s.stats.mana += 20;
    expect(combatPower(s)).toBeGreaterThanOrEqual(cp2 + 11);
  });
});

describe('v1.1 턴제 전투', () => {
  const life = () => {
    const s = createLife(base, seededRng(2));
    s.stats.vit = 40;
    s.stats.mana = 40;
    s.stats.luck = 20;
    s.hp = undefined; // 능력치를 바꿨으니 HP 를 가득 채운다
    return s;
  };
  it('전투력이 크게 앞서면 거의 이기고, 크게 뒤지면 거의 진다', () => {
    const s = life();
    const rng = seededRng(3);
    let strong = 0, weak = 0;
    for (let i = 0; i < 300; i++) {
      const a = startDuel(s, 'event', '적', 50);
      a.cp = 80;
      if (autoDuel(a, s, rng) === 'win') strong++;
      const b = startDuel(s, 'event', '적', 160);
      b.cp = 80;
      if (autoDuel(b, s, rng) === 'win') weak++;
    }
    expect(strong).toBeGreaterThan(270);
    expect(weak).toBeLessThan(30);
  });
  it('마법은 마나를 쓰고, 방어는 피해를 줄이고 반격을 준비한다', () => {
    const s = life();
    const d = startDuel(s, 'event', '적', 100);
    duelTurn(d, s, 'magic', seededRng(4));
    expect(d.mp).toBe(d.mpMax - MAGIC_COST + 3);
    const g = startDuel(s, 'event', '적', 100);
    const blows = duelTurn(g, s, 'guard', seededRng(5));
    expect(blows[0].guard).toBe(true);
    expect(g.counter).toBe(true);
  });
  it('전투 결과를 사건 선택지에 그대로 반영한다', () => {
    const s = life();
    s.age = 20;
    s.pendingEventId = 'a_bandits';
    expect(currentEvent(s)?.id).toBe('a_bandits');
    const res = choose(s, 0, seededRng(6), true);
    expect(res?.passed).toBe(true);
    expect(s.record?.wins).toBe(1);
  });
  it('보스전: 이기면 다음 구간, 처음 지면 쓰러짐', () => {
    const s = life();
    s.age = 20;
    s.hp = 9999;
    beginDive(s, 0);
    // 길목의 마물은 이기고 지나간다
    const toBoss = (rng: () => number) => {
      let r = descendPath(s, rng);
      while (r === 'mob') {
        expect(settleMob(s, 'win', 9999, rng)).toBe('continue');
        r = descendPath(s, rng);
      }
      return r;
    };
    let r = toBoss(seededRng(7));
    expect(r).toBe('boss');
    expect(bossAhead(s).floor).toBe(5);
    expect(settleBoss(s, 'win', 50, seededRng(8))).toBe('cleared');
    expect(s.dive?.floor).toBe(5);
    s.hp = 9999;
    r = toBoss(seededRng(9));
    expect(r).toBe('boss');
    expect(settleBoss(s, 'lose', 0, seededRng(10))).toBe('fallen');
    expect(s.death).toBeNull();
  });
});
