import type { YearNote } from './types';

/** 51세~: 몸의 변화, 은퇴, 손주, 회고 … (생존자가 적으니 적게) */
export const ELDER_NOTES: YearNote[] = [
  { id: 'n5_knees', minAge: 52, maxAge: 58, once: true, text: '비가 오기 전날이면 무릎이 시려 오기 시작했다. 이제 날씨를 무릎으로 맞힌다.', effect: { stats: { vit: -1 } } },
  { id: 'n5_reading_glasses', minAge: 50, maxAge: 60, once: true, text: '책을 팔 길이만큼 멀리 들어야 글자가 보인다. 결국 돋보기를 샀다.' },
];
