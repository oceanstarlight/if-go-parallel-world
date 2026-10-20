import type { YearNote } from './types';

/** 0~5세: 걸음마, 첫마디, 첫 친구 … */
export const INFANT_NOTES: YearNote[] = [
  { id: 'n0_first_step', minAge: 1, maxAge: 2, once: true, text: '처음으로 두 발로 섰다! 세 걸음 만에 엉덩방아를 찧었지만 집안이 박수로 떠들썩했다.', tone: 'good' },
  { id: 'n0_first_word', minAge: 1, maxAge: 3, once: true, text: '첫마디를 뗐다. 엄마도 아빠도 아닌 「밥」이었다.' },
  { id: 'n0_doljabi', minAge: 1, maxAge: 1, once: true, text: '돌잔치 날, 눈앞에 검·지팡이·책·금화가 놓였다. 작은 손이 망설임 없이 뻗어 갔다.' },

  // ───── 0~1세: 뒤집기, 기기, 이유식 ─────
  { id: 'n0_roll_over', minAge: 0, maxAge: 1, once: true, text: '처음으로 데굴 뒤집었다. 요람 난간에 이마를 쿵 찧었지만 가족은 박수를 쳤다.', tone: 'good' },
  { id: 'n0_sit_up', minAge: 0, maxAge: 1, once: true, text: '혼자 앉는 데 성공했다! 곧바로 뒤로 꽈당 넘어갔지만 방석이 든든히 받쳐 주었다.' },
  { id: 'n0_first_tooth', minAge: 0, maxAge: 1, once: true, text: '잇몸에서 하얀 아랫니가 쏙 올라왔다. 이제 손에 닿는 건 뭐든 깨물어 보고 싶다.' },
  { id: 'n0_crawl', minAge: 0, maxAge: 1, text: '엉금엉금 기어 다니기 시작했다. 목적지는 늘 부엌의 약초 바구니다.' },
  { id: 'n0_baby_food', minAge: 0, maxAge: 1, text: '처음 먹어 본 으깬 감자죽. 반은 입에, 반은 볼과 머리카락에 붙었다.' },
  { id: 'n0_fairy_mobile', minAge: 0, maxAge: 1, text: '요람 위에 달린 요정 모양 모빌을 보며 까르르 웃었다. 바람이 불 때마다 날개가 반짝였다.', effect: { mood: 'joy' } },
  { id: 'n0_night_cry', minAge: 0, maxAge: 1, text: '한밤중에 울음이 터져 온 집이 불을 켰다. 어머니가 자장가를 부르며 마당을 몇 바퀴나 돌았다.' },
  { id: 'n0_name_blessing', minAge: 0, maxAge: 1, once: true, text: '신전에서 이름 축복을 받았다. 이마에 성수가 떨어져도 울지 않아 사제가 감탄했다.', tone: 'good' },
  { id: 'n0_finger_glow', minAge: 0, maxAge: 1, text: '자기 손가락을 한참 들여다보았다. 순간 끝이 반짝인 것 같았지만 아마 햇빛이었을 것이다.' },

  // ───── 1~2세: 걸음마, 돌, 첫 탐험 ─────
  { id: 'n0_pull_stand', minAge: 1, maxAge: 2, text: '의자를 붙잡고 벌떡 일어섰다. 손을 놓았더니 엉덩이가 먼저 바닥에 인사했다.' },
  { id: 'n0_many_falls', minAge: 1, maxAge: 2, text: '걷다 넘어지기를 하루에 열 번. 무릎에 푸른 멍이 훈장처럼 생겼다.', tone: 'bad' },
  { id: 'n0_wave_hello', minAge: 1, maxAge: 2, text: '손을 흔들어 인사하는 법을 배웠다. 지나가던 모험가가 웃으며 마주 손을 흔들어 주었다.', tone: 'good' },
  { id: 'n0_peekaboo', minAge: 1, maxAge: 2, text: '까꿍 놀이에 푹 빠졌다. 이불 속에서 나올 때마다 배를 잡고 웃었다.', effect: { mood: 'joy' } },
  { id: 'n0_poker_sword', minAge: 1, maxAge: 3, text: '부지깽이를 검처럼 휘두르다 낡은 항아리를 깨뜨렸다. 아버지는 "소질이 있군"이라며 웃었다.' },
  { id: 'n0_spoon', minAge: 1, maxAge: 2, text: '혼자 숟가락질에 도전했다. 국은 절반이 앞치마로, 나머지는 바닥으로 갔다.' },
  { id: 'n0_market_trip', minAge: 1, maxAge: 2, text: '처음으로 장터에 나들이를 갔다. 북적이는 소리와 향신료 냄새에 눈이 동그래졌다.' },
  { id: 'n0_puppy_lick', minAge: 1, maxAge: 4, text: '이웃집 강아지가 얼굴을 핥아 대는 바람에 비명과 웃음이 동시에 터졌다. 침으로 세수한 기분이다.' },
  { id: 'n0_cat_tail', minAge: 1, maxAge: 3, text: '마을 고양이의 꼬리를 잡으려다 보기 좋게 도망당했다. 고양이는 지붕 위에서 당신을 내려다보았다.' },

  // ───── 2~3세: 두 단어, 싫어 시기, 그림책 ─────
  { id: 'n0_two_words', minAge: 2, maxAge: 3, text: '"엄마 물!" 두 단어로 처음 문장을 만들었다. 물 한 잔이 즉시 배달되었다.', tone: 'good' },
  { id: 'n0_no_phase', minAge: 2, maxAge: 3, text: '무슨 말을 해도 "싫어!"라고 외치는 시기가 왔다. 어머니의 인내심 스탯이 폭발적으로 올랐다.' },
  { id: 'n0_potty', minAge: 2, maxAge: 3, once: true, text: '요강에 혼자 앉는 데 성공했다. 성공 선언과 동시에 가족이 모여 박수를 보냈다.', tone: 'good' },
  { id: 'n0_fairy_book', minAge: 2, maxAge: 4, text: '요정 그림책을 닳도록 읽었다. 글은 몰라도 날개 달린 요정 그림은 눈 감고도 그릴 수 있다.', effect: { stats: { int: 3 } } },
  { id: 'n0_nap_refuse', minAge: 2, maxAge: 4, text: '낮잠을 자기 싫다고 버티다 그대로 밥상에 얼굴을 묻고 잠들었다.' },
  { id: 'n0_picky_eater', minAge: 2, maxAge: 4, text: '당근만 쏙 골라내 접시 한쪽에 쌓았다. 어머니가 "용사는 당근 먹어야 크지"라고 달랬다.' },
  { id: 'n0_chicken_chase', minAge: 2, maxAge: 4, text: '닭을 쫓아 마당을 뛰어다니다 역으로 쫓겼다. 닭이 이겼다.', tone: 'bad' },
  { id: 'n0_imaginary_friend', minAge: 2, maxAge: 4, text: '눈에 보이지 않는 친구와 한참 수다를 떨었다. 식탁에는 그 친구 몫의 빵 한 조각이 놓였다.' },
  { id: 'n0_new_baby', minAge: 2, maxAge: 5, text: '이웃집에 아기가 태어났다. 조그만 손을 신기하게 만져 보다가 손가락을 꼭 잡혔다.', effect: { mood: 'joy' } },

  // ───── 3~5세: "왜?", 상상, 마을 축제 ─────
  { id: 'n0_why_phase', minAge: 3, maxAge: 5, once: true, text: '"왜?" 한마디로 하루를 보냈다. 어른들이 대답하다 지쳐 쓰러졌다.' },
  { id: 'n0_why_sky', minAge: 3, maxAge: 5, text: '"하늘은 왜 파래?" 아버지가 "용이 칠해서 그래"라고 답했다. 정말 믿어 버렸다.', effect: { stats: { int: 3 } } },
  { id: 'n0_say_name', minAge: 3, maxAge: 4, once: true, text: '「{name}」이라고 또박또박 자기 이름을 말했다. 이웃 아주머니가 사탕을 쥐여 주었다.', tone: 'good' },
  { id: 'n0_village_festival', minAge: 3, maxAge: 5, text: '마을 축제에서 아버지의 어깨 위에 올라탔다. 등불이 별처럼 흔들리고 북소리가 가슴에 울렸다.', tone: 'good', effect: { mood: 'joy' } },
  { id: 'n0_wooden_sword', minAge: 3, maxAge: 5, text: '나무칼 한 자루를 선물 받았다. 잠잘 때도 안고 있다가 이불 속에서 새벽 용사가 되었다.' },
  { id: 'n0_cape_play', minAge: 3, maxAge: 5, text: '보자기를 목에 두르고 마왕 퇴치 놀이를 했다. 마왕 역은 불쌍한 인형이었다.' },
  { id: 'n0_ground_drawing', minAge: 3, maxAge: 5, text: '땅바닥에 막대기로 커다란 용을 그렸다. 다리가 일곱 개였지만 위풍당당했다.' },
  { id: 'n0_counting', minAge: 3, maxAge: 5, text: '손가락으로 숫자를 세다 금화 다섯 닢을 자기 몫이라 우겼다. 셈은 정확했다.', effect: { stats: { int: 3 } } },
  { id: 'n0_wrong_shoes', minAge: 3, maxAge: 5, text: '혼자 신발을 신었다. 좌우가 반대였지만 본인은 의기양양했다.' },
  { id: 'n0_lost_in_market', minAge: 3, maxAge: 5, text: '장터에서 어머니의 손을 놓쳤다. 울음이 터지기 직전, 과일 가게 아저씨가 사과를 건네며 찾아 주었다.', effect: { mood: 'fear' } },
  { id: 'n0_butterfly', minAge: 3, maxAge: 5, text: '나비를 쫓아 풀밭을 가로질렀다. 정신을 차리고 보니 개울가였고, 신발이 흠뻑 젖어 있었다.' },
  { id: 'n0_bedtime_story', minAge: 3, maxAge: 5, text: '잠자리에서 모험가 이야기를 졸랐다. 마지막 장면은 항상 용이 고개를 끄덕이며 끝났다.', effect: { mood: 'calm' } },
  { id: 'n0_birthday5', minAge: 5, maxAge: 5, once: true, text: '다섯 번째 생일, 스스로 촛불을 불어 껐다. 이제 어엿한 꼬마 모험가다.', tone: 'good' },
];
