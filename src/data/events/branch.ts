import type { GameEvent } from '../../types';

/**
 * 가지 전용 사건: 직업마다 돈을 버는 고유한 방식 (투자, 한탕, 궁정 암투 …)
 * 공통 틀(arcs.ts)과 달리 각 가지의 규칙을 만드는 사건들이다.
 */
export const BRANCH_EVENTS: GameEvent[] = [
  // ───── 상인: 투자 (성공하면 대박, 실패하면 빚) ─────
  {
    id: 'b_invest', title: '투자 제안', branch: 'merchant', weight: 2.5, cond: { minAge: 18 },
    text: '수상할 만큼 매력적인 투자 제안이 들어왔다. "동방 무역선에 투자하면 세 배로 돌려드리죠!"',
    choices: [
      { label: '재산의 30%를 건다', cond: { goldMin: 100 }, check: { stat: 'int', dc: 35 },
        success: { text: '무역선이 무사히 돌아왔다! 투자금이 불어났다.', effect: { goldPct: 0.6 }, tone: 'good' },
        fail: { text: '배가 돌아오지 않았다… 투자금을 날렸다.', effect: { goldPct: -0.3, stress: 10 } } },
      { label: '재산의 80%를 건다', cond: { goldMin: 100 }, check: { stat: 'int', dc: 45 },
        success: { text: '대박이다!! 금화가 산더미처럼 쌓였다!', effect: { goldPct: 1.6, stats: { fame: 3 }, mood: 'joy' }, tone: 'milestone' },
        fail: { text: '전 재산이 바다에 가라앉았다… 장부를 보며 멍하니 앉아 있었다.', effect: { goldPct: -0.8, stress: 25, mood: 'gloom' } } },
      { label: '빚을 내서 2,000G를 건다', check: { stat: 'int', dc: 50 },
        success: { text: '빚을 갚고도 남았다! 하이 리스크 하이 리턴!', effect: { gold: 4000, stats: { fame: 4 } }, tone: 'milestone' },
        fail: { text: '망했다. 빚 2,000G만 남았다. 빚쟁이들이 냄새를 맡기 시작했다…', effect: { gold: -2000, stress: 30, mood: 'fear' } } },
      { label: '거절한다', success: { text: '"너무 좋은 얘기는 의심하라." 아버지의 말씀이 떠올랐다.' } },
    ],
  },

  // ───── 빚: 빚쟁이가 찾아온다 ─────
  {
    id: 'b_debt_collector', title: '빚쟁이', branch: 'debtor', weight: 4, cond: { minAge: 16 },
    text: '문이 쾅쾅 울린다. "돈 갚아! 이자까지 전부!" 덩치 큰 빚쟁이들이 몰려왔다.',
    choices: [
      { label: '몸으로 때운다', success: { text: '1년 내내 광산에서 일했다. 몸은 망가졌지만 빚이 조금 줄었다.', effect: { gold: 600, stats: { vit: -8 }, stress: 25 } } },
      { label: '야반도주한다', check: { stat: 'luck', dc: 40 },
        success: { text: '한밤중에 짐을 싸서 도망쳤다! 새 마을에서 새 출발이다.', effect: { goldSet: 0, stats: { fame: -5 }, flags: ['fugitive'] }, tone: 'good' },
        fail: { text: '붙잡혔다! 빚쟁이들에게 흠씬 두들겨 맞았다.', effect: { stats: { vit: -20 }, zeroCause: 'debt', stress: 20 } } },
      { label: '파산을 신청한다', success: { text: '가진 것을 모두 내주고 빚을 털었다. 이름에 먹칠을 했지만, 다시 시작할 수 있다.', effect: { goldSet: 0, stats: { fame: -10 }, jobRank: -2, flags: ['bankrupted'] } } },
    ],
  },
  {
    id: 'b_debt_doom', title: '빚의 끝', branch: 'debtor', weight: 6, cond: { goldMax: -6000 },
    text: '빚이 감당할 수 없을 만큼 불어났다. 빚쟁이 두목이 직접 찾아왔다. 눈빛이 차갑다.',
    choices: [
      { label: '마지막 도박을 한다', check: { stat: 'luck', dc: 55 },
        success: { text: '기적이 일어났다! 도박장에서 빚을 전부 갚을 만큼 땄다!', effect: { goldSet: 500, mood: 'joy' }, tone: 'milestone' },
        fail: { text: '마지막 패가 뒤집혔다…', effect: { death: 'debt' } } },
      { label: '모든 것을 내놓는다', success: { text: '집도, 물건도, 이름도 내주었다. 빈털터리지만 살아는 있다.', effect: { goldSet: 0, stats: { fame: -15 }, stress: 30, flags: ['bankrupted'] } } },
    ],
  },

  // ───── 도둑: 한탕 (걸리면 몰수, 세 번째면 교수대) ─────
  {
    id: 'b_heist', title: '한탕', branch: 'thief', weight: 3.5, cond: { minAge: 14 },
    text: (s) => `달이 구름에 가린 밤. 도둑의 피가 끓는다. (지금까지 붙잡힌 횟수: ${s.caught ?? 0}번${(s.caught ?? 0) >= 2 ? ' — 다음엔 교수대다!' : ''})`,
    choices: [
      { label: '시장에서 소매치기', check: { stat: 'luck', dc: 22 },
        success: { text: '눈 깜짝할 사이에 지갑 세 개! 손이 기억하고 있다.', effect: { gold: 120 }, tone: 'good' },
        fail: { text: '"도둑이야!" 경비병에게 붙잡혔다. 가진 돈을 모두 몰수당하고 감옥에 갇혔다.', effect: { caught: true } } },
      { label: '귀족 저택을 턴다', check: { stat: 'luck', dc: 42 },
        success: { text: '보석함을 통째로 들고 나왔다! 오늘 밤의 주인공은 나다.', effect: { gold: 1500, stats: { fame: 2 } }, tone: 'good' },
        fail: { text: '경비견에게 물렸다! 붙잡혀 재산을 몰수당하고 감옥에 갇혔다.', effect: { caught: true, stats: { vit: -5 } } } },
      { label: '왕궁 보물고를 노린다', check: { stat: 'luck', dc: 65 },
        success: { text: '왕궁 보물고가 털렸다!! 대륙 전체가 「전설의 괴도」를 이야기한다!', effect: { gold: 25000, stats: { fame: 15 }, jobRank: 1, flags: ['royal_heist'] }, tone: 'milestone' },
        fail: { text: '근위대에 포위당했다. 전 재산 몰수, 그리고 지하 감옥으로…', effect: { caught: true, stats: { fame: 5 } } } },
      { label: '오늘은 쉰다', success: { text: '도둑에게도 휴일은 필요하다.', effect: { stress: -10 } } },
    ],
  },
  {
    id: 'b_jail', title: '감옥', branch: 'prisoner', weight: 8, cond: {},
    text: '차가운 돌바닥. 철창 너머로 달빛이 들어온다. 형기가 끝나간다.',
    choices: [
      { label: '손을 씻고 새 삶을 산다', success: { text: '출소하는 날, 하늘이 유난히 파랬다. 이제 정직하게 살자.', effect: { unflags: ['jailed'], job: 'farmer', karma: 10 } } },
      { label: '다시 뒷골목으로', success: { text: '출소 첫날 밤, 옛 동료들이 마중 나왔다. "기다렸다고, {sir}."', effect: { unflags: ['jailed'], karma: -5 } } },
      { label: '탈옥한다', check: { stat: 'luck', dc: 45 },
        success: { text: '숟가락 하나로 벽을 뚫었다! 전설에 한 줄이 추가됐다.', effect: { unflags: ['jailed'], stats: { fame: 5 } }, tone: 'good' },
        fail: { text: '탈옥 실패! 형기가 늘어났다.', effect: { stress: 20 } } },
    ],
  },
  {
    id: 'b_thief_recruit', title: '뒷골목의 제안', once: true, weight: 1.5,
    cond: { minAge: 14, maxAge: 40, goldMax: 50, notJobs: ['thief', 'hero', 'priest'] },
    text: '배고픈 저녁, 낡은 망토의 사내가 다가왔다. "솜씨 좋아 보이는데… 우리 길드에서 일해볼 생각 없나?"',
    choices: [
      { label: '도적 길드에 들어간다', success: { text: '뒷골목의 문이 열렸다. 오늘부터 당신은 「좀도둑」이다.', effect: { job: 'thief', karma: -10 }, tone: 'milestone' } },
      { label: '거절한다', success: { text: '"배는 고파도 양심은 안 판다!" 사내가 어깨를 으쓱하고 사라졌다.', effect: { karma: 3 } } },
    ],
  },

  // ───── 궁정: 고난도 시험과 암투 ─────
  {
    id: 'b_court_exam', title: '왕궁 문관 시험', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 40, notJobs: ['court', 'hero', 'demon_officer'], stats: { int: 34 } },
    text: '3년에 한 번 열리는 왕궁 문관 시험! 합격률은 백 명 중 한 명이라고 한다.',
    choices: [
      { label: '시험에 응시한다', check: { stat: 'int', dc: 55 },
        success: { text: '합격!! 방에 붙은 이름을 세 번이나 확인했다. 오늘부터 왕궁의 「서기관」이다!', effect: { job: 'court', stats: { fame: 5 } }, tone: 'milestone' },
        fail: { text: '낙방했다… 3년 뒤를 기약하자.', effect: { stress: 15, mood: 'gloom' } } },
      { label: '지금 일에 만족한다', success: { text: '궁정은 무서운 곳이라고들 한다. 지금이 행복하다.' } },
    ],
  },
  {
    id: 'b_court_intrigue', title: '궁정 암투', branch: 'court', weight: 2, cond: { minAge: 22 },
    text: '어두운 복도에서 누군가 속삭인다. "재상 각하를 끌어내릴 계획이 있소. 함께하겠소?"',
    choices: [
      { label: '계획에 가담한다', check: { stat: 'int', dc: 60 },
        success: { text: '정변이 성공했다! 새 권력의 핵심이 되었다. 재물과 지위가 쏟아진다.', effect: { jobRank: 1, gold: 3000, stats: { fame: 6 }, karma: -5 }, tone: 'milestone' },
        fail: { text: '계획이 새어나갔다. 그날 밤, 와인잔에서 쓴맛이 났다…', effect: { death: 'assassination' } } },
      { label: '재상에게 밀고한다', check: { stat: 'cha', dc: 50 },
        success: { text: '재상이 당신을 신임하게 되었다. 두둑한 포상금!', effect: { gold: 1500, stats: { fame: 3 } }, tone: 'good' },
        fail: { text: '밀고가 오히려 의심을 샀다. 한직으로 밀려났다.', effect: { jobRank: -1, stress: 15 } } },
      { label: '못 들은 척한다', success: { text: '궁정에서 오래 사는 법: 아무것도 모르는 척하기.' } },
    ],
  },

  // ───── 농부: 땅 ─────
  {
    id: 'b_farm_land', title: '이웃의 땅', branch: 'farmer', once: true, weight: 2, cond: { minAge: 20, goldMin: 700 },
    text: '도시로 이사 가는 이웃이 밭을 싸게 넘기겠다고 한다. "700G면 돼. 잘 부탁해."',
    choices: [
      { label: '땅을 산다 (700G)', success: { text: '내 땅이 두 배가 되었다! 이제 어엿한 지주의 길이다.', effect: { gold: -700, own: 'land' }, tone: 'good' } },
      { label: '사양한다', success: { text: '지금 밭만으로도 충분하다.' } },
    ],
  },

  // ───── 공통: 인생 2막 (가지를 갈아탄다) ─────
  {
    id: 'b_career_change', title: '인생 2막', once: true, weight: 1.2, cond: { minAge: 28, maxAge: 50, notJobs: [null, 'hero', 'demon_officer'] },
    text: '문득 거울을 보았다. "이대로 괜찮은 걸까?" 새로운 길이 머릿속을 스친다.',
    choices: [
      { label: '고향에서 농사를 짓는다', cond: { notJobs: ['farmer'] }, success: { text: '도시를 떠나 흙냄새 나는 삶으로. 마음이 편안해졌다.', effect: { job: 'farmer', stress: -20 } } },
      { label: '장사를 시작한다', cond: { notJobs: ['merchant'] }, success: { text: '모아둔 돈으로 작은 가게를 열었다. 두근두근!', effect: { job: 'merchant' } } },
      { label: '모험가로 전직한다', cond: { notJobs: ['adventurer'] }, success: { text: '늦깎이 모험가 등록! 던전이 부른다!', effect: { job: 'adventurer' } } },
      { label: '지금 길을 계속 간다', success: { text: '흔들릴 때도 있지만, 이 길이 내 길이다.', effect: { will: 10 } } },
    ],
  },

  // ───── 부호 ─────
  {
    id: 'b_rich_scam', title: '달콤한 제안', branch: 'rich', once: true, weight: 2, cond: {},
    text: '부자가 되자 친구가 많아졌다. 오늘도 누군가 "확실한 사업"을 들고 왔다.',
    choices: [
      { label: '꼼꼼히 따져본다', check: { stat: 'int', dc: 45 },
        success: { text: '사기꾼의 허점을 찾아내 경비대에 넘겼다! 포상금까지 받았다.', effect: { gold: 1000, stats: { fame: 3 } }, tone: 'good' },
        fail: { text: '감쪽같이 속았다. 재산의 4분의 1이 증발했다.', effect: { goldPct: -0.25, mood: 'anger' } } },
      { label: '자선 재단을 세운다', success: { text: '돈을 좋은 곳에 쓰기로 했다. 사람들이 당신을 칭송한다.', effect: { gold: -3000, karma: 20, stats: { fame: 8 } }, tone: 'good' } },
    ],
  },
];
