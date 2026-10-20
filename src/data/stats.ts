import type { Focus, MoodKey, RelKey, StatKey } from '../types';

export const STAT_KEYS: StatKey[] = ['vit', 'mana', 'int', 'cha', 'fame', 'luck'];

export const STAT_NAMES: Record<StatKey, string> = {
  vit: '체력', mana: '마력', int: '지성', cha: '매력', fame: '명성', luck: '행운',
};

/** 능력치를 누르면 보여 주는 설명: 어디에 쓰이는가 */
export const STAT_INFO: Record<StatKey, string[]> = {
  vit: [
    '전투력의 기둥 (체력·마력 중 높은 쪽 추가)',
    '최대 체력 = 60 + 체력×2 + 방어구 (마력으로는 오르지 않는다)',
    '턴제 전투의 공격 위력 (체력 100 이면 ×1.0)',
    '체력 판정 사건 (싸움·노동·사고)',
    '0이 되면 중상. 낮을수록 병과 노환에 약하고, 40세부터 조금씩 줄어든다',
  ],
  mana: [
    '전투력의 기둥 (체력·마력 중 높은 쪽 추가)',
    '턴제 전투의 마법 위력: 같은 수치의 체력 공격보다 30% 세다. 마나 = 30 + 마력÷2',
    '최대 체력은 올려 주지 않는다',
    '마력 판정 사건 (마력 각성·마탑·금단의 연구)',
  ],
  int: [
    '턴제 전투의 치명타 확률과 마법 배율',
    '지성 판정 사건 (시험·연구·궁정 암투·투자)',
    '학자·궁정 문관·상인 루트의 승진',
  ],
  cha: [
    '매력 50부터 10마다 상점 할인 3% (최대 45%), 팔 때도 같은 비율로 더 받는다',
    '매력 판정 사건 (사교·연애·설득·무도회)',
    '인연(친구·연인) 사건이 잘 풀린다',
  ],
  fame: [
    '환생석 정산: 명성 8당 환생석 1개',
    '귀족·용사·성직 루트와 명예 사건의 조건',
  ],
  luck: [
    '모든 판정의 성공률 보너스 (행운 40 기준 ±)',
    '턴제 전투의 도주·회피 확률',
    '던전 함정 회피',
  ],
};

export const FOCUS_NAMES: Record<Focus, string> = {
  train: '수련', study: '학업', social: '교류', explore: '탐험', rest: '휴식',
};

export const FOCUS_DESC: Record<Focus, string> = {
  train: '체력(최대 체력) 성장',
  study: '지성·마력 성장',
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
