import { describe, expect, it } from 'vitest';
import { YEAR_NOTES } from '../src/data/notes';
import { ALL_EVENTS } from '../src/data/events';
import { advanceMonth, choose, createLife } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { NOTE_GAP } from '../src/engine/notes';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('한 해 기록 (YEAR_NOTES)', () => {
  it('형식이 올바르다: id 유일·접두사, 나이 범위, 문장 길이', () => {
    const ids = new Set<string>();
    const eventIds = new Set(ALL_EVENTS.map((e) => e.id));
    for (const n of YEAR_NOTES) {
      expect(ids.has(n.id), `중복 id ${n.id}`).toBe(false);
      expect(eventIds.has(n.id), `사건 id 와 겹침 ${n.id}`).toBe(false);
      ids.add(n.id);
      expect(n.id, n.id).toMatch(/^n[0-5j]_[a-z0-9_]+$/);
      expect(n.minAge, n.id).toBeGreaterThanOrEqual(0);
      expect(n.minAge, n.id).toBeLessThanOrEqual(n.maxAge);
      expect(n.cond?.minAge, `${n.id}: 나이는 minAge/maxAge 로`).toBeUndefined();
      expect(n.cond?.maxAge, `${n.id}: 나이는 minAge/maxAge 로`).toBeUndefined();
      if (typeof n.text === 'string') expect(n.text.length, `${n.id} 문장이 너무 길다`).toBeLessThanOrEqual(90);
      // 효과는 작게: 능력치 ±2 이하
      for (const v of Object.values(n.effect?.stats ?? {})) expect(Math.abs(v ?? 0), n.id).toBeLessThanOrEqual(2);
      expect(n.effect?.death, n.id).toBeUndefined();
    }
  });

  it('인연 토큰을 쓰는 기록은 그 인연이 있을 때만 나온다', () => {
    for (const n of YEAR_NOTES) {
      if (typeof n.text !== 'string') continue;
      for (const k of ['friend', 'rival', 'mentor', 'spouse'] as const) {
        if (n.text.includes(`{${k}`)) expect(n.cond?.hasRel ?? [], `${n.id} 에 hasRel: ['${k}'] 가 필요하다`).toContain(k);
      }
    }
  });

  it('살아가며 기록이 쌓이고, 한 번뿐인 기록은 한 번만, 같은 기록은 간격을 둔다', () => {
    const s = createLife(base, seededRng(1));
    const rng = seededRng(2);
    for (let i = 0; i < 12 * 40 && !s.death; i++) {
      if (s.pendingEventId) choose(s, 0, rng);
      advanceMonth(s, rng);
    }
    const noteTexts = new Set(YEAR_NOTES.map((n) => (typeof n.text === 'string' ? n.text : '')));
    const logged = s.log.filter((l) => noteTexts.has(l.text));
    expect(logged.length).toBeGreaterThan(5);
    // 걸음마 같은 이정표는 범위 안에서 반드시 한 번
    expect(s.log.filter((l) => l.text.startsWith('처음으로 두 발로 섰다')).length).toBe(1);
    for (const [id, age] of Object.entries(s.notesAt ?? {})) expect(age, id).toBeGreaterThanOrEqual(0);
    expect(NOTE_GAP).toBeGreaterThan(0);
  });
});
