import { describe, expect, it } from 'vitest';
import { applyEffect, createLife } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { attackMul, magicMul } from '../src/engine/duel';
import { beginDive, canEnterDungeon, descendPath, retreat } from '../src/engine/dungeon';
import { clampHp, innPrice, maxHp } from '../src/engine/economy';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };
const life = () => {
  const s = createLife(base, seededRng(3));
  s.pendingEventId = null;
  return s;
};

describe('v1.3 던전', () => {
  it('던전은 2년에 한 번', () => {
    const s = life();
    s.age = 20;
    expect(canEnterDungeon(s)).toBe(true);
    beginDive(s, 0);
    retreat(s);
    s.dive = null;
    expect(canEnterDungeon(s)).toBe(false);
    s.age = 22;
    expect(canEnterDungeon(s)).toBe(true);
  });

  it('길목에서 마물을 만나면 멈춘다 (턴제 전투)', () => {
    let mobs = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = life();
      s.age = 20;
      s.hp = 9999;
      beginDive(s, 0);
      if (descendPath(s, seededRng(seed)) === 'mob') {
        mobs++;
        expect(s.dive?.mob?.name).toBeTruthy();
      }
    }
    expect(mobs).toBeGreaterThan(0);
  });
});

describe('v1.3 경제·체력', () => {
  it('여관비는 회복할 HP 3당 1골드', () => {
    const s = life();
    s.hp = maxHp(s) - 10;
    expect(innPrice(s)).toBe(4);
    s.hp = maxHp(s);
    expect(innPrice(s)).toBe(0);
  });

  it('사건으로 잃는 돈은 가진 만큼만 (빚 사건 제외)', () => {
    const s = life();
    s.gold = 50;
    applyEffect(s, { gold: -200 }, seededRng(1));
    expect(s.gold).toBe(0);
    applyEffect(s, { gold: -2000, debt: true }, seededRng(1));
    expect(s.gold).toBe(-2000);
  });

  it('최대 체력이 줄면 현재 체력도 맞춘다', () => {
    const s = life();
    s.hp = maxHp(s);
    applyEffect(s, { stats: { vit: -10 } }, seededRng(1));
    expect(s.hp).toBe(maxHp(s));
    s.hp = 9999;
    clampHp(s);
    expect(s.hp).toBe(maxHp(s));
  });

  it('사건의 물건은 가방에 들어온다', () => {
    const s = life();
    const n = (s.bag ?? []).length;
    applyEffect(s, { item: { base: 'w1', name: '반짝이는 지팡이' } }, seededRng(1));
    expect(s.bag!.length).toBe(n + 1);
    expect(s.bag!.at(-1)!.name).toBe('반짝이는 지팡이');
  });
});

describe('v1.3 공격·마법 대칭', () => {
  it('체력이 높으면 공격, 마력이 높으면 마법이 세다', () => {
    const s = life();
    s.equip = { weapon: null, armor: null, trinkets: [] };
    s.stats.vit = 70;
    s.stats.mana = 20;
    expect(attackMul(s)).toBeGreaterThan(magicMul(s));
    s.stats.vit = 20;
    s.stats.mana = 70;
    expect(magicMul(s)).toBeGreaterThan(attackMul(s));
  });
});
