export const PLAYER_NAMES = [
  '레온', '아리엘', '카일', '세라', '루시안', '엘리스', '테오', '이리스',
  '라엘', '시온', '노아', '엘린', '페이', '로웬', '카린', '유리엔',
];

export const NPC_NAMES = [
  '리아', '에단', '미렐', '하르트', '셀레네', '오스카', '니나', '베르크',
  '로젤', '가브리엘', '이졸데', '케인', '마리안', '레이븐', '소피아', '알베르트',
];

export const pick = <T>(arr: readonly T[], rng: () => number): T =>
  arr[Math.floor(rng() * arr.length)];
