import type { GameEvent } from '../../types';

/** 15~17세: 아카데미, 혈통 각성 */
export const YOUTH: GameEvent[] = [
  {
    id: 'm_academy15', title: '왕립 아카데미 입학시험', milestone: true,
    cond: { minAge: 15, maxAge: 15 },
    text: '왕도의 왕립 아카데미. 신분을 가리지 않고 재능만을 묻는다는 그곳의 문 앞에 섰다.',
    choices: [
      {
        label: '마법 실기', check: { stat: 'mana', dc: 30 },
        success: { text: '시험관 앞에서 불꽃을 꽃처럼 피워냈다. 합격이다. 시험관 {mentor:이} 당신을 눈여겨보았다.', effect: { flags: ['academy', 'academy_magic'], addRel: 'mentor', stats: { mana: 3, fame: 3 } }, tone: 'good' },
        fail: { text: '불꽃은 피어나기도 전에 꺼졌다. 낙방이었다.', effect: { stats: { cha: -1, luck: 1 } } },
      },
      {
        label: '필기 시험', check: { stat: 'int', dc: 30 },
        success: { text: '마지막 문항까지 막힘이 없었다. 합격이다. 채점관 {mentor:이} 당신의 답안을 오래 들여다보았다.', effect: { flags: ['academy', 'academy_scholar'], addRel: 'mentor', stats: { int: 3, fame: 3 } }, tone: 'good' },
        fail: { text: '절반도 채우지 못했다. 낙방이었다.', effect: { stats: { luck: 1 } } },
      },
      {
        label: '검술 시험', check: { stat: 'vit', dc: 30 },
        success: { text: '시험관의 목검을 쳐냈다. 합격이다.', effect: { flags: ['academy', 'academy_sword'], stats: { vit: 3, fame: 3 } }, tone: 'good' },
        fail: { text: '세 합 만에 목검을 놓쳤다. 낙방이었다.', effect: { stats: { vit: 1 } } },
      },
      { label: '응시하지 않는다', success: { text: '당신은 발길을 돌렸다. 배움은 문 안에만 있는 것이 아니다.', effect: { stats: { vit: 1, luck: 1 } } } },
    ],
  },
  {
    id: 'y_academy_life', title: '아카데미의 나날', weight: 4,
    cond: { minAge: 15, maxAge: 17, flags: ['academy'] },
    text: '시험과 과제, 그리고 계급의 벽. 아카데미의 하루는 길다.',
    choices: [
      { label: '밤새 서고에 남는다', success: { text: '서고지기가 당신에게만 금서 열쇠의 위치를 알려주었다.', effect: { stats: { int: 3, mana: 1 } } } },
      { label: '훈련장에서 검을 휘두른다', success: { text: '손의 물집이 터지고, 다시 굳었다.', effect: { stats: { vit: 3 } } } },
      { label: '귀족 자제들과 어울린다', success: { text: '그들의 웃음 뒤에 숨은 셈법을 배웠다.', effect: { stats: { cha: 2, fame: 2 } } } },
    ],
  },
  {
    id: 'y_academy_rival', title: '수석 결정전', once: true, weight: 3,
    cond: { minAge: 15, maxAge: 17, flags: ['academy'], hasRel: ['rival'] },
    text: '{rival:이} 같은 아카데미에 입학해 있었다. 수석 자리를 두고 모의전이 열린다.',
    choices: [
      {
        label: '전력을 다한다', check: { stat: 'mana', dc: 34 },
        success: { text: '마지막에 서 있던 것은 당신이었다. {rival:은} 이를 악물고 박수를 쳤다.', effect: { stats: { fame: 5 }, rel: { rival: 10 }, flags: ['top_student'] } },
        fail: { text: '준우승. {rival:의} 이름이 수석 명판에 새겨졌다.', effect: { stats: { fame: 1 }, rel: { rival: -5 } } },
      },
      { label: '기권한다', success: { text: '"도망치는 건가." {rival:의} 목소리가 등 뒤에 꽂혔다.', effect: { rel: { rival: -10 } } } },
    ],
  },
  {
    id: 'm_hero16', title: '성검의 부름', milestone: true,
    cond: { minAge: 16, maxAge: 16, houses: ['hero'] },
    text: '열여섯 번째 생일 밤, 가문의 지하에 잠들어 있던 성검이 울었다.',
    choices: [
      {
        label: '성검을 뽑는다', check: { stat: 'vit', dc: 25 },
        success: { text: '검은 깃털처럼 가볍게 뽑혔다. 그 순간부터 당신의 삶은 당신의 것이 아니게 되었다.', effect: { job: 'hero', flags: ['hero_awakened'], stats: { fame: 15 } }, tone: 'milestone' },
        fail: { text: '검은 꿈쩍도 하지 않았다. 아직은 때가 아니라는 듯이.', effect: { flags: ['hero_failed'], stats: { vit: -3 } } },
      },
      { label: '외면한다', success: { text: '지하실 문을 잠갔다. 검의 울음은 그 후로도 밤마다 들려왔다.', effect: { karma: -5, flags: ['hero_refused'] } } },
    ],
  },
  {
    id: 'y_hero_retry', title: '다시, 성검', once: true, weight: 5,
    cond: { minAge: 19, maxAge: 30, houses: ['hero'], flags: ['hero_failed'], notFlags: ['hero_awakened'], jobs: [null, 'adventurer', 'knight', 'farmer'] },
    text: '성검이 다시 울고 있다. 이번에는 더 크게.',
    choices: [
      {
        label: '다시 손을 뻗는다', check: { stat: 'vit', dc: 32 },
        success: { text: '검이 응답했다. 늦었지만, 늦지 않았다.', effect: { job: 'hero', flags: ['hero_awakened'], stats: { fame: 15 } }, tone: 'milestone' },
        fail: { text: '검은 끝내 당신을 택하지 않았다. 성검의 울음이 멎었다.', effect: { stats: { luck: -3 } } },
      },
      { label: '그대로 둔다', success: { text: '당신은 당신의 삶을 살기로 했다.', effect: { stats: { luck: 2 } } } },
    ],
  },
  {
    id: 'm_demon16', title: '군단의 소집', milestone: true,
    cond: { minAge: 16, maxAge: 16, houses: ['demon'] },
    text: '아버지가 검은 갑주를 내밀었다. "이제 너도 군단의 일원이다. 인간의 땅으로 간다."',
    choices: [
      { label: '갑주를 입는다', success: { text: '갑주는 몸에 꼭 맞았다. 처음부터 당신을 위해 만들어진 것처럼.', effect: { job: 'demon_officer', flags: ['demon_joined'], karma: -10, stats: { vit: 3, mana: 3 } }, tone: 'milestone' } },
      {
        label: '도망친다', check: { stat: 'luck', dc: 20 },
        success: { text: '국경 너머 인간의 마을로 숨어들었다. 이제 당신은 어디에도 속하지 않는다.', effect: { flags: ['deserter'], karma: 10 } },
        fail: { text: '추격대의 마법이 등을 꿰뚫었다. 그러나 살아서 국경을 넘었다.', effect: { flags: ['deserter'], karma: 5, stats: { vit: -12 } } },
      },
    ],
  },
];
