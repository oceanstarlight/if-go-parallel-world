import { describe, expect, it } from 'vitest';
import { advanceYear, choose, createLife, currentEvent, visibleChoices } from '../src/engine/life';
import { HOUSES } from '../src/data/houses';
import { CHEATS } from '../src/data/cheats';
import { DEATHS } from '../src/data/deaths';
import { ALL_EVENTS } from '../src/data/events';
import { josa } from '../src/engine/text';
import type { Focus, LifeState } from '../src/types';

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

const FOCI: Focus[] = ['train', 'study', 'social', 'explore'];

function simulate(seed: number, houseId: string, cheatId: string): LifeState {
  const rng = seeded(seed);
  const s = createLife({ name: '테스트', houseId, cheatId, upgrades: {} });
  for (let guard = 0; guard < 500 && !s.death; guard++) {
    if (rng() < 0.15) s.focus = FOCI[Math.floor(rng() * 4)];
    const ev = currentEvent(s);
    if (ev) {
      const n = visibleChoices(s, ev).length;
      choose(s, Math.floor(rng() * n), rng);
    } else {
      advanceYear(s, rng);
    }
  }
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
      expect(s.age).toBeLessThanOrEqual(100);
    }
  });

  it('연대기에 치환되지 않은 {변수} 가 남지 않는다', () => {
    for (const s of lives) {
      for (const l of s.log) expect(l.text, l.text).not.toMatch(/\{\w+(:[가-힣]+)?\}/);
    }
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
    const unseen = ALL_EVENTS.filter((e) => !seen.has(e.id)).map((e) => e.id);
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
      const s = createLife({ name: 't', houseId: 'farm', cheatId: 'growth', upgrades: {} });
      while (s.age < 30) {
        s.pendingEventId = null; // 사건 무시, 순수 성장만
        s.death = null;
        advanceYear(s, rng);
      }
      vals.push(s.stats.vit);
    }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    console.log('30세 체력 평균(농가·성장가속·수련)', avg.toFixed(1));
    expect(avg).toBeGreaterThan(55);
  });
});
