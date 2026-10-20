import type { Focus, MoodKey, RelKey, StatKey } from '../types';

export const STAT_KEYS: StatKey[] = ['atk', 'def', 'mana', 'vit', 'int', 'cha', 'fame', 'luck'];
/** 등급 판정을 받는 능력치 (화면에 보이는 5개) */
export const GRADED: StatKey[] = ['atk', 'def', 'mana', 'vit', 'int'];

export const STAT_NAMES: Record<StatKey, string> = {
  atk: '공격력', def: '방어력', mana: '마력', vit: '체력', int: '지능', cha: '매력', fame: '명성', luck: '행운',
};

/** 능력치를 누르면 보여 주는 설명: 어디에 쓰이는가 */
export const STAT_INFO: Record<StatKey, string[]> = {
  atk: [
    '근접 공격의 위력 (공격력 140 이면 ×1.0)',
    '전투력의 기둥 · 기사·용사가 되려면 D 이상',
  ],
  def: [
    '받는 피해를 일정 수치 줄인다 (방어력 ÷ 10)',
    '전투력에 반영',
  ],
  mana: [
    '마법 위력 (같은 수치의 공격보다 30% 세다) · 마나 = 30 + 마력÷2',
    '최대 체력은 올려 주지 않는다 · 궁정 마법사·성직자가 되려면 D 이상',
  ],
  vit: [
    '최대 체력 = 60 + 체력×2 + 방어구',
    '0이 되면 중상. 40세부터 조금씩 줄어든다',
  ],
  int: [
    '치명타 확률과 피해량 계수, 마법 배율',
    '궁정 문관·상인이 되려면 D 이상',
  ],
  cha: ['(숨은 능력치) 매력 50부터 10마다 상점 할인 3% (최대 45%), 판매 보너스'],
  fame: ['(숨은 능력치) 환생석 정산과 명예 사건의 조건'],
  luck: ['(숨은 능력치) 판정 성공률 보너스, 도주·회피'],
};

export const FOCUS_NAMES: Record<Focus, string> = {
  train: '수련', study: '학업', social: '교류', explore: '탐험', rest: '휴식',
};

export const FOCUS_DESC: Record<Focus, string> = {
  train: '공격력·체력·방어력 성장',
  study: '지능·마력 성장',
  social: '매력·명성 성장',
  explore: '행운 성장, 무작위 보상. 위험한 사건이 잦아진다',
  rest: '스트레스 크게 감소, 의지력 회복',
};

export const MOOD_NAMES: Record<MoodKey, string> = {
  calm: '평온', joy: '기쁨', gloom: '우울', anger: '분노', fear: '불안',
};

/** 기분이 어떤 성장에 유리한지 (UI 안내) */
export const MOOD_HINT: Record<MoodKey, string> = {
  calm: '특별한 보정 없음',
  joy: '교류 ×1.5 · 탐험 ×1.2 · 스트레스 덜 쌓임',
  gloom: '학업 ×1.3 · 교류 ×0.6',
  anger: '수련 ×1.5 · 학업 ×0.7',
  fear: '학업 ×1.2 · 탐험 ×0.6 · 수련 ×0.8',
};

export const REL_NAMES: Record<RelKey, string> = {
  friend: '소꿉친구', rival: '숙적', mentor: '스승', spouse: '반려',
};

export function affectionWord(key: RelKey, v: number): string {
  if (key === 'friend' && v >= 90) return '집착';
  if (v >= 75) return key === 'rival' ? '전우' : '애정';
  if (v >= 50) return key === 'rival' ? '인정' : '신뢰';
  if (v >= 25) return key === 'rival' ? '경쟁' : '호의';
  return key === 'rival' ? '적의' : '냉담';
}
