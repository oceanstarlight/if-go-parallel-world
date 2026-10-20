import type { LifeState } from '../types';
import { combatPower } from './combat';
import { statOf } from './trinket';
import { maxHp } from './economy';
import type { Rng } from './life';

/**
 * 턴제 미니 전투 (사건 전투 · 던전 보스).
 * 피해량은 전투력 비율로 정해서, 전투력이 같으면 6~7합 안팎에서 끝난다.
 *  - 공격: 기본 피해. 행운만큼 치명타
 *  - 마법: 마나를 써서 마력만큼 강한 피해, 빗나가지 않는다
 *  - 방어: 이번 턴 피해를 크게 줄이고, 다음 공격이 반격으로 강해진다. 마나 회복
 *  - 도주: 행운 판정. 실패하면 한 대 맞는다
 */
export type DuelAction = 'attack' | 'magic' | 'guard' | 'flee';
export type DuelResult = 'win' | 'lose' | 'fled';

export interface Duel {
  kind: 'event' | 'boss';
  /** 상대 이름 */
  foe: string;
  cp: number;
  ep: number;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  eHp: number;
  eMax: number;
  /** 방어 태세: 다음 공격이 반격으로 강해진다 */
  counter: boolean;
  turn: number;
  log: string[];
  result: DuelResult | null;
}

/** 한 번의 타격 (연출용) */
export interface Blow {
  from: 'p' | 'e';
  dmg: number;
  crit: boolean;
  magic: boolean;
  miss: boolean;
  /** 맞은 쪽의 남은 HP 비율 */
  hpTo: number;
  /** 방어 자세만 잡았다 (피해 없음) */
  guard?: boolean;
}

export const MAGIC_COST = 15;
/**
 * 한 대에 깎는 HP 비율 (전투력이 같을 때) · 전투력 차이가 피해에 미치는 정도.
 * 공격만 누르면 전투력이 같을 때 승률 40~45%, 1.5배면 약 90% (기존 승률 모델과 비슷하게, 방어·마법을 잘 쓰면 더 높다)
 */
const P_HIT = 0.22, E_HIT = 0.25, P_EXP = 0.7;
const CRIT_MUL = 1.7;

export const critChance = (s: LifeState) => Math.min(0.45, 0.05 + statOf(s, 'luck') * 0.003);
export const dodgeChance = (s: LifeState) => Math.min(0.25, 0.03 + statOf(s, 'luck') * 0.0015);
export const fleeChance = (s: LifeState) => Math.min(0.9, 0.3 + statOf(s, 'luck') * 0.006);
/** 마법 배율: 마력이 높을수록 강하다 */
export const magicMul = (s: LifeState) => 0.9 + statOf(s, 'mana') / 50;

export function startDuel(s: LifeState, kind: Duel['kind'], foe: string, ep: number): Duel {
  const hpMax = maxHp(s);
  const mpMax = 30 + statOf(s, 'mana');
  return {
    kind, foe, cp: combatPower(s), ep,
    hp: Math.max(1, Math.min(s.hp ?? hpMax, hpMax)), hpMax,
    mp: mpMax, mpMax,
    eHp: Math.round(ep * 2), eMax: Math.round(ep * 2),
    counter: false, turn: 0, log: [`${foe}이(가) 앞을 가로막았다!`], result: null,
  };
}

const spread = (rng: Rng) => 0.6 + rng() * 0.8;

/** 한 턴: 내 행동 → (살아 있으면) 적의 반격. 연출용 타격 목록을 돌려준다 */
export function duelTurn(d: Duel, s: LifeState, action: DuelAction, rng: Rng): Blow[] {
  if (d.result) return [];
  const blows: Blow[] = [];
  const ratio = Math.max(0.2, d.cp / Math.max(1, d.ep));
  const pBase = d.eMax * P_HIT * ratio ** P_EXP;
  const eBase = d.hpMax * E_HIT / ratio ** P_EXP;
  let guarding = false;
  d.turn++;

  if (action === 'magic' && d.mp < MAGIC_COST) action = 'attack';
  if (action === 'attack' || action === 'magic') {
    const magic = action === 'magic';
    if (magic) d.mp -= MAGIC_COST;
    const miss = !magic && rng() < 0.06;
    const crit = !miss && rng() < critChance(s);
    let dmg = miss ? 0 : pBase * spread(rng) * (magic ? magicMul(s) : 1) * (crit ? CRIT_MUL : 1) * (d.counter ? 1.5 : 1);
    dmg = miss ? 0 : Math.max(1, Math.round(dmg));
    d.eHp = Math.max(0, d.eHp - dmg);
    blows.push({ from: 'p', dmg, crit, magic, miss, hpTo: d.eHp / d.eMax });
    d.log.push(miss ? '공격이 빗나갔다!' : `${d.counter ? '반격! ' : ''}${magic ? '마법' : '공격'}${crit ? ' 치명타!' : ''} ${dmg} 피해`);
    d.counter = false;
    if (d.eHp <= 0) {
      d.result = 'win';
      d.log.push(`${d.foe}을(를) 쓰러뜨렸다!`);
      return blows;
    }
  } else if (action === 'guard') {
    guarding = true;
    d.counter = true;
    d.mp = Math.min(d.mpMax, d.mp + 8);
    blows.push({ from: 'p', dmg: 0, crit: false, magic: false, miss: false, hpTo: d.hp / d.hpMax, guard: true });
    d.log.push('방어 태세! 다음 공격이 반격이 된다.');
  } else {
    if (rng() < fleeChance(s)) {
      d.result = 'fled';
      d.log.push('틈을 노려 도망쳤다!');
      return blows;
    }
    d.log.push('도망치지 못했다!');
  }

  // 적의 차례
  const heavy = rng() < 0.2;
  const miss = rng() < dodgeChance(s);
  let dmg = miss ? 0 : eBase * spread(rng) * (heavy ? 1.6 : 1) * (guarding ? 0.35 : 1);
  dmg = miss ? 0 : Math.max(1, Math.round(dmg));
  d.hp = Math.max(0, d.hp - dmg);
  blows.push({ from: 'e', dmg, crit: heavy, magic: false, miss, hpTo: d.hp / d.hpMax });
  d.log.push(miss ? `${d.foe}의 공격을 피했다!` : `${d.foe}의 ${heavy ? '강공격' : '공격'}! ${dmg} 피해${guarding ? ' (방어)' : ''}`);
  d.mp = Math.min(d.mpMax, d.mp + 3);
  if (d.hp <= 0) {
    d.result = 'lose';
    d.log.push('더는 버틸 수 없다…');
  }
  return blows;
}

/** 자동 전투 (테스트·밸런스 확인용): 마나가 있으면 마법, 아니면 공격 */
export function autoDuel(d: Duel, s: LifeState, rng: Rng): DuelResult {
  for (let i = 0; i < 60 && !d.result; i++) duelTurn(d, s, d.mp >= MAGIC_COST && statOf(s, 'mana') > statOf(s, 'vit') ? 'magic' : 'attack', rng);
  return d.result ?? 'lose';
}
