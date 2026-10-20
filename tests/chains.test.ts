import { describe, expect, it } from 'vitest';
import { ALL_EVENTS } from '../src/data/events';
import type { Choice, Effect, Outcome } from '../src/types';
import { choose, createLife, eligible, visibleChoices } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { eventById } from '../src/data/events';

/** src 아래 모든 .ts 파일의 원문 */
const CODE = Object.values(import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>).join('\n');

describe('사건 연관성', () => {
  it('세운 플래그는 반드시 어딘가에서 다시 읽힌다 (끊긴 선택 없음)', () => {
    const set = new Map<string, string>();
    const read = new Set<string>();
    const eff = (id: string, e?: Effect) => e?.flags?.forEach((f) => set.set(f, id));
    const out = (id: string, o?: Outcome) => eff(id, o?.effect);
    for (const ev of ALL_EVENTS) {
      for (const f of [...(ev.cond.flags ?? []), ...(ev.cond.notFlags ?? [])]) read.add(f);
      const rs: (Choice | NonNullable<typeof ev.auto>)[] = [...(ev.choices ?? []), ...(ev.auto ? [ev.auto] : [])];
      for (const r of rs) {
        const c = r as Choice;
        for (const f of [...(c.cond?.flags ?? []), ...(c.cond?.notFlags ?? [])]) read.add(f);
        out(ev.id, r.success);
        out(ev.id, r.fail);
      }
    }
    // 코드에서 읽는 플래그: has(s, 'x') · includes('x') · flags: [...] 가 아닌 곳의 문자열
    for (const m of CODE.matchAll(/(?:has\(s, |includes\()'([a-z0-9_]+)'/g)) read.add(m[1]);
    for (const m of CODE.matchAll(/\[([^\]]*)\]\.(?:some|every)\(\(f\) => s\.flags\.includes\(f\)\)/g)) {
      for (const f of m[1].matchAll(/'([a-z0-9_]+)'/g)) read.add(f[1]);
    }
    // 다른 시스템이 세우고 읽는 플래그 (던전 깊이 기록 등)
    for (const f of ['depth_20', 'depth_80', 'dungeon_conquered']) read.add(f);
    const dead = [...set.keys()].filter((f) => !read.has(f)).map((f) => `${f} (${set.get(f)})`);
    expect(dead).toEqual([]);
  });

  it('사슬 사건의 조건 플래그는 누군가 세운다 (도달 불가능한 사건 없음)', () => {
    const setters = new Set<string>();
    for (const ev of ALL_EVENTS) {
      for (const r of [...(ev.choices ?? []), ...(ev.auto ? [ev.auto] : [])]) {
        r.success.effect?.flags?.forEach((f) => setters.add(f));
        r.fail?.effect?.flags?.forEach((f) => setters.add(f));
      }
    }
    // 출신·시스템이 주는 플래그
    for (const m of CODE.matchAll(/flags: \[([^\]]*)\]/g)) for (const f of m[1].matchAll(/'([a-z0-9_]+)'/g)) setters.add(f[1]);
    for (const f of ['depth_20', 'depth_40', 'depth_60', 'depth_80', 'jailed']) setters.add(f);
    const orphan = ALL_EVENTS.flatMap((ev) => (ev.cond.flags ?? []).filter((f) => !setters.has(f)).map((f) => `${ev.id}: ${f}`));
    expect(orphan).toEqual([]);
  });
});

describe('드문 사슬도 끝까지 이어진다', () => {
  const base = { name: '테스트', houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

  it('용사 파티: 편지를 주우면 누명을 벗고, 공주의 보답 사건이 열린다', () => {
    const s = createLife(base, seededRng(1));
    s.age = 25;
    s.flags.push('hero_party', 'hp_q1', 'hp_camp', 'hp_suspect');
    const framed = eventById('a_hero_framed')!;
    expect(eligible(s, framed)).toBe(true);
    s.pendingEventId = framed.id;
    const idx = visibleChoices(s, framed).findIndex((c) => c.cond?.flags?.includes('hp_suspect'));
    choose(s, idx, seededRng(2));
    expect(s.flags).toContain('hp_cleared');
    expect(eligible(s, eventById('hp_cleared_reward')!)).toBe(true);
  });

  it('파산 → 바닥 → 재기', () => {
    const s = createLife(base, seededRng(6));
    s.age = 30;
    s.flags.push('bankrupted');
    s.stats.int = 150; // 상인은 지능 D 이상
    s.pendingEventId = 'bankrupt_bottom';
    choose(s, 0, seededRng(7));
    expect(s.jobId).toBe('merchant');
    s.gold = 2500;
    expect(eligible(s, eventById('bankrupt_comeback')!)).toBe(true);
  });

  it('빚이 6,000G를 넘으면 빚의 끝 사건이 열린다', () => {
    const s = createLife(base, seededRng(3));
    s.age = 30;
    s.gold = -7000;
    expect(eligible(s, eventById('b_debt_doom')!)).toBe(true);
  });

  it('차가운 결혼: 플래그와 배우자가 있으면 결말 사건이 열린다', () => {
    const s = createLife(base, seededRng(8));
    s.age = 30;
    s.flags.push('cold_marriage');
    s.rels.spouse = { name: '유리', affection: -20 };
    expect(eligible(s, eventById('cold_marriage_end')!)).toBe(true);
  });

  it('대신 칼을 맞아주면, 그 사람이 불굴 목숨을 돌려준다', () => {
    const s = createLife(base, seededRng(4));
    s.age = 30;
    s.extraLives = 1;
    s.rels.friend = { name: '리아', affection: 50 };
    s.pendingEventId = 'x_blow_friend';
    const ev = eventById('x_blow_friend')!;
    choose(s, visibleChoices(s, ev).findIndex((c) => c.label.includes('불굴')), seededRng(5));
    expect(s.extraLives).toBe(0);
    expect(eligible(s, eventById('blow_repay')!)).toBe(true);
  });
});
