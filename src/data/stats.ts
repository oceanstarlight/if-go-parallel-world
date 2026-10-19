import type { Focus, MoodKey, RelKey, StatKey } from '../types';

export const STAT_KEYS: StatKey[] = ['vit', 'mana', 'int', 'cha', 'fame', 'luck'];

export const STAT_NAMES: Record<StatKey, string> = {
  vit: '체력', mana: '마력', int: '지성', cha: '매력', fame: '명성', luck: '행운',
};

export const FOCUS_NAMES: Record<Focus, string> = {
  train: '수련', study: '학업', social: '교류', explore: '탐험', rest: '휴식',
};

export const FOCUS_DESC: Record<Focus, string> = {
  train: '체력·마력 성장',
  study: '지성·마력 성장',
  social: '매력·명성 성장',
  explore: '행운 성장, 무작위 보상. 위험한 사건이 잦아진다',
  rest: '성장 없음. 스트레스 크게 감소, 의지력 회복',
};

export const MOOD_NAMES: Record<MoodKey, string> = {
  calm: '평온', joy: '기쁨', gloom: '우울', anger: '분노', fear: '불안',
};

export const MOOD_ICON: Record<MoodKey, string> = {
  calm: '😌', joy: '😊', gloom: '😢', anger: '😠', fear: '😰',
};

/** 기분이 어떤 방침에 유리한지 (UI 안내) */
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
