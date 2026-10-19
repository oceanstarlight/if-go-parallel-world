import { describe, expect, it } from 'vitest';
import { drawPortrait, type Stage } from '../src/gfx/portrait';
import { ALL_SCENES, SCENE_H, SCENE_W, drawScene } from '../src/gfx/scenes';
import { enemySprite, playerSprite, type EnemyKind } from '../src/gfx/sprites';
import { battleFor, sceneFor } from '../src/gfx/mapping';
import { ALL_EVENTS } from '../src/data/events';
import { HOUSES } from '../src/data/houses';
import { JOBS } from '../src/data/jobs';
import { createLife } from '../src/engine/life';

const filled = (data: (string | null)[]) => data.filter(Boolean).length / data.length;

describe('도트 그래픽', () => {
  it('모든 장면이 화면을 채운다', () => {
    for (const k of ALL_SCENES) {
      const { p, groundY } = drawScene(k, 5);
      expect([p.w, p.h]).toEqual([SCENE_W, SCENE_H]);
      expect(filled(p.data), k).toBeGreaterThan(0.99);
      expect(groundY).toBeLessThan(SCENE_H);
    }
  });

  it('모든 가문 × 나이 × 직업 초상화를 그린다', () => {
    const stages: Stage[] = ['baby', 'child', 'teen', 'adult', 'elder'];
    for (const h of HOUSES) for (const st of stages) for (const j of [null, ...JOBS.map((x) => x.id)]) {
      for (const dead of [false, true]) {
        const p = drawPortrait({ seed: 42, stage: st, houseId: h.id, jobId: j, jobRank: 5, dead });
        expect(filled(p.data)).toBe(1);
        expect(p.data.every((c) => c === null || /^#[0-9a-f]{6}$/.test(c))).toBe(true);
      }
    }
  });

  it('전투 스프라이트를 그린다', () => {
    const kinds: EnemyKind[] = ['bandit', 'soldier', 'rival', 'bully', 'stalker', 'hero', 'demon_lord', 'traitor', 'wolf', 'shadow', 'dragon', 'wyvern'];
    for (const k of kinds) expect(filled(enemySprite(k).data), k).toBeGreaterThan(0.05);
    expect(filled(playerSprite({ seed: 1, stage: 'adult', houseId: 'hero', jobId: 'hero', jobRank: 3, dead: false }, false).data)).toBeGreaterThan(0.05);
  });

  it('사건 매핑: 전투는 체력·마력 판정에만 붙는다', () => {
    for (const ev of ALL_EVENTS) {
      for (const c of ev.choices ?? []) {
        const b = battleFor(ev.id, c);
        if (b) expect(['vit', 'mana']).toContain(c.check?.stat);
      }
    }
    const s = createLife({ name: '테스트', houseId: 'farm', cheatId: 'growth', upgrades: {} });
    for (const ev of ALL_EVENTS) {
      s.pendingEventId = ev.id;
      expect(ALL_SCENES).toContain(sceneFor(s));
    }
  });
});
