import type { YearNote } from './types';

/** 51세~: 몸의 변화, 은퇴, 손주, 회고 … (생존자가 적으니 적게) */
export const ELDER_NOTES: YearNote[] = [
  { id: 'n5_knees', minAge: 52, maxAge: 58, once: true, text: '비가 오기 전날이면 무릎이 시려 오기 시작했다. 이제 날씨를 무릎으로 맞힌다.', effect: { stats: { vit: -1 } } },
  { id: 'n5_reading_glasses', minAge: 50, maxAge: 60, once: true, text: '책을 팔 길이만큼 멀리 들어야 글자가 보인다. 결국 돋보기를 샀다.' },
  // ───── 51~65세: 몸의 변화, 은퇴 ─────
  { id: 'n5_waist', minAge: 51, maxAge: 70, text: '허리를 펴는 데 시간이 걸린다. 일어설 때마다 나도 모르게 「으쌰」 소리가 나왔다.', tone: 'bad', effect: { stats: { vit: -1 } } },
  { id: 'n5_gray_all', minAge: 51, maxAge: 65, text: '머리가 거의 은빛이 되었다. 마을 아이들이 "산신령 같다"고 해서 웃고 말았다.' },
  { id: 'n5_retire', minAge: 55, maxAge: 68, once: true, text: '오랜 일에서 물러났다. 마지막 날 동료들이 건넨 꽃다발이 현관에 오래 걸려 있었다.', tone: 'good', effect: { mood: 'calm' } },
  { id: 'n5_early_wake', minAge: 55, maxAge: 85, text: '해보다 먼저 눈이 떠진다. 새벽 안개 속에서 차를 끓이는 시간이 하루 중 제일 좋다.', effect: { mood: 'calm' } },
  { id: 'n5_garden_retire', minAge: 55, maxAge: 85, text: '마당 한쪽에 약초밭을 일궜다. 흙을 만지는 일이 이렇게 마음을 편하게 하는 줄 몰랐다.', effect: { stress: -5 } },
  { id: 'n5_old_adventure_tale', minAge: 55, maxAge: 90, text: '마을 아이들에게 젊은 시절의 모험담을 들려주었다. 이야기는 해마다 조금씩 더 대단해진다.', effect: { stats: { cha: 1 } } },
  { id: 'n5_grandchild_born', minAge: 55, maxAge: 80, once: true, cond: { flags: ['has_child'] }, text: '손주가 태어났다. 조그만 손가락이 내 손가락을 꼭 쥐었을 때 세월이 한꺼번에 쏟아졌다.', tone: 'good' },
  { id: 'n5_grandchild_play', minAge: 58, maxAge: 85, cond: { flags: ['has_child'] }, text: '손주와 마당에서 숨바꼭질을 했다. 무릎은 아팠지만 웃음소리가 약보다 나았다.', tone: 'good', effect: { mood: 'joy' } },
  { id: 'n5_grandchild_story', minAge: 58, maxAge: 90, cond: { flags: ['has_child'] }, text: '손주가 잠들 때까지 옛날이야기를 들려주었다. 이야기 속 용은 늘 마지막에 고개를 끄덕인다.', effect: { mood: 'calm' } },

  // ───── 65~85세: 회고, 오랜 인연 ─────
  { id: 'n5_old_friend_visit', minAge: 60, maxAge: 100, cond: { hasRel: ['friend'] }, text: '{friend:이} 오랜만에 찾아왔다. 차 한 주전자로 해가 질 때까지 옛이야기를 나눴다.', tone: 'good', effect: { mood: 'joy' } },
  { id: 'n5_old_rival_toast', minAge: 60, maxAge: 100, cond: { hasRel: ['rival'] }, text: '{rival:과} 마주 앉아 술을 나눴다. 누가 이겼는지는 이제 아무래도 좋았다.' },
  { id: 'n5_spouse_bench', minAge: 60, maxAge: 100, cond: { hasRel: ['spouse'] }, text: '{spouse:와} 마루에 나란히 앉아 해 지는 걸 보았다. 말은 없어도 충분했다.', tone: 'good', effect: { mood: 'calm' } },
  { id: 'n5_hearing', minAge: 62, maxAge: 100, text: '잘 안 들리는 귀를 탓하다 문득 조용한 하루가 오히려 괜찮다는 걸 알았다.' },
  { id: 'n5_cane', minAge: 65, maxAge: 100, once: true, text: '단단한 지팡이를 새로 깎았다. 모험가 시절의 검보다 이게 더 든든하다.' },
  { id: 'n5_old_sword_wall', minAge: 60, maxAge: 100, text: '벽에 걸린 낡은 검에 먼지가 앉았다. 닦다가 한참 손을 멈췄다.' },
  { id: 'n5_sunny_porch', minAge: 60, maxAge: 100, text: '볕 좋은 마루에서 졸다 깨었다. 꿈속에서 어린 시절의 마을이 그대로 있었다.', effect: { mood: 'calm' } },
  { id: 'n5_funeral_old', minAge: 65, maxAge: 100, text: '오랜 지인의 장례에 다녀왔다. 돌아오는 길에는 말없이 구름만 보았다.', effect: { mood: 'gloom' } },
  { id: 'n5_cough_winter', minAge: 62, maxAge: 100, text: '겨울이 깊어지자 기침이 길어졌다. 따뜻한 생강차를 끓여 마시며 봄을 기다렸다.', tone: 'bad', effect: { stats: { vit: -1 } } },
  { id: 'n5_young_visitors', minAge: 60, maxAge: 100, text: '젊은 모험가들이 길을 물어 왔다. 알려 준 지름길보다 웃으며 손 흔들어 준 일이 더 오래 남았다.' },
  { id: 'n5_tea_ritual', minAge: 60, maxAge: 100, text: '매일 같은 시간에 같은 잔으로 차를 마신다. 그 반복이 이제는 가장 좋은 의식이다.', effect: { mood: 'calm' } },
  { id: 'n5_birthday_old', minAge: 65, maxAge: 100, text: '생일상에 가족이 둘러앉았다. 촛불을 한 번에 끄지 못하자 모두가 웃으며 같이 불어 주었다.', tone: 'good' },
  { id: 'n5_look_back', minAge: 65, maxAge: 100, text: '낡은 상자 속에서 어린 시절의 구슬과 첫 길드 등록증이 나왔다. 오래 만지작거렸다.', effect: { mood: 'calm' } },
  { id: 'n5_stars_night', minAge: 62, maxAge: 100, text: '잠이 오지 않는 밤, 마당에 나가 별을 올려다보았다. 이제는 별자리 이름을 전부 잊었지만 참 곱다.' },
  { id: 'n5_new_start_old', minAge: 70, maxAge: 100, text: '이 나이에도 새로 배우는 게 있다는 사실이 신기했다. 이웃 아이에게서 글자 놀이를 배웠다.' },
  { id: 'n5_spring_blossom', minAge: 55, maxAge: 100, text: '올봄에도 마당의 벚나무가 꽃을 피웠다. 한 해를 더 맞이했다는 사실이 새삼 고마웠다.', tone: 'good', effect: { mood: 'calm' } },
];
