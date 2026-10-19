import type { GameEvent, LifeState } from '../../types';
import { jobById, jobTitle } from '../jobs';

const has = (s: LifeState, f: string) => s.flags.includes(f);

/** 직업 선택, 승진, 직업 전용 사건 */
export const CAREER: GameEvent[] = [
  {
    id: 'm_career18', title: '갈림길', milestone: true,
    cond: { minAge: 18, maxAge: 25, jobs: [null] },
    text: '열여덟. 이제 무엇으로 살아갈지 정해야 한다.',
    choices: [
      {
        label: '기사단에 입단한다', cond: { test: (s) => s.stats.vit >= 32 || has(s, 'academy_sword') },
        success: { text: '왕국 기사단의 문장을 받았다. 무거웠다.', effect: { job: 'knight' }, tone: 'milestone' },
      },
      {
        label: '궁정 마법사단에 지원한다', cond: { test: (s) => (s.stats.mana >= 36 && s.stats.int >= 26) || has(s, 'academy_magic') || has(s, 'apprentice') },
        success: { text: '회색 로브를 걸쳤다. 탑의 계단은 끝이 보이지 않았다.', effect: { job: 'mage' }, tone: 'milestone' },
      },
      {
        label: '상회에 들어간다', cond: { test: (s) => (s.stats.int >= 24 && s.stats.cha >= 22) || s.houseId === 'merchant' || has(s, 'academy_scholar') },
        success: { text: '장부와 저울, 그리고 끝없는 흥정의 세계에 발을 들였다.', effect: { job: 'merchant' }, tone: 'milestone' },
      },
      {
        label: '신전에 출가한다', cond: { karmaMin: 15, notFlags: ['demonblood'] },
        success: { text: '머리를 깎고 흰 옷을 입었다. 신은 아직 대답하지 않았다.', effect: { job: 'priest' }, tone: 'milestone' },
      },
      {
        label: '마왕군에 투신한다', cond: { test: (s) => (has(s, 'demonblood') && !has(s, 'deserter')) || s.karma <= -40 },
        success: { text: '국경 너머 검은 성채로 향했다. 인간의 땅에는 더 이상 당신의 자리가 없었다.', effect: { job: 'demon_officer', karma: -5 }, tone: 'milestone' },
      },
      {
        label: '모험가 길드에 등록한다',
        success: { text: '나무 패찰 하나를 받았다. 가장 낮은 등급, 그러나 가장 넓은 길이었다.', effect: { job: 'adventurer' }, tone: 'milestone' },
      },
      {
        label: '고향으로 돌아가 땅을 일군다', cond: { notHouses: ['noble', 'demon'] },
        success: { text: '괭이를 들었다. 흙냄새가 그리웠다.', effect: { job: 'farmer' }, tone: 'milestone' },
      },
      {
        label: '가문의 상단을 맡는다', cond: { houses: ['noble'] },
        success: { text: '대공가의 상단은 작은 왕국과도 같았다.', effect: { job: 'merchant', stats: { fame: 3 } }, tone: 'milestone' },
      },
    ],
  },
  {
    id: 'e_promotion', title: '기회', weight: 3,
    cond: {
      maxJobRank: 4,
      test: (s) => {
        const job = jobById(s.jobId);
        if (!job) return false;
        if (job.id === 'hero' && s.jobRank >= 4) return false; // 최종 직위는 마왕성에서
        return s.stats[job.primary] >= 20 + s.jobRank * 12;
      },
    },
    text: (s) => `${jobTitle(s.jobId, s.jobRank + 1)}의 자리가 비었다. 시선이 당신에게 모인다.`,
    auto: {
      check: { stat: 'fame', dc: 10 },
      success: {
        text: (s) =>
          s.jobId === 'demon_officer' && s.jobRank === 5
            ? '선대 마왕이 쓰러지고, 군단은 당신을 새 왕으로 추대했다. 당신은 마왕의 왕좌에 앉았다.'
            : `${jobTitle(s.jobId, s.jobRank)}에 올랐다.`,
        effect: { jobRank: 1, stats: { fame: 5 } },
        tone: 'milestone',
      },
      fail: { text: '기회는 다른 이에게 돌아갔다.' },
    },
  },

  // ───── 기사 ─────
  {
    id: 'e_knight_war', title: '출진', weight: 2,
    cond: { minAge: 18, maxAge: 60, jobs: ['knight'] },
    text: '국경에 적군이 집결했다. 기사단에 출진 명령이 떨어졌다.',
    choices: [
      {
        label: '선봉에 선다', check: { stat: 'vit', dc: 42 },
        success: { text: '적진을 꿰뚫었다. 개선 행렬의 맨 앞에 당신이 있었다.', effect: { stats: { fame: 12 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '창끝이 갑주의 틈을 찾아냈다.', effect: { death: 'war' } },
      },
      {
        label: '진지를 지킨다', check: { stat: 'vit', dc: 25 },
        success: { text: '진지는 무너지지 않았다.', effect: { stats: { fame: 4 } } },
        fail: { text: '야습에 진지가 불탔다. 화살이 어깨를 꿰뚫었다.', effect: { stats: { vit: -12 }, zeroCause: 'war' } },
      },
    ],
  },
  // ───── 상인 ─────
  {
    id: 'e_merchant_deal', title: '남방 무역로', weight: 2,
    cond: { minAge: 18, maxAge: 65, jobs: ['merchant'] },
    text: '남방 무역로를 독점할 기회가 왔다. 전 재산을 걸어야 한다.',
    choices: [
      {
        label: '전부 건다', check: { stat: 'int', dc: 40 },
        success: { text: '배는 금과 향신료를 가득 싣고 돌아왔다.', effect: { stats: { fame: 12 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '배는 돌아오지 않았다.', effect: { stats: { fame: -12, cha: -2 } } },
      },
      { label: '안전하게 간다', success: { text: '작은 이익을 꾸준히 쌓았다.', effect: { stats: { int: 1 } } } },
    ],
  },
  // ───── 모험가 ─────
  {
    id: 'e_adv_betrayal', title: '야영지의 밤', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 55, jobs: ['adventurer'] },
    text: '던전에서 돌아오는 길, 동료들의 눈빛이 이상하다. 보물의 분배를 두고 수군거린다.',
    choices: [
      {
        label: '동료를 믿는다', check: { stat: 'luck', dc: 38 },
        success: { text: '기우였다. 그들은 끝까지 당신의 동료였다.', effect: { stats: { fame: 3 }, karma: 3 } },
        fail: { text: '잠든 사이, 등에 칼이 꽂혔다.', effect: { death: 'betrayal_party' } },
      },
      { label: '몫을 포기한다', success: { text: '보물을 모두 내주었다. 목숨값이었다.', effect: { stats: { fame: -3 }, karma: 5 } } },
      {
        label: '먼저 손을 쓴다', check: { stat: 'vit', dc: 35 },
        success: { text: '야영지에는 당신 혼자 남았다.', effect: { karma: -20, stats: { fame: 2 } }, tone: 'bad' },
        fail: { text: '셋을 상대하기엔 역부족이었다.', effect: { death: 'betrayal_party' } },
      },
    ],
  },
  {
    id: 'e_adv_quest', title: '고난도 의뢰', weight: 2,
    cond: { minAge: 18, maxAge: 60, jobs: ['adventurer'] },
    text: '길드 게시판에 금테 두른 의뢰서가 붙었다. 와이번 둥지 소탕.',
    choices: [
      {
        label: '수락한다', check: { stat: 'vit', dc: 34 },
        success: { text: '와이번의 꼬리를 길드 카운터에 내려놓았다.', effect: { stats: { fame: 7, luck: 1 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '독침이 허벅지를 꿰뚫었다.', effect: { stats: { vit: -14 }, zeroCause: 'dungeon' } },
      },
      { label: '다른 의뢰를 찾는다', success: { text: '약초 채집도 엄연한 일이다.', effect: { stats: { luck: 1 } } } },
    ],
  },
  // ───── 성직자 ─────
  {
    id: 'e_priest_heretic', title: '화형대', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 70, jobs: ['priest'] },
    text: '이단 심문에 입회하라는 명이 내려왔다. 피고는 마을의 약초꾼 노파다.',
    choices: [
      { label: '판결을 따른다', success: { text: '장작에 불이 붙었다. 당신은 끝까지 눈을 감지 않았다.', effect: { karma: -15, jobRank: 1, stats: { fame: 5 } }, tone: 'bad' } },
      {
        label: '노파를 변호한다', check: { stat: 'cha', dc: 40 },
        success: { text: '노파는 풀려났다. 대주교의 눈빛이 차가워졌다.', effect: { karma: 15, stats: { fame: 5 } }, tone: 'good' },
        fail: { text: '변호는 묵살되었다. 그리고 당신의 이름도 명부에 올랐다.', effect: { karma: 10, stats: { fame: -10 }, flags: ['suspected'] } },
      },
    ],
  },
  {
    id: 'e_priest_plague', title: '역병의 마을', weight: 1.5,
    cond: { minAge: 18, maxAge: 70, jobs: ['priest'] },
    text: '역병이 도는 마을로 파견되었다. 신전의 문 앞에 환자들이 줄지어 누워 있다.',
    choices: [
      {
        label: '환자들을 돌본다', check: { stat: 'vit', dc: 30 },
        success: { text: '마을은 살아남았다. 사람들은 당신을 성인이라 불렀다.', effect: { karma: 10, stats: { fame: 8 }, jobRank: 1 }, tone: 'good' },
        fail: { text: '역병이 당신에게도 옮았다.', effect: { karma: 10, stats: { vit: -25 }, zeroCause: 'plague' } },
      },
      { label: '문을 닫고 기도한다', success: { text: '기도는 길었다. 줄은 점점 짧아졌다.', effect: { karma: -5 } } },
    ],
  },
  // ───── 농부 ─────
  {
    id: 'e_farmer_harvest', title: '수확', weight: 2,
    cond: { minAge: 18, maxAge: 85, jobs: ['farmer'] },
    text: '가을이 왔다. 한 해의 땀이 결실을 맺을 때다.',
    auto: {
      check: { stat: 'luck', dc: 20 },
      success: { text: '풍년이다. 곳간이 가득 찼다.', effect: { stats: { vit: 2, fame: 1 } } },
      fail: { text: '흉작이다. 긴 겨울이 될 것이다.', effect: { stats: { vit: -8 }, zeroCause: 'famine' } },
    },
  },
  // ───── 마왕군 ─────
  {
    id: 'e_demon_raid', title: '명령', weight: 2,
    cond: { minAge: 16, maxAge: 70, jobs: ['demon_officer'], maxJobRank: 4 },
    text: '인간 마을을 불태우라는 명령이 내려왔다.',
    choices: [
      { label: '명령을 따른다', success: { text: '불길은 밤새 꺼지지 않았다.', effect: { karma: -15, jobRank: 1, stats: { fame: 5 } }, tone: 'bad' } },
      {
        label: '마을을 몰래 대피시킨다', check: { stat: 'luck', dc: 35 },
        success: { text: '텅 빈 마을을 불태웠다. 아무도 몰랐다.', effect: { karma: 15, flags: ['spared_human'] }, tone: 'good' },
        fail: { text: '배신이 발각되었다. 강등과 고문이 뒤따랐다.', effect: { karma: 10, jobRank: -1, stats: { vit: -20 }, zeroCause: 'war' } },
      },
    ],
  },
  {
    id: 'e_demon_lord_hero', title: '용사의 도래', once: true, weight: 6,
    cond: { jobs: ['demon_officer'], minJobRank: 5 },
    text: '마왕성의 문이 부서졌다. 빛나는 검을 든 자가 왕좌의 방으로 걸어 들어온다.',
    choices: [
      {
        label: '맞선다', check: { stat: 'mana', dc: 70 },
        success: { text: '용사는 쓰러졌다. 세계는 절망했고, 당신은 공허했다.', effect: { stats: { fame: 20 }, flags: ['hero_slain'] } },
        fail: { text: '성검이 심장을 꿰뚫었다.', effect: { death: 'demon_lord_slain' } },
      },
      {
        label: '화친을 청한다', cond: { test: (s) => s.karma >= -20 || has(s, 'spared_human') }, check: { stat: 'cha', dc: 45 },
        success: { text: '검이 내려졌다. 삼백 년 전쟁이 끝난 날이었다.', effect: { karma: 30, stats: { fame: 15 }, flags: ['peace'] }, tone: 'good' },
        fail: { text: '"마왕의 말은 듣지 않는다." 그것이 용사의 대답이었다.', effect: { death: 'demon_lord_slain' } },
      },
      {
        label: '왕좌를 버리고 달아난다', check: { stat: 'luck', dc: 40 },
        success: { text: '이름을 버리고 떠돌이 모험가가 되었다.', effect: { job: 'adventurer', stats: { fame: -20 }, flags: ['fugitive'] } },
        fail: { text: '왕좌의 방을 나서기도 전에 빛이 등을 덮쳤다.', effect: { death: 'demon_lord_slain' } },
      },
    ],
  },
  // ───── 용사 ─────
  {
    id: 'e_hero_final', title: '마왕성', once: true, weight: 6,
    cond: { minAge: 22, jobs: ['hero'], minJobRank: 4 },
    text: '마침내 마왕성의 왕좌 앞에 섰다. 마왕이 천천히 일어선다.',
    choices: [
      {
        label: '성검을 휘두른다', check: { stat: 'vit', dc: 62 },
        success: { text: '성검이 마왕의 심장을 꿰뚫었다. 당신은 살아서 돌아왔다.', effect: { jobRank: 1, stats: { fame: 30 }, flags: ['slew_demon_lord'] }, tone: 'milestone' },
        fail: { text: '마왕의 마지막 일격이 당신을 꿰뚫었다. 그러나 성검 역시 마왕을 꿰뚫고 있었다.', effect: { stats: { fame: 30 }, death: 'hero_sacrifice' } },
      },
      { label: '목숨을 바쳐 봉인한다', success: { text: '생명이 성검을 타고 흘러들었다. 마왕과 함께, 빛 속으로.', effect: { stats: { fame: 40 }, karma: 20, death: 'hero_sacrifice' } } },
      {
        label: '마왕의 말을 듣는다', check: { stat: 'cha', dc: 50 },
        success: { text: '마왕은 지쳐 있었다. 두 사람은 처음으로 칼 대신 말을 나누었다.', effect: { jobRank: 1, karma: 20, stats: { fame: 15 }, flags: ['peace'] }, tone: 'good' },
        fail: { text: '마왕은 웃었다. 그리고 공격해왔다.', effect: { stats: { vit: -30 }, zeroCause: 'hero_sacrifice' } },
      },
    ],
  },
];
