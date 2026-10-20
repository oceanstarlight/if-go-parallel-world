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
        label: '꾹 참는다', check: { stat: 'vit', dc: 20 },
        success: { text: '으읍! 볼을 빵빵하게 부풀려 빛을 삼켰다. 들키지 않았다. 세이프!', effect: { stats: { vit: 4, mana: 4 } } },
        fail: { text: '참긴 했는데 사흘 내내 딸꾹질처럼 빛이 새어 나와 앓아누웠다.', effect: { stats: { vit: -8, mana: 2 } } },
      },
      {
        label: '마음껏 터뜨린다', cond: { test: (s) => s.cheatId !== 'allmagic' }, check: { stat: 'mana', dc: 36 },
        success: { text: '방 안이 별빛으로 가득 찼다! 그날부터 동네 사람들은 당신을 "신동"이라 불렀다.', effect: { stats: { mana: 10, fame: 10 }, flags: ['prodigy'] } },
        fail: { text: '빛이 통통 튀어 다니며 그릇을 전부 깨뜨렸다. 어머니의 미소가 무서워졌다.', effect: { stats: { vit: -10, cha: -4 } } },
      },
      {
        label: '마음껏 터뜨린다 (일곱 속성이 대답한다)', cond: { cheats: ['allmagic'] }, check: { stat: 'mana', dc: 56 },
        success: { text: '무지개색 빛기둥이 지붕을 뚫었다! 산파 할머니가 그 자리에서 무릎을 꿇었다. 치트 능력, 확인 완료.', effect: { stats: { mana: 16, fame: 16 }, flags: ['prodigy'] } },
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
        success: { text: '그 아이, {friend:은} 그 뒤로도 울타리 너머에서 몰래몰래 당신을 지켜보았다.', effect: { addRel: 'friend', rel: { friend: -20 }, stats: { int: 2 } } },
      },
    ],
  },
  {
    id: 'm_rite7', title: '적성의 의식', milestone: true,
    cond: { minAge: 7, maxAge: 7, notHouses: ['demon'] },
    text: '신전의 커다란 수정구 앞에 섰다. 두근두근. 이세계 하면 역시 이 이벤트지!',
    choices: [
      {
        label: '마력을 듬뿍 흘린다', check: { stat: 'mana', dc: 40 },
        success: { text: '수정구가 눈부시게 빛났다! 신관님의 안경이 미끄러졌다. "이, 이 아이는 왕도로 보내야 합니다!"', effect: { stats: { mana: 6, fame: 10 }, flags: ['gifted'] } },
        fail: { text: '수정구가 반딧불만큼 깜빡였다. 신관님이 "다음 아이~" 하고 불렀다. 아직 각성 전인 걸로 하자.', effect: { stats: { int: 2 } } },
      },
      {
        label: '수정에 손대지 않는다',
        success: { text: '"내 운명은 내가 정할래!" 어른들은 한숨을 쉬었지만, 왠지 행운이 따라올 것 같다.', effect: { karma: -3, stats: { luck: 4 } } },
      },
    ],
  },
  {
    id: 'm_rite7_demon', title: '피의 맹세', milestone: true,
    cond: { minAge: 7, maxAge: 7, houses: ['demon'] },
    text: '마왕성의 일곱 살 생일 의식! 흑요석 잔에 손가락을 콕 찔러 피 한 방울을 바친다.',
    auto: {
      check: { stat: 'vit', dc: 30 },
      success: { text: '잔이 보랏빛으로 보글보글 끓었다. 무뚝뚝한 아버지가 처음으로 머리를 쓰다듬어 주었다.', effect: { stats: { vit: 6, mana: 8 } } },
      fail: { text: '한 방울이라더니 생각보다 많이 뽑혔다. 어질어질… 의식이 끝나자 그대로 기절했다.', effect: { stats: { vit: -12 } } },
    },
  },
  {
    id: 'm_rival10', title: '라이벌 등장', milestone: true,
    cond: { minAge: 10, maxAge: 10 },
    text: '또래 중에 유독 당신만 노려보는 아이가 있다. "너, 나랑 승부해!" 뭐든 한 발 앞서려 든다.',
    choices: [
      {
        label: '정면승부!', check: { stat: 'vit', dc: 30 },
        success: { text: '한바탕 뒹군 끝에 {rival:이} 먼저 "…오늘은 봐준다!"며 외쳤다. 분하지만 인정하는 눈빛이었다.', effect: { addRel: 'rival', rel: { rival: 10 }, stats: { fame: 4 } } },
        fail: { text: '흙투성이가 된 당신을 {rival:이} 내려다보며 "후훗, 내 승리!"라고 외쳤다.', effect: { addRel: 'rival', rel: { rival: -10 }, stats: { vit: -6 } } },
      },
      {
        label: '무시한다',
        success: { text: '{rival:은} 무시당했다며 발을 동동 굴렀다. 앞으로 더 귀찮게 할 것 같다.', effect: { addRel: 'rival', rel: { rival: -15 }, stats: { cha: 2 } } },
      },
    ],
  },

  // ───── 무작위 ─────
  {
    id: 'c_fever', title: '감기', once: true, weight: 2,
    cond: { minAge: 1, maxAge: 5 },
    text: '한겨울, 몸이 화끈화끈 달아올랐다. 이세계 감기는 레벨이 다르다.',
    auto: {
      check: { stat: 'vit', dc: 16 },
      success: { text: '사흘 밤낮을 끙끙 앓고 나니 개운하게 털고 일어났다. 체력이 조금 붙은 기분!', effect: { stats: { vit: 4 } } },
      fail: { text: '열은 내렸지만 기운이 쭉 빠졌다. 당분간 무리는 금물이다.', effect: { stats: { vit: -16 }, zeroCause: 'illness' } },
    },
  },
  {
    id: 'c_lullaby', title: '자장가', once: true,
    cond: { minAge: 1, maxAge: 4 },
    text: '어머니가 처음 듣는 자장가를 불러주었다. 가사는 몰라도 왠지 코끝이 찡했다.',
    auto: { success: { text: '전생에서도 누군가 이런 노래를 불러준 것 같다. 이번 생은 잘 살아보자.', effect: { stats: { cha: 2, luck: 2 } } } },
  },
  {
    id: 'c_friend_play', title: '소꿉친구', weight: 3,
    cond: { minAge: 6, maxAge: 13, hasRel: ['friend'] },
    text: '{friend:이} 오늘도 문 앞에서 "놀자~!" 하고 기다리고 있다.',
    choices: [
      { label: '강가로 놀러 간다', success: { text: '해 질 때까지 물수제비를 떴다. {friend:이} 까르르 웃었다.', effect: { rel: { friend: 10 }, stats: { vit: 2 } } } },
      { label: '그림책을 읽어준다', success: { text: '{friend:은} 당신 목소리를 듣다가 새근새근 잠들었다.', effect: { rel: { friend: 8 }, stats: { int: 2 } } } },
      { label: '오늘은 바쁘다고 한다', success: { text: '{friend:은} 입을 삐죽 내밀고 돌아갔다. 그런데 다음 날에도, 그다음 날에도 문 앞에 있었다.', effect: { rel: { friend: -5 } } } },
    ],
  },
  {
    id: 'c_forest', title: '요정의 숲', weight: 2, focus: 'explore',
    cond: { minAge: 6, maxAge: 13 },
    text: '어른들이 들어가지 말라던 숲. 그 깊은 곳에서 파란 빛이 이리 오라는 듯 깜빡인다.',
    choices: [
      {
        label: '빛을 따라간다', check: { stat: 'luck', dc: 36 },
        success: { text: '이끼 낀 제단 위에서 따끈따끈한 파란 돌과 작은 은방울을 주웠다. 요정이 준 선물일까?', effect: { stats: { mana: 8, luck: 4 }, flags: ['relic'], trinket: { base: 't_fairy', rarity: 'rare' } } },
        fail: { text: '갑자기 나타난 늑대들에게 쫓겨 덤불 속에서 밤을 새웠다. 무릎이 다 까졌다.', effect: { stats: { vit: -16 } } },
      },
      { label: '얌전히 돌아간다', success: { text: '착한 아이는 어른 말을 듣는 법. 숲 쪽에서 아쉬운 듯한 바람이 불었다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_attic', title: '다락방의 비밀 책', once: true, focus: 'study', weight: 1.5,
    cond: { minAge: 6, maxAge: 14 },
    text: '다락방 상자 속에서 표지가 찢어진 책을 찾았다. 신전의 "봉인" 도장이 쾅 찍혀 있다. 두근두근.',
    choices: [
      {
        label: '몰래 읽는다', check: { stat: 'int', dc: 32 },
        success: { text: '금지된 술식이 잔뜩 적혀 있었다! 전생에서 갈고닦은 암기력으로 전부 외워버렸다.', effect: { stats: { int: 10, mana: 6 }, flags: ['forbidden_knowledge'] } },
        fail: { text: '글자는 읽히는데 무슨 소린지 하나도 모르겠다. 아직 레벨이 부족한 듯.', effect: { stats: { int: 2 } } },
      },
      { label: '신전에 가져다준다', success: { text: '신관님이 책을 받아 들고 한참 말이 없더니, 당신의 이름을 수첩에 적어 갔다. 칭찬… 이겠지?', effect: { karma: 6, stats: { fame: 2 } } } },
    ],
  },
  {
    id: 'c_carriage', title: '폭주 마차', once: true, weight: 1.5,
    cond: { minAge: 6, maxAge: 30, notHouses: ['noble'] },
    text: '진흙길 한복판에 넘어진 아이가 있다. 그리고 저 너머에서, 귀족의 마차가 브레이크 없이 달려온다! 이건… 이세계 트럭?!',
    choices: [
      {
        label: '몸을 날린다', check: { stat: 'vit', dc: 44 },
        success: { text: '아이를 안고 데굴데굴 굴렀다. 바퀴가 옷자락을 스치고 지나갔다. 마을 사람들의 박수가 쏟아졌다!', effect: { stats: { fame: 16 }, karma: 12 } },
        fail: { text: '아이를 길가로 밀어냈다. …그리고 익숙한 하얀 빛. 아, 이 전개 어디서 봤는데.', effect: { karma: 12, death: 'carriage' } },
      },
      {
        label: '크게 소리친다', check: { stat: 'cha', dc: 36 },
        success: { text: '"비켜어어!" 아이는 아슬아슬하게 길가로 굴러 나왔다. 휴우.', effect: { karma: 5 } },
        fail: { text: '목소리가 말발굽 소리에 묻혀버렸다. 다행히 아이는 무사했지만, 그날 밤 잠이 오지 않았다.', effect: { karma: 2, stats: { cha: -4 } } },
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
        label: '막아선다', check: { stat: 'vit', dc: 40 },
        success: { text: '영주 아들이 코를 감싸 쥐고 줄행랑쳤다! 마을 아이들이 "대장!"이라 부르기 시작했다.', effect: { stats: { fame: 6, vit: 2 }, karma: 5 } },
        fail: { text: '얻어맞은 건 당신이었다. 게다가 그 아버지가 소작료까지 올렸다. 치사하다!', effect: { stats: { vit: -12 } } },
      },
      { label: '모른 척한다', success: { text: '처세술이 1 올랐다. …별로 기쁘지 않다.', effect: { stats: { cha: 2 }, karma: -2 } } },
    ],
  },
  {
    id: 'c_noble_lesson', title: '귀족 수업', weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['noble'] },
    text: '예법, 검술, 역사, 춤! 대공가 아이의 스케줄표는 빈칸이 없다.',
    auto: { success: { text: '가정교사의 잔소리 속에서 한 해가 훌쩍 지나갔다. 그래도 제법 귀족다워졌다.', effect: { stats: { cha: 4, int: 2, vit: 2 } } } },
  },
  {
    id: 'c_prodigy_visit', title: '궁정 마법사의 방문', once: true, weight: 4,
    cond: { minAge: 8, maxAge: 12, test: (s) => s.flags.includes('prodigy') || s.flags.includes('gifted') },
    text: '신동 소문을 듣고 궁정 마법사가 찾아왔다! 긴 수염의 할아버지가 당신을 흥미롭게 내려다본다.',
    choices: [
      { label: '제자가 된다', success: { text: '대마법사 {mentor:이} 싱긋 웃으며 반짝이는 지팡이를 건넸다. 오늘부터 마법 수업 시작!', effect: { addRel: 'mentor', stats: { mana: 8, int: 4 }, flags: ['apprentice'], item: { base: 'w1', rarity: 'rare', name: '반짝이는 지팡이' } }, tone: 'good' } },
      { label: '거절한다', success: { text: '"허허, 아쉽구먼." 할아버지는 사탕 하나를 쥐여주고 떠났다.', effect: { stats: { luck: 4 } } } },
    ],
  },
  {
    id: 'c_market', title: '시장의 흥정', weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['merchant'] },
    text: '아버지가 이국의 상인과 향신료 값으로 옥신각신하고 있다.',
    choices: [
      {
        label: '흥정에 끼어든다', check: { stat: 'int', dc: 32 },
        success: { text: '전생의 암산 실력이 빛을 발했다! 이국 상인이 "이 꼬마 뭐야?!" 하고 혀를 내둘렀다.', effect: { stats: { int: 4, cha: 4, fame: 2 } } },
        fail: { text: '아버지가 웃으며 당신의 입을 살포시 막았다.', effect: { stats: { cha: -2 } } },
      },
      { label: '구경한다', success: { text: '말 한마디에 값이 오르락내리락. 장사란 신기하다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_demon_child', title: '인간 포로', once: true, weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['demon'] },
    text: '마왕군의 아이들은 인간을 겁주는 법부터 배운다. 오늘은 잡혀 온 인간 소년이 당신 앞에 섰다.',
    choices: [
      { label: '명령대로 겁을 준다', success: { text: '소년은 엉엉 울며 도망쳤다. 아버지는 흡족해했지만, 왠지 마음 한구석이 따끔했다.', effect: { karma: -15, stats: { mana: 6, vit: 4 } }, tone: 'bad' } },
      {
        label: '몰래 풀어준다', check: { stat: 'luck', dc: 36 },
        success: { text: '"쉿, 이쪽이야." 소년은 고맙다는 말 대신 꾸벅 고개를 숙이고 사라졌다.', effect: { karma: 15, flags: ['spared_human'] } },
        fail: { text: '들켜버렸다! 아버지에게 엄청나게 혼나고 일주일 동안 외출 금지를 당했다.', effect: { karma: 10, stats: { vit: -20 } } },
      },
    ],
  },
  {
    id: 'c_famine', title: '흉년', weight: 1,
    cond: { minAge: 4, maxAge: 40, houses: ['farm'], notJobs: ['knight', 'mage', 'merchant', 'priest'] },
    text: '올해는 흉년이다. 곳간이 텅텅 비어가고, 이웃집 꼬마가 배를 곯는다는 소문이 들린다.',
    choices: [
      { label: '이웃과 나눈다', success: { text: '모두 조금씩 배고팠지만, 다 같이 봄을 맞이했다. 마을 인심이 훈훈해졌다.', effect: { karma: 10, stats: { vit: -16 }, zeroCause: 'famine' } } },
      { label: '우리 가족 몫을 지킨다', success: { text: '문을 꼭 걸어 잠갔다. 그 겨울, 이웃집 굴뚝 연기가 유난히 가늘었다.', effect: { karma: -6, stats: { vit: -6 }, zeroCause: 'famine' } } },
      {
        label: '눈 덮인 숲으로 사냥을 나간다', check: { stat: 'luck', dc: 40 },
        success: { text: '커다란 사슴을 끌고 돌아왔다! 오늘 밤은 마을 전체가 고기 파티다!', effect: { stats: { vit: 4, fame: 4 } } },
        fail: { text: '빈손으로, 꽁꽁 언 발로 돌아왔다. 콧물이 고드름이 됐다.', effect: { stats: { vit: -28 }, zeroCause: 'famine' } },
      },
    ],
  },
  {
    id: 'c_plague', title: '유행병', once: true, weight: 0.4,
    cond: { minAge: 12, maxAge: 90 },
    text: '왕국에 지독한 유행병이 돌고 있다. 거리마다 기침 소리가 가득하다.',
    auto: {
      check: { stat: 'vit', dc: 32 },
      success: { text: '며칠 끙끙 앓았지만 거짓말처럼 나았다. 면역력 만세!', effect: { stats: { vit: -6 } } },
      fail: { text: '이번 병은 독했다. 몸이 쉽게 회복되지 않는다.', effect: { stats: { vit: -40 }, zeroCause: 'plague' } },
    },
  },

  // ───── 유년기 범용 일상 (누구에게나 · 반복) ─────
  // 연결: 친구(기지·싸움) · 강아지 · 할머니 전설→동굴 · 글방 · 서재→이야기 대회 · 등불 소원 · 음유시인

  // 친구
  {
    id: 'c_new_kid', title: '새로 온 아이', weight: 2,
    cond: { minAge: 4, maxAge: 12, notRel: ['friend'] },
    text: '장터 구석에서 혼자 돌멩이를 쌓는 아이가 있다. 눈이 마주치자 고개를 휙 돌렸다.',
    choices: [
      { label: '돌멩이를 같이 쌓는다', success: { text: '탑이 와르르 무너지자 둘 다 배를 잡고 웃었다. 이름은 {friend}. 오늘부터 단짝이다!', effect: { addRel: 'friend', rel: { friend: 15 } }, tone: 'good' } },
      { label: '말을 걸어 본다', check: { stat: 'cha', dc: 36 },
        success: { text: '"같이 놀래?" 아이의 얼굴이 환해졌다. {friend:은} 금세 당신의 그림자처럼 따라다녔다.', effect: { addRel: 'friend', rel: { friend: 10 }, stats: { cha: 2 } } },
        fail: { text: '너무 큰 목소리에 아이가 도망쳐 버렸다. 다음엔 조금 더 살살 다가가자.', effect: { stats: { cha: 2 } } } },
      { label: '지나친다', success: { text: '모르는 아이에게 말을 거는 건 역시 어렵다. 돌탑만 한참 돌아보았다.', effect: {} } },
    ],
  },
  {
    id: 'c_secret_base', title: '우리만의 비밀기지', weight: 1.5,
    cond: { minAge: 6, maxAge: 12, hasRel: ['friend'], notFlags: ['secret_base'] },
    text: '{friend:이} 속삭인다. "있잖아, 헛간 뒤에 아무도 모르는 빈 공간을 찾았어!"',
    choices: [
      { label: '둘이서 꾸민다', success: { text: '나무 상자는 의자가, 낡은 천은 지붕이 되었다. 여기부터가 우리 나라다!', effect: { rel: { friend: 12 }, flags: ['secret_base'], stats: { int: 2 } }, tone: 'good' } },
      { label: '어른들께 말한다', success: { text: '"어머나, 기특하구나." 칭찬은 받았지만 {friend:은} 삐쳐서 한동안 말이 없었다.', effect: { rel: { friend: -10 }, karma: 2 } } },
    ],
  },
  {
    id: 'c_base_night', title: '기지에서 보낸 밤', weight: 1.5,
    cond: { minAge: 7, maxAge: 12, hasRel: ['friend'], flags: ['secret_base'] },
    text: '비밀기지 지붕 틈으로 별이 쏟아진다. {friend:이} 담요를 끌어당기며 소곤댄다.',
    choices: [
      { label: '별자리 이야기를 지어낸다', check: { stat: 'int', dc: 36 },
        success: { text: '"저 별은 용의 눈이야!" 둘 다 믿어 버릴 만큼 그럴듯했다.', effect: { rel: { friend: 10 }, stats: { int: 4 }, mood: 'joy' } },
        fail: { text: '이야기가 산으로 갔다. 결국 둘 다 킥킥대다 잠들었다.', effect: { rel: { friend: 6 } } } },
      { label: '몰래 간식을 나눠 먹는다', success: { text: '딱딱한 빵도 이럴 땐 진수성찬이다. 다음 날 아침 아랫배가 조금 아팠다.', effect: { rel: { friend: 8 }, stats: { vit: -2 } } } },
    ],
  },
  {
    id: 'c_quarrel', title: '단짝과 다툼', weight: 1,
    cond: { minAge: 6, maxAge: 12, hasRel: ['friend'], notFlags: ['quarreled'] },
    text: '장난감 목검을 서로 먼저 잡겠다고 실랑이하다, "이제 너랑 안 놀아!"라는 말이 튀어나왔다.',
    choices: [
      { label: '먼저 돌아선다', success: { text: '붉어진 얼굴로 집에 돌아왔다. 하루 종일 마음이 무거웠다.', effect: { rel: { friend: -15 }, flags: ['quarreled'], mood: 'gloom' } } },
      { label: '"내가 미안해!"라고 한다', check: { stat: 'cha', dc: 40 },
        success: { text: '{friend:은} 눈이 동그래졌다가 "…나도"라며 웃었다. 싸움은 5분 만에 끝났다.', effect: { rel: { friend: 8 }, stats: { cha: 4 }, mood: 'joy' } },
        fail: { text: '사과가 늦었는지, {friend:은} 쌩하고 가 버렸다. 가슴이 콕콕 쑤신다.', effect: { rel: { friend: -10 }, flags: ['quarreled'], mood: 'gloom' } } },
    ],
  },
  {
    id: 'c_make_up', title: '어색한 화해', weight: 4,
    cond: { minAge: 6, maxAge: 12, hasRel: ['friend'], flags: ['quarreled'] },
    text: '다툰 뒤로 {friend:과} 눈도 못 마주친다. 그런데 오늘, 문 앞에 작은 꾸러미가 놓여 있다.',
    choices: [
      { label: '꾸러미를 들고 찾아간다', success: { text: '안에는 삐뚤빼뚤한 쿠키가 들어 있었다. 서로 "탔네!" 하며 웃자 앙금이 사라졌다.', effect: { rel: { friend: 20 }, unflags: ['quarreled'], mood: 'joy' }, tone: 'good' } },
      { label: '모른 척 두고 본다', success: { text: '꾸러미는 다음 날에도 그대로였다. 쿠키는 눅눅해졌고, 거리는 더 멀어졌다.', effect: { rel: { friend: -10 }, unflags: ['quarreled'], mood: 'gloom' } } },
    ],
  },

  // 강아지
  {
    id: 'c_stray_pup', title: '떠돌이 강아지', weight: 2,
    cond: { minAge: 4, maxAge: 12, notFlags: ['has_pup'] },
    text: '골목 모퉁이에서 꼬질꼬질한 강아지가 졸졸 따라온다. 꼬리를 얼마나 흔드는지 엉덩이째 흔들린다.',
    choices: [
      { label: '집에 데려간다', check: { stat: 'cha', dc: 36 },
        success: { text: '부모님은 한숨을 쉬었지만, 강아지가 발치에서 배를 보이자 항복했다. 식구가 늘었다!', effect: { flags: ['has_pup'], stats: { luck: 2 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '"안 돼, 원래 있던 곳에 두고 와." 강아지는 대문 앞에서 한참 앉아 있었다.', effect: { mood: 'gloom' } } },
      { label: '빵 조각만 나눠 준다', success: { text: '강아지는 빵을 꿀꺽 삼키고 만족스럽게 트림했다. 다음에 또 보자!', effect: { karma: 2 } } },
    ],
  },
  {
    id: 'c_pup_trick', title: '강아지 훈련', weight: 3, focus: 'train',
    cond: { minAge: 5, maxAge: 12, flags: ['has_pup'] },
    text: '강아지에게 "앉아!"를 가르치는 중이다. 강아지는 열심히 드러누웠다.',
    choices: [
      { label: '끈기 있게 가르친다', check: { stat: 'int', dc: 36 },
        success: { text: '드디어 앉았다! 이어서 손도 주고, 공도 물어 왔다. 마을 아이들이 구경하러 모여들었다.', effect: { stats: { int: 2, cha: 4, fame: 2 } } },
        fail: { text: '강아지는 앉는 법 대신 땅을 파는 법을 익혔다. 마당이 곰보가 되었다.', effect: { stats: { vit: 2 } } } },
      { label: '그냥 같이 뛰어논다', success: { text: '해가 질 때까지 마당을 몇 바퀴나 뛰었는지 모른다. 둘 다 혀를 쑥 내밀고 뻗었다.', effect: { stats: { vit: 4 } } } },
    ],
  },
  {
    id: 'c_pup_lost', title: '사라진 강아지', weight: 1,
    cond: { minAge: 5, maxAge: 12, flags: ['has_pup'] },
    text: '아침부터 강아지가 보이지 않는다. 밥그릇만 덩그러니 놓여 있다.',
    choices: [
      { label: '온 동네를 뒤진다', check: { stat: 'luck', dc: 40 },
        success: { text: '방앗간 지붕 아래 새끼 쥐를 지키던 강아지를 찾았다! 어째 이 녀석이 더 뿌듯해 보인다.', effect: { stats: { luck: 4, vit: 2 }, mood: 'joy' } },
        fail: { text: '해가 지도록 찾았지만 흔적도 없다. 이튿날 아침, 강아지는 시치미를 떼고 문 앞에서 기다리고 있었다.', effect: { stats: { vit: -4 }, mood: 'calm' } } },
      { label: '밥그릇을 문 앞에 둔다', success: { text: '기다리다 잠이 들었다. 새벽에 따뜻한 혀가 볼을 핥았다. 돌아왔구나.', effect: { stats: { luck: 2 } } } },
    ],
  },
  {
    id: 'c_pup_guard', title: '짖는 강아지', weight: 1,
    cond: { minAge: 6, maxAge: 12, flags: ['has_pup'] },
    text: '한밤중 강아지가 숲 쪽을 보며 으르렁댄다. 덤불 속에서 두 개의 눈이 반짝인다.',
    choices: [
      { label: '강아지를 안고 물러선다', success: { text: '숨을 죽이고 기다렸더니 눈동자는 멧돼지 가족이었다. 강아지는 용감한 척 마지막까지 짖었다.', effect: { stats: { luck: 2 }, karma: 1 } } },
      { label: '횃불을 들고 쫓아낸다', check: { stat: 'vit', dc: 44 },
        success: { text: '횃불을 휙휙 돌리자 멧돼지가 후다닥 달아났다. 강아지는 마치 자기가 쫓아낸 듯 으스댔다.', effect: { stats: { vit: 4, fame: 4 }, mood: 'joy' } },
        fail: { text: '횃불을 놓쳐 앞머리가 살짝 그을렸다. 멧돼지는 비웃듯 느긋하게 사라졌다.', effect: { stats: { vit: -6, cha: -2 } } } },
    ],
  },

  // 할머니 이야기 → 동굴
  {
    id: 'c_grandma_tale', title: '할머니의 옛날이야기', weight: 2,
    cond: { minAge: 3, maxAge: 12, notFlags: ['heard_legend'] },
    text: '화롯가에서 이웃집 할머니가 속삭인다. "옛날 옛적, 저 뒷산 바위틈에 용이 낮잠을 자고 있었단다."',
    choices: [
      { label: '눈을 반짝이며 듣는다', success: { text: '밤새 용의 꿈을 꿨다. 내일은 뒷산에 가 봐야겠다는 생각이 머리를 떠나지 않는다.', effect: { flags: ['heard_legend'], stats: { int: 2 }, mood: 'joy' } } },
      { label: '무섭다며 귀를 막는다', success: { text: '할머니가 껄껄 웃으며 엿 한 조각을 쥐여 주었다. 이야기는 다음에 이어서 해 주신단다.', effect: { stats: { cha: 2 } } } },
    ],
  },
  {
    id: 'c_legend_hunt', title: '전설의 바위틈', weight: 2, focus: 'explore',
    cond: { minAge: 7, maxAge: 12, flags: ['heard_legend'], notFlags: ['found_cave'] },
    text: '할머니가 말한 뒷산 바위. 풀숲을 헤치자 이끼 낀 틈새가 입을 벌리고 있다.',
    choices: [
      { label: '틈새를 파헤쳐 본다', check: { stat: 'luck', dc: 40 },
        success: { text: '바위 뒤에서 어른 한 명쯤 지나갈 작은 동굴이 나타났다! 서늘한 바람이 불어 나온다.', effect: { flags: ['found_cave'], stats: { luck: 4 } }, tone: 'good' },
        fail: { text: '쥐 한 마리가 튀어나와 놀라 뒤로 넘어졌다. 용은 아직 낮잠 중인가 보다.', effect: { stats: { vit: -4 } } } },
      { label: '근처에서 도토리만 줍는다', success: { text: '주머니 가득 도토리를 주워 돌아왔다. 용은 못 봤지만 다람쥐와는 친해졌다.', effect: { stats: { vit: 2 } } } },
    ],
  },
  {
    id: 'c_cave_deeper', title: '동굴 안쪽', weight: 3, focus: 'explore',
    cond: { minAge: 8, maxAge: 12, flags: ['found_cave'] },
    text: '동굴 안쪽에서 희미하게 물 떨어지는 소리가 난다. 벽에는 누군가 새겨 둔 낙서가 있다.',
    choices: [
      { label: '횃불을 들고 들어간다', check: { stat: 'vit', dc: 44 },
        success: { text: '끝에는 반짝이는 광석이 잔뜩 박힌 작은 방이 있었다! 용은 없었지만 이 정도면 충분하다.', effect: { gold: 30, stats: { vit: 2, fame: 2 }, unflags: ['found_cave'] }, tone: 'good' },
        fail: { text: '발을 헛디뎌 웅덩이에 풍덩! 홀딱 젖은 채 돌아왔다. 감기는 덤이다.', effect: { stats: { vit: -12 }, unflags: ['found_cave'] } } },
      { label: '낙서만 따라 그리고 돌아간다', success: { text: '그림 속에 용 비슷한 게 있었다. 베낀 그림은 비밀 보물처럼 간직하기로 했다.', effect: { stats: { int: 4 }, unflags: ['found_cave'] } } },
    ],
  },

  // 계절·축제
  {
    id: 'c_spring_planting', title: '봄 씨뿌리기', weight: 1.5,
    cond: { minAge: 4, maxAge: 12 },
    text: '봄볕이 따뜻하다. 마을 곳곳에서 어른들이 밭을 갈고 씨를 뿌린다. 꼬마들도 작은 호미를 쥐었다.',
    choices: [
      { label: '열심히 돕는다', success: { text: '손톱 밑이 까매졌지만 새싹이 올라올 날이 벌써 기다려진다.', effect: { stats: { vit: 4 }, karma: 2 } } },
      { label: '지렁이를 구경한다', success: { text: '지렁이의 삶은 의외로 바쁘다. 어른들이 "얘는 또 딴짓이네" 하고 웃었다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_summer_river', title: '여름 강가', weight: 2,
    cond: { minAge: 5, maxAge: 12 },
    text: '푹푹 찌는 한여름, 아이들이 하나둘 강으로 뛰어든다. 물살이 오늘따라 조금 빠르다.',
    choices: [
      { label: '깊은 쪽까지 헤엄친다', check: { stat: 'vit', dc: 44 },
        success: { text: '건너편 바위까지 헤엄쳐 갔다! 아이들이 환호하며 이름을 외쳤다.', effect: { stats: { vit: 4, fame: 4 } }, tone: 'good' },
        fail: { text: '발이 닿지 않아 허우적대다 구조되었다. 한동안 물이 무서워질 것 같다.', effect: { stats: { vit: -10 }, mood: 'fear' } } },
      { label: '얕은 곳에서 물장구', success: { text: '송사리를 쫓다 보니 어느새 해가 저물었다. 얼굴이 새빨갛게 탔다.', effect: { stats: { vit: 2 }, mood: 'joy' } } },
    ],
  },
  {
    id: 'c_harvest_fest', title: '추수 축제', weight: 2,
    cond: { minAge: 4, maxAge: 12 },
    text: '황금빛 들판 위로 북소리가 울린다. 광장에는 떡과 과일, 춤추는 어른들로 가득하다.',
    choices: [
      { label: '춤판에 뛰어든다', check: { stat: 'cha', dc: 40 },
        success: { text: '엉터리 춤이었는데 박수가 쏟아졌다! 누군가 꿀떡을 입에 넣어 주었다.', effect: { stats: { cha: 4, fame: 4 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '스텝이 꼬여 대자로 넘어졌다. 어른들이 웃음을 터뜨렸지만, 같이 웃어 버렸다.', effect: { stats: { cha: 2 } } } },
      { label: '먹거리 구경을 다닌다', success: { text: '떡, 엿, 구운 밤. 배가 빵빵해져 집까지 굴러가는 기분이었다.', effect: { stats: { vit: 2 }, mood: 'joy' } } },
    ],
  },
  {
    id: 'c_lantern_fest', title: '등불 축제', weight: 1.5,
    cond: { minAge: 4, maxAge: 12, notFlags: ['lantern_wish'] },
    text: '밤하늘로 수백 개의 등불이 둥실 떠오른다. 등에 소원을 적으면 하늘에 닿는다고 한다.',
    choices: [
      { label: '소원을 정성껏 적는다', success: { text: '"…이번 생은 꼭 행복하게!" 등불이 별들 사이로 작아질 때까지 눈을 떼지 못했다.', effect: { flags: ['lantern_wish'], stats: { luck: 2 }, mood: 'calm' } } },
      { label: '그냥 구경만 한다', success: { text: '수많은 불빛이 눈동자에 비쳤다. 소원은 다음 해로 미뤄 두었다.', effect: { mood: 'calm' } } },
    ],
  },
  {
    id: 'c_wish_answered', title: '소원의 흔적', weight: 3,
    cond: { minAge: 5, maxAge: 12, flags: ['lantern_wish'] },
    text: '작년에 띄운 등불의 조각이 바람에 실려 마당으로 떨어졌다. 아직 소원 글씨가 어렴풋하다.',
    choices: [
      { label: '소중히 간직한다', success: { text: '품속에 넣어 두니 왠지 기운이 난다. 언젠가 정말 이루어질 것 같다.', effect: { unflags: ['lantern_wish'], stats: { luck: 4 }, mood: 'joy' }, tone: 'good' } },
      { label: '다시 띄워 보낸다', check: { stat: 'luck', dc: 40 },
        success: { text: '불꽃이 되살아나 하늘로 올라갔다. 그날 밤 길에서 은화 한 닢을 주웠다.', effect: { unflags: ['lantern_wish'], gold: 10, stats: { luck: 2 } } },
        fail: { text: '등불은 몇 미터 못 가서 나뭇가지에 걸렸다. 소원은 나중에 직접 이뤄야겠다.', effect: { unflags: ['lantern_wish'], stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_winter_snow', title: '첫눈 오는 날', weight: 2,
    cond: { minAge: 3, maxAge: 12 },
    text: '밤새 눈이 소복이 쌓였다. 온 마을이 하얀 이불을 덮은 듯 조용하다.',
    choices: [
      { label: '커다란 눈사람을 만든다', check: { stat: 'vit', dc: 36 },
        success: { text: '키가 어른보다 큰 눈사람이 완성되었다! 지나가던 행인이 거수경례를 하고 갔다.', effect: { stats: { vit: 2, fame: 2 }, mood: 'joy' } },
        fail: { text: '머리를 올리다 눈사람이 와르르 무너졌다. 눈 속에서 웃고 있는 건 당신이었다.', effect: { stats: { vit: -2 }, mood: 'joy' } } },
      { label: '눈싸움 대장이 된다', success: { text: '눈덩이 방어벽을 세우고 마을 아이들과 한바탕 전쟁을 벌였다. 승패는 아무도 기억하지 못한다.', effect: { stats: { vit: 4, cha: 2 } } } },
    ],
  },

  // 글방·서재
  {
    id: 'c_village_school', title: '마을 글방', weight: 2, focus: 'study',
    cond: { minAge: 5, maxAge: 12, notFlags: ['school_kid'] },
    text: '촌장 댁 사랑방이 글방이 되었다. 칠판 앞에 선 선생님이 분필을 휙 돌리며 외쳤다. "자, 오늘부터 시작이다!"',
    choices: [
      { label: '맨 앞자리에 앉는다', success: { text: '선생님이 흡족한 얼굴로 고개를 끄덕였다. 오늘부터 글방 학생이다.', effect: { flags: ['school_kid'], stats: { int: 4 } }, tone: 'good' } },
      { label: '창가 자리에 앉는다', success: { text: '창밖 참새가 더 재미있었지만, 그래도 이름은 쓰는 법을 배웠다.', effect: { flags: ['school_kid'], stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_test_day', title: '글방 시험날', weight: 2, focus: 'study',
    cond: { minAge: 6, maxAge: 12, flags: ['school_kid'] },
    text: '선생님이 종이를 나눠 주셨다. 한 줄 위에 적힌 문제가 낯설다. 옆자리 아이의 답안이 슬쩍 보인다.',
    choices: [
      { label: '내 힘으로 푼다', check: { stat: 'int', dc: 40 },
        success: { text: '전생의 암산이 번쩍였다. 선생님이 점수를 보더니 "이 아이 뭐야?" 하고 고개를 갸웃했다.', effect: { stats: { int: 6, fame: 2 }, karma: 1 }, tone: 'good' },
        fail: { text: '반쯤 풀고 시간이 끝났다. 점수는 아슬아슬했지만 정직한 점수다.', effect: { stats: { int: 2 }, karma: 1 } } },
      { label: '옆자리를 슬쩍 본다', check: { stat: 'luck', dc: 44 },
        success: { text: '다행히 그 아이의 답이 맞았다. 가슴이 두근거렸지만 들키지 않았다.', effect: { karma: -3, stats: { int: 2 } } },
        fail: { text: '선생님과 눈이 딱 마주쳤다. 복도에서 양동이를 들고 한 시간을 서 있었다.', effect: { karma: -2, stats: { cha: -4 } } } },
    ],
  },
  {
    id: 'c_library_corner', title: '서재의 구석 자리', weight: 1.5, focus: 'study',
    cond: { minAge: 6, maxAge: 12, notFlags: ['book_lover'] },
    text: '촌장 댁 서재 구석에서 먼지 쌓인 그림 이야기책을 발견했다. 표지에는 용사와 용이 그려져 있다.',
    choices: [
      { label: '끝까지 읽는다', check: { stat: 'int', dc: 32 },
        success: { text: '해가 지는 줄도 모르고 읽었다. 글자가 이야기가 되는 순간, 세계가 하나 더 생겼다.', effect: { flags: ['book_lover'], stats: { int: 6 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '어려운 단어가 많아 졸고 말았다. 그래도 그림은 마음에 쏙 들었다.', effect: { flags: ['book_lover'], stats: { int: 2 } } } },
      { label: '그림만 훑어본다', success: { text: '용 그림이 제일 멋있었다. 삐뚤빼뚤하게 따라 그리다 보니 조금 늘었다.', effect: { stats: { cha: 2 } } } },
    ],
  },
  {
    id: 'c_story_contest', title: '마을 이야기 대회', weight: 3,
    cond: { minAge: 7, maxAge: 12, flags: ['book_lover'] },
    text: '축제 마지막 날, 무대에서 이야기 대회가 열린다. "읽은 이야기를 들려줄 사람?" 주변에서 모두 당신을 쳐다본다.',
    choices: [
      { label: '앞으로 나가 들려준다', check: { stat: 'cha', dc: 44 },
        success: { text: '용사와 용의 모험을 몸짓까지 섞어 들려주자 객석이 숨을 죽였다. 우승 상품은 자루 가득한 사탕이다!', effect: { stats: { cha: 6, fame: 6 }, unflags: ['book_lover'], mood: 'joy' }, tone: 'good' },
        fail: { text: '긴장해서 결말을 잊어버렸다. "그래서 다들 행복했대요!" 하고 급히 끝내자 오히려 박수가 나왔다.', effect: { stats: { cha: 2 }, unflags: ['book_lover'] } } },
      { label: '객석에서 응원만 한다', success: { text: '다른 아이들의 이야기를 들으며 다음엔 나도 해 보고 싶다고 생각했다.', effect: { stats: { int: 2 } } } },
    ],
  },

  // 가족·일상
  {
    id: 'c_mom_cooking', title: '어머니의 부엌', weight: 2,
    cond: { minAge: 3, maxAge: 12 },
    text: '구수한 냄새가 코를 간질인다. 어머니가 앞치마를 두른 채 손짓한다. "와서 도와줄래?"',
    choices: [
      { label: '반죽을 주무른다', success: { text: '밀가루 범벅이 되었지만 저녁 식탁에 올라온 건 당신이 빚은 만두였다. 약간 못생겼다.', effect: { stats: { vit: 2, cha: 2 }, mood: 'joy' } } },
      { label: '몰래 맛을 본다', check: { stat: 'luck', dc: 36 },
        success: { text: '한 입 쏙, 들키지 않았다! 만족감과 죄책감이 동시에 밀려왔다.', effect: { stats: { luck: 2 } } },
        fail: { text: '"그 손은 뭐니?" 어머니의 국자가 정확히 손등 위에서 멈췄다. 압도적인 위압감이었다.', effect: { stats: { cha: -2 } } } },
    ],
  },
  {
    id: 'c_dad_fishing', title: '아버지와 낚시', weight: 2,
    cond: { minAge: 5, maxAge: 12 },
    text: '아버지가 낚싯대를 하나 더 챙겼다. "오늘은 둘이서 큰놈 한 마리 잡아 보자꾸나."',
    choices: [
      { label: '숨죽이고 기다린다', check: { stat: 'luck', dc: 40 },
        success: { text: '찌가 쑥 가라앉았다! 팔뚝만 한 잉어를 낚아 올리자 아버지가 어깨를 두드렸다.', effect: { stats: { luck: 4, vit: 2 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '한 마리도 못 잡고 장화만 흠뻑 젖었다. 아버지는 웃으며 "그래도 즐거웠지?"라고 했다.', effect: { stats: { vit: 2 } } } },
      { label: '물수제비를 뜬다', success: { text: '돌이 열두 번 튀었다! 아버지가 입을 떡 벌렸다. 물고기들은 멀리 도망쳤다.', effect: { stats: { vit: 2, fame: 2 } } } },
    ],
  },
  {
    id: 'c_birthday', title: '생일날', weight: 2,
    cond: { minAge: 2, maxAge: 12 },
    text: '오늘은 당신의 생일이다. 식탁 위에 따뜻한 국과 작은 케이크가 놓여 있다.',
    choices: [
      { label: '촛불을 불며 소원을 빈다', success: { text: '후우! 촛불이 한 번에 꺼졌다. 온 가족이 박수를 치며 노래해 주었다.', effect: { stats: { luck: 2, cha: 2 }, mood: 'joy' } } },
      { label: '케이크를 이웃과 나눈다', success: { text: '작은 케이크는 조각조각 나뉘었지만 대문을 열 때마다 "생일 축하해!"가 돌아왔다.', effect: { karma: 4, stats: { cha: 2 }, mood: 'joy' } } },
    ],
  },

  // 작은 모험·만남
  {
    id: 'c_traveling_merchant', title: '떠돌이 행상', weight: 1.5,
    cond: { minAge: 5, maxAge: 12 },
    text: '낯선 마차가 마을 어귀에 멈췄다. 행상이 보따리를 풀자 처음 보는 신기한 물건이 줄줄이 나온다.',
    choices: [
      { label: '심부름을 도와준다', check: { stat: 'vit', dc: 36 },
        success: { text: '무거운 짐을 옮겨 주자 행상이 은화 한 닢과 사탕을 쥐여 주었다. "꼬마 일꾼, 고맙구나!"', effect: { gold: 8, stats: { vit: 2 } } },
        fail: { text: '짐을 들다 넘어져 병을 하나 깼다. 행상은 껄껄 웃었지만 한참 사과해야 했다.', effect: { stats: { cha: 2, vit: -2 } } } },
      { label: '신기한 물건을 구경한다', success: { text: '반짝이는 유리구슬, 모양이 이상한 열쇠, 먼 나라의 지도. 세상은 생각보다 훨씬 크다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_wandering_bard', title: '떠돌이 음유시인', weight: 1.5, focus: 'social',
    cond: { minAge: 5, maxAge: 12, notFlags: ['bard_song'] },
    text: '광장 분수대 위에서 류트 소리가 울린다. 낯선 음유시인이 용사의 노래를 부르고 있다.',
    choices: [
      { label: '앞줄에서 따라 부른다', check: { stat: 'cha', dc: 36 },
        success: { text: '후렴구를 따라 불렀더니 시인이 윙크했다. "어, 쓸 만한데?" 노래 한 소절이 귀에 박혔다.', effect: { flags: ['bard_song'], stats: { cha: 4 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '음정이 하늘로 날아가 비둘기들이 일제히 날아올랐다. 시인은 어깨를 들썩이며 웃었다.', effect: { stats: { cha: 2 } } } },
      { label: '조용히 귀 기울인다', success: { text: '가사를 곱씹으며 돌아왔다. 어른이 되면 이런 노래의 주인공이 되고 싶다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'c_bard_encore', title: '노래의 메아리', weight: 3,
    cond: { minAge: 6, maxAge: 12, flags: ['bard_song'] },
    text: '시인에게 배운 노래를 흥얼거리며 걷는데, 어느새 동네 아이들이 줄줄이 뒤를 따라온다.',
    choices: [
      { label: '합창대를 만든다', check: { stat: 'cha', dc: 44 },
        success: { text: '골목이 노래로 가득 찼다! 창문마다 어른들이 고개를 내밀고 박수를 쳤다.', effect: { unflags: ['bard_song'], stats: { cha: 6, fame: 4 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '박자가 제각각이라 개구리 합창단 같았다. 그래도 다들 즐거워 보인다.', effect: { unflags: ['bard_song'], stats: { cha: 2 } } } },
      { label: '혼자 조용히 부른다', success: { text: '잠들기 전 이불 속에서 속삭이듯 불렀다. 꿈속에서 시인이 박수를 쳐 주었다.', effect: { unflags: ['bard_song'], mood: 'calm' } } },
    ],
  },
  {
    id: 'c_thunderstorm', title: '천둥 치는 밤', weight: 1.5,
    cond: { minAge: 3, maxAge: 12 },
    text: '우르릉 쾅! 번개가 방 안을 하얗게 밝힌다. 이불 속에서 심장이 쿵쾅거린다.',
    choices: [
      { label: '부모님 방으로 달려간다', success: { text: '말없이 이불을 들어 주는 품이 따뜻했다. 천둥은 어느새 자장가가 되었다.', effect: { mood: 'calm', stats: { luck: 2 } } } },
      { label: '창문으로 번개를 구경한다', check: { stat: 'vit', dc: 40 },
        success: { text: '번쩍! 하늘이 갈라지는 걸 끝까지 보았다. 왠지 가슴 깊은 곳에서 힘이 솟았다.', effect: { stats: { mana: 4, vit: 2 } }, tone: 'good' },
        fail: { text: '번개 소리에 놀라 의자째 뒤로 넘어졌다. 이마에 혹이 하나 생겼다.', effect: { stats: { vit: -4 }, mood: 'fear' } } },
    ],
  },
  {
    id: 'c_old_well', title: '오래된 우물', weight: 1,
    cond: { minAge: 5, maxAge: 12 },
    text: '마을 끝 낡은 우물에서 메아리가 울린다. 안쪽을 들여다보며 소리치면 누군가 대답하는 것 같다.',
    choices: [
      { label: '크게 소원을 외친다', check: { stat: 'luck', dc: 40 },
        success: { text: '"…해라!" 메아리가 세 번 돌아오더니 두레박에 반짝이는 동전이 걸려 올라왔다.', effect: { gold: 5, stats: { luck: 4 } }, tone: 'good' },
        fail: { text: '메아리 대신 개구리가 대답했다. 개굴. 이것도 인연이려니 한다.', effect: { stats: { cha: 2 } } } },
      { label: '두레박만 조용히 내린다', success: { text: '시원한 물 한 모금이 달았다. 우물 속 얼굴이 어딘가 의젓해 보였다.', effect: { stats: { vit: 2 } } } },
    ],
  },
];
