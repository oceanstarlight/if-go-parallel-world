import type { GameEvent } from '../../types';

/** 15~17세: 아카데미, 혈통 각성 */
export const YOUTH: GameEvent[] = [
  {
    id: 'm_academy15', title: '왕립 마법 아카데미 입학시험', milestone: true,
    cond: { minAge: 15, maxAge: 15 },
    text: '드디어 왔다, 이세계 학원물의 꽃! 신분 상관없이 재능만 본다는 왕립 아카데미의 거대한 정문 앞에 섰다.',
    choices: [
      {
        label: '마법 실기', check: { stat: 'mana', dc: 30 },
        success: { text: '손바닥 위에 불꽃 장미를 피워냈다! 합격! 시험관 {mentor:이} "오호…" 하며 눈을 반짝였다.', effect: { flags: ['academy', 'academy_magic'], addRel: 'mentor', stats: { mana: 3, fame: 3 } }, tone: 'good' },
        fail: { text: '불꽃이 피식 하고 꺼졌다. 뒤에서 누가 킥 웃었다. 낙방…', effect: { stats: { cha: -1, luck: 1 } } },
      },
      {
        label: '필기 시험', check: { stat: 'int', dc: 30 },
        success: { text: '전생의 시험 노하우로 술술 풀었다. 합격! 채점관 {mentor:이} 답안지를 한참 들여다보았다.', effect: { flags: ['academy', 'academy_scholar'], addRel: 'mentor', stats: { int: 3, fame: 3 } }, tone: 'good' },
        fail: { text: '문제지를 펼치자 머리가 새하얘졌다. 낙방…', effect: { stats: { luck: 1 } } },
      },
      {
        label: '검술 시험', check: { stat: 'vit', dc: 30 },
        success: { text: '시험관의 목검을 "챙!" 하고 쳐냈다. 합격!', effect: { flags: ['academy', 'academy_sword'], stats: { vit: 3, fame: 3 } }, tone: 'good' },
        fail: { text: '세 합 만에 목검이 하늘을 날았다. 낙방…', effect: { stats: { vit: 1 } } },
      },
      { label: '시험을 보지 않는다', success: { text: '"학교만이 길은 아니잖아?" 당신은 콧노래를 부르며 발길을 돌렸다.', effect: { stats: { vit: 1, luck: 1 } } } },
    ],
  },
  {
    id: 'y_academy_life', title: '두근두근 학원 생활', weight: 4,
    cond: { minAge: 15, maxAge: 17, flags: ['academy'] },
    text: '수업, 과제, 동아리, 그리고 기숙사 야식! 아카데미의 하루는 눈 깜짝할 새 지나간다.',
    choices: [
      { label: '도서관에서 밤을 새운다', success: { text: '사서 선배가 당신에게만 금서 열람실 열쇠가 어디 있는지 귓속말로 알려주었다.', effect: { stats: { int: 3, mana: 1 } } } },
      { label: '훈련장에서 검을 휘두른다', success: { text: '손에 물집이 잡혔다가 굳은살이 되었다. 근육이 붙는 게 느껴진다!', effect: { stats: { vit: 3 } } } },
      { label: '귀족 자제들과 티타임', success: { text: '우아하게 홍차를 마시며 귀족 사회의 눈치 게임을 배웠다.', effect: { stats: { cha: 2, fame: 2 } } } },
    ],
  },
  {
    id: 'y_academy_rival', title: '수석 결정전', once: true, weight: 3,
    cond: { minAge: 15, maxAge: 17, flags: ['academy'], hasRel: ['rival'] },
    text: '{rival:도} 같은 아카데미에 입학해 있었다! 수석 자리를 건 모의전이 열린다. "이번엔 안 져!"',
    choices: [
      {
        label: '전력을 다한다', check: { stat: 'mana', dc: 34 },
        success: { text: '마지막까지 서 있던 건 당신이었다! {rival:은} 분한 얼굴로 그래도 박수를 쳐주었다.', effect: { stats: { fame: 5 }, rel: { rival: 10 }, flags: ['top_student'] } },
        fail: { text: '아깝게 준우승. 수석 명판에는 {rival:의} 이름이 반짝인다.', effect: { stats: { fame: 1 }, rel: { rival: -5 } } },
      },
      { label: '기권한다', success: { text: '"도망치는 거야?!" {rival:의} 외침이 등 뒤로 날아왔다.', effect: { rel: { rival: -10 } } } },
    ],
  },
  {
    id: 'm_hero16', title: '성검의 부름', milestone: true,
    cond: { minAge: 16, maxAge: 16, houses: ['hero'] },
    text: '열여섯 번째 생일 밤, 가문의 지하실에서 성검이 "우우웅" 하고 울기 시작했다. 주인공 각성 이벤트다!',
    choices: [
      {
        label: '성검을 뽑는다', check: { stat: 'vit', dc: 25 },
        success: { text: '검이 깃털처럼 가볍게 뽑혔다! 눈부신 빛과 함께 등에 문장이 떠올랐다. 이제부터 당신은 용사다!', effect: { job: 'hero', flags: ['hero_awakened'], stats: { fame: 15 } }, tone: 'milestone' },
        fail: { text: '…꿈쩍도 안 한다. 성검이 "아직이야"라고 말하는 것 같다.', effect: { flags: ['hero_failed'], stats: { vit: -3 } } },
      },
      { label: '"용사 같은 거 안 해!" 지하실 문을 잠근다', will: 30, success: { text: '지하실 문을 잠갔다. 성검은 밤마다 서운하다는 듯 웅웅거렸지만, 평범하고 느긋한 하루하루가 시작됐다.', effect: { flags: ['hero_refused', 'defied_fate'], stats: { luck: 6 }, stress: -15 }, tone: 'milestone' } },
    ],
  },
  {
    id: 'y_hero_retry', title: '다시, 성검', once: true, weight: 5,
    cond: { minAge: 19, maxAge: 30, houses: ['hero'], flags: ['hero_failed'], notFlags: ['hero_awakened'], jobs: [null, 'adventurer', 'knight', 'farmer'] },
    text: '성검이 또 부르고 있다. 이번엔 더 크고, 더 간절하게.',
    choices: [
      {
        label: '다시 손을 뻗는다', check: { stat: 'vit', dc: 32 },
        success: { text: '검이 드디어 대답했다! 조금 늦었지만, 주인공은 원래 늦게 각성하는 법이다.', effect: { job: 'hero', flags: ['hero_awakened'], stats: { fame: 15 } }, tone: 'milestone' },
        fail: { text: '성검은 끝내 반응하지 않았다. 지하실이 조용해졌다.', effect: { stats: { luck: -3 } } },
      },
      { label: '그냥 둔다', success: { text: '"용사 같은 거, 안 해도 괜찮아." 당신은 당신만의 이야기를 쓰기로 했다.', effect: { stats: { luck: 2 } } } },
    ],
  },
  {
    id: 'm_demon16', title: '마왕군 입대식', milestone: true,
    cond: { minAge: 16, maxAge: 16, houses: ['demon'] },
    text: '아버지가 반짝이는 검은 갑옷을 내밀었다. "오늘부터 너도 마왕군이다! 멋지게 활약하거라!"',
    choices: [
      { label: '갑옷을 입는다', success: { text: '갑옷이 맞춤처럼 꼭 맞았다. 거울 속의 자신이 제법 멋져 보인다.', effect: { job: 'demon_officer', flags: ['demon_joined'], karma: -10, stats: { vit: 3, mana: 3 } }, tone: 'milestone' } },
      {
        label: '가출한다', check: { stat: 'luck', dc: 20 },
        success: { text: '국경 너머 인간 마을로 몰래 넘어갔다. 새 이름, 새 인생. 어디에도 속하지 않는 자유!', effect: { flags: ['deserter'], karma: 10 } },
        fail: { text: '추격대의 마법에 엉덩이를 데었지만, 무사히 국경을 넘었다. 아야야…', effect: { flags: ['deserter'], karma: 5, stats: { vit: -12 } } },
      },
    ],
  },
];
