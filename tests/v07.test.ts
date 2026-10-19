import { describe, expect, it } from 'vitest';
import { advanceYear, applyEffect, createLife } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { combatPower, floorPower, winChance } from '../src/engine/combat';
import { buy, equip, maxHp, sell, sellAllLoot, yearlyEconomy } from '../src/engine/economy';
import { beginDive, descend, preview, retreat, startFloors } from '../src/engine/dungeon';
import { branchPaths, inBranch } from '../src/data/branches';
import { ARC_EVENTS } from '../src/data/events/arcs';
import { ALL_EVENTS } from '../src/data/events';
import { MARKET } from '../src/data/market';
import { BOSSES } from '../src/data/items';

const base = { name: '테스트', houseId: 'merchant', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('v0.7 전투력', () => {
  it('승률은 전투력이 같으면 50%, 강할수록 오르고 3~97%로 제한된다', () => {
    expect(winChance(100, 100)).toBe(50);
    expect(winChance(130, 100)).toBeGreaterThan(75);
    expect(winChance(390, 300)).toBeGreaterThan(80);
    expect(winChance(1000, 10)).toBe(97);
    expect(winChance(1, 1000)).toBe(3);
  });
  it('장비가 전투력을 올린다', () => {
    const s = createLife(base, seededRng(1));
    const before = combatPower(s);
    s.gold = 10000;
    expect(buy(s, 'w4').ok).toBe(true);
    equip(s, s.bag![0].uid);
    expect(combatPower(s) - before).toBe(42);
  });
  it('100층 마왕은 1층보다 훨씬 강하다', () => {
    expect(floorPower(100, true)).toBeGreaterThan(floorPower(5, true) * 8);
    expect(BOSSES).toHaveLength(20);
  });
});

describe('v0.7 경제', () => {
  it('출신별 시작 골드와 연간 수입, 빚 이자', () => {
    const s = createLife(base, seededRng(2));
    expect(s.gold).toBe(200);
    applyEffect(s, { job: 'court' }, seededRng(3));
    s.age = 25;
    const g = s.gold!;
    yearlyEconomy(s, seededRng(4));
    expect(s.gold! - g).toBe(360 - 60);
    s.gold = -1000;
    yearlyEconomy(s, seededRng(5));
    expect(s.gold!).toBeLessThan(-1000 + 360 - 60);
  });
  it('사고팔기: 서비스는 살 때마다 비싸지고, 소유물은 한 번만', () => {
    const s = createLife(base, seededRng(6));
    s.age = 30;
    s.gold = 100000;
    const int0 = s.stats.int;
    buy(s, 'tutor');
    const g1 = s.gold;
    buy(s, 'tutor');
    expect(g1 - s.gold).toBe(600);
    expect(s.stats.int).toBeGreaterThanOrEqual(int0 + 10);
    expect(buy(s, 'house').ok).toBe(true);
    expect(buy(s, 'house').ok).toBe(false);
    buy(s, 'p1');
    const potion = s.bag!.find((x) => x.kind === 'potion')!;
    const g2 = s.gold;
    sell(s, potion.uid);
    expect(s.gold).toBe(g2 + potion.value);
    expect(MARKET.length).toBeGreaterThan(35);
  });
  it('도둑질로 세 번 붙잡히면 교수대', () => {
    const s = createLife(base, seededRng(7));
    s.gold = 500;
    applyEffect(s, { caught: true }, seededRng(1));
    expect(s.gold).toBe(0);
    applyEffect(s, { caught: true }, seededRng(1));
    expect(s.death).toBeNull();
    applyEffect(s, { caught: true }, seededRng(1));
    expect(s.death?.causeId).toBe('gallows');
  });
});

describe('v0.7 던전', () => {
  it('5층씩 내려가고, 귀환하면 전리품이 가방으로 들어온다', () => {
    let cleared = 0;
    for (let i = 0; i < 30; i++) {
      const s = createLife(base, seededRng(100 + i));
      s.age = 20;
      Object.assign(s.stats, { vit: 60, mana: 50, int: 30, luck: 30 });
      s.hp = maxHp(s);
      expect(startFloors(s)).toEqual([0]);
      beginDive(s, 0);
      const pv = preview(s);
      expect(pv.from).toBe(1);
      expect(pv.to).toBe(5);
      const res = descend(s, seededRng(200 + i));
      if (res === 'cleared') {
        cleared++;
        expect(s.dive!.floor).toBe(5);
        expect(s.dgBest).toBe(5);
        const loot = s.dive!.loot.length;
        const gold = s.gold!;
        retreat(s);
        expect(s.dive).toBeNull();
        expect(s.bag!.length).toBe(loot);
        expect(s.gold!).toBeGreaterThanOrEqual(gold);
        expect(startFloors(s)).toEqual([0, 5]);
        sellAllLoot(s);
        expect(s.bag!.filter((x) => x.kind === 'loot')).toHaveLength(0);
      }
    }
    expect(cleared).toBeGreaterThan(20);
  });
  it('한 해가 지나면 HP가 가득 찬다', () => {
    const s = createLife(base, seededRng(9));
    s.age = 20;
    s.hp = 1;
    s.focus = 'train';
    advanceYear(s, seededRng(10));
    if (!s.death) expect(s.hp).toBe(maxHp(s));
  });
  it('100층 마왕을 쓰러뜨리면 명성과 막대한 부, 그리고 게임은 계속된다', () => {
    const s = createLife(base, seededRng(11));
    s.age = 40;
    Object.assign(s.stats, { vit: 100, mana: 100, int: 100, luck: 100 });
    s.equip = { weapon: { uid: 1, base: 'w8', name: '성검', kind: 'weapon', rarity: 'legend', power: 500, value: 1 }, armor: { uid: 2, base: 'a8', name: '갑옷', kind: 'armor', rarity: 'legend', power: 500, value: 1 } };
    s.dgBest = 95;
    s.hp = maxHp(s);
    beginDive(s, 95);
    const fame = s.stats.fame;
    let res = descend(s, seededRng(12));
    for (let t = 0; t < 5 && res === 'fled'; t++) {
      s.hp = maxHp(s);
      res = descend(s, seededRng(13 + t));
    }
    expect(res).toBe('conquered');
    expect(s.flags).toContain('slew_demon_lord');
    expect(s.stats.fame).toBeGreaterThan(fame);
    const g = s.gold!;
    retreat(s);
    expect(s.gold! - g).toBeGreaterThanOrEqual(100000);
    expect(s.death).toBeNull();
  });
});

describe('v0.7 인생 트리', () => {
  it('공통 틀 4종 × 8개 가지 = 32개 사건, 모든 가지 사건은 존재하는 가지를 가리킨다', () => {
    expect(ARC_EVENTS).toHaveLength(32);
    for (const e of ALL_EVENTS.filter((x) => x.branch)) expect(inBranch, e.id).toBeTruthy();
  });
  it('가지 경로: 인생 › 상인 › 대상회', () => {
    const s = createLife(base, seededRng(14));
    applyEffect(s, { job: 'merchant' }, seededRng(1));
    s.jobRank = 3;
    expect(branchPaths(s)).toContainEqual(['상인', '대상회']);
    expect(inBranch(s, 'trade_house')).toBe(true);
    expect(inBranch(s, 'thief')).toBe(false);
  });
});
