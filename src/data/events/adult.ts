import type { GameEvent } from '../../types';

const friendAff = (s: { rels: { friend?: { affection: number } } }) => s.rels.friend?.affection ?? 0;

/** 15세 이후 공통 사건 */
export const ADULT: GameEvent[] = [
  // ───── 인연 ─────
  {
    id: 'a_friend_confess', title: '고백', once: true, weight: 4,
    cond: { minAge: 16, maxAge: 28, hasRel: ['friend'], relMin: { friend: 55 }, notRel: ['spouse'] },
    text: '{friend:이} 당신의 소매를 붙잡았다. "어릴 때부터 계속… 너만 봤어."',
    choices: [
      { label: '받아들인다', success: { text: '이듬해 봄, 두 사람은 마을 신전에서 혼례를 올렸다.', effect: { promoteToSpouse: 'friend', karma: 3, stats: { cha: 2 } }, tone: 'good' } },
      { label: '거절한다', success: { text: '"…그래." {friend:은} 웃고 있었다. 눈만은 웃고 있지 않았다.', effect: { rel: { friend: -10 }, flags: ['friend_obsessed'] }, tone: 'bad' } },
    ],
  },
  {
    id: 'a_yandere', title: '그림자', once: true, weight: 3,
    cond: { minAge: 18, maxAge: 55, flags: ['friend_obsessed'], hasRel: ['friend'] },
    text: '요즘 들어 누군가의 시선이 느껴진다. 오늘 밤, 문 앞에 {friend:이} 서 있었다. 손에 무언가를 쥔 채.',
    choices: [
      {
        label: '마음을 달랜다', check: { stat: 'cha', dc: 42 },
        success: { text: '긴 밤이 지나고, {friend:은} 울면서 칼을 떨어뜨렸다.', effect: { unflags: ['friend_obsessed'], rel: { friend: 10 } } },
        fail: { text: '"왜 나를 보지 않아?" 차가운 것이 가슴에 닿았다.', effect: { death: 'yandere' } },
      },
      {
        label: '도망친다', check: { stat: 'luck', dc: 30 },
        success: { text: '그 길로 도시를 떠났다. 다시는 돌아가지 않았다.', effect: { removeRel: ['friend'], unflags: ['friend_obsessed'] } },
        fail: { text: '그 그림자는 언제나 당신보다 한 걸음 빨랐다.', effect: { death: 'yandere' } },
      },
      {
        label: '맞선다', check: { stat: 'vit', dc: 30 },
        success: { text: '모든 것이 끝났을 때, 당신의 손은 피에 젖어 있었다. 어릴 적 울타리 너머의 눈동자가 떠올랐다.', effect: { removeRel: ['friend'], unflags: ['friend_obsessed'], karma: -15 }, tone: 'bad' },
        fail: { text: '{friend:은} 당신을 끌어안았다. 놓아주지 않았다. 영원히.', effect: { death: 'yandere' } },
      },
    ],
  },
  {
    id: 'a_marriage', title: '혼담', once: true, weight: 2,
    cond: { minAge: 20, maxAge: 40, notRel: ['spouse'] },
    text: '중매쟁이가 혼담을 가져왔다. 좋은 집안의, 좋은 사람이라 한다.',
    choices: [
      {
        label: '혼담을 받아들인다', cond: { test: (s) => friendAff(s) >= 55 },
        success: { text: '혼례의 날, 반려 {spouse:와} 나란히 섰다. 하객들 사이에서 {friend:이} 웃고 있었다. 박수를 치지 않은 채로.', effect: { addRel: 'spouse', flags: ['friend_obsessed'], stats: { cha: 1 } } },
      },
      {
        label: '혼담을 받아들인다', cond: { test: (s) => friendAff(s) < 55 },
        success: { text: '조촐한 혼례였다. 그러나 {spouse:의} 손은 따뜻했다.', effect: { addRel: 'spouse', stats: { cha: 1 } }, tone: 'good' },
      },
      { label: '거절한다', success: { text: '아직은 혼자 걷고 싶었다.', effect: { stats: { luck: 1 } } } },
    ],
  },
  {
    id: 'a_child', title: '탄생', once: true, weight: 3,
    cond: { minAge: 21, maxAge: 45, hasRel: ['spouse'] },
    text: '{spouse:와} 당신 사이에 아이가 태어났다.',
    auto: { success: { text: '작은 손이 당신의 손가락을 꽉 쥐었다. 두 번째 삶에서, 처음으로 지키고 싶은 것이 생겼다.', effect: { flags: ['has_child'], karma: 5, stats: { cha: 2 }, rel: { spouse: 10 } }, tone: 'good' } },
  },
  {
    id: 'a_spouse_death', title: '이별', once: true, weight: 1,
    cond: { minAge: 50, maxAge: 90, hasRel: ['spouse'] },
    text: '{spouse:이} 병상에 누운 지 한 달이 지났다.',
    auto: { success: { text: '{spouse:이} 먼저 떠났다. 마지막까지 당신의 손을 잡고 있었다.', effect: { removeRel: ['spouse'], stats: { vit: -5, cha: -2 } }, tone: 'bad' } },
  },
  {
    id: 'a_mentor_death', title: '스승의 임종', once: true, weight: 1.5,
    cond: { minAge: 30, maxAge: 80, hasRel: ['mentor'] },
    text: '스승 {mentor:이} 위독하다는 전갈이 왔다.',
    auto: { success: { text: '{mentor:은} 세상을 떠났다. 남긴 것은 낡은 지팡이와 한 권의 연구 노트였다.', effect: { removeRel: ['mentor'], stats: { int: 5, mana: 3 } }, tone: 'bad' } },
  },
  {
    id: 'a_rival_duel', title: '결투 신청', weight: 2,
    cond: { minAge: 16, maxAge: 45, hasRel: ['rival'], relMin: { rival: 11 } },
    text: '{rival:이} 장갑을 던졌다. "이번에야말로 결판을 내자."',
    choices: [
      {
        label: '검으로 받는다', check: { stat: 'vit', dc: 38 },
        success: { text: '검끝이 {rival:의} 목에서 멈췄다. 숙적은 처음으로 웃었다.', effect: { stats: { fame: 8 }, rel: { rival: 15 } } },
        fail: { text: '흙바닥에 쓰러졌다. {rival:은} 말없이 등을 돌렸다.', effect: { stats: { vit: -15, fame: -5 }, rel: { rival: -10 }, zeroCause: 'duel' } },
      },
      {
        label: '마법으로 받는다', check: { stat: 'mana', dc: 38 },
        success: { text: '두 개의 마법진이 충돌했고, 먼저 무릎을 꿇은 쪽은 {rival:이었다}.', effect: { stats: { fame: 8 }, rel: { rival: 15 } } },
        fail: { text: '역류한 마력이 혈관을 태웠다.', effect: { stats: { vit: -15, fame: -5 }, rel: { rival: -10 }, zeroCause: 'duel' } },
      },
      { label: '거절한다', success: { text: '겁쟁이라는 소문이 돌았다.', effect: { stats: { fame: -4 }, rel: { rival: -10 } } } },
    ],
  },
  {
    id: 'a_rival_deathmatch', title: '원한', once: true, weight: 3,
    cond: { minAge: 20, maxAge: 60, hasRel: ['rival'], relMax: { rival: 10 } },
    text: '원한은 깊어질 대로 깊어졌다. {rival:은} 이제 목숨을 걸자고 한다.',
    choices: [
      {
        label: '응한다', check: { stat: 'vit', dc: 42 },
        success: { text: '숙적은 쓰러졌다. 기묘하게도, 허전했다.', effect: { removeRel: ['rival'], stats: { fame: 10 }, karma: -5 } },
        fail: { text: '{rival:의} 칼이 먼저 닿았다.', effect: { death: 'duel' } },
      },
      {
        label: '화해를 청한다', check: { stat: 'cha', dc: 38 },
        success: { text: '긴 침묵 끝에, {rival:은} 당신이 내민 손을 잡았다.', effect: { rel: { rival: 40 }, karma: 10 } },
        fail: { text: '{rival:은} 침을 뱉고 떠났다. 다음에 만날 때는 칼을 들고 있을 것이다.', effect: { stats: { fame: -5 } } },
      },
    ],
  },
  {
    id: 'a_rival_reconcile', title: '오랜 숙적', once: true, weight: 2,
    cond: { minAge: 30, maxAge: 80, relMin: { rival: 70 } },
    text: '{rival:이} 술병을 들고 찾아왔다.',
    auto: { success: { text: '숙적이라 부르기엔 너무 오래 함께 걸어왔다. 두 사람은 새벽까지 옛이야기를 나누었다.', effect: { rel: { rival: 10 }, stats: { fame: 3 }, flags: ['rival_friend'] }, tone: 'good' } },
  },

  // ───── 모험 / 위험 ─────
  {
    id: 'a_dungeon', title: '심층', weight: 1.3, focus: 'explore',
    cond: { minAge: 16, maxAge: 60 },
    text: '왕국 북쪽에서 새 던전이 발견되었다. 심층에는 고대의 보물이 잠들어 있다는 소문이 돈다.',
    choices: [
      {
        label: '심층까지 내려간다', check: { stat: 'luck', dc: 34 },
        success: { text: '심층의 석실에서 고대 왕의 보관을 손에 넣었다.', effect: { stats: { fame: 10, luck: 3, mana: 3 }, flags: ['treasure'] } },
        fail: { text: '횃불이 꺼졌다. 어둠 속에서 무언가가 숨을 쉬었다.', effect: { death: 'dungeon' } },
      },
      {
        label: '상층만 탐사한다', check: { stat: 'vit', dc: 20 },
        success: { text: '마석 몇 개를 챙겨 돌아왔다.', effect: { stats: { fame: 3, vit: 2 } } },
        fail: { text: '함정에 걸려 다리를 다쳤다.', effect: { stats: { vit: -10 }, zeroCause: 'dungeon' } },
      },
      { label: '돌아선다', success: { text: '돌아오지 못한 자들의 이야기가 떠올랐다.' } },
    ],
  },
  {
    id: 'a_bandits', title: '산길', weight: 2, focus: 'explore',
    cond: { minAge: 15, maxAge: 65 },
    text: '산길에서 산적 떼가 길을 막았다. "가진 걸 전부 내놔라."',
    choices: [
      {
        label: '검을 뽑는다', check: { stat: 'vit', dc: 28 },
        success: { text: '두목이 쓰러지자 나머지는 흩어졌다.', effect: { stats: { fame: 4, vit: 1 } } },
        fail: { text: '칼날이 옆구리를 갈랐다.', effect: { stats: { vit: -16 }, zeroCause: 'bandits' } },
      },
      {
        label: '마법으로 위협한다', check: { stat: 'mana', dc: 28 },
        success: { text: '손바닥 위의 불꽃을 보자 산적들이 뒷걸음질 쳤다.', effect: { stats: { fame: 4 } } },
        fail: { text: '불꽃은 피어나지 않았다. 대가는 혹독했다.', effect: { stats: { vit: -16 }, zeroCause: 'bandits' } },
      },
      { label: '가진 것을 내준다', success: { text: '목숨값으로는 싼 편이었다.', effect: { stats: { fame: -2 } } } },
    ],
  },
  {
    id: 'a_gamble', title: '뒷골목 도박장', weight: 1, focus: 'explore',
    cond: { minAge: 16, maxAge: 60 },
    text: '연기 자욱한 지하 도박장. 주사위가 구른다.',
    choices: [
      {
        label: '전부 건다', check: { stat: 'luck', dc: 35 },
        success: { text: '운명의 여신이 미소 지었다. 도박장 주인의 얼굴이 하얗게 질렸다.', effect: { stats: { fame: 3, luck: 3 } } },
        fail: { text: '빈털터리가 되어 새벽 거리로 나섰다.', effect: { stats: { cha: -2, fame: -3 } } },
      },
      { label: '구경만 한다', success: { text: '사람이 무너지는 소리를 들었다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_dragon', title: '검은 날개', once: true, weight: 0.7,
    cond: { minAge: 22, maxAge: 75, stats: { fame: 30 } },
    text: '북쪽 하늘을 가르며 고룡이 내려왔다. 도시가 불타고 있다. 사람들이 당신의 이름을 부른다.',
    choices: [
      {
        label: '마법으로 맞선다', check: { stat: 'mana', dc: 60 },
        success: { text: '마지막 마법이 비늘을 꿰뚫었다. 용은 비명을 지르며 추락했다.', effect: { stats: { fame: 25 }, flags: ['dragonslayer'] }, tone: 'good' },
        fail: { text: '용의 숨결이 모든 것을 삼켰다.', effect: { death: 'dragon' } },
      },
      {
        label: '검으로 맞선다', check: { stat: 'vit', dc: 62 },
        success: { text: '용의 턱 아래, 단 하나의 역린에 검을 꽂았다.', effect: { stats: { fame: 25 }, flags: ['dragonslayer'] }, tone: 'good' },
        fail: { text: '검이 비늘에 닿기도 전에, 세상이 불꽃이 되었다.', effect: { death: 'dragon' } },
      },
      {
        label: '백성을 피난시킨다', check: { stat: 'cha', dc: 30 },
        success: { text: '수천 명이 당신을 따라 남문을 빠져나갔다.', effect: { karma: 12, stats: { fame: 6 } } },
        fail: { text: '혼란 속에서 불길에 휩쓸렸다.', effect: { karma: 5, stats: { vit: -18 }, zeroCause: 'dragon' } },
      },
      { label: '도망친다', success: { text: '살아남았다. 그날 불탄 도시의 이름을 당신은 평생 입에 올리지 않았다.', effect: { stats: { fame: -10 }, karma: -5 } } },
    ],
  },
  {
    id: 'a_war', title: '징집령', weight: 0.8,
    cond: { minAge: 18, maxAge: 50, notJobs: ['knight', 'demon_officer', 'hero', 'priest'], notFlags: ['demonblood'] },
    text: '국경에서 전쟁이 터졌다. 마을 광장에 징집령이 붙었다.',
    choices: [
      {
        label: '징집에 응한다', check: { stat: 'vit', dc: 30 },
        success: { text: '살아 돌아왔다. 많은 이들이 그러지 못했다.', effect: { stats: { fame: 6, vit: 2 }, karma: 3 } },
        fail: { text: '첫 번째 돌격에서, 당신의 이름은 명부의 한 줄이 되었다.', effect: { death: 'war' } },
      },
      {
        label: '징집관을 매수한다', check: { stat: 'int', dc: 26 },
        success: { text: '금화 몇 닢이면 충분했다. 대신 누군가의 아들이 끌려갔다.', effect: { stats: { fame: -3 }, karma: -6 } },
        fail: { text: '발각되어 광장에서 매질을 당했다.', effect: { stats: { fame: -8, vit: -8 } } },
      },
    ],
  },
  {
    id: 'a_illness', title: '병', weight: 0.8,
    cond: { minAge: 30, maxAge: 99 },
    text: '기침이 멎지 않는다.',
    auto: {
      check: { stat: 'vit', dc: 28 },
      success: { text: '가벼운 열병이었다. 한 달을 앓고 일어났다.', effect: { stats: { vit: -2 } } },
      fail: { text: '오랜 병이 찾아왔다. 몸이 눈에 띄게 야위어 간다.', effect: { stats: { vit: -15 }, zeroCause: 'illness' } },
    },
  },

  // ───── 어둠 ─────
  {
    id: 'a_dark_pact', title: '속삭임', once: true, weight: 0.8,
    cond: { minAge: 18, maxAge: 60 },
    text: '밤마다 같은 목소리가 들린다. "원하는 것을 주마. 대가는 훗날 받겠다."',
    choices: [
      { label: '계약한다', success: { text: '검은 인장이 손등에 새겨졌다. 힘이 넘쳐흘렀다.', effect: { flags: ['pact'], stats: { mana: 18, vit: 8, luck: 5 }, karma: -30 }, tone: 'bad' } },
      { label: '성수를 뿌린다', success: { text: '목소리는 웃으며 물러갔다. "언젠가 다시 오마."', effect: { karma: 5 } } },
    ],
  },
  {
    id: 'a_pact_due', title: '약속의 날', once: true, weight: 8,
    cond: { minAge: 45, flags: ['pact'] },
    text: '검은 인장이 타오르기 시작했다. 그 목소리가 문 앞에 와 있다.',
    auto: {
      check: { stat: 'luck', dc: 50 },
      success: { text: '계약자는 당신을 한참 바라보다가, 무슨 연유인지 그대로 사라졌다. 인장도 함께 지워졌다.', effect: { unflags: ['pact'] }, tone: 'good' },
      fail: { text: '영혼이 몸에서 뜯겨 나갔다.', effect: { death: 'pact' } },
    },
  },
  {
    id: 'a_forbidden', title: '금기의 문', once: true, weight: 2,
    cond: { minAge: 25, maxAge: 75, test: (s) => s.jobId === 'mage' || s.flags.includes('forbidden_knowledge') },
    text: '오랜 연구 끝에, 신이 닫아둔 문의 열쇠에 닿았다. 문 너머에는 진리가 있다.',
    choices: [
      {
        label: '문을 연다', check: { stat: 'int', dc: 55 },
        success: { text: '진리는 아름다웠다. 당신은 그것을 견뎠다.', effect: { stats: { mana: 15, int: 10, fame: 10 }, flags: ['archmage_secret'] }, tone: 'good' },
        fail: { text: '문 너머의 것이 당신을 바라보았다.', effect: { death: 'experiment' } },
      },
      { label: '열쇠를 불태운다', success: { text: '어떤 문은 닫혀 있어야 한다.', effect: { karma: 5, stats: { int: 2 } } } },
    ],
  },
  {
    id: 'a_inquisition', title: '이단 심문관', once: true, weight: 1.5,
    cond: { minAge: 18, maxAge: 80, notJobs: ['priest'], test: (s) => ['forbidden_knowledge', 'archmage_secret', 'pact', 'suspected'].some((f) => s.flags.includes(f)) },
    text: '검은 옷의 심문관들이 문을 두드렸다. "이단의 혐의가 있다."',
    choices: [
      {
        label: '혐의를 부정한다', check: { stat: 'cha', dc: 40 },
        success: { text: '심문관들은 증거를 찾지 못하고 물러갔다. 지금은.', effect: { stats: { fame: -3 } } },
        fail: { text: '증거는 충분했다. 광장에 장작이 쌓였다.', effect: { death: 'heresy' } },
      },
      { label: '참회한다', success: { text: '무릎을 꿇고 모든 것을 고백했다. 목숨은 건졌으나, 이름은 더럽혀졌다.', effect: { stats: { fame: -15 }, karma: 5, unflags: ['forbidden_knowledge', 'suspected'] } } },
      {
        label: '도주한다', check: { stat: 'luck', dc: 35 },
        success: { text: '창문으로 뛰어내려 어둠 속으로 사라졌다.', effect: { stats: { fame: -10 }, flags: ['fugitive'] } },
        fail: { text: '성문은 이미 닫혀 있었다.', effect: { death: 'heresy' } },
      },
    ],
  },
  {
    id: 'a_demon_exposed', title: '피의 정체', once: true, weight: 1.5,
    cond: { minAge: 15, maxAge: 70, flags: ['demonblood'], notJobs: ['demon_officer'] },
    text: '누군가 당신의 붉은 눈동자를 보았다. 마을에 소문이 돈다. "저자는 마족이다."',
    choices: [
      {
        label: '거짓을 꾸민다', check: { stat: 'cha', dc: 38 },
        success: { text: '그럴듯한 이야기를 지어냈다. 소문은 잦아들었다.', effect: { karma: -3 } },
        fail: { text: '기사단이 왔다. 해명의 기회는 주어지지 않았다.', effect: { death: 'demon_purge' } },
      },
      {
        label: '마을을 떠난다', check: { stat: 'luck', dc: 25 },
        success: { text: '또다시 짐을 쌌다. 어디에도 오래 머물 수 없다.', effect: { stats: { fame: -5 } } },
        fail: { text: '마을 어귀에서 횃불을 든 사람들이 기다리고 있었다.', effect: { death: 'demon_purge' } },
      },
      {
        label: '정체를 밝히고 지난 선행을 호소한다', cond: { karmaMin: 30 }, check: { stat: 'cha', dc: 28 },
        success: { text: '마을 사람들은 오래 침묵했다. 그리고 당신이 구했던 노인이 앞으로 나와 당신의 손을 잡았다.', effect: { karma: 10, stats: { fame: 15 }, flags: ['accepted'] }, tone: 'good' },
        fail: { text: '진실은 아무도 구하지 못했다.', effect: { death: 'demon_purge' } },
      },
    ],
  },
  {
    id: 'a_hero_party_invite', title: '용사 일행', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 40, stats: { fame: 18 }, notHouses: ['hero'], notJobs: ['hero', 'demon_officer'] },
    text: '용사 일행이 당신의 소문을 듣고 찾아왔다. "함께 마왕을 토벌하지 않겠나."',
    choices: [
      { label: '합류한다', success: { text: '빛나는 이들의 곁에 섰다. 그 빛이 얼마나 차가운지는 아직 몰랐다.', effect: { flags: ['hero_party'], stats: { fame: 10 } }, tone: 'good' } },
      { label: '사양한다', success: { text: '정중히 고개를 저었다. 용사는 아쉬운 기색 없이 돌아섰다.' } },
    ],
  },
  {
    id: 'a_hero_framed', title: '누명', once: true, weight: 4,
    cond: { minAge: 19, maxAge: 50, flags: ['hero_party'] },
    text: '왕녀가 독살당했다. 그리고 용사는, 증거라며 당신의 단검을 내밀었다.',
    choices: [
      {
        label: '결백을 주장한다', check: { stat: 'cha', dc: 46 },
        success: { text: '진범은 용사 파티의 성녀였다. 그러나 당신을 향한 의심의 눈초리는 끝내 거두어지지 않았다.', effect: { stats: { fame: 5 }, karma: 5, unflags: ['hero_party'] } },
        fail: { text: '재판은 한나절 만에 끝났다. 광장의 군중은 용사의 이름을 연호했다.', effect: { death: 'hero_framed' } },
      },
      {
        label: '도주한다', check: { stat: 'luck', dc: 32 },
        success: { text: '국경을 넘었다. 수배서의 얼굴은 당신을 닮지 않았지만, 이름은 당신의 것이었다.', effect: { stats: { fame: -15 }, flags: ['fugitive'], unflags: ['hero_party'] } },
        fail: { text: '국경 검문소에서 붙잡혔다. 처형은 다음 날 새벽이었다.', effect: { death: 'hero_framed' } },
      },
    ],
  },
  {
    id: 'a_noble_poison', title: '은잔', once: true, weight: 1.2,
    cond: { minAge: 12, maxAge: 60, houses: ['noble'] },
    text: '연회 자리. 당신 앞에 놓인 은잔의 포도주에서 희미한 쓴 향이 난다.',
    choices: [
      {
        label: '그대로 마신다', check: { stat: 'luck', dc: 40 },
        success: { text: '독은 약했다. 사흘을 앓았을 뿐이다.', effect: { stats: { vit: -6 } } },
        fail: { text: '목구멍이 타들어 갔다. 연회장의 웃음소리가 멀어졌다.', effect: { death: 'assassination' } },
      },
      {
        label: '잔을 바꿔치기한다', check: { stat: 'int', dc: 32 },
        success: { text: '이복형이 그 잔을 비웠다. 그리고 쓰러졌다.', effect: { karma: -8, stats: { fame: 3 } } },
        fail: { text: '시도는 들켰다. 그날 이후 당신의 식사에는 늘 감시가 붙었다.', effect: { stats: { vit: -6, cha: -3 } } },
      },
      {
        label: '실수인 척 잔을 엎는다', check: { stat: 'cha', dc: 25 },
        success: { text: '범인은 끝내 밝혀지지 않았다.', effect: { stats: { fame: -1 } } },
        fail: { text: '어색한 몸짓이었다. 누군가 그것을 눈여겨보았다.', effect: { stats: { fame: -5 } } },
      },
    ],
  },
  {
    id: 'a_noble_succession', title: '후계', once: true, weight: 1.5,
    cond: { minAge: 25, maxAge: 50, houses: ['noble'] },
    text: '대공이 쓰러졌다. 후계를 두고 형제들이 칼을 갈기 시작했다.',
    choices: [
      {
        label: '후계를 다툰다', check: { stat: 'cha', dc: 50 },
        success: { text: '대공가의 문장이 당신의 가슴에 달렸다.', effect: { stats: { fame: 20 }, flags: ['heir'] }, tone: 'good' },
        fail: { text: '정적의 칼이 더 빨랐다.', effect: { death: 'assassination' } },
      },
      { label: '물러난다', success: { text: '권좌 대신 목숨을 택했다.', effect: { stats: { fame: -5 }, karma: 3 } } },
    ],
  },

  // ───── 일상 ─────
  {
    id: 'a_tavern', title: '음유시인', weight: 2, focus: 'social',
    cond: { minAge: 16, maxAge: 70 },
    text: '주점에서 낯선 음유시인이 말을 걸어왔다.',
    choices: [
      {
        label: '술을 산다', check: { stat: 'cha', dc: 22 },
        success: { text: '시인은 당신의 이야기를 노래로 만들겠다고 약속했다.', effect: { stats: { cha: 2, fame: 3, luck: 1 } } },
        fail: { text: '시인은 술만 마시고 사라졌다.', effect: { stats: { luck: -1 } } },
      },
      { label: '조용히 자리를 뜬다', success: { text: '오늘 밤은 혼자이고 싶었다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ball', title: '무도회', weight: 1.5, focus: 'social',
    cond: { minAge: 16, maxAge: 50 },
    text: '왕도의 무도회 초대장이 도착했다.',
    choices: [
      {
        label: '참석한다', check: { stat: 'cha', dc: 30 },
        success: { text: '그날 밤의 화제는 당신이었다.', effect: { stats: { fame: 6, cha: 2 } } },
        fail: { text: '발을 밟았다. 백작 부인의 발이었다.', effect: { stats: { fame: -2 } } },
      },
      { label: '불참한다', success: { text: '초대장은 벽난로 속으로 들어갔다.' } },
    ],
  },
  {
    id: 'a_research', title: '왕립 도서관', weight: 1.5, focus: 'study',
    cond: { minAge: 18, maxAge: 70 },
    text: '왕립 도서관 금서고의 열람 허가가 떨어졌다.',
    choices: [
      {
        label: '논문을 쓴다', check: { stat: 'int', dc: 32 },
        success: { text: '논문은 학회를 뒤흔들었다.', effect: { stats: { fame: 5, int: 3 } } },
        fail: { text: '반박문이 열 편 넘게 쏟아졌다.', effect: { stats: { int: 1, fame: -1 } } },
      },
      {
        label: '금서를 몰래 필사한다', check: { stat: 'luck', dc: 25 },
        success: { text: '누구도 눈치채지 못했다.', effect: { stats: { int: 4, mana: 3 }, flags: ['forbidden_knowledge'] } },
        fail: { text: '사서가 보았다. 당신의 이름이 어딘가로 보고되었다.', effect: { stats: { int: 2 }, flags: ['suspected'] } },
      },
    ],
  },
  {
    id: 'a_monster_hunt', title: '마물 토벌', weight: 1.5, focus: 'train',
    cond: { minAge: 16, maxAge: 60 },
    text: '인근 마을에 마물이 출몰한다. 토벌 의뢰가 붙었다.',
    choices: [
      {
        label: '의뢰를 받는다', check: { stat: 'vit', dc: 30 },
        success: { text: '마물의 머리를 마을 광장에 걸었다.', effect: { stats: { fame: 4, vit: 2 } } },
        fail: { text: '발톱에 찢긴 상처가 깊었다.', effect: { stats: { vit: -12 }, zeroCause: 'bandits' } },
      },
      { label: '지나친다', success: { text: '다른 누군가가 하겠지.' } },
    ],
  },
  {
    id: 'a_charity', title: '빈민가', weight: 1,
    cond: { minAge: 15, maxAge: 85 },
    text: '빈민가의 아이들이 굶주린 눈으로 당신을 올려다본다.',
    choices: [
      { label: '가진 것을 나눈다', success: { text: '아이들이 빵을 받아 들고 달아났다. 한 아이가 돌아보며 고개를 숙였다.', effect: { karma: 10, stats: { cha: 1 } } } },
      { label: '지나친다', success: { text: '세상의 모든 굶주림을 구할 수는 없다.', effect: { karma: -3 } } },
    ],
  },
  {
    id: 'a_temple_blessing', title: '신탁', once: true, weight: 1,
    cond: { minAge: 12, maxAge: 80, karmaMin: 35 },
    text: '신전의 노사제가 당신을 불러 세웠다. "신께서 당신을 보고 계십니다."',
    auto: { success: { text: '이마에 축복의 성유가 발렸다. 몸이 가벼워졌다.', effect: { stats: { luck: 6, fame: 2 } }, tone: 'good' } },
  },
  {
    id: 'a_reflection', title: '황혼', once: true, weight: 3,
    cond: { minAge: 60 },
    text: '흰머리가 늘었다. 지나온 길을 돌아본다.',
    choices: [
      {
        label: '회고록을 쓴다', check: { stat: 'int', dc: 30 },
        success: { text: '두 개의 세계를 산 사람의 기록. 책은 널리 읽혔다.', effect: { stats: { fame: 8 } } },
        fail: { text: '펜은 자꾸 멈췄다. 어떤 기억은 글이 되지 않는다.', effect: { stats: { int: 1 } } },
      },
      { label: '제자를 기른다', success: { text: '당신이 가진 모든 것을 젊은이들에게 넘겼다.', effect: { karma: 8, stats: { cha: 2 } } } },
      { label: '홀로 길을 떠난다', success: { text: '지팡이 하나를 짚고 아직 보지 못한 땅으로 향했다.', effect: { stats: { luck: 5 } } } },
    ],
  },
];
