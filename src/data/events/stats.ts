import type { GameEvent } from '../../types';

/**
 * 능력치 사건: 능력치 하나를 크게 키우거나 깎는 범용 사건 (능력치마다 3개)
 * + 이야기가 있는 장신구를 주는 사건.
 */
export const STAT_EVENTS: GameEvent[] = [
  // ───── 체력 ─────
  {
    id: 's_vit_harvest', title: '추수 일손', weight: 1.2, focus: 'train',
    cond: { minAge: 8, maxAge: 40 },
    text: '이웃 농장에서 추수 일손이 모자라다며 도움을 청했다. 볕이 뜨겁다.',
    choices: [
      { label: '해 질 때까지 돕는다', check: { stat: 'vit', dc: 67 },
        success: { text: '볏단을 산더미처럼 날랐다. 저녁 밥상의 고기가 유난히 맛있다.', effect: { stats: { vit: 8 }, karma: 2 }, tone: 'good' },
        fail: { text: '반나절 만에 허리를 부여잡고 드러누웠다. 그래도 땀 흘린 만큼 몸은 단단해졌다.', effect: { stats: { vit: 3 }, stress: 8 } } },
      { label: '그늘에서 물을 나른다', success: { text: '일꾼들이 "물 당번 최고!"라며 엄지를 들었다.', effect: { stats: { cha: 3, vit: 3 } } } },
    ],
  },
  {
    id: 's_vit_mountain', title: '새벽 산행', weight: 1, focus: 'train',
    cond: { minAge: 12, maxAge: 65 },
    text: '마을 뒷산 정상에서 해돋이를 보면 일 년 내내 건강하다는 말이 있다.',
    choices: [
      { label: '뛰어서 오른다', check: { stat: 'vit', dc: 90 },
        success: { text: '숨을 헐떡이며 정상에 서자 붉은 해가 떠올랐다. 온몸에 힘이 차오른다!', effect: { stats: { vit: 11 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '중턱에서 발을 접질렸다. 해돋이는 절뚝거리며 내려오는 길에 봤다.', effect: { stats: { vit: -8 }, zeroCause: 'illness' } } },
      { label: '천천히 걸어 오른다', success: { text: '해는 이미 떠 있었지만 산바람이 상쾌했다.', effect: { stats: { vit: 6 } } } },
    ],
  },
  {
    id: 's_vit_cold', title: '독한 감기', weight: 0.8,
    cond: { minAge: 3, maxAge: 90 },
    text: '목이 칼칼하고 머리가 지끈거린다. 마을에 감기가 돌고 있다.',
    choices: [
      { label: '푹 쉰다', success: { text: '사흘을 내리 잤다. 개운하지만 몸이 조금 약해진 느낌이다.', effect: { stats: { vit: -3 }, stress: -10 } } },
      { label: '참고 일상을 이어 간다', check: { stat: 'vit', dc: 84 },
        success: { text: '이 정도 감기쯤이야! 오히려 몸이 이겨 내며 단련되었다.', effect: { stats: { vit: 6 } }, tone: 'good' },
        fail: { text: '감기가 폐렴이 될 뻔했다. 한동안 기침이 멎지 않았다.', effect: { stats: { vit: -17 }, zeroCause: 'illness', stress: 10 } } },
    ],
  },

  // ───── 마력 ─────
  {
    id: 's_mana_starlight', title: '별빛 명상', weight: 1, focus: 'study',
    cond: { minAge: 6, maxAge: 80 },
    text: '구름 한 점 없는 밤, 별빛이 유난히 가깝게 느껴진다. 손끝이 찌릿하다.',
    choices: [
      { label: '눈을 감고 별빛을 받아들인다', check: { stat: 'mana', dc: 73 },
        success: { text: '몸 안을 흐르는 마력의 길이 또렷하게 느껴졌다!', effect: { stats: { mana: 11 } }, tone: 'good' },
        fail: { text: '집중하다 그대로 잠들어 버렸다. 이슬에 젖은 채 아침을 맞았다.', effect: { stats: { mana: 3, vit: -3 } } } },
      { label: '그냥 별을 센다', success: { text: '백스무 개까지 세다 잠들었다. 좋은 꿈을 꿨다.', effect: { stats: { mana: 3 }, mood: 'calm' } } },
    ],
  },
  {
    id: 's_mana_runes', title: '이상한 룬 문자', weight: 0.9,
    cond: { minAge: 10, maxAge: 70 },
    text: '헌책방 구석의 책장에 손가락을 대자 룬 문자가 희미하게 빛났다.',
    choices: [
      { label: '룬을 따라 읽는다', check: { stat: 'int', dc: 84 },
        success: { text: '작은 불꽃이 손바닥 위에서 춤추었다. 책값은 그 자리에서 치렀다.', effect: { stats: { mana: 8, int: 3 }, gold: -20 }, tone: 'good' },
        fail: { text: '룬이 펑 터지며 앞머리가 그을렸다. 주인장이 배를 잡고 웃었다.', effect: { stats: { mana: 3, cha: -3 } } } },
      { label: '못 본 척 내려놓는다', success: { text: '찜찜하지만 안전하다. 그날 밤 꿈에 룬 문자가 둥둥 떠다녔다.', effect: { stats: { int: 3 } } } },
    ],
  },
  {
    id: 's_mana_overflow', title: '마력 과부하', weight: 0.6,
    cond: { minAge: 8, maxAge: 60, stats: { mana: 84 } },
    text: '요즘 마력이 넘쳐흐른다. 촛불이 저절로 켜졌다 꺼졌다 한다.',
    choices: [
      { label: '마력을 하늘로 쏘아 올린다', success: { text: '밤하늘에 커다란 불꽃이 피었다! 마을 사람들이 축제인 줄 알았다.', effect: { stats: { mana: 6, fame: 6 }, stress: -10 }, tone: 'good' } },
      { label: '꾹 눌러 담는다', check: { stat: 'vit', dc: 84 },
        success: { text: '넘치는 힘을 몸 깊이 갈무리했다. 마력의 그릇이 한층 넓어졌다.', effect: { stats: { mana: 11 } }, tone: 'good' },
        fail: { text: '사흘 내내 열이 났다. 마력은 그대로인데 몸만 축났다.', effect: { stats: { vit: -14 }, zeroCause: 'mana_overload' } } },
    ],
  },

  // ───── 지성 ─────
  {
    id: 's_int_riddle', title: '수수께끼 노인', weight: 1, focus: 'study',
    cond: { minAge: 7, maxAge: 70 },
    text: '다리 위의 노인이 길을 막고 웃었다. "수수께끼를 풀면 지나가게 해 주지."',
    choices: [
      { label: '머리를 굴린다', check: { stat: 'int', dc: 78 },
        success: { text: '"…정답!" 노인은 껄껄 웃으며 낡은 책 한 권을 건넸다.', effect: { stats: { int: 11 } }, tone: 'good' },
        fail: { text: '답이 "고양이"가 아니었다. 노인은 아쉬운 표정으로 길을 비켜 주었다.', effect: { stats: { int: 3 } } } },
      { label: '돌아서 간다', success: { text: '한참을 돌아갔다. 다리 건너편에서 노인이 손을 흔들었다.', effect: { stats: { vit: 3 } } } },
    ],
  },
  {
    id: 's_int_library', title: '밤샘 독서', weight: 1, focus: 'study',
    cond: { minAge: 9, maxAge: 80 },
    text: '도서관에서 빌린 두꺼운 책이 손에서 떨어지지 않는다. 벌써 자정이다.',
    choices: [
      { label: '끝까지 읽는다', success: { text: '새벽닭이 울 무렵 마지막 장을 덮었다. 세상이 조금 넓어 보인다.', effect: { stats: { int: 8 }, stress: 6 }, tone: 'good' } },
      { label: '내일 마저 읽는다', success: { text: '푹 자고 일어나 맑은 머리로 읽으니 더 잘 들어왔다.', effect: { stats: { int: 6 } } } },
    ],
  },
  {
    id: 's_int_scam', title: '그럴듯한 약장수', weight: 0.8,
    cond: { minAge: 12, maxAge: 85 },
    text: '광장의 약장수가 "머리가 좋아지는 기적의 물약!"을 외친다. 한 병에 50골드.',
    choices: [
      { label: '성분을 따져 묻는다', check: { stat: 'int', dc: 84 },
        success: { text: '그냥 설탕물이라는 걸 밝혀냈다! 구경꾼들이 박수를 쳤다.', effect: { stats: { int: 6, fame: 6 } }, tone: 'good' },
        fail: { text: '말솜씨에 넘어가 한 병을 샀다. 달았다. 그게 다였다.', effect: { gold: -50, stats: { int: -3 } } } },
      { label: '무시하고 지나간다', success: { text: '뒤에서 "후회할 거요!" 하는 외침이 들렸다. 후회하지 않았다.', effect: { stats: { int: 3 } } } },
    ],
  },

  // ───── 매력 ─────
  {
    id: 's_cha_dance', title: '광장의 춤판', weight: 1, focus: 'social',
    cond: { minAge: 10, maxAge: 75 },
    text: '광장에서 악사들이 흥겨운 곡을 연주한다. 다들 손을 잡고 원을 그리며 돈다.',
    choices: [
      { label: '원 안으로 뛰어든다', check: { stat: 'cha', dc: 73 },
        success: { text: '스텝이 척척 맞았다! 춤이 끝나자 여기저기서 박수가 터졌다.', effect: { stats: { cha: 11 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '세 번째 박자에서 앞사람 발을 밟았다. 그래도 다 같이 웃었다.', effect: { stats: { cha: 3 } } } },
      { label: '박수만 친다', success: { text: '구경도 즐겁다. 리듬은 몸에 남았다.', effect: { stats: { cha: 3 } } } },
    ],
  },
  {
    id: 's_cha_mirror', title: '거울 앞 연습', weight: 0.8, focus: 'social',
    cond: { minAge: 12, maxAge: 50 },
    text: '내일 중요한 자리가 있다. 거울 앞에서 웃는 얼굴을 연습해 본다.',
    choices: [
      { label: '백 번 연습한다', success: { text: '광대가 아플 지경이지만 미소에 자신감이 붙었다.', effect: { stats: { cha: 8 } }, tone: 'good' } },
      { label: '자연스러운 게 최고다', success: { text: '다음 날, 꾸밈없는 웃음이 오히려 좋은 인상을 남겼다.', effect: { stats: { cha: 6 }, stress: -5 } } },
    ],
  },
  {
    id: 's_cha_rumor', title: '나쁜 소문', weight: 0.7,
    cond: { minAge: 12, maxAge: 80 },
    text: '누군가 당신에 대한 이상한 소문을 퍼뜨리고 있다. 사람들의 시선이 따갑다.',
    choices: [
      { label: '정면으로 해명한다', check: { stat: 'cha', dc: 90 },
        success: { text: '진심 어린 해명에 오해가 풀렸다. 오히려 사람들이 더 믿어 주게 되었다.', effect: { stats: { cha: 8, fame: 3 } }, tone: 'good' },
        fail: { text: '말이 꼬여 변명처럼 들렸다. 소문은 한동안 사그라지지 않았다.', effect: { stats: { cha: -8 }, stress: 12 } } },
      { label: '시간이 해결하길 기다린다', success: { text: '계절이 바뀌자 소문도 잊혔다. 마음고생은 조금 했다.', effect: { stats: { cha: -3 }, stress: 6 } } },
    ],
  },

  // ───── 명성 ─────
  {
    id: 's_fame_fire', title: '불난 집', weight: 0.8,
    cond: { minAge: 12, maxAge: 65 },
    text: '이웃집에서 연기가 치솟는다! 안에 아이가 있다는 외침이 들린다.',
    choices: [
      { label: '불길 속으로 뛰어든다', check: { stat: 'vit', dc: 95 },
        success: { text: '아이를 안고 뛰쳐나왔다! 마을 사람들이 당신의 이름을 연호했다.', effect: { stats: { fame: 17 }, karma: 8 }, tone: 'good' },
        fail: { text: '아이는 구했지만 팔에 화상을 입었다. 그래도 모두가 고마워했다.', effect: { stats: { fame: 11, vit: -22 }, karma: 8, zeroCause: 'illness' } } },
      { label: '물동이 줄을 세운다', check: { stat: 'cha', dc: 78 },
        success: { text: '당신의 지휘로 불길이 잡혔다. 다친 사람 하나 없었다.', effect: { stats: { fame: 11, cha: 3 }, karma: 4 }, tone: 'good' },
        fail: { text: '우왕좌왕하는 사이 소방대가 도착했다. 다행히 모두 무사했다.', effect: { stats: { fame: 3 } } } },
    ],
  },
  {
    id: 's_fame_bard', title: '음유시인의 노래', weight: 0.7,
    cond: { minAge: 16, maxAge: 85, stats: { fame: 42 } },
    text: '떠돌이 음유시인이 당신의 이야기를 노래로 만들고 싶다고 한다.',
    choices: [
      { label: '과장 좀 섞어 들려준다', success: { text: '노래 속 당신은 용을 세 마리쯤 쓰러뜨렸다. 노래는 대히트였다!', effect: { stats: { fame: 14 }, karma: -2 }, tone: 'good' } },
      { label: '있는 그대로 들려준다', success: { text: '소박하지만 따뜻한 노래가 되었다. 듣는 이마다 고개를 끄덕였다.', effect: { stats: { fame: 8 }, karma: 3 } } },
    ],
  },
  {
    id: 's_fame_contest', title: '마을 대항 시합', weight: 1,
    cond: { minAge: 10, maxAge: 50 },
    text: '이웃 마을과 해마다 여는 시합 날이다. 대표 선수 자리가 하나 비었다.',
    choices: [
      { label: '대표로 나선다', check: { stat: 'luck', dc: 73 },
        success: { text: '결승점을 가장 먼저 밟았다! 마을의 영웅이 되었다.', effect: { stats: { fame: 14, vit: 3 } }, tone: 'good' },
        fail: { text: '아깝게 2등. 그래도 마을 사람들이 어깨를 두드려 주었다.', effect: { stats: { fame: 6 } } } },
      { label: '응원단을 맡는다', success: { text: '목이 쉬도록 응원했다. 응원상을 받았다.', effect: { stats: { fame: 3, cha: 6 } } } },
    ],
  },

  // ───── 행운 ─────
  {
    id: 's_luck_coin', title: '반짝이는 동전', weight: 1, focus: 'explore',
    cond: { minAge: 4, maxAge: 90 },
    text: '길바닥에서 반짝이는 동전을 발견했다. 앞면일까, 뒷면일까?',
    choices: [
      { label: '주워서 던져 본다', check: { stat: 'luck', dc: 67 },
        success: { text: '앞면! 그날 하루 종일 일이 술술 풀렸다.', effect: { stats: { luck: 11 }, gold: 5 }, tone: 'good' },
        fail: { text: '뒷면. 던진 동전은 하수구로 굴러 들어갔다.', effect: { stats: { luck: 3 } } } },
      { label: '주인을 찾아 준다', success: { text: '주인을 찾지는 못했지만, 착한 일을 하니 기분이 좋다.', effect: { karma: 3, stats: { luck: 6 } } } },
    ],
  },
  {
    id: 's_luck_blackcat', title: '검은 고양이', weight: 0.9,
    cond: { minAge: 5, maxAge: 85 },
    text: '검은 고양이가 앞길을 가로질렀다. 불길하다는 말도, 행운이라는 말도 있다.',
    choices: [
      { label: '쓰다듬어 준다', success: { text: '고양이가 그르릉거리며 발에 몸을 비볐다. 왠지 좋은 일이 생길 것 같다.', effect: { stats: { luck: 8 }, mood: 'joy' }, tone: 'good' } },
      { label: '길을 돌아간다', success: { text: '돌아가는 길에 웅덩이를 밟았다. 고양이 탓은 아니겠지…', effect: { stats: { luck: -3 } } } },
    ],
  },
  {
    id: 's_luck_lottery', title: '축제 복권', weight: 0.8,
    cond: { minAge: 14, maxAge: 90 },
    text: '추수 축제에서 복권을 판다. 한 장에 10골드, 1등은 황금 송아지!',
    choices: [
      { label: '한 장 산다', check: { stat: 'luck', dc: 112 },
        success: { text: '1등이다!! 황금 송아지를 팔아 큰돈이 생겼다!', effect: { gold: 800, stats: { luck: 6, fame: 6 } }, tone: 'good' },
        fail: { text: '꽝. 종이 쪼가리를 바람에 날려 보냈다.', effect: { gold: -10 } } },
      { label: '사지 않는다', success: { text: '그 10골드로 꼬치구이를 사 먹었다. 확실한 행복이다.', effect: { stats: { vit: 3 }, mood: 'joy' } } },
    ],
  },

  // ───── 이야기가 있는 장신구 ─────
  {
    id: 's_t_mother', title: '어머니의 손수건', once: true, weight: 1.2,
    cond: { minAge: 15, maxAge: 22 },
    text: '집을 떠나는 날 아침, 어머니가 수놓은 손수건을 쥐여 주었다. "힘들 땐 꺼내 보렴."',
    choices: [
      { label: '꼭 끌어안는다', success: { text: '손수건에서 집 냄새가 났다. 어디를 가든 지켜 줄 것 같다.', effect: { trinket: { base: 't_mother', rarity: 'rare' }, stress: -10 }, tone: 'good' } },
      { label: '쑥스러워 대충 받는다', success: { text: '주머니에 쑤셔 넣었지만, 마을 끝에서 몰래 한 번 꺼내 보았다.', effect: { trinket: { base: 't_mother', rarity: 'common' } } } },
    ],
  },
  {
    id: 's_t_mentor', title: '스승의 반지', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 70, hasRel: ['mentor'] },
    text: '{mentor:이} 낡은 반지를 빼 건넸다. "이제 네가 가질 때가 됐다."',
    choices: [
      { label: '두 손으로 받는다', success: { text: '반지에 새겨진 문양이 손끝에 따뜻하게 닿는다. 스승의 지혜가 깃든 듯하다.', effect: { trinket: { base: 't_mentor', rarity: 'epic' }, rel: { mentor: 10 } }, tone: 'good' } },
      { label: '아직 이르다며 사양한다', success: { text: '"…그 겸손함이면 됐다." 스승은 끝내 반지를 손에 쥐여 주었다.', effect: { trinket: { base: 't_mentor', rarity: 'rare' }, rel: { mentor: 15 } } } },
    ],
  },
  {
    id: 's_t_fairy', title: '요정의 장난', once: true, weight: 1,
    cond: { minAge: 5, maxAge: 40 },
    text: '방울 소리와 함께 요정이 나타나 깔깔 웃었다. "숨바꼭질 이기면 선물 줄게!"',
    choices: [
      { label: '숨바꼭질을 한다', check: { stat: 'luck', dc: 78 },
        success: { text: '나무 구멍 속 요정을 찾아냈다! 요정이 은방울을 던져 주고 사라졌다.', effect: { trinket: { base: 't_fairy', rarity: 'epic' } }, tone: 'good' },
        fail: { text: '해가 지도록 못 찾았다. 요정은 "다음에 또 놀자~" 하고 사라졌다.', effect: { stats: { luck: 3 } } } },
      { label: '요정을 쫓아낸다', success: { text: '요정이 볼을 부풀리며 사라졌다. 그날 밤 신발 끈이 전부 묶여 있었다.', effect: { stats: { luck: -6 } } } },
    ],
  },
  {
    id: 's_t_hero', title: '쓰러진 용사', once: true, weight: 0.8,
    cond: { minAge: 16, maxAge: 60 },
    text: '숲길에서 상처투성이 노병을 만났다. 깨진 견장을 내밀며 마을까지 데려다 달라고 한다.',
    choices: [
      { label: '업고 마을까지 간다', check: { stat: 'vit', dc: 84 },
        success: { text: '마을에 닿자 노병이 웃었다. "젊은 용사여, 이걸 가져가게." 깨진 견장이 묵직하다.', effect: { trinket: { base: 't_hero', rarity: 'epic' }, karma: 6 }, tone: 'good' },
        fail: { text: '중간에 다리가 풀렸지만 지나가던 수레를 불러 세웠다. 노병은 견장을 쥐여 주었다.', effect: { trinket: { base: 't_hero', rarity: 'rare' }, karma: 5, stats: { vit: -8 } } } },
      { label: '사람을 불러 온다', success: { text: '마을 사람들과 함께 노병을 옮겼다. 노병은 고맙다며 고개를 숙였다.', effect: { karma: 4 } } },
    ],
  },
  {
    id: 's_t_star', title: '떨어진 별', once: true, weight: 0.7,
    cond: { minAge: 8, maxAge: 80 },
    text: '한밤중, 뒷산에 별똥별이 떨어졌다. 숲 사이로 희미한 빛이 새어 나온다.',
    choices: [
      { label: '빛을 찾아간다', check: { stat: 'mana', dc: 78 },
        success: { text: '움푹 파인 땅에서 아직 따뜻한 별 조각을 주웠다. 마력이 맥박처럼 뛴다.', effect: { trinket: { base: 't_star', rarity: 'epic' } }, tone: 'good' },
        fail: { text: '빛은 금세 꺼졌다. 손에 쥔 건 반짝이는 돌멩이 하나.', effect: { trinket: { base: 't_star', rarity: 'common' } } } },
      { label: '소원을 빈다', success: { text: '눈을 감고 소원을 빌었다. 무슨 소원이었는지는 비밀이다.', effect: { stats: { luck: 6 }, mood: 'calm' } } },
    ],
  },
  {
    id: 's_t_crown', title: '축제의 왕', once: true, weight: 0.8,
    cond: { minAge: 14, maxAge: 60, stats: { cha: 70 } },
    text: '추수 축제에서 「올해의 축제 왕」을 뽑는다고 한다. 친구들이 등을 떠민다.',
    choices: [
      { label: '무대에 오른다', check: { stat: 'cha', dc: 95 },
        success: { text: '만장일치! 꽃으로 엮은 왕관이 머리 위에 씌워졌다. 오늘만큼은 당신이 왕이다!', effect: { trinket: { base: 't_crown', rarity: 'rare' }, stats: { fame: 8 } }, tone: 'good' },
        fail: { text: '아쉽게 2등. 위로 삼아 작은 왕관 장식을 받았다.', effect: { trinket: { base: 't_crown', rarity: 'common' } } } },
      { label: '구경만 한다', success: { text: '왕관을 쓴 사람이 너무 신나 보여서 덩달아 웃었다.', effect: { mood: 'joy' } } },
    ],
  },
];
