import type { GameEvent, LifeState } from '../../types';

/** 지난 생들에서 이 캐릭터를 만난 횟수 */
const past = (s: LifeState, id: string) => s.npcPast?.[id] ?? 0;

/**
 * 고정 캐릭터: 여러 생에 걸쳐 다시 등장하고, 당신을 기억한다.
 * 만날 때마다 meet 효과로 기록되고, 죽을 때 메타에 누적된다.
 */
export const NPC_EVENTS: GameEvent[] = [
  // ───── 떠돌이 마녀 루루 ─────
  {
    id: 'npc_lulu', title: '떠돌이 마녀 루루', once: true, weight: 1.4,
    cond: { minAge: 7, maxAge: 70, test: (s) => past(s, 'lulu') < 3 },
    text: (s) =>
      past(s, 'lulu') === 0
        ? '숲길을 걷는데 하늘에서 빗자루 탄 소녀가 떨어졌다. "아야야… 너, 방금 나 떨어지는 거 봤지?!" 마녀 모자가 삐뚤어져 있다.'
        : `빗자루 소리와 함께 익숙한 목소리가 들렸다. "어? 너 또 태어났구나! 전생에서도 ${past(s, 'lulu')}번이나 만났잖아~" 마녀 루루가 손을 흔든다.`,
    choices: [
      {
        label: '일으켜 준다', check: { stat: 'cha', dc: 34 },
        success: { text: '"고마워! 답례로 이거 줄게♪" 루루가 반짝이는 물약을 건넸다. 마셔보니 몸이 가볍다!', effect: { meet: 'lulu', stats: { luck: 14, vit: 8 } }, tone: 'good' },
        fail: { text: '일으키다 같이 넘어졌다. 루루가 깔깔 웃으며 사탕 하나를 쥐여주고 날아갔다.', effect: { meet: 'lulu', stats: { luck: 6 } } },
      },
      {
        label: '모른 척 지나간다',
        success: { text: '"흥, 다음 생에 두고 봐!" 등 뒤에서 루루가 혀를 내밀었다.', effect: { meet: 'lulu' } },
      },
    ],
  },
  {
    id: 'npc_lulu_regular', title: '단골손님 루루', once: true, weight: 2.5,
    cond: { minAge: 10, maxAge: 80, test: (s) => past(s, 'lulu') >= 3 },
    text: (s) => `"${past(s, 'lulu')}번째 생에서도 만나다니, 우리 운명인가 봐!" 마녀 루루가 비밀 물약 세 병을 꺼냈다. "단골 특별 서비스♪ 하나만 골라!"`,
    choices: [
      { label: '젊음의 물약', success: { text: '한 모금 마시자 몸에 활력이 넘쳤다! "피부 좋아졌다~"', effect: { meet: 'lulu', stats: { vit: 42 } }, tone: 'good' } },
      { label: '지혜의 물약', success: { text: '머릿속이 맑아졌다. 마법 공식이 술술 이해된다!', effect: { meet: 'lulu', stats: { int: 28, mana: 22 } }, tone: 'good' } },
      { label: '행운의 물약', success: { text: '마시는 순간 네잎클로버가 발밑에 피어났다!', effect: { meet: 'lulu', stats: { luck: 42 } }, tone: 'good' } },
    ],
  },

  // ───── 사신 그림 ─────
  {
    id: 'npc_grim', title: '차 마시는 사신', once: true, weight: 3,
    cond: { minAge: 55 },
    text: (s) =>
      past(s, 'grim') === 0
        ? '검은 로브의 해골이 집 앞 벤치에 앉아 있다. "안녕? 난 사신이야. 아직 데리러 온 건 아니고~ 심심한데 체스 한 판 할래?"'
        : `"오, 또 보네! 이번이 ${past(s, 'grim') + 1}번째 생인가?" 사신 그림이 체스판을 펼치며 해골 이를 딱딱거렸다. "지난번 판, 복수전이다!"`,
    choices: [
      {
        label: '체스로 승부한다', check: { stat: 'int', dc: 106 },
        success: { text: '체크메이트! 사신이 머리(뼈)를 긁적였다. "졌다, 졌어! 약속대로 좀 더 천천히 데리러 올게."', effect: { meet: 'grim', flags: ['grim_win'], stats: { fame: 8 } }, tone: 'good' },
        fail: { text: '"체크메이트~" 사신이 즐겁게 웃었다. "괜찮아, 아직은 안 데려가. 아마도?"', effect: { meet: 'grim', stats: { luck: -6 } } },
      },
      {
        label: '차만 마신다',
        success: { text: '사신이 끓인 차는 의외로 맛있었다. "인생 어땠어?" 둘은 해가 질 때까지 수다를 떨었다.', effect: { meet: 'grim', karma: 5, stats: { cha: 6 } } },
      },
    ],
  },

  // ───── 고양이 상인 모모 ─────
  {
    id: 'npc_momo', title: '고양이 상인 모모', once: true, weight: 1.4,
    cond: { minAge: 12, maxAge: 80, maxStats: { luck: 277 } },
    text: (s) =>
      past(s, 'momo') < 2
        ? '고양이 귀 상인 모모가 보따리를 펼쳤다. "손님, 운명의 뽑기 한 판 어떠냥? 꽝은… 아마 없다냥!"'
        : `"앗, 단골손님이다냥! 벌써 ${past(s, 'momo')}번째 생이냥?" 모모가 반짝이는 황금 캡슐을 흔들었다. "단골한테는 확률 업 이벤트다냥!"`,
    choices: [
      {
        label: '뽑기를 돌린다', check: { stat: 'luck', dc: 84 },
        success: { text: '번쩍! 황금 캡슐이 열리며 전설급 아이템이 튀어나왔다. "대, 대박이다냥!!"', effect: { meet: 'momo', flags: ['momo_jackpot'], stats: { fame: 14, luck: 14, mana: 14, vit: 14 } }, tone: 'good' },
        fail: { text: '캡슐에서 나온 건… 고양이 발바닥 스티커. "꽝도 소중한 추억이다냥~"', effect: { meet: 'momo', stats: { cha: 3 } } },
      },
      {
        label: '구경만 한다',
        success: { text: '"다음에 또 오라냥!" 모모가 꼬리를 흔들며 사라졌다.', effect: { meet: 'momo' } },
      },
    ],
  },
];
