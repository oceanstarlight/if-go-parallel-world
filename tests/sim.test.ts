import { describe, expect, it } from 'vitest';
import { STRESS_HIGH, advanceYear, createLife } from '../src/engine/life';
import { HOUSES } from '../src/data/houses';
import { CHEATS } from '../src/data/cheats';
import { DEATHS } from '../src/data/deaths';
import { ALL_EVENTS } from '../src/data/events';
import { josa } from '../src/engine/text';
import type { Legend, LifeState } from '../src/types';
import { autoStep } from '../src/engine/sim';

/** 재현 가능한 난수 (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEGENDS: Legend[] = [
  { name: '아르테', deed: '드래곤을 쓰러뜨린', kind: 'hero', houseId: 'hero', age: 61, lifeNo: 1 },
  { name: '벨', deed: '악명 높은', kind: 'villain', houseId: 'demon', age: 40, lifeNo: 2 },
  { name: '미오', deed: '어린 나이에 떠난', kind: 'ghost', houseId: 'farm', age: 9, lifeNo: 3 },
  { name: '세라', deed: '대현자라 불린', kind: 'sage', houseId: 'elf', age: 120, lifeNo: 4 },
];

function simulate(seed: number, houseId: string, cheatId: string): LifeState {
  const rng = seeded(seed);
  const s = createLife({ name: '테스트', houseId, cheatId, upgrades: {}, npcPast: seed % 3 === 0 ? { lulu: 3, grim: 2, momo: 2 } : {}, lifeNo: 1 + (seed % 5), legends: seed % 4 === 0 ? LEGENDS : [] }, rng);
  for (let guard = 0; guard < 500 && !s.death; guard++) autoStep(s, rng);
  return s;
}

describe('엔진', () => {
  it('조사를 받침에 맞게 붙인다', () => {
    expect(josa('리아', '이')).toBe('리아가');
    expect(josa('에단', '이')).toBe('에단이');
    expect(josa('하르트', '은')).toBe('하르트는');
    expect(josa('케인', '과')).toBe('케인과');
    expect(josa('미렐', '으로')).toBe('미렐로');
    expect(josa('에단', '이었다')).toBe('에단이었다');
  });

  it('사건 ID 가 중복되지 않는다', () => {
    const ids = ALL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('사건이 참조하는 사인은 모두 정의되어 있다', () => {
    const deathIds = new Set(DEATHS.map((d) => d.id));
    for (const ev of ALL_EVENTS) {
      for (const r of [...(ev.choices ?? []), ...(ev.auto ? [ev.auto] : [])]) {
        for (const o of [r.success, r.fail]) {
          if (o?.effect?.death) expect(deathIds, `${ev.id}`).toContain(o.effect.death);
          if (o?.effect?.zeroCause) expect(deathIds, `${ev.id}`).toContain(o.effect.zeroCause);
          if (r.check) expect(r.fail, `${ev.id}: check 에는 fail 필요`).toBeDefined();
        }
      }
    }
  });
});

describe('시뮬레이션', () => {
  const N = 3000;
  const lives: LifeState[] = [];
  for (let i = 0; i < N; i++) {
    const house = HOUSES[i % HOUSES.length].id;
    const cheat = CHEATS[Math.floor(i / HOUSES.length) % CHEATS.length].id;
    lives.push(simulate(i + 1, house, cheat));
  }

  it('모든 삶은 끝나고, 사인은 정의된 것이다', () => {
    const deathIds = new Set(DEATHS.map((d) => d.id));
    for (const s of lives) {
      expect(s.death).not.toBeNull();
      expect(deathIds).toContain(s.death!.causeId);
      expect(s.age).toBeLessThanOrEqual(140); // 엘프·불로 체질은 100세를 넘길 수 있다
    }
  });

  it('연대기에 치환되지 않은 {변수} 가 남지 않는다', () => {
    const bad = lives.flatMap((s) => s.log.map((l) => l.text)).filter((t) => /\{\w+(:[가-힣]+)?\}/.test(t));
    expect(bad).toEqual([]);
  });

  it('분포 리포트', () => {
    const causes: Record<string, number> = {};
    const seen = new Set<string>();
    for (const s of lives) {
      causes[s.death!.causeId] = (causes[s.death!.causeId] ?? 0) + 1;
      s.seen.forEach((id) => seen.add(id));
    }
    const avg = lives.reduce((a, s) => a + s.age, 0) / N;
    const jobs: Record<string, number> = {};
    for (const s of lives) jobs[`${s.jobId}:${s.jobRank}`] = (jobs[`${s.jobId}:${s.jobRank}`] ?? 0) + 1;
    // 일부러 드문 사건 (도달 가능성은 tests/chains.test.ts 에서 직접 확인한다)
    const RARE = ['b_debt_doom', 'hp_cleared_reward', 'bankrupt_comeback', 'cold_marriage_end'];
    const unseen = ALL_EVENTS.filter((e) => !seen.has(e.id) && !RARE.includes(e.id)).map((e) => e.id);
    console.log('평균 수명', avg.toFixed(1));
    console.log('사인 분포', Object.entries(causes).sort((a, b) => b[1] - a[1]));
    console.log('직업:직급', Object.entries(jobs).sort((a, b) => b[1] - a[1]).slice(0, 20));
    console.log('한 번도 안 나온 사건', unseen);
    const young: Record<string, number> = {};
    for (const s of lives) if (s.age < 18) young[s.death!.causeId] = (young[s.death!.causeId] ?? 0) + 1;
    console.log('18세 이전 사망', Object.entries(young).sort((a, b) => b[1] - a[1]));
    expect(avg).toBeGreaterThan(25);
    expect(unseen).toEqual([]);
  });
});

describe('성장 곡선', () => {
  it('한 능력치에 집중하면 30세 무렵 충분히 성장한다', () => {
    const vals: number[] = [];
    for (let i = 0; i < 300; i++) {
      const rng = seeded(10_000 + i);
      const s = createLife({ name: 't', houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] }, rng);
      while (s.age < 30) {
        s.pendingEventId = null; // 사건 무시, 순수 성장만
        s.death = null;
        // 스트레스가 쌓이면 한 해 쉬는 평범한 플레이어
        s.focus = (s.stress ?? 0) >= STRESS_HIGH ? 'rest' : 'train';
        advanceYear(s, rng);
      }
      vals.push(s.stats.vit);
    }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    console.log('30세 체력 평균(농가·성장가속·수련)', avg.toFixed(1));
    expect(avg).toBeGreaterThan(55);
  });
});
