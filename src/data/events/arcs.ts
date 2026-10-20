import type { GameEvent, StatKey } from '../../types';

/**
 * 공통 사건 틀: 모든 직업 가지가 「기회 · 라이벌 · 위기 · 횡재」 네 틀을 공유하고,
 * 가지마다 문장과 판정 능력치·금액·난이도만 바꿔 끼운다. (트리의 공통 마디)
 */
interface ArcSpec {
  branch: string;
  stat: StatKey;
  /** 금액 기준 (골드) */
  gold: number;
  /** 기준 난이도 */
  dc: number;
  opportunity: { title: string; text: string; take: string; win: string; lose: string; pass: string; passText: string };
  rival: { title: string; text: string; fight: string; win: string; lose: string; ally: string; allyText: string };
  crisis: { title: string; text: string; handle: string; win: string; lose: string; flee: string; fleeText: string };
  windfall: { title: string; text: string; result: string };
}

export function careerArc(a: ArcSpec): GameEvent[] {
  const id = (k: string) => `arc_${a.branch}_${k}`;
  return [
    {
      id: id('opportunity'), title: a.opportunity.title, branch: a.branch, once: true, weight: 1.6, cond: { minAge: 18 },
      text: a.opportunity.text,
      choices: [
        { label: a.opportunity.take, check: { stat: a.stat, dc: a.dc },
          success: { text: a.opportunity.win, effect: { gold: a.gold * 3, stats: { fame: 4 }, mood: 'joy' }, tone: 'good' },
          fail: { text: a.opportunity.lose, effect: { gold: -a.gold, stress: 10 } } },
        { label: a.opportunity.pass, success: { text: a.opportunity.passText, effect: { stress: -5 } } },
      ],
    },
    {
      id: id('rival'), title: a.rival.title, branch: a.branch, once: true, weight: 1.4, cond: { minAge: 20 },
      text: a.rival.text,
      choices: [
        { label: a.rival.fight, check: { stat: a.stat, dc: a.dc + 20 },
          success: { text: a.rival.win, effect: { jobRank: 1, stats: { fame: 6 } }, tone: 'milestone' },
          fail: { text: a.rival.lose, effect: { stats: { fame: -4 }, mood: 'anger' } } },
        { label: a.rival.ally, success: { text: a.rival.allyText, effect: { gold: Math.round(a.gold * 0.5), karma: 3 } } },
      ],
    },
    {
      id: id('crisis'), title: a.crisis.title, branch: a.branch, once: true, weight: 1.4, cond: { minAge: 22 },
      text: a.crisis.text,
      choices: [
        { label: a.crisis.handle, check: { stat: a.stat, dc: a.dc + 10 },
          success: { text: a.crisis.win, effect: { gold: a.gold, stats: { fame: 6 } }, tone: 'good' },
          fail: { text: a.crisis.lose, effect: { goldPct: -0.3, stress: 15, mood: 'gloom' } } },
        { label: a.crisis.flee, success: { text: a.crisis.fleeText, effect: { gold: -Math.round(a.gold * 0.5) } } },
      ],
    },
    {
      id: id('windfall'), title: a.windfall.title, branch: a.branch, once: true, weight: 1, cond: { minAge: 18 },
      text: a.windfall.text,
      auto: { success: { text: a.windfall.result, effect: { gold: a.gold * 2, mood: 'joy' }, tone: 'good' } },
    },
  ];
}

export const ARC_EVENTS: GameEvent[] = [
  ...careerArc({
    branch: 'farmer', stat: 'vit', gold: 60, dc: 56,
    opportunity: { title: '품평회', text: '왕도에서 농작물 품평회가 열린다! 올해 키운 호박이 유난히 크다.',
      take: '호박을 출품한다', win: '금상! 「전설의 호박」이라는 이름이 붙었다. 상금이 두둑하다!', lose: '수레가 뒤집혀 호박이 박살났다… 수레값만 날렸다.',
      pass: '조용히 농사나 짓는다', passText: '평화로운 하루. 이것도 나쁘지 않다.' },
    rival: { title: '옆 밭 농부', text: '옆 밭 농부가 "누가 더 많이 수확하나 내기하자!"며 도발한다.',
      fight: '내기에 응한다', win: '압승! 마을 사람들이 당신을 「농사왕」이라 부르기 시작했다.', lose: '졌다… 그 집 무가 내 팔뚝만 하다니.',
      ally: '함께 농사짓자고 제안한다', allyText: '둘이 힘을 합치니 수확이 늘었다. 이웃사촌이 최고!' },
    crisis: { title: '메뚜기 떼', text: '하늘이 까맣다! 메뚜기 떼가 밭으로 몰려온다!',
      handle: '밤새 연기를 피워 막는다', win: '해냈다! 마을에서 유일하게 밭을 지켜냈다. 곡식값이 폭등했다!', lose: '역부족이었다… 올해 농사는 망했다.',
      flee: '그냥 둔다', fleeText: '피해를 줄이려 덜 익은 작물이라도 서둘러 거뒀다.' },
    windfall: { title: '밭에서 나온 항아리', text: '밭을 갈다 괭이에 무언가 걸렸다. 낡은 항아리다!', result: '항아리 안에는 옛 금화가 가득! 할아버지의 할아버지가 숨겨둔 걸까?' },
  }),
  ...careerArc({
    branch: 'merchant', stat: 'int', gold: 200, dc: 72,
    opportunity: { title: '독점 계약', text: '항구에 처음 보는 향신료가 들어왔다. 독점 계약을 맺으면 큰돈이 될 것 같다.',
      take: '독점 계약을 맺는다', win: '대박! 왕도 귀족들이 줄을 섰다. 금고가 넘친다!', lose: '알고 보니 그냥 말린 풀이었다… 계약금만 날렸다.',
      pass: '신중하게 지켜본다', passText: '돌다리도 두들겨 보고 건넌다. 장사의 기본이다.' },
    rival: { title: '경쟁 상회', text: '건너편에 경쟁 상회가 문을 열었다. 가격 후려치기가 시작됐다!',
      fight: '가격 전쟁에 맞선다', win: '경쟁 상회가 백기를 들었다. 시장은 이제 당신의 것!', lose: '출혈 경쟁 끝에 손님을 뺏겼다. 분하다!',
      ally: '합병을 제안한다', allyText: '손을 잡으니 둘 다 웃었다. 상도덕이란 이런 것!' },
    crisis: { title: '난파 소식', text: '물건을 가득 실은 상선이 폭풍에 휘말렸다는 소식이 들려왔다!',
      handle: '보험과 인맥을 총동원한다', win: '보험금에 구조된 화물까지! 오히려 이득을 봤다.', lose: '화물 대부분을 잃었다. 장부가 빨갛게 물들었다…',
      flee: '손실을 확정하고 털어낸다', fleeText: '아프지만 깔끔하게 정리했다. 다음 배를 기다리자.' },
    windfall: { title: '단골의 팁', text: '오랜 단골 귀족 부인이 은밀히 귀띔해 주었다. "다음 달 왕실 혼례가 있대요."', result: '혼례용 비단을 미리 사두었다가 세 배로 팔았다!' },
  }),
  ...careerArc({
    branch: 'court', stat: 'int', gold: 300, dc: 96,
    opportunity: { title: '국왕의 특명', text: '국왕이 당신을 따로 불렀다. "이 어려운 일, 그대라면 해낼 수 있겠지?"',
      take: '특명을 받든다', win: '완벽하게 해냈다! 국왕이 금화 주머니를 하사했다.', lose: '실수로 일을 그르쳤다. 국왕의 표정이 차갑다…',
      pass: '정중히 사양한다', passText: '모난 돌이 정 맞는다. 궁정에선 몸을 사리는 것도 지혜다.' },
    rival: { title: '정적', text: '같은 서열의 정적이 당신을 깎아내리는 소문을 퍼뜨리고 있다.',
      fight: '어전 회의에서 정면 반박한다', win: '논리로 압살했다! 국왕이 당신을 한 계단 올렸다.', lose: '말이 꼬였다. 정적이 비웃는다.',
      ally: '정적과 손을 잡는다', allyText: '어제의 적이 오늘의 동맹. 뒷거래로 짭짤한 이득을 나눴다.' },
    crisis: { title: '횡령 누명', text: '국고에서 금화가 사라졌다! 그런데 장부에 당신의 서명이…?!',
      handle: '진짜 범인을 찾아낸다', win: '진범을 잡았다! 오히려 공을 인정받아 포상을 받았다.', lose: '누명을 벗지 못했다. 벌금으로 재산 일부를 몰수당했다.',
      flee: '조용히 배상하고 덮는다', fleeText: '억울하지만 돈으로 막았다. 궁정은 무서운 곳이다.' },
    windfall: { title: '하사품', text: '왕비의 생일 연회에서 당신이 바친 시가 크게 칭찬받았다.', result: '왕비가 보석 박힌 브로치를 하사했다. 팔면 한밑천이다!' },
  }),
  ...careerArc({
    branch: 'thief', stat: 'luck', gold: 150, dc: 76,
    opportunity: { title: '보물 지도', text: '술 취한 선원에게서 보물 지도를 슬쩍했다. 진짜일까?',
      take: '지도를 따라간다', win: '진짜였다! 동굴 깊숙한 곳에서 해적의 금화 상자를 찾았다!', lose: '가짜 지도였다. 함정에 빠져 장비만 잃었다.',
      pass: '팔아치운다', passText: '다른 바보에게 지도를 팔았다. 이게 진짜 도둑의 지혜!' },
    rival: { title: '라이벌 괴도', text: '「검은 고양이」라는 괴도가 당신의 구역을 넘보고 있다.',
      fight: '누가 먼저 훔치나 승부한다', win: '한발 앞서 보석을 훔쳤다! 뒷골목이 당신의 이름을 외친다.', lose: '한발 늦었다. 신문에는 「검은 고양이」의 이름만…',
      ally: '함께 일하자고 제안한다', allyText: '둘이 함께하니 일이 쉬웠다. 수익을 반씩 나눴다.' },
    crisis: { title: '현상 수배', text: '마을 곳곳에 당신의 수배 전단이 붙었다! 얼굴이 꽤 닮게 그려졌다.',
      handle: '변장하고 버틴다', win: '아무도 못 알아봤다! 오히려 수배 전단을 기념품으로 팔았다.', lose: '변장이 들통나 도망치느라 은신처의 돈을 두고 나왔다.',
      flee: '이웃 도시로 몸을 피한다', fleeText: '여비가 꽤 들었지만 무사히 몸을 숨겼다.' },
    windfall: { title: '주운 지갑', text: '훔친 지갑 하나가 유난히 묵직하다.', result: '안에는 귀족의 금화가 가득! 오늘은 운수 좋은 날!' },
  }),
  ...careerArc({
    branch: 'adventurer', stat: 'vit', gold: 120, dc: 68,
    opportunity: { title: '긴급 의뢰', text: '길드 게시판에 금테 두른 긴급 의뢰가 붙었다. 「마을을 습격하는 오우거 토벌」.',
      take: '의뢰를 받는다', win: '오우거를 쓰러뜨렸다! 마을 사람들의 환호와 두둑한 보수!', lose: '오우거의 몽둥이에 날아갔다. 치료비가 보수보다 비쌌다.',
      pass: '다른 사람에게 양보한다', passText: '무리하지 않는 것도 모험가의 실력이다.' },
    rival: { title: '라이벌 파티', text: '옆 테이블 파티가 "F급은 집에나 가라"며 비웃는다.',
      fight: '실력으로 보여준다', win: '던전 공략 속도로 압살! 길드 마스터가 랭크 승급을 제안했다.', lose: '이번엔 그쪽이 빨랐다. 다음엔 두고 보자!',
      ally: '합동 원정을 제안한다', allyText: '같이 가니 든든했다. 전리품도 나눠 가졌다.' },
    crisis: { title: '부상', text: '의뢰 중 다리를 크게 다쳤다. 의사는 한동안 쉬라고 한다.',
      handle: '이를 악물고 재활한다', win: '예전보다 더 강해져서 돌아왔다! 복귀 축하 의뢰가 쏟아졌다.', lose: '재활이 길어졌다. 약값으로 저축이 바닥났다.',
      flee: '푹 쉰다', fleeText: '비싼 치료를 받고 푹 쉬었다. 몸이 재산이다.' },
    windfall: { title: '전설의 상인', text: '던전 입구에서 수상한 상인이 낡은 반지를 사겠다고 한다.', result: '쓸모없는 줄 알았던 반지가 고대 유물이었다! 큰돈을 받았다.' },
  }),
  ...careerArc({
    branch: 'faith', stat: 'cha', gold: 80, dc: 60,
    opportunity: { title: '순례단', text: '성지 순례단을 이끌 사제를 찾는다고 한다.',
      take: '순례단을 이끈다', win: '무사히 순례를 마쳤다! 감사의 헌금이 쏟아졌다.', lose: '길을 잃어 순례가 엉망이 됐다. 사비로 보상했다.',
      pass: '신전을 지킨다', passText: '조용한 기도의 나날. 마음이 맑아진다.' },
    rival: { title: '이웃 신전', text: '이웃 마을 신전의 사제가 "기적은 우리 쪽이 더 많다"며 신도를 빼간다.',
      fight: '설교 대결을 한다', win: '감동의 설교에 신도들이 눈물을 흘렸다! 주교가 당신을 주목한다.', lose: '설교 중에 졸아버렸다… 신도들이 웃었다.',
      ally: '합동 축제를 연다', allyText: '두 신전이 함께한 축제는 대성공! 헌금도 나눴다.' },
    crisis: { title: '역병', text: '마을에 역병이 돈다. 신전으로 환자들이 몰려든다.',
      handle: '밤낮없이 치유한다', win: '역병을 잠재웠다! 「성녀/성자」라는 별명이 생겼다.', lose: '힘이 모자랐다. 약값으로 신전 금고가 비었다.',
      flee: '이웃 신전에 도움을 청한다', fleeText: '사례금을 주고 지원을 받았다. 함께라서 다행이다.' },
    windfall: { title: '익명의 기부', text: '신전 문 앞에 묵직한 자루가 놓여 있다. 쪽지에는 「예전에 구해준 사람」.', result: '자루 가득 금화가! 여신님, 감사합니다.' },
  }),
  ...careerArc({
    branch: 'demon', stat: 'mana', gold: 200, dc: 80,
    opportunity: { title: '마왕의 시험', text: '마왕이 군단장들을 불러모았다. "인간의 요새 하나를 함락시킨 자에게 영지를 주겠다."',
      take: '요새로 출격한다', win: '요새가 함락됐다! 마왕이 직접 하사품을 내렸다.', lose: '용사 파티와 마주쳐 후퇴했다. 체면이 말이 아니다.',
      pass: '몸을 사린다', passText: '무리한 공적보다 생존. 마왕군에서 오래 사는 비결이다.' },
    rival: { title: '사천왕의 견제', text: '사천왕 중 하나가 당신을 노골적으로 견제한다.',
      fight: '마력 대결을 신청한다', win: '마력의 격돌 끝에 승리! 마왕군 서열이 올라갔다.', lose: '날아가 벽에 박혔다. 부하들이 수군댄다.',
      ally: '충성을 맹세한다', allyText: '사천왕의 그늘 아래서 짭짤한 떡고물을 받았다.' },
    crisis: { title: '반란', text: '부하 마물들이 반란을 일으켰다! 성문이 불타고 있다.',
      handle: '직접 진압한다', win: '반란을 잠재웠다. 마물들이 다시 충성을 맹세했다.', lose: '진압에 실패했다. 보물고를 털렸다…',
      flee: '보상금으로 달랜다', fleeText: '금화로 마물들의 입을 막았다. 마왕군도 결국 돈이다.' },
    windfall: { title: '용의 둥지', text: '순찰 중에 비어 있는 용의 둥지를 발견했다.', result: '용이 모아둔 금화 더미를 챙겼다! 마왕에겐 비밀이다.' },
  }),
  ...careerArc({
    branch: 'hero', stat: 'vit', gold: 200, dc: 88,
    opportunity: { title: '왕의 부탁', text: '국왕이 머리를 숙였다. "공주가 마물에게 납치되었소. 부디…"',
      take: '공주를 구하러 간다', win: '공주를 구했다! 왕국 전체가 축제다. 국왕이 금고를 열었다.', lose: '마물에게 당해 후퇴했다. 공주는 다른 기사가 구했다…',
      pass: '다른 임무가 먼저다', passText: '용사에게는 더 큰 사명이 있다. …아마도.' },
    rival: { title: '가짜 용사', text: '「진짜 용사」를 자칭하는 녀석이 나타나 당신을 사기꾼이라 부른다.',
      fight: '결투로 증명한다', win: '성검이 빛났다! 가짜 용사가 무릎을 꿇었다. 진짜는 하나뿐!', lose: '방심했다가 졌다. 사람들이 수군댄다…',
      ally: '동료로 받아들인다', allyText: '알고 보니 꽤 쓸만한 녀석이었다. 파티가 든든해졌다.' },
    crisis: { title: '성검의 침묵', text: '성검이 갑자기 빛을 잃었다! 마왕군이 이 틈을 노린다.',
      handle: '성검의 신전으로 간다', win: '시련을 통과하자 성검이 더 밝게 빛났다! 신전에서 보물도 받았다.', lose: '시련에 실패했다. 대장장이에게 거금을 주고 겨우 고쳤다.',
      flee: '평범한 검으로 버틴다', fleeText: '비싼 검을 샀다. 성검은 언젠가 다시 빛나겠지.' },
    windfall: { title: '감사의 마을', text: '예전에 구해준 마을 사람들이 찾아왔다.', result: '모두가 조금씩 모은 성금을 내밀었다. 용사 하길 잘했다!' },
  }),
];
