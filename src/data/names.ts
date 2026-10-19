export type Gender = 'm' | 'f';

export const MALE_NAMES = [
  '레온', '카일', '루시안', '테오', '시온', '노아', '로웬', '유리엔', '에단', '하르트',
  '오스카', '베르크', '가브리엘', '케인', '레이븐', '알베르트', '펠릭스', '다리우스', '리오', '아델',
];

export const FEMALE_NAMES = [
  '아리엘', '세라', '엘리스', '이리스', '라엘', '엘린', '페이', '카린', '리아', '미렐',
  '셀레네', '니나', '로젤', '이졸데', '마리안', '소피아', '루나', '클로에', '에스텔', '비비안',
];

/** 예전 코드 호환: 모든 이름 */
export const PLAYER_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];
export const NPC_NAMES = PLAYER_NAMES;

export const namesOf = (g: Gender) => (g === 'f' ? FEMALE_NAMES : MALE_NAMES);

/** 이름으로 성별을 짐작한다 (성별이 없던 예전 저장 데이터용) */
export const genderOfName = (name: string): Gender => (FEMALE_NAMES.includes(name) ? 'f' : 'm');

export const opposite = (g: Gender): Gender => (g === 'f' ? 'm' : 'f');

export const pick = <T>(arr: readonly T[], rng: () => number): T =>
  arr[Math.floor(rng() * arr.length)];
