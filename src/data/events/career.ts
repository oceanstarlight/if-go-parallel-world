import type { GameEvent, LifeState } from '../../types';
import { jobById, jobTitle } from '../jobs';

const has = (s: LifeState, f: string) => s.flags.includes(f);

/** 직업 선택, 승진, 직업 전용 사건 */
export const CAREER: GameEvent[] = [
  {
    id: 'm_career18', title: '진로 선택', milestone: true,
    cond: { minAge: 18, maxAge: 25, jobs: [null] },
    text: '열여덟 살! 이세계 성인식도 끝났다. 이제 뭘 하며 살지 정할 시간이다.',
    choices: [
      {
        label: '기사단에 입단한다', cond: { test: (s) => s.stats.vit >= 32 || has(s, 'academy_sword') },
        success: { text: '반짝이는 기사단 문장을 받았다. 가슴이 웅장해진다!', effect: { job: 'knight' }, tone: 'milestone' },
      },
      {
        label: '궁정 마법사단에 지원한다', cond: { test: (s) => (s.stats.mana >= 36 && s.stats.int >= 26) || has(s, 'academy_magic') || has(s, 'apprentice') },
        success: { text: '별무늬 로브를 걸쳤다. 마탑의 계단은 끝이 안 보이지만, 그만큼 꿈도 크다!', effect: { job: 'mage' }, tone: 'milestone' },
      },
      {
        label: '상회에 들어간다', cond: { test: (s) => (s.stats.int >= 24 && s.stats.cha >= 22) || s.houseId === 'merchant' || has(s, 'academy_scholar') },
        success: { text: '장부, 저울, 그리고 흥정! 돈 냄새 나는 세계에 첫발을 디뎠다.', effect: { job: 'merchant' }, tone: 'milestone' },
      },
      {
        label: '신전에 들어간다', cond: { karmaMin: 15, notFlags: ['demonblood'] },
        success: { text: '새하얀 사제복을 입었다. 여신님, 잘 부탁드립니다!', effect: { job: 'priest' }, tone: 'milestone' },
      },
      {
        label: '마왕군에 들어간다', cond: { test: (s) => (has(s, 'demonblood') && !has(s, 'deserter')) || s.karma <= -40 },
        success: { text: '국경 너머 마왕성으로 향했다. 어둠의 간부 루트, 시작합니다.', effect: { job: 'demon_officer', karma: -5 }, tone: 'milestone' },
      },
      {
        label: '모험가 길드에 등록한다',
        success: { text: '나무 길드 카드를 받았다. 최하위 F랭크지만, 이세계 모험가의 로망은 S급이다!', effect: { job: 'adventurer' }, tone: 'milestone' },
      },
      {
        label: '왕궁 문관 시험에 응시한다', cond: { stats: { int: 34 } }, check: { stat: 'int', dc: 52 },
        success: { text: '백 대 일의 경쟁을 뚫고 합격! 왕궁의 「서기관」이 되었다. 엘리트 코스다!', effect: { job: 'court', stats: { fame: 4 } }, tone: 'milestone' },
        fail: { text: '낙방… 일단 아무 일이나 하면서 다음 기회를 노리자.', effect: { job: 'adventurer', stress: 10 } },
      },
      {
        label: '뒷골목에 발을 들인다', cond: { notFlags: ['heroblood'], karmaMax: 20 },
        success: { text: '도적 길드의 문을 두드렸다. 정직하게 벌기엔 세상이 너무 팍팍하다!', effect: { job: 'thief', karma: -8 }, tone: 'milestone' },
      },
      {
        label: '고향에서 농사를 짓는다', cond: { notHouses: ['noble', 'demon'] },
        success: { text: '괭이를 들었다. 슬로우 라이프, 나쁘지 않다.', effect: { job: 'farmer' }, tone: 'milestone' },
      },
      {
        label: '가문의 상단을 맡는다', cond: { houses: ['noble'] },
        success: { text: '대공가의 상단은 거의 작은 나라 하나 규모였다. 스케일이 다르다!', effect: { job: 'merchant', stats: { fame: 3 } }, tone: 'milestone' },
      },
    ],
  },
  {
    id: 'e_promotion', title: '승진 찬스', weight: 3,
    cond: {
      maxJobRank: 4,
      test: (s) => {
        const job = jobById(s.jobId);
        if (!job) return false;
        if (job.id === 'hero' && s.jobRank >= 4) return false; // 최종 직위는 마왕성에서
        return s.stats[job.primary] >= 20 + s.jobRank * 12;
      },
    },
    text: (s) => `「${jobTitle(s.jobId, s.jobRank + 1)}」 자리가 비었다! 다들 당신을 힐끔힐끔 보고 있다.`,
    auto: {
      check: { stat: 'fame', dc: 10 },
      success: {
        text: (s) =>
          s.jobId === 'demon_officer' && s.jobRank === 5
            ? '선대 마왕이 은퇴를 선언했다! 군단의 만장일치로, 당신이 새로운 마왕으로 즉위했다. 망토가 펄럭인다!'
            : `승진 축하! 이제 당신은 「${jobTitle(s.jobId, s.jobRank)}」이다. 레벨 업!`,
        effect: { jobRank: 1, stats: { fame: 5 } },
        tone: 'milestone',
      },
      fail: { text: '아쉽게도 이번 기회는 다른 사람에게 돌아갔다. 다음엔 꼭!' },
    },
  },

  // ───── 기사 ─────
  {
    id: 'e_knight_war', title: '출정', weight: 2,
    cond: { minAge: 18, maxAge: 60, jobs: ['knight'] },
    text: '국경에 적군이 몰려왔다! 기사단에 출정 명령이 떨어졌다.',
    choices: [
      {
        label: '선봉에 선다', check: { stat: 'vit', dc: 42 },
        success: { text: '적진을 시원하게 뚫었다! 개선 행진 맨 앞에서 꽃잎 세례를 받았다.', effect: { stats: { fame: 12 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '앗, 갑옷 틈새로 창끝이…', effect: { death: 'war' } },
      },
      {
        label: '진지를 지킨다', check: { stat: 'vit', dc: 25 },
        success: { text: '진지는 끄떡없었다. 든든한 방패 역할 완료!', effect: { stats: { fame: 4 } } },
        fail: { text: '밤중 기습에 진지가 불탔다. 어깨에 화살을 맞았다. 아야!', effect: { stats: { vit: -12 }, zeroCause: 'war' } },
      },
    ],
  },
  // ───── 상인 ─────
  {
    id: 'e_merchant_deal', title: '남쪽 무역로', weight: 3, once: true,
    cond: { minAge: 18, maxAge: 65, jobs: ['merchant'] },
    text: '남쪽 무역로를 독점할 기회가 찾아왔다! 단, 전 재산을 걸어야 한다. 돈이 없다면… 빚을 낼 수도 있다.',
    choices: [
      {
        label: '전 재산을 올인한다', check: { stat: 'int', dc: 40 }, cond: { goldMin: 1 },
        success: { text: '배가 금화와 향신료를 산더미처럼 싣고 돌아왔다! 재산이 세 배로 불었다. 대박!', effect: { stats: { fame: 12 }, jobRank: 1, goldPct: 2, goldCap: 30000 }, tone: 'good' },
        fail: { text: '…배가 돌아오지 않았다. 지갑도 마음도 텅 비었다.', effect: { stats: { fame: -12, cha: -2 }, goldSet: 0 } },
      },
      {
        label: '빚을 내서 올인한다', check: { stat: 'int', dc: 44 }, cond: { goldMax: 0 },
        success: { text: '빌린 돈으로 띄운 배가 보물을 싣고 돌아왔다! 빚을 갚고도 큰돈이 남았다!', effect: { stats: { fame: 12 }, jobRank: 1, gold: 3000 }, tone: 'good' },
        fail: { text: '…배가 돌아오지 않았다. 남은 건 차용증 한 장. 빚이 크게 늘었다.', effect: { stats: { fame: -12, cha: -2 }, gold: -1500, stress: 20 } },
      },
      { label: '안전하게 간다', success: { text: '티끌 모아 태산. 차곡차곡 이익을 쌓았다.', effect: { stats: { int: 1 } } } },
    ],
  },
  // ───── 모험가 ─────
  {
    id: 'e_adv_betrayal', title: '야영지의 밤', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 55, jobs: ['adventurer'] },
    text: '던전에서 돌아오는 길, 파티원들의 눈빛이 수상하다. 보물 분배를 두고 소곤소곤…',
    choices: [
      {
        label: '동료를 믿는다', check: { stat: 'luck', dc: 38 },
        success: { text: '괜한 걱정이었다! 다 같이 모닥불 앞에서 건배했다.', effect: { stats: { fame: 3 }, karma: 3 } },
        fail: { text: '잠든 사이, 등 뒤가 서늘해졌다. 이것이 그 유명한 「파티 추방」 엔딩…', effect: { death: 'betrayal_party' } },
      },
      { label: '몫을 양보한다', success: { text: '보물을 몽땅 양보했다. 목숨값치고는 싸게 먹혔다.', effect: { stats: { fame: -3 }, karma: 5 } } },
      {
        label: '선수를 친다', check: { stat: 'vit', dc: 35 },
        success: { text: '정신을 차려보니 야영지에는 당신 혼자였다. 이건 좀 다크했는데…', effect: { karma: -20, stats: { fame: 2 } }, tone: 'bad' },
        fail: { text: '셋을 상대하기엔 역부족이었다.', effect: { death: 'betrayal_party' } },
      },
    ],
  },
  {
    id: 'e_adv_quest', title: '고난도 의뢰', weight: 2,
    cond: { minAge: 18, maxAge: 60, jobs: ['adventurer'] },
    text: '길드 게시판에 금테 두른 의뢰서가 붙었다. "와이번 둥지 소탕, 보상 두둑함!"',
    choices: [
      {
        label: '받아들인다', check: { stat: 'vit', dc: 34 },
        success: { text: '와이번 꼬리를 길드 카운터에 쿵 내려놓았다. 접수원 언니가 박수를 쳐주었다!', effect: { stats: { fame: 7, luck: 1 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '독침에 허벅지를 쏘였다. 으아아, 해독 포션 어디 있지?!', effect: { stats: { vit: -14 }, zeroCause: 'dungeon' } },
      },
      { label: '다른 의뢰를 찾는다', success: { text: '약초 채집도 훌륭한 일이다. 안전 제일!', effect: { stats: { luck: 1 } } } },
    ],
  },
  // ───── 성직자 ─────
  {
    id: 'e_priest_heretic', title: '이단 재판', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 70, jobs: ['priest'] },
    text: '이단 재판에 참석하라는 명령이 내려왔다. 피고는 마을의 약초꾼 할머니다.',
    choices: [
      { label: '판결을 따른다', success: { text: '할머니는 추방당했다. 위에서는 칭찬받았지만, 마음이 무거웠다.', effect: { karma: -15, jobRank: 1, stats: { fame: 5 } }, tone: 'bad' } },
      {
        label: '할머니를 변호한다', check: { stat: 'cha', dc: 40 },
        success: { text: '할머니는 무죄 방면! 대주교님의 눈빛은 싸늘했지만, 마을 사람들은 당신을 업고 다녔다.', effect: { karma: 15, stats: { fame: 5 } }, tone: 'good' },
        fail: { text: '변호는 묵살되었다. 게다가 당신 이름까지 요주의 명단에 올라갔다.', effect: { karma: 10, stats: { fame: -10 }, flags: ['suspected'] } },
      },
    ],
  },
  {
    id: 'e_priest_plague', title: '유행병이 도는 마을', weight: 1.5,
    cond: { minAge: 18, maxAge: 70, jobs: ['priest'] },
    text: '유행병이 도는 마을로 파견되었다. 신전 앞에 환자들이 줄을 서 있다.',
    choices: [
      {
        label: '환자를 돌본다', check: { stat: 'vit', dc: 30 },
        success: { text: '치유 마법을 밤낮으로 썼다. 마을은 회복됐고, 사람들은 당신을 "성녀님""성자님"이라 불렀다.', effect: { karma: 10, stats: { fame: 8 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '과로 끝에 당신도 병에 걸려버렸다.', effect: { karma: 10, stats: { vit: -25 }, zeroCause: 'plague' } },
      },
      { label: '문을 닫고 기도한다', success: { text: '기도는 길었다. 그 사이 줄은 점점 짧아졌다.', effect: { karma: -5 } } },
    ],
  },
  // ───── 농부 ─────
  {
    id: 'e_farmer_harvest', title: '수확의 계절', weight: 2,
    cond: { minAge: 18, maxAge: 85, jobs: ['farmer'] },
    text: '가을이 왔다! 1년 동안 흘린 땀이 열매를 맺을 시간.',
    auto: {
      check: { stat: 'luck', dc: 20 },
      success: { text: '대풍년! 곳간이 꽉꽉 찼다. 수확제다!', effect: { stats: { vit: 2, fame: 1 } } },
      fail: { text: '흉작이다. 올겨울은 허리띠를 졸라매야겠다.', effect: { stats: { vit: -8 }, zeroCause: 'famine' } },
    },
  },
  // ───── 마왕군 ─────
  {
    id: 'e_demon_raid', title: '작전 명령', weight: 2,
    cond: { minAge: 16, maxAge: 70, jobs: ['demon_officer'], maxJobRank: 4 },
    text: '인간 마을을 습격하라는 명령이 떨어졌다.',
    choices: [
      { label: '명령을 따른다', success: { text: '마을은 불탔고, 상관은 흡족해했다. …뭔가 찝찝하다.', effect: { karma: -15, jobRank: 1, stats: { fame: 5 } }, tone: 'bad' } },
      {
        label: '몰래 마을 사람들을 대피시킨다', check: { stat: 'luck', dc: 35 },
        success: { text: '텅 빈 마을만 불태우고 보고서를 올렸다. 완벽 범죄!', effect: { karma: 15, flags: ['spared_human'] }, tone: 'good' },
        fail: { text: '들켰다! 강등당하고 감옥에서 한참 고생했다.', effect: { karma: 10, jobRank: -1, stats: { vit: -20 }, zeroCause: 'war' } },
      },
    ],
  },
  {
    id: 'e_demon_lord_hero', title: '용사 등장', once: true, weight: 6,
    cond: { jobs: ['demon_officer'], minJobRank: 5 },
    text: '쾅! 마왕성의 문이 부서졌다. 빛나는 성검을 든 용사가 왕좌의 방으로 걸어 들어온다.',
    choices: [
      {
        label: '정면으로 맞선다', check: { stat: 'mana', dc: 70 },
        success: { text: '용사는 쓰러졌다. 이겼는데… 왜 이렇게 허전하지?', effect: { stats: { fame: 20 }, flags: ['hero_slain'] } },
        fail: { text: '성검의 빛이 당신을 감쌌다. 마왕, 퇴장.', effect: { death: 'demon_lord_slain' } },
      },
      {
        label: '화해를 제안한다', cond: { test: (s) => s.karma >= -20 || has(s, 'spared_human') }, check: { stat: 'cha', dc: 45 },
        success: { text: '용사가 검을 내렸다. 삼백 년 전쟁이 끝난 날, 두 사람은 같이 밥을 먹었다.', effect: { karma: 30, stats: { fame: 15 }, flags: ['peace'] }, tone: 'good' },
        fail: { text: '"마왕의 말은 안 들어!" 대화는 거기까지였다.', effect: { death: 'demon_lord_slain' } },
      },
      {
        label: '왕좌를 버리고 도망친다', check: { stat: 'luck', dc: 40 },
        success: { text: '이름을 바꾸고 평범한 모험가로 새 출발했다. 은퇴한 마왕의 슬로우 라이프!', effect: { job: 'adventurer', stats: { fame: -20 }, flags: ['fugitive'] } },
        fail: { text: '방을 나서기도 전에 등 뒤에서 성검의 빛이 번쩍였다.', effect: { death: 'demon_lord_slain' } },
      },
    ],
  },
  // ───── 용사 ─────
  {
    id: 'e_hero_final', title: '마왕성 최종 결전', once: true, weight: 6,
    cond: { minAge: 22, jobs: ['hero'], minJobRank: 4 },
    text: '드디어 마왕성 왕좌의 방. 마왕이 천천히 일어선다. 최종 보스전이다!',
    choices: [
      {
        label: '성검을 휘두른다', check: { stat: 'vit', dc: 62 },
        success: { text: '성검이 마왕을 꿰뚫었다! 세계에 평화가 찾아왔다. 해피엔딩!', effect: { jobRank: 1, stats: { fame: 30 }, flags: ['slew_demon_lord'] }, tone: 'milestone' },
        fail: { text: '마지막 일격이 엇갈렸다. 당신과 마왕은 함께 빛 속으로 사라졌다.', effect: { stats: { fame: 30 }, death: 'hero_sacrifice' } },
      },
      { label: '목숨을 걸고 봉인한다', success: { text: '모든 생명력을 성검에 담았다. 눈부신 빛 속에서, 세계가 구원받았다.', effect: { stats: { fame: 40 }, karma: 20, death: 'hero_sacrifice' } } },
      {
        label: '마왕과 대화한다', check: { stat: 'cha', dc: 50 },
        success: { text: '마왕은 사실 많이 지쳐 있었다. 두 사람은 처음으로 칼 대신 차를 나누었다.', effect: { jobRank: 1, karma: 20, stats: { fame: 15 }, flags: ['peace'] }, tone: 'good' },
        fail: { text: '마왕이 피식 웃더니 공격해 왔다. 대화 실패!', effect: { stats: { vit: -30 }, zeroCause: 'hero_sacrifice' } },
      },
    ],
  },
];
