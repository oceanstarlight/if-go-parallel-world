import type { GameEvent } from '../../types';

/** 0~14세 */
export const CHILDHOOD: GameEvent[] = [
  // ───── 이정표 ─────
  {
    id: 'm_awaken3', title: '마력 각성', milestone: true,
    cond: { minAge: 3, maxAge: 3 },
    text: '세 번째 겨울, 처음으로 몸 안에서 무언가가 끓어올랐다. 손끝에서 희미한 빛이 새어 나온다.',
    choices: [
      {
        label: '억누른다', check: { stat: 'vit', dc: 10 },
        success: { text: '이를 악물고 빛을 삼켰다. 아무도 눈치채지 못했다.', effect: { stats: { vit: 2, mana: 2 } } },
        fail: { text: '빛은 가라앉았지만, 며칠을 앓아누웠다.', effect: { stats: { vit: -4, mana: 1 } } },
      },
      {
        label: '흘려보낸다', cond: { test: (s) => s.cheatId !== 'allmagic' }, check: { stat: 'mana', dc: 18 },
        success: { text: '빛이 방 안을 가득 채웠다. 그날부터 사람들은 당신을 신동이라 불렀다.', effect: { stats: { mana: 5, fame: 5 }, flags: ['prodigy'] } },
        fail: { text: '빛이 제멋대로 날뛰어 집 안의 그릇을 모두 깨뜨렸다. 어른들의 눈빛이 달라졌다.', effect: { stats: { vit: -5, cha: -2 } } },
      },
      {
        label: '흘려보낸다 (모든 속성이 응답한다)', cond: { cheats: ['allmagic'] }, check: { stat: 'mana', dc: 28 },
        success: { text: '일곱 빛깔의 빛이 방 안을 가득 채웠다. 늙은 산파가 무릎을 꿇었다. 그날부터 사람들은 당신을 신동이라 불렀다.', effect: { stats: { mana: 8, fame: 8 }, flags: ['prodigy'] } },
        fail: { text: '빛은 멈추지 않았다. 너무 작은 몸에, 너무 큰 바다가 흘러들었다.', effect: { death: 'mana_overload' } },
      },
    ],
  },
  {
    id: 'm_friend5', title: '이웃의 아이', milestone: true,
    cond: { minAge: 5, maxAge: 5 },
    text: '옆집에 이사 온 아이가 울타리 너머로 당신을 빤히 바라본다.',
    choices: [
      {
        label: '손을 내민다',
        success: { text: '{friend:은} 망설이다 당신의 손을 잡았다. 작고 차가운 손이었다.', effect: { addRel: 'friend', rel: { friend: 20 } }, tone: 'good' },
      },
      {
        label: '모른 척한다',
        success: { text: '그 아이, {friend:은} 그 뒤로도 멀찍이서 당신을 지켜보았다.', effect: { addRel: 'friend', rel: { friend: -20 }, stats: { int: 1 } } },
      },
    ],
  },
  {
    id: 'm_rite7', title: '적성의 의식', milestone: true,
    cond: { minAge: 7, maxAge: 7, notHouses: ['demon'] },
    text: '신전의 수정구 앞에 섰다. 신관이 당신의 손을 차가운 수정 위에 올린다.',
    choices: [
      {
        label: '수정에 마력을 흘린다', check: { stat: 'mana', dc: 20 },
        success: { text: '수정이 눈부시게 빛났다. 신관의 눈이 커졌다. "이 아이는… 왕도로 보내야 합니다."', effect: { stats: { mana: 3, fame: 5 }, flags: ['gifted'] } },
        fail: { text: '수정은 희미하게 깜빡였을 뿐이다. 신관은 무표정하게 다음 아이를 불렀다.', effect: { stats: { int: 1 } } },
      },
      {
        label: '수정을 거부한다',
        success: { text: '당신은 손을 거두었다. 어른들의 눈살이 찌푸려졌다. 운명을 남에게 읽히고 싶지 않았다.', effect: { karma: -3, stats: { luck: 2 } } },
      },
    ],
  },
  {
    id: 'm_rite7_demon', title: '피의 의식', milestone: true,
    cond: { minAge: 7, maxAge: 7, houses: ['demon'] },
    text: '마왕성의 제단. 군단의 아이들은 일곱 살이 되면 자신의 피를 흑요석 잔에 바친다.',
    auto: {
      check: { stat: 'vit', dc: 15 },
      success: { text: '잔이 검붉게 끓어올랐다. 아버지가 처음으로 당신의 머리를 쓰다듬었다.', effect: { stats: { vit: 3, mana: 4 } } },
      fail: { text: '피를 너무 많이 잃었다. 의식이 끝났을 때 당신은 차가운 돌바닥에 쓰러져 있었다.', effect: { stats: { vit: -6 } } },
    },
  },
  {
    id: 'm_rival10', title: '숙적', milestone: true,
    cond: { minAge: 10, maxAge: 10 },
    text: '또래 중에 유독 당신을 노려보는 아이가 있다. 무엇을 하든 한 발짝 앞서려 든다.',
    choices: [
      {
        label: '정면으로 맞선다', check: { stat: 'vit', dc: 15 },
        success: { text: '주먹다짐 끝에 {rival:은} 처음으로 고개를 숙였다. 그 눈에는 분함과, 묘한 인정이 섞여 있었다.', effect: { addRel: 'rival', rel: { rival: 10 }, stats: { fame: 2 } } },
        fail: { text: '흙바닥에 쓰러진 당신을 {rival:이} 내려다보며 웃었다.', effect: { addRel: 'rival', rel: { rival: -10 }, stats: { vit: -3 } } },
      },
      {
        label: '상대하지 않는다',
        success: { text: '{rival:은} 당신의 무관심을 모욕으로 받아들였다.', effect: { addRel: 'rival', rel: { rival: -15 }, stats: { cha: 1 } } },
      },
    ],
  },

  // ───── 무작위 ─────
  {
    id: 'c_fever', title: '열병', once: true, weight: 2,
    cond: { minAge: 1, maxAge: 5 },
    text: '한겨울, 몸이 불덩이처럼 달아올랐다.',
    auto: {
      check: { stat: 'vit', dc: 8 },
      success: { text: '고열이 사흘 밤낮을 이어졌다. 그러나 당신은 살아남았다.', effect: { stats: { vit: 2 } } },
      fail: { text: '열은 내렸지만, 몸은 예전 같지 않다.', effect: { stats: { vit: -8 }, zeroCause: 'illness' } },
    },
  },
  {
    id: 'c_lullaby', title: '자장가', once: true,
    cond: { minAge: 1, maxAge: 4 },
    text: '어머니가 낮은 목소리로 오래된 자장가를 불러주었다. 가사의 뜻은 몰랐지만, 이상하게 눈물이 났다.',
    auto: { success: { text: '전생에서도 누군가 이런 노래를 불러주었던 것 같다.', effect: { stats: { cha: 1, luck: 1 } } } },
  },
  {
    id: 'c_friend_play', title: '소꿉친구', weight: 3,
    cond: { minAge: 6, maxAge: 13, hasRel: ['friend'] },
    text: '{friend:이} 오늘도 문 앞에서 기다리고 있다.',
    choices: [
      { label: '함께 강가로 간다', success: { text: '해가 질 때까지 물수제비를 떴다. {friend:이} 웃었다.', effect: { rel: { friend: 10 }, stats: { vit: 1 } } } },
      { label: '책을 읽어준다', success: { text: '{friend:은} 당신의 목소리를 들으며 잠들었다.', effect: { rel: { friend: 8 }, stats: { int: 1 } } } },
      { label: '오늘은 바쁘다고 한다', success: { text: '{friend:은} 아무 말 없이 돌아갔다. 다음 날에도, 그다음 날에도 문 앞에 있었다.', effect: { rel: { friend: -5 } } } },
    ],
  },
  {
    id: 'c_forest', title: '금지된 숲', weight: 2, focus: 'explore',
    cond: { minAge: 6, maxAge: 13 },
    text: '어른들이 절대 들어가지 말라던 숲. 그 깊은 곳에서 푸른빛이 깜빡인다.',
    choices: [
      {
        label: '빛을 따라간다', check: { stat: 'luck', dc: 18 },
        success: { text: '이끼 낀 제단 위에서 푸른 돌을 주웠다. 손에 쥐자 따뜻했다.', effect: { stats: { mana: 4, luck: 2 }, flags: ['relic'] } },
        fail: { text: '늑대 무리에게 쫓겨 덤불 속에서 밤을 새웠다. 다리에 깊은 상처가 남았다.', effect: { stats: { vit: -8 } } },
      },
      { label: '돌아선다', success: { text: '숲의 어둠이 당신을 부르는 듯했지만, 등을 돌렸다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'c_attic', title: '다락방의 고서', once: true, focus: 'study', weight: 1.5,
    cond: { minAge: 6, maxAge: 14 },
    text: '다락방 구석, 먼지 쌓인 상자 속에서 표지가 찢긴 책을 찾았다. 신전의 봉인 인장이 찍혀 있다.',
    choices: [
      {
        label: '몰래 읽는다', check: { stat: 'int', dc: 16 },
        success: { text: '책에는 신전이 금한 술식이 적혀 있었다. 당신은 그것을 전부 외웠다.', effect: { stats: { int: 5, mana: 3 }, flags: ['forbidden_knowledge'] } },
        fail: { text: '글자는 읽을 수 있었으나 뜻은 닿지 않았다.', effect: { stats: { int: 1 } } },
      },
      { label: '신전에 가져간다', success: { text: '신관은 책을 받아 들고 오래 침묵했다. 그리고 당신의 이름을 물었다.', effect: { karma: 6, stats: { fame: 1 } } } },
    ],
  },
  {
    id: 'c_carriage', title: '진흙길', once: true, weight: 1.5,
    cond: { minAge: 6, maxAge: 30, notHouses: ['noble'] },
    text: '진흙길 한복판에 넘어진 아이가 있다. 그리고 그 너머에서, 문장을 단 귀족의 마차가 속도를 줄이지 않고 달려온다.',
    choices: [
      {
        label: '몸을 던진다', check: { stat: 'vit', dc: 22 },
        success: { text: '아이를 안고 굴렀다. 바퀴가 옷자락을 스치고 지나갔다. 마부는 뒤돌아보지도 않았다.', effect: { stats: { fame: 8 }, karma: 12 } },
        fail: { text: '아이를 길가로 밀쳐냈다. 그것이 마지막으로 기억나는 일이었다.', effect: { karma: 12, death: 'carriage' } },
      },
      {
        label: '소리쳐 경고한다', check: { stat: 'cha', dc: 18 },
        success: { text: '아이는 가까스로 길가로 기어 나왔다.', effect: { karma: 5 } },
        fail: { text: '목소리는 말발굽 소리에 묻혔다. 당신은 그날 밤 잠들지 못했다.', effect: { karma: 2, stats: { cha: -2 } } },
      },
      { label: '외면한다', success: { text: '걸음을 재촉했다. 등 뒤에서 들린 소리는 오래도록 잊히지 않았다.', effect: { karma: -10 } } },
    ],
  },
  {
    id: 'c_bully', title: '영주의 아들', weight: 1.5,
    cond: { minAge: 8, maxAge: 14, flags: ['commoner'] },
    text: '영주의 아들 일행이 마을 아이들을 괴롭히고 있다.',
    choices: [
      {
        label: '막아선다', check: { stat: 'vit', dc: 20 },
        success: { text: '코피를 흘리며 도망치는 영주의 아들. 마을 아이들이 당신을 우러러보았다.', effect: { stats: { fame: 3, vit: 1 }, karma: 5 } },
        fail: { text: '맞은 것은 당신이었다. 그리고 그 아버지는 당신 집의 소작료를 올렸다.', effect: { stats: { vit: -6 } } },
      },
      { label: '고개를 숙인다', success: { text: '살아남는 법을 하나 더 배웠다.', effect: { stats: { cha: 1 }, karma: -2 } } },
    ],
  },
  {
    id: 'c_noble_lesson', title: '대공가의 교육', weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['noble'] },
    text: '예법, 검술, 역사, 무도. 대공가의 아이에게 쉬는 날은 없다.',
    auto: { success: { text: '가정교사의 회초리 아래에서 한 해가 지나갔다.', effect: { stats: { cha: 2, int: 1, vit: 1 } } } },
  },
  {
    id: 'c_prodigy_visit', title: '왕도의 마법사', once: true, weight: 4,
    cond: { minAge: 8, maxAge: 12, test: (s) => s.flags.includes('prodigy') || s.flags.includes('gifted') },
    text: '신동의 소문을 들은 궁정 마법사가 먼 길을 찾아왔다. 회색 로브의 노인이 당신을 내려다본다.',
    choices: [
      { label: '제자가 된다', success: { text: '노마법사 {mentor:은} 말없이 지팡이를 건넸다. 그날부터 수업이 시작되었다.', effect: { addRel: 'mentor', stats: { mana: 4, int: 2 }, flags: ['apprentice'] }, tone: 'good' } },
      { label: '거절한다', success: { text: '"아쉽군." 노인은 그렇게만 말하고 떠났다.', effect: { stats: { luck: 2 } } } },
    ],
  },
  {
    id: 'c_market', title: '시장의 흥정', weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['merchant'] },
    text: '아버지가 이국의 상인과 향신료 값을 두고 실랑이 중이다.',
    choices: [
      {
        label: '흥정에 끼어든다', check: { stat: 'int', dc: 16 },
        success: { text: '당신의 셈이 더 빨랐다. 이국 상인이 혀를 내둘렀다.', effect: { stats: { int: 2, cha: 2, fame: 1 } } },
        fail: { text: '아버지가 조용히 당신의 입을 막았다.', effect: { stats: { cha: -1 } } },
      },
      { label: '구경만 한다', success: { text: '말 한마디에 값이 오르내리는 것을 지켜보았다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'c_demon_child', title: '포로', once: true, weight: 2,
    cond: { minAge: 6, maxAge: 14, houses: ['demon'] },
    text: '마왕성의 아이들은 인간을 사냥감으로 배운다. 오늘은 포로로 잡힌 인간 소년이 당신 앞에 끌려왔다.',
    choices: [
      { label: '명령대로 벤다', success: { text: '검은 생각보다 가벼웠다. 그 사실이 가장 무거웠다.', effect: { karma: -15, stats: { mana: 3, vit: 2 } }, tone: 'bad' } },
      {
        label: '몰래 풀어준다', check: { stat: 'luck', dc: 18 },
        success: { text: '소년은 어둠 속으로 사라졌다. 고맙다는 말도 없이.', effect: { karma: 15, flags: ['spared_human'] } },
        fail: { text: '발각되었다. 아버지의 채찍 자국이 등에 남았다.', effect: { karma: 10, stats: { vit: -10 } } },
      },
    ],
  },
  {
    id: 'c_famine', title: '흉년', weight: 1,
    cond: { minAge: 4, maxAge: 40, houses: ['farm'], notJobs: ['knight', 'mage', 'merchant', 'priest'] },
    text: '흉년이다. 곳간이 바닥을 보이기 시작했다. 이웃집 아이가 굶고 있다는 소문이 들린다.',
    choices: [
      { label: '이웃과 나눈다', success: { text: '모두가 조금씩 굶었다. 그리고 모두가 봄을 맞았다.', effect: { karma: 10, stats: { vit: -8 }, zeroCause: 'famine' } } },
      { label: '가족 몫을 지킨다', success: { text: '문을 걸어 잠갔다. 그 겨울, 이웃집 굴뚝에서 연기가 끊겼다.', effect: { karma: -6, stats: { vit: -3 }, zeroCause: 'famine' } } },
      {
        label: '눈 덮인 숲으로 사냥을 나간다', check: { stat: 'luck', dc: 20 },
        success: { text: '사슴 한 마리를 끌고 돌아왔다. 마을이 당신의 이름을 불렀다.', effect: { stats: { vit: 2, fame: 2 } } },
        fail: { text: '빈손으로, 동상 입은 발로 돌아왔다.', effect: { stats: { vit: -14 }, zeroCause: 'famine' } },
      },
    ],
  },
  {
    id: 'c_plague', title: '검은 해', once: true, weight: 0.4,
    cond: { minAge: 12, maxAge: 90 },
    text: '검은 역병이 왕국을 휩쓸었다. 거리마다 조종이 울린다.',
    auto: {
      check: { stat: 'vit', dc: 16 },
      success: { text: '열과 반점이 몸을 덮었다가, 거짓말처럼 물러갔다.', effect: { stats: { vit: -3 } } },
      fail: { text: '역병은 당신을 지나치지 않았다.', effect: { stats: { vit: -20 }, zeroCause: 'plague' } },
    },
  },
];
