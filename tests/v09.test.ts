import { describe, expect, it } from 'vitest';
import { applyEffect, createLife, genderOf } from '../src/engine/life';
import { seededRng } from '../src/engine/sim';
import { fill } from '../src/engine/text';
import { FEMALE_NAMES, MALE_NAMES, genderOfName } from '../src/data/names';
import { hairStyleOf } from '../src/gfx/dotportrait';
import { drawPortrait } from '../src/gfx/portrait';

const base = { houseId: 'merchant', cheatId: 'growth', upgrades: {}, traits: [] as string[] };

describe('v0.9 성별', () => {
  it('이름 목록은 성별끼리 겹치지 않고, 이름으로 성별을 안다', () => {
    expect(MALE_NAMES.some((n) => FEMALE_NAMES.includes(n))).toBe(false);
    expect(genderOfName('세라')).toBe('f');
    expect(genderOfName('레온')).toBe('m');
  });

  it('연인·친구는 이성, 라이벌은 동성, 이름도 그 성별 목록에서 짓는다', () => {
    for (const [name, g] of [['세라', 'f'], ['레온', 'm']] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = createLife({ ...base, name, gender: g }, seededRng(seed));
        expect(genderOf(s)).toBe(g);
        for (const k of ['spouse', 'friend', 'rival'] as const) applyEffect(s, { addRel: k }, seededRng(seed));
        const other = g === 'f' ? 'm' : 'f';
        expect(s.rels.spouse?.gender).toBe(other);
        expect(s.rels.friend?.gender).toBe(other);
        expect(s.rels.rival?.gender).toBe(g);
        for (const k of ['spouse', 'friend', 'rival'] as const) {
          const r = s.rels[k]!;
          expect(r.name).not.toBe(s.name);
          expect(genderOfName(r.name)).toBe(r.gender);
        }
      }
    }
  });

  it('호칭은 주인공 성별을 따른다', () => {
    const f = createLife({ ...base, name: '세라', gender: 'f' }, seededRng(1));
    const m = createLife({ ...base, name: '레온', gender: 'm' }, seededRng(1));
    expect(fill('{royal}의 부탁, {sir}', f)).toBe('왕자의 부탁, 누님');
    expect(fill('{royal}의 부탁, {sir}', m)).toBe('공주의 부탁, 형님');
    expect(fill('{inlaw:이} 되었다', m)).toBe('사위가 되었다');
    expect(fill('{inlaw:이} 되었다', f)).toBe('며느리가 되었다');
  });
});

describe('v0.9 도트 지도 초상화', () => {
  it('앞머리·뒷머리 조합이 성별마다 여러 가지다', () => {
    const rnd = seededRng(7);
    for (const g of ['m', 'f'] as const) {
      const bangs = new Set<string>(), backs = new Set<string>();
      for (let i = 0; i < 200; i++) {
        const h = hairStyleOf(g, 'adult', rnd);
        bangs.add(h.bangs);
        backs.add(h.back);
      }
      expect(bangs.size).toBeGreaterThanOrEqual(5);
      expect(backs.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('성별이 다르면 초상화가 달라진다', () => {
    const spec = { seed: 3, stage: 'adult' as const, houseId: 'farm', jobId: null, jobRank: 0, dead: false };
    const a = drawPortrait({ ...spec, gender: 'f' }).data.join();
    const b = drawPortrait({ ...spec, gender: 'm' }).data.join();
    expect(a).not.toBe(b);
  });

});
