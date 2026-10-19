import type { Focus, RelKey, StatKey } from '../types';

export const STAT_KEYS: StatKey[] = ['vit', 'mana', 'int', 'cha', 'fame', 'luck'];

export const STAT_NAMES: Record<StatKey, string> = {
  vit: '체력', mana: '마력', int: '지성', cha: '매력', fame: '명성', luck: '행운',
};

export const FOCUS_NAMES: Record<Focus, string> = {
  train: '수련', study: '학업', social: '교류', explore: '탐험',
};

export const FOCUS_DESC: Record<Focus, string> = {
  train: '체력·마력 성장',
  study: '지성·마력 성장',
  social: '매력·명성 성장',
  explore: '행운 성장, 무작위 보상. 위험한 사건이 잦아진다',
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
