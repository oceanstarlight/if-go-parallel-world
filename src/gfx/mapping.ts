import type { Choice, LifeState } from '../types';
import { DEFAULT_TIME, type ParticleKind, type SceneKind, type TimeOfDay } from './scenes';
import type { EnemyKind } from './sprites';

/** 사건 → 장면. 'home' 은 가문의 고향 장면으로 바뀐다 */
const EVENT_SCENE: Record<string, SceneKind | 'home'> = {
  m_awaken3: 'room', m_friend5: 'home', m_rite7: 'temple', m_rite7_demon: 'demon_castle', m_rival10: 'home',
  c_fever: 'room', c_lullaby: 'room', c_friend_play: 'home', c_forest: 'forest', c_attic: 'room',
  c_carriage: 'road', c_bully: 'village', c_noble_lesson: 'castle', c_prodigy_visit: 'home', c_market: 'port',
  c_demon_child: 'demon_castle', c_famine: 'snow', c_plague: 'graveyard',
  m_academy15: 'academy', y_academy_life: 'library', y_academy_rival: 'academy', m_hero16: 'temple',
  y_hero_retry: 'temple', m_demon16: 'demon_castle',
  a_friend_confess: 'home', a_yandere: 'graveyard', a_marriage: 'temple', a_child: 'room',
  a_spouse_death: 'graveyard', a_mentor_death: 'library', a_rival_duel: 'road', a_rival_deathmatch: 'battlefield',
  a_rival_reconcile: 'tavern', a_dungeon: 'dungeon', a_bandits: 'road', a_gamble: 'tavern', a_dragon: 'burning',
  a_war: 'battlefield', a_illness: 'room', a_dark_pact: 'graveyard', a_pact_due: 'graveyard',
  a_forbidden: 'library', a_inquisition: 'temple', a_demon_exposed: 'village', a_hero_party_invite: 'tavern',
  a_hero_framed: 'castle', a_noble_poison: 'throne', a_noble_succession: 'throne', a_tavern: 'tavern',
  a_ball: 'castle', a_research: 'library', a_monster_hunt: 'forest', a_charity: 'village',
  a_temple_blessing: 'temple', a_reflection: 'home',
  m_career18: 'road', e_knight_war: 'battlefield', e_merchant_deal: 'port', e_adv_betrayal: 'forest',
  e_adv_quest: 'road', e_priest_heretic: 'temple', e_priest_plague: 'graveyard', e_farmer_harvest: 'village',
  e_demon_raid: 'burning', e_demon_lord_hero: 'throne', e_hero_final: 'throne',
};

const HOME: Record<string, SceneKind> = {
  farm: 'village', merchant: 'port', noble: 'castle', demon: 'demon_castle', hero: 'village',
};

const JOB_SCENE: Record<string, SceneKind> = {
  farmer: 'village', knight: 'castle', mage: 'academy', merchant: 'port', adventurer: 'road',
  priest: 'temple', demon_officer: 'demon_castle', hero: 'castle',
};

export function sceneFor(s: LifeState): SceneKind {
  const evId = s.pendingEventId ?? s.lastEventId;
  if (evId === 'e_promotion' && s.jobId) return JOB_SCENE[s.jobId] ?? 'village';
  const mapped = evId ? EVENT_SCENE[evId] : undefined;
  if (mapped) return mapped === 'home' ? HOME[s.houseId] ?? 'village' : mapped;
  if (s.age < 3) return 'room';
  if (s.jobId && s.age >= 18) {
    if (s.focus === 'explore') return 'forest';
    if (s.focus === 'social') return 'tavern';
    return JOB_SCENE[s.jobId] ?? 'village';
  }
  switch (s.focus) {
    case 'study': return s.flags.includes('academy') ? 'library' : 'room';
    case 'explore': return s.age < 15 ? 'forest' : 'road';
    case 'social': return s.age >= 16 ? 'tavern' : HOME[s.houseId] ?? 'village';
    default: return HOME[s.houseId] ?? 'village';
  }
}

/** 전투 연출이 붙는 사건과 그 적 */
const BATTLE_ENEMY: Record<string, EnemyKind> = {
  c_bully: 'bully', m_rival10: 'bully', y_academy_rival: 'rival', a_rival_duel: 'rival',
  a_rival_deathmatch: 'rival', a_bandits: 'bandit', a_dungeon: 'shadow', a_dragon: 'dragon',
  a_monster_hunt: 'wolf', e_knight_war: 'soldier', a_war: 'soldier', e_adv_quest: 'wyvern',
  e_adv_betrayal: 'traitor', a_yandere: 'stalker', e_demon_lord_hero: 'hero', e_hero_final: 'demon_lord',
};

/** 이 선택이 전투인가: 전투 사건 + 체력/마력 판정 */
export function battleFor(eventId: string, choice: Choice): { enemy: EnemyKind; magic: boolean } | null {
  const enemy = BATTLE_ENEMY[eventId];
  const stat = choice.check?.stat;
  if (!enemy || (stat !== 'vit' && stat !== 'mana')) return null;
  return { enemy, magic: stat === 'mana' };
}

/** 사인별 묘지 연출 */
export function graveWeather(causeId: string): ParticleKind {
  switch (causeId) {
    case 'heresy': case 'dragon': case 'pact': case 'demon_lord_slain':
      return 'embers';
    case 'mana_overload': case 'experiment': case 'hero_sacrifice': case 'old_age':
      return 'sparkles';
    case 'famine': case 'plague': case 'illness':
      return 'snow';
    case 'war': case 'demon_purge': case 'assassination':
      return 'leaves';
    case 'yandere': case 'betrayal_party': case 'hero_framed': case 'duel': case 'carriage': case 'bandits': case 'dungeon':
      return 'rain';
    default:
      return 'fireflies';
  }
}

/** 데미지 숫자 크기를 정하는 적 최대 HP */
export const ENEMY_HP: Record<EnemyKind, number> = {
  bully: 30, bandit: 120, soldier: 150, rival: 160, stalker: 140, traitor: 130, wolf: 110,
  shadow: 260, wyvern: 380, hero: 720, demon_lord: 880, dragon: 999,
};

/** 밤에 일어나는 사건 */
const NIGHT_EVENTS = new Set(['m_awaken3', 'c_fever', 'a_yandere', 'a_dark_pact', 'a_pact_due', 'a_illness', 'e_adv_betrayal', 'a_inquisition']);
/** 노을 무렵의 사건 */
const DUSK_EVENTS = new Set(['a_spouse_death', 'a_mentor_death', 'a_reflection', 'a_friend_confess', 'a_rival_reconcile', 'e_hero_final', 'e_demon_lord_hero']);

/** 시간대: 사건 > 나이(노년은 노을) > 장면 기본값 */
export function timeFor(s: LifeState, kind: SceneKind): TimeOfDay {
  const evId = s.pendingEventId ?? s.lastEventId;
  if (evId && NIGHT_EVENTS.has(evId)) return 'night';
  if (evId && DUSK_EVENTS.has(evId)) return 'dusk';
  const base = DEFAULT_TIME[kind];
  if (base === 'day' && s.age >= 55) return 'dusk';
  return base;
}
