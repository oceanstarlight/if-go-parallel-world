import type { GameEvent } from '../../types';

/** 0~14세 */
export const CHILDHOOD: GameEvent[] = [
  // ───── 이정표 ─────
  {
    id: 'm_awaken3', title: '마력 각성', milestone: true,
    cond: { minAge: 3, maxAge: 3 },
    text: '세 살의 어느 밤, 배꼽 아래가 간질간질하더니 손끝에서 반짝반짝 빛이 새어 나왔다. 이건… 설마 그 유명한 마력?!',
    choices: [
      {
        label: '꾹 참는다', check: { stat: 'vit', dc: 10 },
        success: { text: '으읍! 볼을 빵빵하게 부풀려 빛을 삼켰다. 들키지 않았다. 세이프!', effect: { stats: { vit: 2, mana: 2 } } },
        fail: { text: '참긴 했는데 사흘 내내 딸꾹질처럼 빛이 새어 나와 앓아누웠다.', effect: { stats: { vit: -4, mana: 1 } } },
      },
      {
        label: '마음껏 터뜨린다', cond: { test: (s) => s.cheatId !== 'allmagic' }, check: { stat: 'mana', dc: 18 },
        success: { text: '방 안이 별빛으로 가득 찼다! 그날부터 동네 사람들은 당신을 "신동"이라 불렀다.', effect: { stats: { mana: 5, fame: 5 }, flags: ['prodigy'] } },
        fail: { text: '빛이 통통 튀어 다니며 그릇을 전부 깨뜨렸다. 어머니의 미소가 무서워졌다.', effect: { stats: { vit: -5, cha: -2 } } },
      },
      {
        label: '마음껏 터뜨린다 (일곱 속성이 대답한다)', cond: { cheats: ['allmagic'] }, check: { stat: 'mana', dc: 28 },
        success: { text: '무지개색 빛기둥이 지붕을 뚫었다! 산파 할머니가 그 자리에서 무릎을 꿇었다. 치트 능력, 확인 완료.', effect: { stats: { mana: 8, fame: 8 }, flags: ['prodigy'] } },
        fail: { text: '앗, 이건 좀… 너무 많은데? 작은 몸에 바다 하나가 통째로 쏟아졌다.', effect: { death: 'mana_overload' } },
      },
    ],
  },
  {
    id: 'm_friend5', title: '이웃의 아이', milestone: true,
    cond: { minAge: 5, maxAge: 5 },
    text: '옆집에 이사 온 아이가 울타리 너머로 당신을 뚫어지게 바라보고 있다. 눈이 반짝반짝하다.',
    choices: [
      {
        label: '손을 내민다',
        success: { text: '{friend:은} 쭈뼛거리다 당신 손을 꼭 잡았다. 오늘부터 소꿉친구 확정!', effect: { addRel: 'friend', rel: { friend: 20 } }, tone: 'good' },
      },
      {
        label: '못 본 척한다',
        success: { text: '그 아이, {friend:은} 그 뒤로도 울타리 너머에서 몰래몰래 당신을 지켜보았다.', effect: { addRel: 'friend', rel: { friend: -20 }, stats: { int: 1 } } },
      },
    ],
  },
  {
    id: 'm_rite7', title: '적성의 의식', milestone: true,
    cond: { minAge: 7, maxAge: 7, notHouses: ['demon'] },
    text: '신전의 커다란 수정구 앞에 섰다. 두근두근. 이세계 하면 역시 이 이벤트지!',
    choices: [
      {
        label: '마력을 듬뿍 흘린다', check: { stat: 'mana', dc: 20 },
        success: { text: '수정구가 눈부시게 빛났다! 신관님의 안경이 미끄러졌다. "이, 이 아이는 왕도로 보내야 합니다!"', effect: { stats: { mana: 3, fame: 5 }, flags: ['gifted'] } },
        fail: { text: '수정구가 반딧불만큼 깜빡였다. 신관님이 "다음 아이~" 하고 불렀다. 아직 각성 전인 걸로 하자.', effect: { stats: { int: 1 } } },
      },
      {
        label: '수정에 손대지 않는다',
        success: { text: '"내 운명은 내가 정할래!" 어른들은 한숨을 쉬었지만, 왠지 행운이 따라올 것 같다.', effect: { karma: -3, stats: { luck: 2 } } },
      },
    ],
  },
  {
    id: 'm_rite7_demon', title: '피의 맹세', milestone: true,
    cond: { minAge: 7, maxAge: 7, houses: ['demon'] },
    text: '마왕성의 일곱 살 생일 의식! 흑요석 잔에 손가락을 콕 찔러 피 한 방울을 바친다.',
    auto: {
      check: { stat: 'vit', dc: 15 },
      success: { text: '잔이 보랏빛으로 보글보글 끓었다. 무뚝뚝한 아버지가 처음으로 머리를 쓰다듬어 주었다.', effect: { stats: { vit: 3, mana: 4 } } },
      fail: { text: '한 방울이라더니 생각보다 많이 뽑혔다. 어질어질… 의식이 끝나자 그대로 기절했다.', effect: { stats: { vit: -6 } } },
    },
  },
  {
    id: 'm_rival10', title: '라이벌 등장', milestone: true,
    cond: { minAge: 10, maxAge: 10 },
    text: '또래 중에 유독 당신만 노려보는 아이가 있다. "너, 나랑 승부해!" 뭐든 한 발 앞서려 든다.',
    choices: [
      {
        label: '정면승부!', check: { stat: 'vit', dc: 15 },
        success: { text: '한바탕 뒹군 끝에 {rival:이} 먼저 "…오늘은 봐준다!"며 외쳤다. 분하지만 인정하는 눈빛이었다.', effect: { addRel: 'rival', rel: { rival: 10 }, stats: { fame: 2 } } },
        fail: { text: '흙투성이가 된 당신을 {rival:이} 내려다보며 "후훗, 내 승리!"라고 외쳤다.', effect: { addRel: 'rival', rel: { rival: -10 }, stats: { vit: -3 } } },
      },
      {
        label: '무시한다',
        success: { text: '{rival:은} 무시당했다며 발을 동동 굴렀다. 앞으로 더 귀찮게 할 것 같다.', effect: { addRel: 'rival', rel: { rival: -15 }, stats: { cha: 1 } } },
      },
    ],
  },

  // ───── 무작위 ─────
  {
    id: 'c_fever', title: '감기', once: true, weight: 2,
    cond: { minAge: 1, maxAge: 5 },
    text: '한겨울, 몸이 화끈화끈 달아올랐다. 이세계 감기는 레벨이 다르다.',
    auto: {
      check: { stat: 'vit', dc: 8 },
      success: { text: '사흘 밤낮을 끙끙 앓고 나니 개운하게 털고 일어났다. 체력이 조금 붙은 기분!', effect: { stats: { vit: 2 } } },
      fail: { text: '열은 내렸지만 기운이 쭉 빠졌다. 당분간 무리는 금물이다.', effect: { stats: { vit: -8 }, zeroCause: 'illness' } },
    },
  },
  {
    id: 'c_lullaby', title: '자장가', once: true,
    cond: { minAge: 1, maxAge: 4 },
    text: '어머니가 처음 듣는 자장가를 불러주었다. 가사는 몰라도 왠지 코끝이 찡했다.',
    auto: { success: { text: '전생에서도 누군가 이런 노래를 불러준 것 같다. 이번 생은 잘 살아보자.', effect: { stats: { cha: 1, luck: 1 } } } },
  },
  {
    id: 'c_friend_play', title: '소꿉친구', weight: 3,
    cond: { minAge: 6, maxAge: 13, hasRel: ['friend'] },
    text: '{friend:이} 오늘도 문 앞에서 "놀자~!" 하고 기다리고 있다.',
    choices: [
      { label: '강가로 놀러 간다', success: { text: '해 질 때까지 물수제비를 떴다. {friend:이} 까르르 웃었다.', effect: { rel: { friend: 10 }, stats: { vit: 1 } } } },
      { label: '그림책을 읽어준다', success: { text: '{friend:은} 당신 목소리를 듣다가 새근새근 잠들었다.', effect: { rel: { friend: 8 }, stats: { int: 1 } } } },
      { label: '오늘은 바쁘다고 한다', success: { text: '{friend:은} 입을 삐죽 내밀고 돌아갔다. 그런데 다음 날에도, 그다음 날에도 문 앞에 있었다.', effect: { rel: { friend: -5 } } } },
    ],
  },
  {
    id: 'c_forest', title: '요정의 숲', weight: 2, focus: 'explore',
    cond: { minAge: 6, maxAge: 13 },
    text: '어른들이 들어가지 말라던 숲. 그 깊은 곳에서 파란 빛이 이리 오라는 듯 깜빡인다.',
    choices: [
      {
        label: '빛을 따라간다', check: { stat: 'luck', dc: 18 },
        success: { text: '이끼 낀 제단 위에서 따끈따끈한 파란 돌을 주웠다. 요정이 준 선물일까?', effect: { stats: { mana: 4, luck: 2 }, flags: ['relic'] } },
        fail: { text: '갑자기 나타난 늑대들에게 쫓겨 덤불 속에서 밤을 새웠다. 무릎이 다 까졌다.', effect: { stats: { vit: -8 } } },
      },
      { label: '얌전히 돌아간다', success: { text: '착한 아이는 어른 말을 듣는 법. 숲 쪽에서 아쉬운 듯한 바람이 불었다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'c_attic', title: '다락방의 비밀 책', once: true, focus: 'study', weight: 1.5,
    cond: { minAge: 6, maxAge: 14 },
    text: '다락방 상자 속에서 표지가 찢어진 책을 찾았다. 신전의 "봉인" 도장이 쾅 찍혀 있다. 두근두근.',
    choices: [
      {
        label: '몰래 읽는다', check: { stat: 'int', dc: 16 },
        success: { text: '금지된 술식이 잔뜩 적혀 있었다! 전생에서 갈고닦은 암기력으로 전부 외워버렸다.', effect: { stats: { int: 5, mana: 3 }, flags: ['forbidden_knowledge'] } },
        fail: { text: '글자는 읽히는데 무슨 소린지 하나도 모르겠다. 아직 레벨이 부족한 듯.', effect: { stats: { int: 1 } } },
      },
      { label: '신전에 가져다준다', success: { text: '신관님이 책을 받아 들고 한참 말이 없더니, 당신의 이름을 수첩에 적어 갔다. 칭찬… 이겠지?', effect: { karma: 6, stats: { fame: 1 } } } },
    ],
  },
  {
    id: 'c_carriage', title: '폭주 마차', once: true, weight: 1.5,
    cond: { minAge: 6, maxAge: 30, notHouses: ['noble'] },
    text: '진흙길 한복판에 넘어진 아이가 있다. 그리고 저 너머에서, 귀족의 마차가 브레이크 없이 달려온다! 이건… 이세계 트럭?!',
    choices: [
      {
        label: '몸을 날린다', check: { stat: 'vit', dc: 22 },
        success: { text: '아이를 안고 데굴데굴 굴렀다. 바퀴가 옷자락을 스치고 지나갔다. 마을 사람들의 박수가 쏟아졌다!', effect: { stats: { fame: 8 }, karma: 12 } },
        fail: { text: '아이를 길가로 밀어냈다. …그리고 익숙한 하얀 빛. 아, 이 전개 어디서 봤는데.', effect: { karma: 12, death: 'carriage' } },
      },
      {
        label: '크게 소리친다', check: { stat: 'cha', dc: 18 },
        success: { text: '"비켜어어!" 아이는 아슬아슬하게 길가로 굴러 나왔다. 휴우.', effect: { karma: 5 } },
        fail: { text: '목소리가 말발굽 소리에 묻혀버렸다. 다행히 아이는 무사했지만, 그날 밤 잠이 오지 않았다.', effect: { karma: 2, stats: { cha: -2 } } },
      },
      { label: '못 본 척한다', success: { text: '발걸음을 재촉했다. 등 뒤에서 들린 소리가 한동안 귓가에 맴돌았다.', effect: { karma: -10 } } },
    ],
  },
  {
    id: 'c_bully', title: '영주의 아들', weight: 1.5,
    cond: { minAge: 8, maxAge: 14, flags: ['commoner'] },
    text: '영주 아들 일당이 마을 아이들을 괴롭히고 있다. 저런 녀석, 꼭 있다니까.',
    choices: [
      {
        label: '막아선다', check: { stat: 'vit', dc: 20 },
        success: { text: '영주 아들이 코를 감싸 쥐고 줄행랑쳤다! 마을 아이들이 "대장!"이라 부르기 시작했다.', effect: { stats: { fame: 3, vit: 1 }, karma: 5 } },
        fail: { text: '얻어맞은 건 당신이었다. 게다가 그 아버지가 소작료까지 올렸다. 치사하다!', effect: { stats: { vit: -6 } } },
      },
      { label: '모른 척한다', success: { text: '처세술이 1 올랐다. …별로 기쁘지 않다.', effect: { stats: { cha: 1 }, karma: -2 } } },
    ],
  },
  {
    id: 'c_noble_lesson', title: '귀족 수업', weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['noble'] },
    text: '예법, 검술, 역사, 춤! 대공가 아이의 스케줄표는 빈칸이 없다.',
    auto: { success: { text: '가정교사의 잔소리 속에서 한 해가 훌쩍 지나갔다. 그래도 제법 귀족다워졌다.', effect: { stats: { cha: 2, int: 1, vit: 1 } } } },
  },
  {
    id: 'c_prodigy_visit', title: '궁정 마법사의 방문', once: true, weight: 4,
    cond: { minAge: 8, maxAge: 12, test: (s) => s.flags.includes('prodigy') || s.flags.includes('gifted') },
    text: '신동 소문을 듣고 궁정 마법사가 찾아왔다! 긴 수염의 할아버지가 당신을 흥미롭게 내려다본다.',
    choices: [
      { label: '제자가 된다', success: { text: '대마법사 {mentor:이} 싱긋 웃으며 반짝이는 지팡이를 건넸다. 오늘부터 마법 수업 시작!', effect: { addRel: 'mentor', stats: { mana: 4, int: 2 }, flags: ['apprentice'] }, tone: 'good' } },
      { label: '거절한다', success: { text: '"허허, 아쉽구먼." 할아버지는 사탕 하나를 쥐여주고 떠났다.', effect: { stats: { luck: 2 } } } },
    ],
  },
  {
    id: 'c_market', title: '시장의 흥정', weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['merchant'] },
    text: '아버지가 이국의 상인과 향신료 값으로 옥신각신하고 있다.',
    choices: [
      {
        label: '흥정에 끼어든다', check: { stat: 'int', dc: 16 },
        success: { text: '전생의 암산 실력이 빛을 발했다! 이국 상인이 "이 꼬마 뭐야?!" 하고 혀를 내둘렀다.', effect: { stats: { int: 2, cha: 2, fame: 1 } } },
        fail: { text: '아버지가 웃으며 당신의 입을 살포시 막았다.', effect: { stats: { cha: -1 } } },
      },
      { label: '구경한다', success: { text: '말 한마디에 값이 오르락내리락. 장사란 신기하다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'c_demon_child', title: '인간 포로', once: true, weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['demon'] },
    text: '마왕군의 아이들은 인간을 겁주는 법부터 배운다. 오늘은 잡혀 온 인간 소년이 당신 앞에 섰다.',
    choices: [
      { label: '명령대로 겁을 준다', success: { text: '소년은 엉엉 울며 도망쳤다. 아버지는 흡족해했지만, 왠지 마음 한구석이 따끔했다.', effect: { karma: -15, stats: { mana: 3, vit: 2 } }, tone: 'bad' } },
      {
        label: '몰래 풀어준다', check: { stat: 'luck', dc: 18 },
        success: { text: '"쉿, 이쪽이야." 소년은 고맙다는 말 대신 꾸벅 고개를 숙이고 사라졌다.', effect: { karma: 15, flags: ['spared_human'] } },
        fail: { text: '들켜버렸다! 아버지에게 엄청나게 혼나고 일주일 동안 외출 금지를 당했다.', effect: { karma: 10, stats: { vit: -10 } } },
      },
    ],
  },
  {
    id: 'c_famine', title: '흉년', weight: 1,
    cond: { minAge: 4, maxAge: 40, houses: ['farm'], notJobs: ['knight', 'mage', 'merchant', 'priest'] },
    text: '올해는 흉년이다. 곳간이 텅텅 비어가고, 이웃집 꼬마가 배를 곯는다는 소문이 들린다.',
    choices: [
      { label: '이웃과 나눈다', success: { text: '모두 조금씩 배고팠지만, 다 같이 봄을 맞이했다. 마을 인심이 훈훈해졌다.', effect: { karma: 10, stats: { vit: -8 }, zeroCause: 'famine' } } },
      { label: '우리 가족 몫을 지킨다', success: { text: '문을 꼭 걸어 잠갔다. 그 겨울, 이웃집 굴뚝 연기가 유난히 가늘었다.', effect: { karma: -6, stats: { vit: -3 }, zeroCause: 'famine' } } },
      {
        label: '눈 덮인 숲으로 사냥을 나간다', check: { stat: 'luck', dc: 20 },
        success: { text: '커다란 사슴을 끌고 돌아왔다! 오늘 밤은 마을 전체가 고기 파티다!', effect: { stats: { vit: 2, fame: 2 } } },
        fail: { text: '빈손으로, 꽁꽁 언 발로 돌아왔다. 콧물이 고드름이 됐다.', effect: { stats: { vit: -14 }, zeroCause: 'famine' } },
      },
    ],
  },
  {
    id: 'c_plague', title: '유행병', once: true, weight: 0.4,
    cond: { minAge: 12, maxAge: 90 },
    text: '왕국에 지독한 유행병이 돌고 있다. 거리마다 기침 소리가 가득하다.',
    auto: {
      check: { stat: 'vit', dc: 16 },
      success: { text: '며칠 끙끙 앓았지만 거짓말처럼 나았다. 면역력 만세!', effect: { stats: { vit: -3 } } },
      fail: { text: '이번 병은 독했다. 몸이 쉽게 회복되지 않는다.', effect: { stats: { vit: -20 }, zeroCause: 'plague' } },
    },
  },
];
