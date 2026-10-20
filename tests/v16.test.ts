import { describe, expect, it } from 'vitest';
import { advanceMonth, choose, createLife, currentEvent } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { doomOf } from '../src/data/world';
import type { LifeState } from '../src/types';

const base = { name: '세라', gender: 'f' as const, houseId: 'farm', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

/** 사건은 첫 선택지로 넘기며 끝까지 산다 */
function liveOut(s: LifeState, rng = seededRng(9), hook?: (s: LifeState) => void) {
  for (let i = 0; i < 12 * 60 && !s.death; i++) {
    hook?.(s);
    if (currentEvent(s)) choose(s, 0, rng);
    else advanceMonth(s, rng);
  }
}

describe('v1.6 세계의 끝', () => {
  it('멸망은 48~52세, 가면 쓴 사람은 20~22세 (1~3회차)', () => {
    for (let i = 0; i < 20; i++) {
      const s = createLife({ ...base, loop: i % 4 }, seededRng(i));
      expect(s.doomAge).toBeGreaterThanOrEqual(48);
      expect(s.doomAge).toBeLessThanOrEqual(52);
      if (i % 4 < 3) expect(s.hintAge).toBeGreaterThanOrEqual(20);
      else expect(s.hintAge).toBeUndefined();
    }
  });

  it('회차마다 멸망이 바뀐다: 흑룡 → 달 → 전쟁 → 사라짐 → 홍수 → 다시', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => doomOf(n).id)).toEqual(['doom_dragon', 'doom_moon', 'doom_war', 'doom_vanish', 'doom_flood', 'doom_dragon']);
  });

  it('살아남으면 가면 쓴 사람의 노래를 듣고, 멸망의 날 세계와 함께 잠든다', () => {
    const s = createLife({ ...base, loop: 1 }, seededRng(3));
    liveOut(s, seededRng(4), (x) => {
      // 사고로 일찍 죽지 않게
      x.extraLives = 9;
      x.injuries = 0;
    });
    expect(s.flags).toContain('heard_masked');
    expect(s.death?.causeId).toBe('doom_moon');
    expect(s.death?.age).toBe(s.doomAge);
    expect(s.log.some((l) => l.text.includes('황토빛'))).toBe(true);
  });

  it('4회차부터 진실 루트: 진리자의 말을 들으면 백룡을 쓰러뜨린다 (해피엔딩)', () => {
    const s = createLife({ ...base, loop: 3, hints: 3 }, seededRng(5));
    expect(s.flags).toContain('truth_open');
    s.flags.push('tr_lib', 'tr_truth');
    liveOut(s, seededRng(6), (x) => {
      x.extraLives = 9;
      x.injuries = 0;
    });
    expect(s.death?.causeId).toBe('happy_end');
  });

  it('노래를 다 듣지 못했으면 진실 루트는 열리지 않는다', () => {
    const s = createLife({ ...base, loop: 3, hints: 2 }, seededRng(7));
    expect(s.flags).not.toContain('truth_open');
  });
});
