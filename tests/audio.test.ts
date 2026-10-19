import { describe, expect, it } from 'vitest';
import { STEPS_PER_BAR, TRACKS, compose, degToMidi, moodFor, type Mood } from '../src/audio/compose';

describe('배경 음악 작곡', () => {
  const moods = Object.keys(TRACKS) as Mood[];

  it('모든 곡이 24마디이고, 같은 시드면 같은 곡이 나온다', () => {
    for (const m of moods) {
      const a = compose(TRACKS[m]);
      expect(a.length, m).toBe(24 * STEPS_PER_BAR);
      expect(JSON.stringify(compose(TRACKS[m]))).toBe(JSON.stringify(a));
    }
  });

  it('선율은 음계 안의 음이고, 듣기 편한 음역에 머문다', () => {
    for (const m of moods) {
      const t = TRACKS[m];
      const inScale = new Set(t.scale.map((x) => x % 12));
      const leads = compose(t).flatMap((s) => (s.lead ? [s.lead[0]] : []));
      expect(leads.length, m).toBeGreaterThan(10);
      for (const n of leads) {
        expect(inScale.has((((n - t.root) % 12) + 12) % 12), `${m} ${n}`).toBe(true);
        expect(n).toBeGreaterThanOrEqual(degToMidi(t, 5));
        expect(n).toBeLessThanOrEqual(degToMidi(t, 14));
      }
    }
  });

  it('마지막 프레이즈는 선율 없이 반주만 흐르고, 프레이즈 끝은 으뜸음으로 맺는다', () => {
    for (const m of moods) {
      const t = TRACKS[m];
      const sc = compose(t);
      expect(sc.slice(16 * STEPS_PER_BAR).every((s) => !s.lead), m).toBe(true);
      const cadence = sc[7 * STEPS_PER_BAR].lead!;
      expect(((cadence[0] - t.root) % 12 + 12) % 12, m).toBe(0);
    }
  });

  it('화면마다 어울리는 분위기를 고른다', () => {
    expect(moodFor('dungeon')).toBe('dungeon');
    expect(moodFor('death')).toBe('requiem');
    expect(moodFor('altar')).toBe('altar');
    expect(moodFor('setup')).toBe('title');
  });
});
