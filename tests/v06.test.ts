import { describe, expect, it } from 'vitest';
import { STRESS_HIGH, advanceYear, applyOracle, choiceLocked, choose, createLife, currentEvent, visibleChoices } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { TRAITS, rollTraits, traitById } from '../src/data/traits';
import { DESTINY_EVENTS } from '../src/data/events/destiny';
import { HOUSES } from '../src/data/houses';
import { legendOf } from '../src/data/legends';
import { goddessLines } from '../src/data/goddess';
import { ORACLE, pickOracle } from '../src/data/oracle';
import { DEATHS } from '../src/data/deaths';
import { eventById } from '../src/data/events';

const base = { name: '테스트', houseId: 'farm', cheatId: 'growth', upgrades: {} };

describe('v0.6 타고난 특성', () => {
  it('0~2개, 중복·모순 없이 뽑는다', () => {
    const rng = seededRng(3);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      const t = rollTraits(rng);
      counts[t.length]++;
      expect(new Set(t).size).toBe(t.length);
      if (t.length === 2) expect(traitById(t[0])!.conflicts ?? []).not.toContain(t[1]);
    }
    expect(counts[0]).toBeGreaterThan(300);
    expect(counts[2]).toBeGreaterThan(800);
    expect(new Set(TRAITS.map((t) => t.id)).size).toBe(TRAITS.length);
  });

  it('특성이 시작 능력치와 불굴 목숨에 반영된다', () => {
    const a = createLife({ ...base, traits: [] }, seededRng(1));
    const b = createLife({ ...base, traits: ['gorgeous', 'plot_armor'] }, seededRng(1));
    expect(b.stats.cha - a.stats.cha).toBe(20); // 능력치 200 기준
    expect(b.extraLives - a.extraLives).toBe(1);
  });
});

describe('v0.6 스트레스 · 휴식 · 의지력', () => {
  it('같은 방침을 반복하면 스트레스가 쌓이고, 휴식하면 내려간다', () => {
    const s = createLife({ ...base, traits: [] }, seededRng(2));
    const rng = seededRng(9);
    while (s.age < 25 && !s.death) {
      s.pendingEventId = null;
      advanceYear(s, rng);
    }
    s.death = null;
    // 하던 해를 마저 보낸다 (한 해 = 12달, 마음은 새해에 정산된다)
    while ((s.month ?? 0) !== 0) {
      s.pendingEventId = null;
      advanceYear(s, rng);
    }
    expect(s.stress).toBeGreaterThanOrEqual(STRESS_HIGH);
    const before = s.stress!;
    const willBefore = s.will!;
    s.focus = 'rest';
    s.pendingEventId = null;
    advanceYear(s, rng);
    expect(s.stress!).toBeLessThan(before);
    expect(s.will!).toBeGreaterThan(willBefore);
  });

  it('의지력이 모자라면 숙명을 거스르는 선택지가 잠긴다', () => {
    // 용사 혈통의 숙명은 「성검의 부름」(m_hero16) 이 맡는다
    expect(DESTINY_EVENTS.map((e) => e.cond.houses![0]).sort()).toEqual(HOUSES.map((h) => h.id).filter((h) => h !== 'hero').sort());
    const s = createLife({ ...base, traits: [] }, seededRng(4));
    s.age = 16;
    s.pendingEventId = 'd_farm';
    const ev = currentEvent(s)!;
    const defyIdx = visibleChoices(s, ev).findIndex((c) => c.will);
    s.will = 10;
    expect(choiceLocked(s, visibleChoices(s, ev)[defyIdx])).toBe(true);
    expect(choose(s, defyIdx)).toBeNull();
    s.will = 60;
    expect(choose(s, defyIdx)).not.toBeNull();
    expect(s.will).toBe(35);
    expect(s.flags).toContain('defied_fate');
  });

  it('불굴 목숨이 없으면 대신 죽어줄 수 있다', () => {
    const s = createLife({ ...base, traits: [] }, seededRng(5));
    s.age = 30;
    s.will = 80;
    s.rels.friend = { name: '리아', affection: 60 };
    s.pendingEventId = 'x_blow_friend';
    const choices = visibleChoices(s, eventById('x_blow_friend')!);
    const idx = choices.findIndex((c) => c.will === 40);
    expect(idx).toBeGreaterThanOrEqual(0);
    choose(s, idx);
    expect(s.death?.causeId).toBe('sacrifice');
  });
});

describe('v0.6 여신 · 문답 · 전설', () => {
  it('모든 사인에 여신 대사가 있고, 같은 죽음이 반복되면 반응한다', () => {
    for (const d of DEATHS) {
      const s = createLife({ ...base, traits: [] }, seededRng(6));
      s.death = { causeId: d.id, age: 30 };
      s.age = 30;
      const lines = goddessLines(s, { lifeNo: 2, causeCount: 1 });
      expect(lines.length).toBeGreaterThan(0);
    }
    const s = createLife({ ...base, traits: [] }, seededRng(7));
    s.death = { causeId: 'dragon', age: 40 };
    expect(goddessLines(s, { lifeNo: 3, prevCause: 'dragon', causeCount: 2 })[0]).toContain('또');
  });

  it('문답은 서로 다른 3개를 뽑고 답이 반영된다', () => {
    const ids = pickOracle(seededRng(8));
    expect(new Set(ids).size).toBe(3);
    const s = createLife({ ...base, traits: [] }, seededRng(8));
    const will = s.will!;
    applyOracle(s, [ORACLE.find((q) => q.id === 'fate')!.answers[1]]);
    expect(s.will).toBe(will + 20);
  });

  it('업적을 남긴 생은 전설이 되고, 다음 생에서 전설 사건이 일어난다', () => {
    const s = createLife({ ...base, traits: [] }, seededRng(9));
    s.flags.push('dragonslayer');
    s.death = { causeId: 'old_age', age: 70 };
    const legend = legendOf(s)!;
    expect(legend.kind).toBe('hero');
    let seen = 0;
    for (let i = 0; i < 120; i++) {
      const next = createLife({ ...base, legends: [legend] }, seededRng(500 + i));
      const rng = seededRng(900 + i);
      for (let g = 0; g < 400 && !next.death; g++) {
        const ev = currentEvent(next);
        if (ev) {
          const open = visibleChoices(next, ev).findIndex((c) => !choiceLocked(next, c));
          choose(next, open, rng);
        } else advanceYear(next, rng);
      }
      if (next.seen.some((id) => id.startsWith('lg_'))) seen++;
    }
    expect(seen).toBeGreaterThan(30);
  });
});
