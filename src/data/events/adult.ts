import type { GameEvent } from '../../types';

const friendAff = (s: { rels: { friend?: { affection: number } } }) => s.rels.friend?.affection ?? 0;

/** 15세 이후 공통 사건 */
export const ADULT: GameEvent[] = [
  // ───── 인연 ─────
  {
    id: 'a_friend_confess', title: '고백', once: true, weight: 4,
    cond: { minAge: 16, maxAge: 28, hasRel: ['friend'], relMin: { friend: 55 }, notRel: ['spouse'] },
    text: '{friend:이} 새빨개진 얼굴로 당신의 소매를 붙잡았다. "어, 어릴 때부터 계속… 너만 좋아했어!"',
    choices: [
      { label: '받아들인다', success: { text: '이듬해 봄, 꽃잎이 흩날리는 마을 신전에서 두 사람은 결혼식을 올렸다. 소꿉친구 루트 클리어!', effect: { promoteToSpouse: 'friend', karma: 3, stats: { cha: 2 } }, tone: 'good' } },
      { label: '거절한다', success: { text: '"…그렇구나. 응, 알았어." {friend:은} 웃고 있었다. 그런데 눈동자에 하이라이트가 없다.', effect: { rel: { friend: -10 }, flags: ['friend_obsessed'] }, tone: 'bad' } },
    ],
  },
  {
    id: 'a_yandere', title: '수상한 시선', once: true, weight: 3,
    cond: { minAge: 18, maxAge: 55, flags: ['friend_obsessed'], hasRel: ['friend'] },
    text: '요즘 어딜 가든 누군가의 시선이 느껴진다. 오늘 밤, 문 앞에 {friend:이} 서 있었다. 손에는… 부엌칼?!',
    choices: [
      {
        label: '진심으로 달랜다', check: { stat: 'cha', dc: 42 },
        success: { text: '밤새 이야기를 나눈 끝에, {friend:은} 엉엉 울며 칼을 떨어뜨렸다. "미안해… 너무 좋아해서 그랬어."', effect: { unflags: ['friend_obsessed'], rel: { friend: 10 } } },
        fail: { text: '"왜 나만 봐주지 않는 거야?" 얀데레 엔딩, 해금.', effect: { death: 'yandere' } },
      },
      {
        label: '전력으로 도망친다', check: { stat: 'luck', dc: 30 },
        success: { text: '그 길로 이웃 나라까지 도망쳤다. 가끔 등 뒤가 서늘하지만, 아마 기분 탓이다.', effect: { removeRel: ['friend'], unflags: ['friend_obsessed'] } },
        fail: { text: '모퉁이를 돌자 {friend:이} 먼저 와서 웃고 있었다. "어디 가?"', effect: { death: 'yandere' } },
      },
      {
        label: '맞선다', check: { stat: 'vit', dc: 30 },
        success: { text: '칼을 빼앗고 겨우 진정시켰다. {friend:은} 그 길로 마을을 떠났다. 씁쓸한 결말이었다.', effect: { removeRel: ['friend'], unflags: ['friend_obsessed'], karma: -15 }, tone: 'bad' },
        fail: { text: '{friend:은} 당신을 꼭 끌어안았다. "이제 영원히 같이 있자." 그리고 놓아주지 않았다.', effect: { death: 'yandere' } },
      },
    ],
  },
  {
    id: 'a_marriage', title: '맞선 제안', once: true, weight: 2,
    cond: { minAge: 20, maxAge: 40, notRel: ['spouse'] },
    text: '중매쟁이 아주머니가 맞선을 들고 왔다. 좋은 집안의 좋은 사람이라나?',
    choices: [
      {
        label: '맞선을 받아들인다', cond: { test: (s) => friendAff(s) >= 55 },
        success: { text: '결혼식 날, {spouse:와} 나란히 섰다. 하객석의 {friend:이} 웃고 있었다. 박수는 치지 않은 채로.', effect: { addRel: 'spouse', flags: ['friend_obsessed'], stats: { cha: 1 } } },
      },
      {
        label: '맞선을 받아들인다', cond: { test: (s) => friendAff(s) < 55 },
        success: { text: '아담한 결혼식이었지만 {spouse:의} 손은 따뜻했다. 행복 루트 진입!', effect: { addRel: 'spouse', stats: { cha: 1 } }, tone: 'good' },
      },
      { label: '거절한다', success: { text: '"아직은 자유롭게 살래!" 독신 라이프 만세.', effect: { stats: { luck: 1 } } } },
    ],
  },
  {
    id: 'a_child', title: '새 생명', once: true, weight: 3,
    cond: { minAge: 21, maxAge: 45, hasRel: ['spouse'] },
    text: '{spouse:와} 당신 사이에 아기가 태어났다!',
    auto: { success: { text: '조그만 손이 당신 손가락을 꼭 쥐었다. 두 번째 인생에서, 처음으로 지키고 싶은 것이 생겼다.', effect: { flags: ['has_child'], karma: 5, stats: { cha: 2 }, rel: { spouse: 10 } }, tone: 'good' } },
  },
  {
    id: 'a_spouse_death', title: '작별', once: true, weight: 1,
    cond: { minAge: 50, maxAge: 90, hasRel: ['spouse'] },
    text: '{spouse:이} 앓아누운 지 한 달이 지났다.',
    auto: { success: { text: '{spouse:이} 먼저 별이 되었다. 마지막까지 웃으며 당신의 손을 잡고 있었다.', effect: { removeRel: ['spouse'], stats: { vit: -5, cha: -2 } }, tone: 'bad' } },
  },
  {
    id: 'a_mentor_death', title: '스승님의 마지막 수업', once: true, weight: 1.5,
    cond: { minAge: 30, maxAge: 80, hasRel: ['mentor'] },
    text: '스승 {mentor:이} 위독하다는 소식이 날아왔다.',
    auto: { success: { text: '{mentor:은} "잘 컸구나" 하고 웃으며 눈을 감았다. 남은 것은 낡은 지팡이와 빼곡한 연구 노트였다.', effect: { removeRel: ['mentor'], stats: { int: 5, mana: 3 } }, tone: 'bad' } },
  },
  {
    id: 'a_rival_duel', title: '결투 신청', weight: 2,
    cond: { minAge: 16, maxAge: 45, hasRel: ['rival'], relMin: { rival: 11 } },
    text: '{rival:이} 장갑을 던졌다! "오늘이야말로 결판을 내자!"',
    choices: [
      {
        label: '검으로 받는다', check: { stat: 'vit', dc: 38 },
        success: { text: '검끝이 {rival:의} 목 앞에서 멈췄다. 숙적이 처음으로 활짝 웃었다. "…역시 너야."', effect: { stats: { fame: 8 }, rel: { rival: 15 } } },
        fail: { text: '흙바닥에 대자로 뻗었다. {rival:은} 손을 내밀까 말까 망설이다 그냥 가버렸다.', effect: { stats: { vit: -15, fame: -5 }, rel: { rival: -10 }, zeroCause: 'duel' } },
      },
      {
        label: '마법으로 받는다', check: { stat: 'mana', dc: 38 },
        success: { text: '두 마법진이 정면충돌! 먼저 무릎을 꿇은 건 {rival:이었다}.', effect: { stats: { fame: 8 }, rel: { rival: 15 } } },
        fail: { text: '마력이 역류해 머리카락이 폭탄 맞은 것처럼 부풀었다.', effect: { stats: { vit: -15, fame: -5 }, rel: { rival: -10 }, zeroCause: 'duel' } },
      },
      { label: '거절한다', success: { text: '"겁쟁이~" 하는 소문이 돌았다. 뭐, 상관없어.', effect: { stats: { fame: -4 }, rel: { rival: -10 } } } },
    ],
  },
  {
    id: 'a_rival_deathmatch', title: '진검승부', once: true, weight: 3,
    cond: { minAge: 20, maxAge: 60, hasRel: ['rival'], relMax: { rival: 10 } },
    text: '쌓이고 쌓인 앙금이 폭발 직전이다. {rival:은} 이번엔 진검승부를 하자고 한다.',
    choices: [
      {
        label: '받아들인다', check: { stat: 'vit', dc: 42 },
        success: { text: '승리했다. 그런데 이상하게, 이긴 쪽이 더 허전했다.', effect: { removeRel: ['rival'], stats: { fame: 10 }, karma: -5 } },
        fail: { text: '{rival:의} 검이 한발 빨랐다.', effect: { death: 'duel' } },
      },
      {
        label: '화해를 청한다', check: { stat: 'cha', dc: 38 },
        success: { text: '긴 침묵 끝에 {rival:이} 당신의 손을 잡았다. "…이번만이야." 츤데레였다.', effect: { rel: { rival: 40 }, karma: 10 } },
        fail: { text: '{rival:은} "흥!" 하고 고개를 돌려 가버렸다. 다음엔 진짜 칼을 들고 올 것 같다.', effect: { stats: { fame: -5 } } },
      },
    ],
  },
  {
    id: 'a_rival_reconcile', title: '오랜 라이벌', once: true, weight: 2,
    cond: { minAge: 30, maxAge: 80, relMin: { rival: 70 } },
    text: '{rival:이} 술병을 들고 찾아왔다.',
    auto: { success: { text: '라이벌이라 부르기엔 너무 오래 함께 달려왔다. 두 사람은 새벽까지 추억 이야기로 웃었다.', effect: { rel: { rival: 10 }, stats: { fame: 3 }, flags: ['rival_friend'] }, tone: 'good' } },
  },

  // ───── 모험 / 위험 ─────
  {
    id: 'a_dungeon', title: '신규 던전', weight: 1.3, focus: 'explore',
    cond: { minAge: 16, maxAge: 60 },
    text: '왕국 북쪽에서 새 던전이 발견됐다! 최하층에는 고대의 보물이 잠들어 있다는 소문이다.',
    choices: [
      {
        label: '최하층까지 공략한다', check: { stat: 'luck', dc: 34 },
        success: { text: '보스 방에서 고대 왕의 왕관을 손에 넣었다! 레어 아이템 획득!', effect: { stats: { fame: 10, luck: 3, mana: 3 }, flags: ['treasure'], trinket: { stat: 'fame', rarity: 'epic' } } },
        fail: { text: '횃불이 꺼졌다. 어둠 속에서 커다란 무언가가 "그르릉" 숨을 쉬었다.', effect: { death: 'dungeon' } },
      },
      {
        label: '얕은 층만 돈다', check: { stat: 'vit', dc: 20 },
        success: { text: '마석 몇 개를 챙겨 돌아왔다. 소소한 수입!', effect: { stats: { fame: 3, vit: 2 } } },
        fail: { text: '함정 발판을 밟아 다리를 삐끗했다.', effect: { stats: { vit: -10 }, zeroCause: 'dungeon' } },
      },
      { label: '돌아간다', success: { text: '"던전은 도망칠 때를 아는 사람이 오래 살아남는다." 선배 모험가의 말이 떠올랐다.' } },
    ],
  },
  {
    id: 'a_bandits', title: '산길의 도적', weight: 2, focus: 'explore',
    cond: { minAge: 15, maxAge: 65 },
    text: '산길에서 도적 떼가 튀어나왔다! "가진 거 다 내놔!"',
    choices: [
      {
        label: '검을 뽑는다', check: { stat: 'vit', dc: 28 },
        success: { text: '두목을 한 방에 쓰러뜨리자 나머지는 비명을 지르며 흩어졌다.', effect: { stats: { fame: 4, vit: 1 } } },
        fail: { text: '칼날이 옆구리를 스쳤다. 으윽!', effect: { stats: { vit: -16 }, zeroCause: 'bandits' } },
      },
      {
        label: '마법으로 겁을 준다', check: { stat: 'mana', dc: 28 },
        success: { text: '손바닥 위에 화염구를 띄우자 도적들이 "마, 마법사다!" 하고 줄행랑쳤다.', effect: { stats: { fame: 4 } } },
        fail: { text: '불꽃이 피식 꺼졌다. 도적들이 비웃으며 달려들었다.', effect: { stats: { vit: -16 }, zeroCause: 'bandits' } },
      },
      { label: '순순히 내준다', success: { text: '지갑이 가벼워졌지만 목숨은 무겁다.', effect: { stats: { fame: -2 } } } },
    ],
  },
  {
    id: 'a_gamble', title: '뒷골목 카지노', weight: 1, focus: 'explore',
    cond: { minAge: 16, maxAge: 60 },
    text: '반짝이는 지하 카지노. 주사위가 데굴데굴 구른다.',
    choices: [
      {
        label: '올인한다', check: { stat: 'luck', dc: 35 },
        success: { text: '행운의 여신이 윙크했다! 카지노 사장의 얼굴이 새파래졌다.', effect: { stats: { fame: 3, luck: 3 } } },
        fail: { text: '빈털터리가 되어 새벽 거리로 쫓겨났다. 다시는 도박 안 해…', effect: { stats: { cha: -2, fame: -3 } } },
      },
      { label: '구경만 한다', success: { text: '남의 인생이 오르락내리락하는 걸 구경했다. 도박은 무섭다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_dragon', title: '드래곤 습격', once: true, weight: 0.7,
    cond: { minAge: 22, maxAge: 75, stats: { fame: 30 } },
    text: '하늘을 가르며 거대한 드래곤이 내려왔다! 도시가 불타고, 사람들이 당신을 부른다.',
    choices: [
      {
        label: '마법으로 맞선다', check: { stat: 'mana', dc: 60 },
        success: { text: '최대 출력 마법이 비늘을 뚫었다! 드래곤이 굉음과 함께 추락했다. 드래곤 슬레이어 칭호 획득!', effect: { stats: { fame: 25 }, flags: ['dragonslayer'] }, tone: 'good' },
        fail: { text: '드래곤 브레스가 모든 것을 삼켰다.', effect: { death: 'dragon' } },
      },
      {
        label: '검으로 맞선다', check: { stat: 'vit', dc: 62 },
        success: { text: '턱 밑의 역린 한 장을 정확히 찔렀다! 드래곤이 쓰러졌다. 전설의 시작!', effect: { stats: { fame: 25 }, flags: ['dragonslayer'] }, tone: 'good' },
        fail: { text: '검이 닿기도 전에, 세상이 온통 불꽃이 되었다.', effect: { death: 'dragon' } },
      },
      {
        label: '사람들을 대피시킨다', check: { stat: 'cha', dc: 30 },
        success: { text: '수천 명이 당신을 따라 무사히 성문을 빠져나갔다. 진짜 영웅은 이런 사람이다.', effect: { karma: 12, stats: { fame: 6 } } },
        fail: { text: '대피를 돕다가 불길에 휩쓸렸다.', effect: { karma: 5, stats: { vit: -18 }, zeroCause: 'dragon' } },
      },
      { label: '도망친다', success: { text: '살아남았다. 그날 이후로 하늘에 큰 그림자만 보여도 깜짝 놀라게 됐다.', effect: { stats: { fame: -10 }, karma: -5 } } },
    ],
  },
  {
    id: 'a_war', title: '징집령', weight: 0.8,
    cond: { minAge: 18, maxAge: 50, notJobs: ['knight', 'demon_officer', 'hero', 'priest'], notFlags: ['demonblood'] },
    text: '국경에서 전쟁이 터졌다! 마을 광장에 징집 공고가 붙었다.',
    choices: [
      {
        label: '징집에 응한다', check: { stat: 'vit', dc: 30 },
        success: { text: '무사히 살아 돌아왔다! 훈장도 하나 받았다.', effect: { stats: { fame: 6, vit: 2 }, karma: 3, trinket: { base: 't_fame1', rarity: 'rare' } } },
        fail: { text: '첫 돌격에서, 하얀 빛이 당신을 감쌌다.', effect: { death: 'war' } },
      },
      {
        label: '뇌물을 쓴다', check: { stat: 'int', dc: 26 },
        success: { text: '금화 몇 닢으로 해결했다. …대신 다른 누군가가 끌려갔다는 소식이 마음에 걸린다.', effect: { stats: { fame: -3 }, karma: -6 } },
        fail: { text: '들켜서 광장에서 엉덩이를 맞았다. 창피해!', effect: { stats: { fame: -8, vit: -8 } } },
      },
    ],
  },
  {
    id: 'a_illness', title: '몸살', weight: 0.8,
    cond: { minAge: 30, maxAge: 99 },
    text: '콜록콜록. 기침이 멈추지 않는다.',
    auto: {
      check: { stat: 'vit', dc: 28 },
      success: { text: '가벼운 감기였다. 한 달 푹 쉬고 쌩쌩해졌다.', effect: { stats: { vit: -2 } } },
      fail: { text: '꽤 오래 앓았다. 몸이 눈에 띄게 야위었다.', effect: { stats: { vit: -15 }, zeroCause: 'illness' } },
    },
  },

  // ───── 어둠 ─────
  {
    id: 'a_dark_pact', title: '악마의 속삭임', once: true, weight: 0.8,
    cond: { minAge: 18, maxAge: 60 },
    text: '밤마다 같은 목소리가 들린다. "원하는 힘을 주지. 대가는… 나중에 받을게♪"',
    choices: [
      { label: '계약한다', success: { text: '손등에 멋진 문양이 새겨졌다! 힘이 넘쳐흐른다. 중2병 감성 MAX.', effect: { flags: ['pact'], stats: { mana: 18, vit: 8, luck: 5 }, karma: -30 }, tone: 'bad' } },
      { label: '성수를 뿌린다', success: { text: '"앗 차가워! 다음에 또 올게~" 목소리가 깔깔 웃으며 사라졌다.', effect: { karma: 5 } } },
    ],
  },
  {
    id: 'a_pact_due', title: '계약 만료일', once: true, weight: 8,
    cond: { minAge: 45, flags: ['pact'] },
    text: '손등의 문양이 화끈거린다. 그 목소리가 문 앞에 와 있다. "약속한 대가, 받으러 왔어♪"',
    auto: {
      check: { stat: 'luck', dc: 50 },
      success: { text: '악마는 당신을 한참 보더니 "…너 재밌네. 이번엔 봐줄게" 하고 문양을 지워주었다.', effect: { unflags: ['pact'] }, tone: 'good' },
      fail: { text: '영혼이 쏙 빠져나갔다. 계약서는 꼼꼼히 읽어야 한다.', effect: { death: 'pact' } },
    },
  },
  {
    id: 'a_forbidden', title: '금단의 문', once: true, weight: 2,
    cond: { minAge: 25, maxAge: 75, test: (s) => s.jobId === 'mage' || s.flags.includes('forbidden_knowledge') },
    text: '오랜 연구 끝에, 신들이 잠가둔 진리의 문 열쇠를 찾아냈다.',
    choices: [
      {
        label: '문을 연다', check: { stat: 'int', dc: 55 },
        success: { text: '우주의 비밀이 머릿속으로 쏟아졌다! 당신은 그것을 견뎌냈다. 대현자 각성!', effect: { stats: { mana: 15, int: 10, fame: 10 }, flags: ['archmage_secret'] }, tone: 'good' },
        fail: { text: '문 너머의 무언가와 눈이 마주쳤다. 아, 이건 안 되는 거였구나.', effect: { death: 'experiment' } },
      },
      { label: '열쇠를 녹여버린다', success: { text: '"모르는 게 약일 때도 있지." 어떤 문은 닫혀 있는 게 낫다.', effect: { karma: 5, stats: { int: 2 } } } },
    ],
  },
  {
    id: 'a_inquisition', title: '이단 심문관', once: true, weight: 1.5,
    cond: { minAge: 18, maxAge: 80, notJobs: ['priest'], test: (s) => ['forbidden_knowledge', 'archmage_secret', 'pact', 'suspected'].some((f) => s.flags.includes(f)) },
    text: '까만 망토의 심문관들이 문을 두드렸다. "이단 혐의로 조사하겠다!"',
    choices: [
      {
        label: '시치미 뗀다', check: { stat: 'cha', dc: 40 },
        success: { text: '심문관들은 증거를 못 찾고 돌아갔다. 일단은 휴우.', effect: { stats: { fame: -3 } } },
        fail: { text: '증거가 산더미였다. 광장에 장작이 쌓였다.', effect: { death: 'heresy' } },
      },
      { label: '자백한다', success: { text: '모든 걸 털어놓고 반성문을 백 장 썼다. 목숨은 건졌지만 평판은 바닥이다.', effect: { stats: { fame: -15 }, karma: 5, unflags: ['forbidden_knowledge', 'suspected'] } } },
      {
        label: '도망친다', check: { stat: 'luck', dc: 35 },
        success: { text: '창문으로 뛰어내려 지붕을 타고 달아났다! 닌자 같았다.', effect: { stats: { fame: -10 }, flags: ['fugitive'] } },
        fail: { text: '성문은 이미 굳게 닫혀 있었다.', effect: { death: 'heresy' } },
      },
    ],
  },
  {
    id: 'a_demon_exposed', title: '정체 들통', once: true, weight: 1.5,
    cond: { minAge: 15, maxAge: 70, flags: ['demonblood'], notJobs: ['demon_officer'] },
    text: '누군가 당신의 붉은 눈과 작은 뿔을 보았다. "저 사람, 마족 아니야?!" 소문이 돈다.',
    choices: [
      {
        label: '그럴듯하게 둘러댄다', check: { stat: 'cha', dc: 38 },
        success: { text: '"이건 코스프레예요!" 놀랍게도 다들 믿었다.', effect: { karma: -3 } },
        fail: { text: '기사단이 들이닥쳤다. 해명할 틈도 없었다.', effect: { death: 'demon_purge' } },
      },
      {
        label: '마을을 떠난다', check: { stat: 'luck', dc: 25 },
        success: { text: '또 짐을 쌌다. 정착은 언제쯤 할 수 있을까.', effect: { stats: { fame: -5 } } },
        fail: { text: '마을 어귀에서 횃불 든 사람들이 기다리고 있었다.', effect: { death: 'demon_purge' } },
      },
      {
        label: '정체를 밝히고 그동안의 선행을 호소한다', cond: { karmaMin: 30 }, check: { stat: 'cha', dc: 28 },
        success: { text: '마을이 조용해졌다. 그때 당신이 구해줬던 할아버지가 나와 당신 손을 잡았다. "이 사람은 좋은 사람이야."', effect: { karma: 10, stats: { fame: 15 }, flags: ['accepted'] }, tone: 'good' },
        fail: { text: '진심은 통하지 않았다.', effect: { death: 'demon_purge' } },
      },
    ],
  },
  {
    id: 'a_hero_party_invite', title: '용사 파티', once: true, weight: 2,
    cond: { minAge: 18, maxAge: 40, stats: { fame: 18 }, notHouses: ['hero'], notJobs: ['hero', 'demon_officer'] },
    text: '용사 일행이 당신의 소문을 듣고 찾아왔다! "함께 마왕을 무찌르지 않겠어?"',
    choices: [
      { label: '합류한다', success: { text: '용사 파티에 들어갔다! 반짝반짝한 동료들. …이 반짝임에 그늘이 있다는 건 아직 몰랐다.', effect: { flags: ['hero_party'], stats: { fame: 10 } }, tone: 'good' } },
      { label: '사양한다', success: { text: '"저는 조연이 편해서요." 용사는 아쉬운 기색 없이 돌아섰다.', effect: { flags: ['hp_declined'] } } },
    ],
  },
  {
    id: 'a_hero_framed', title: '누명', once: true, weight: 4,
    cond: { minAge: 19, maxAge: 50, flags: ['hero_party', 'hp_camp'], notFlags: ['hp_trust'] },
    text: '공주님이 독에 쓰러졌다. 그리고 세실이, 증거라며 당신의 단검을 들어 올렸다. 아르센의 눈이 흔들린다. 이건… 그 유명한 파티 추방물?!',
    choices: [
      {
        label: '모닥불에서 주운 편지를 내민다', cond: { flags: ['hp_suspect'] },
        success: { text: '타다 남은 편지의 문장이 모두의 눈앞에 드러났다. 세실의 얼굴이 하얗게 질렸다. 진범은 성녀였다!', effect: { flags: ['hp_cleared'], unflags: ['hero_party'], stats: { fame: 15 }, karma: 5 }, tone: 'milestone' },
      },
      {
        label: '결백을 주장한다', check: { stat: 'cha', dc: 46 },
        success: { text: '진범은 파티의 성녀였다! 누명은 벗었지만, 다들 어색하게 눈을 피했다.', effect: { stats: { fame: 5 }, karma: 5, unflags: ['hero_party'] } },
        fail: { text: '재판은 반나절 만에 끝났다. 광장에서는 용사의 이름이 울려 퍼졌다.', effect: { death: 'hero_framed' } },
      },
      {
        label: '도망친다', check: { stat: 'luck', dc: 32 },
        success: { text: '국경을 넘었다. 수배서 그림은 하나도 안 닮았지만, 이름은 당신 것이었다.', effect: { stats: { fame: -15 }, flags: ['fugitive'], unflags: ['hero_party'] } },
        fail: { text: '국경 검문소에서 붙잡혔다. 억울하다…!', effect: { death: 'hero_framed' } },
      },
    ],
  },
  {
    id: 'a_noble_poison', title: '은잔의 포도주', once: true, weight: 1.2,
    cond: { minAge: 12, maxAge: 60, houses: ['noble'] },
    text: '화려한 연회. 그런데 당신의 은잔에서 살짝 쓴 냄새가 난다. 이건 독?!',
    choices: [
      {
        label: '그냥 마신다', check: { stat: 'luck', dc: 40 },
        success: { text: '독이 약했다. 사흘 배탈로 끝났다. 위장 튼튼!', effect: { stats: { vit: -6 } } },
        fail: { text: '목이 화끈 타올랐다. 연회장의 음악이 멀어졌다.', effect: { death: 'assassination' } },
      },
      {
        label: '잔을 몰래 바꾼다', check: { stat: 'int', dc: 32 },
        success: { text: '범인이었던 이복형이 그 잔을 마시고 쓰러졌다. 인과응보!', effect: { karma: -8, stats: { fame: 3 } } },
        fail: { text: '들켰다! 그 뒤로 식사 때마다 독 감별사가 붙었다.', effect: { stats: { vit: -6, cha: -3 } } },
      },
      {
        label: '실수인 척 잔을 엎는다', check: { stat: 'cha', dc: 25 },
        success: { text: '"어머, 손이 미끄러졌네♪" 범인은 끝내 밝혀지지 않았다.', effect: { stats: { fame: -1 } } },
        fail: { text: '너무 어색한 연기였다. 다들 수상하게 쳐다봤다.', effect: { stats: { fame: -5 } } },
      },
    ],
  },
  {
    id: 'a_noble_succession', title: '후계 다툼', once: true, weight: 1.5,
    cond: { minAge: 25, maxAge: 50, houses: ['noble'] },
    text: '대공이 쓰러졌다! 후계 자리를 두고 형제들의 암투가 시작됐다.',
    choices: [
      {
        label: '후계를 노린다', check: { stat: 'cha', dc: 50 },
        success: { text: '대공가의 문장이 당신 가슴에 빛났다! 악역 영애… 아니, 후계자 루트 성공!', effect: { stats: { fame: 20 }, flags: ['heir'] }, tone: 'good' },
        fail: { text: '정적의 암살자가 한발 빨랐다.', effect: { death: 'assassination' } },
      },
      { label: '물러난다', success: { text: '권력보다는 평화로운 삶을 골랐다.', effect: { stats: { fame: -5 }, karma: 3 } } },
    ],
  },

  // ───── 일상 ─────
  {
    id: 'a_tavern', title: '음유시인', weight: 2, focus: 'social',
    cond: { minAge: 16, maxAge: 70 },
    text: '주점에서 류트를 든 음유시인이 말을 걸어왔다.',
    choices: [
      {
        label: '한 잔 산다', check: { stat: 'cha', dc: 22 },
        success: { text: '시인은 당신의 모험담을 노래로 만들겠다고 약속했다! 언젠가 유명해질지도?', effect: { stats: { cha: 2, fame: 3, luck: 1 } } },
        fail: { text: '시인은 술만 마시고 사라졌다. 먹튀다!', effect: { stats: { luck: -1 } } },
      },
      { label: '조용히 자리를 뜬다', success: { text: '오늘은 혼자 별을 보고 싶은 밤이다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ball', title: '왕궁 무도회', weight: 1.5, focus: 'social',
    cond: { minAge: 16, maxAge: 50 },
    text: '반짝이는 왕궁 무도회 초대장이 도착했다!',
    choices: [
      {
        label: '참석한다', check: { stat: 'cha', dc: 30 },
        success: { text: '그날 밤의 주인공은 당신이었다! 다들 당신 이야기뿐이다.', effect: { stats: { fame: 6, cha: 2 } } },
        fail: { text: '백작 부인의 발을 세 번 밟았다. 다음엔 춤 연습부터…', effect: { stats: { fame: -2 } } },
      },
      { label: '가지 않는다', success: { text: '초대장은 서랍 속으로. 집에서 뒹굴뒹굴이 최고다.' } },
    ],
  },
  {
    id: 'a_research', title: '왕립 도서관', weight: 1.5, focus: 'study',
    cond: { minAge: 18, maxAge: 70 },
    text: '왕립 도서관 비밀 서고의 열람 허가가 나왔다!',
    choices: [
      {
        label: '논문을 쓴다', check: { stat: 'int', dc: 32 },
        success: { text: '논문이 학회를 뒤집어놓았다! 천재 학자 등장!', effect: { stats: { fame: 5, int: 3 } } },
        fail: { text: '반박 논문이 열 편 넘게 쏟아졌다. 학계는 무섭다.', effect: { stats: { int: 1, fame: -1 } } },
      },
      {
        label: '금서를 몰래 베껴 쓴다', check: { stat: 'luck', dc: 25 },
        success: { text: '아무도 눈치채지 못했다. 지식이 1000 상승했다!', effect: { stats: { int: 4, mana: 3 }, flags: ['forbidden_knowledge'] } },
        fail: { text: '사서님이 봐버렸다. 당신 이름이 어딘가로 보고됐다.', effect: { stats: { int: 2 }, flags: ['suspected'] } },
      },
    ],
  },
  {
    id: 'a_monster_hunt', title: '마물 토벌', weight: 1.5, focus: 'train',
    cond: { minAge: 16, maxAge: 60 },
    text: '근처 마을에 마물이 나타났다! 길드에 토벌 의뢰가 붙었다.',
    choices: [
      {
        label: '의뢰를 받는다', check: { stat: 'vit', dc: 30 },
        success: { text: '마물을 무찔렀다! 마을 사람들이 축제를 열어주었다.', effect: { stats: { fame: 4, vit: 2 } } },
        fail: { text: '발톱에 긁혀 꽤 깊은 상처가 났다.', effect: { stats: { vit: -12 }, zeroCause: 'bandits' } },
      },
      { label: '넘어간다', success: { text: '다른 모험가가 해결하겠지.' } },
    ],
  },
  {
    id: 'a_charity', title: '골목의 아이들', weight: 1,
    cond: { minAge: 15, maxAge: 85 },
    text: '골목의 아이들이 배고픈 눈으로 당신을 올려다본다.',
    choices: [
      { label: '가진 걸 나눠준다', success: { text: '아이들이 빵을 받아 들고 신나게 뛰어갔다. 한 아이가 돌아보며 꾸벅 인사했다.', effect: { karma: 10, stats: { cha: 1 } } } },
      { label: '그냥 지나간다', success: { text: '모두를 도울 수는 없다. …그래도 마음이 쓰인다.', effect: { karma: -3 } } },
    ],
  },
  {
    id: 'a_temple_blessing', title: '여신의 축복', once: true, weight: 1,
    cond: { minAge: 12, maxAge: 80, karmaMin: 35 },
    text: '신전의 할머니 사제가 당신을 불러 세웠다. "여신님께서 당신을 아끼고 계세요."',
    auto: { success: { text: '이마에 축복의 성유를 발라주었다. 몸이 깃털처럼 가벼워졌다!', effect: { stats: { luck: 6, fame: 2 } }, tone: 'good' } },
  },
  {
    id: 'a_reflection', title: '노을빛 회상', once: true, weight: 3,
    cond: { minAge: 60 },
    text: '흰머리가 꽤 늘었다. 지나온 날들을 돌아본다.',
    choices: [
      {
        label: '회고록을 쓴다', check: { stat: 'int', dc: 30 },
        success: { text: '"두 개의 세계를 살아본 사람의 이야기." 책은 베스트셀러가 되었다!', effect: { stats: { fame: 8 } } },
        fail: { text: '펜이 자꾸 멈췄다. 어떤 추억은 글로 옮기기 아깝다.', effect: { stats: { int: 1 } } },
      },
      { label: '후배를 키운다', success: { text: '당신의 모든 노하우를 젊은 세대에게 물려주었다. 제자들이 "선생님!" 하고 따른다.', effect: { karma: 8, stats: { cha: 2 } } } },
      { label: '홀로 여행을 떠난다', success: { text: '지팡이 하나 짚고, 아직 못 가본 땅을 향해 길을 나섰다. 인생은 여행이다!', effect: { stats: { luck: 5 } } } },
    ],
  },
];
