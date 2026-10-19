import type { Choice, LifeState } from '../types';
import type { EnemyKind } from '../gfx/sprites';
import { jobById } from '../data/jobs';

/** 전투 연출이 붙는 사건과 그 적. 이 사건의 체력·마력 판정은 전투력 승부가 된다 */
export const BATTLE_ENEMY: Record<string, EnemyKind> = {
  c_bully: 'bully', m_rival10: 'bully', y_academy_rival: 'rival', a_rival_duel: 'rival',
  a_rival_deathmatch: 'rival', a_bandits: 'bandit', a_dungeon: 'shadow', a_dragon: 'dragon',
  a_monster_hunt: 'wolf', e_knight_war: 'soldier', a_war: 'soldier', e_adv_quest: 'wyvern',
  e_adv_betrayal: 'traitor', a_yandere: 'stalker', e_demon_lord_hero: 'hero', e_hero_final: 'demon_lord',
  hp_first_quest: 'shadow', hp_dungeon_raid: 'shadow', hp_final_march: 'demon_lord', hp_hunted: 'hero',
  fugitive_bounty: 'bandit', avenger_duel: 'hero',
};

/** 적 이름 (생애 기록용) */
export const ENEMY_NAME: Record<string, string> = {
  bully: '골목대장', rival: '라이벌', bandit: '산적', shadow: '그림자 마물', dragon: '드래곤', wolf: '마수',
  soldier: '적국 병사', wyvern: '와이번', traitor: '배신자', stalker: '스토커', hero: '용사', demon_lord: '마왕',
};

/** 이 선택지가 전투인가 (전투 사건의 체력·마력 판정) */
export function isCombat(eventId: string | null | undefined, c: Choice): boolean {
  const stat = c.check?.stat;
  return !!eventId && !!BATTLE_ENEMY[eventId] && (stat === 'vit' || stat === 'mana');
}

/** 내 전투력: 능력치 + 장비 + 직업 */
export function combatPower(s: LifeState): number {
  const { vit, mana, int, luck } = s.stats;
  const gear = (s.equip?.weapon?.power ?? 0) + (s.equip?.armor?.power ?? 0);
  const job = (jobById(s.jobId)?.combat ?? 0) * s.jobRank;
  return Math.round(vit + mana + 0.5 * Math.max(vit, mana) + 0.25 * (int + luck) + gear + job);
}

/** 사건 전투의 적 전투력 (판정 난이도에서) */
export const enemyPowerOfDc = (dc: number) => Math.round(20 + dc * 2.2);

/** 던전 계층의 적 전투력 */
export function floorPower(floor: number, boss = false): number {
  const base = 30 + floor * 4;
  return Math.round(base * (boss ? (floor >= 100 ? 1.4 : 1.3) : 1));
}

/** 승률 (%): 전투력이 같으면 50%. 30% 강하면 적 전투력 100일 때 약 77%, 300일 때 약 84% */
export function winChance(cp: number, ep: number): number {
  const p = 1 / (1 + Math.exp(-(cp - ep) / (0.15 * ep + 10)));
  return Math.max(3, Math.min(97, Math.round(p * 100)));
}

/** 전투 선택지의 전투력·승률 (UI 표시와 판정에 같은 값을 쓴다) */
export function battleOdds(s: LifeState, c: Choice): { cp: number; ep: number; p: number } {
  const cp = combatPower(s);
  const ep = enemyPowerOfDc(c.check?.dc ?? 30);
  return { cp, ep, p: winChance(cp, ep) };
}
