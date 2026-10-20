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
    auto: { success: { text: '{mentor:은} "잘 컸구나" 하고 웃으며 눈을 감았다. 남은 것은 낡은 지팡이와 빼곡한 연구 노트였다.', effect: { removeRel: ['mentor'], stats: { int: 5, mana: 3 }, item: { base: 'w2', rarity: 'rare', name: '스승의 낡은 지팡이' } }, tone: 'bad' } },
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

  // ───── 모험 (18~60세 · 누구에게나 · 반복) ─────
  // 소규모 모험 위주. 큰 보상·죽음·직업 변경은 없다.
  // 연결: 유적(소문→입구→보물창고) · 항해(출항→폭풍→섬) · 대상 호위(호위→신기루→도착) · 숲의 정령 · 괴수 발자국 · 숨겨진 문

  // 유적 탐사
  {
    id: 'a_ex_ruin_rumor', title: '유적의 소문', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 58, notFlags: ['ex_ruin', 'ex_ruin_in'] },
    text: '주점에서 나이 든 탐험가가 술잔을 흔들며 속삭인다. "산 너머 안개 속에 아무도 들어가 본 적 없는 유적이 있어."',
    choices: [
      { label: '지도를 얻어 낸다', check: { stat: 'cha', dc: 32 },
        success: { text: '술 한 잔에 탐험가가 낡은 지도를 건넸다. "젊은이, 몸조심해."', effect: { flags: ['ex_ruin'], stats: { cha: 1, fame: 1 } }, tone: 'good' },
        fail: { text: '탐험가는 코를 골며 잠들어 버렸다. 방향은 대충 들었지만 지도는 놓쳤다.', effect: { flags: ['ex_ruin'] } } },
      { label: '흘려듣는다', success: { text: '술자리 허풍이려니 했다. 그래도 안개 낀 산이 자꾸 눈에 밟힌다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_ruin_gate', title: '안개 속 유적 입구', weight: 3, focus: 'explore',
    cond: { minAge: 18, maxAge: 58, flags: ['ex_ruin'] },
    text: '안개를 헤치고 도착한 곳에 이끼 낀 돌문이 우뚝 서 있다. 문 한가운데에 손바닥 모양의 홈이 파여 있다.',
    choices: [
      { label: '손을 대고 마력을 흘린다', check: { stat: 'mana', dc: 33 },
        success: { text: '돌문이 우르릉 소리를 내며 열렸다! 서늘한 바람과 함께 길이 드러났다.', effect: { unflags: ['ex_ruin'], flags: ['ex_ruin_in'], stats: { mana: 2 } }, tone: 'good' },
        fail: { text: '홈에서 불꽃이 튀어 손끝이 따끔했다. 문은 꼼짝도 하지 않는다. 오늘은 물러나자.', effect: { unflags: ['ex_ruin'], stats: { vit: -3 } } } },
      { label: '문양을 그대로 베껴 온다', success: { text: '문양을 꼼꼼히 베껴 두었다. 훗날 학자들이 값을 쳐줄지도 모른다.', effect: { unflags: ['ex_ruin'], stats: { int: 2 }, gold: 30 } } },
    ],
  },
  {
    id: 'a_ex_ruin_vault', title: '유적의 작은 보물 방', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 58, flags: ['ex_ruin_in'] },
    text: '복도 끝 방에는 먼지 쌓인 상자들이 줄줄이 놓여 있다. 한쪽 벽에는 오래된 벽화가 빛난다.',
    choices: [
      { label: '상자를 하나씩 연다', check: { stat: 'luck', dc: 34 },
        success: { text: '세 번째 상자에서 은화 한 보따리와 옛 부적이 나왔다! 소소하지만 쏠쏠한 수확이다.', effect: { unflags: ['ex_ruin_in'], gold: 120, stats: { luck: 2, fame: 2 } }, tone: 'good' },
        fail: { text: '상자는 대부분 텅 비어 있었다. 먼지만 잔뜩 뒤집어쓰고 돌아왔다.', effect: { unflags: ['ex_ruin_in'], stats: { vit: -2 } } } },
      { label: '벽화를 해독한다', check: { stat: 'int', dc: 34 },
        success: { text: '벽화는 옛 왕국의 별자리 지도였다. 학자들이 보면 눈이 휘둥그레질 발견이다.', effect: { unflags: ['ex_ruin_in'], stats: { int: 3, fame: 2 } }, tone: 'good' },
        fail: { text: '아무리 봐도 알아볼 수 없는 문자뿐이었다. 그림이라도 예쁘니 위안이 된다.', effect: { unflags: ['ex_ruin_in'], stats: { int: 1 } } } },
    ],
  },

  // 항해
  {
    id: 'a_ex_harbor_ship', title: '항구의 모집 공고', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, notFlags: ['ex_voyage'] },
    text: '항구 게시판에 새 공고가 붙었다. "동쪽 군도로 떠날 선원 구함. 일당 후함, 파도는 보장 못 함."',
    choices: [
      { label: '선원으로 지원한다', check: { stat: 'vit', dc: 30 },
        success: { text: '선장이 팔뚝을 한 번 보더니 "합격!"이라고 외쳤다. 돛이 펄럭이며 배가 항구를 떠났다.', effect: { flags: ['ex_voyage'], stats: { vit: 1 } }, tone: 'good' },
        fail: { text: '밧줄 매듭 시험에서 세 번 연속 풀려 버렸다. 선장이 한숨을 쉬었다. "다음 배에 와라."', effect: { stats: { int: 1 } } } },
      { label: '구경만 하고 돌아선다', success: { text: '갈매기 소리와 소금 냄새를 맡으며 한참 부두를 거닐었다.', effect: { mood: 'calm' } } },
    ],
  },
  {
    id: 'a_ex_sea_storm', title: '바다 위의 폭풍', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, flags: ['ex_voyage'] },
    text: '출항 사흘째, 수평선이 새까맣게 변했다. 선장이 외친다. "돛을 접어라! 폭풍이다!"',
    choices: [
      { label: '돛 줄을 붙잡는다', check: { stat: 'vit', dc: 34 },
        success: { text: '파도에 온몸이 흠뻑 젖었지만 돛을 지켜 냈다. 선원들이 환호하며 어깨를 두드렸다.', effect: { stats: { vit: 2, fame: 2 } }, tone: 'good' },
        fail: { text: '파도에 휩쓸려 갑판을 데굴데굴 굴렀다. 멍투성이가 됐지만 배는 무사했다.', effect: { stats: { vit: -6 } } } },
      { label: '선실에서 짐을 단속한다', success: { text: '굴러다니는 상자를 묶느라 정신없었지만, 덕분에 화물이 하나도 상하지 않았다.', effect: { stats: { int: 1 }, gold: 20 } } },
    ],
  },
  {
    id: 'a_ex_island_landing', title: '이름 없는 섬', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, flags: ['ex_voyage'] },
    text: '폭풍이 지나가자 눈앞에 하얀 백사장의 작은 섬이 나타났다. 야자수 사이로 반짝이는 무언가가 보인다.',
    choices: [
      { label: '섬 안쪽을 탐사한다', check: { stat: 'luck', dc: 33 },
        success: { text: '모래 속에서 오래된 도자기와 진주가 나왔다! 선장이 몫을 나눠 주었다.', effect: { unflags: ['ex_voyage'], gold: 150, stats: { luck: 2, fame: 2 } }, tone: 'good' },
        fail: { text: '게 떼와 벌레만 잔뜩 만났다. 그래도 일몰 풍경만은 값을 매길 수 없었다.', effect: { unflags: ['ex_voyage'], stats: { vit: 1 }, mood: 'calm' } } },
      { label: '해변에서 조개를 줍는다', success: { text: '조개 구이로 선원들과 연회를 열었다. 항해 중 가장 맛있는 식사였다.', effect: { unflags: ['ex_voyage'], stats: { cha: 2 }, mood: 'joy' } } },
    ],
  },

  // 대상 호위
  {
    id: 'a_ex_caravan_guard', title: '대상단 호위', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, notFlags: ['ex_caravan'] },
    text: '사막 건너 오아시스 도시로 가는 대상단이 호위를 모집한다. "낙타는 우리가, 모험은 당신이!"',
    choices: [
      { label: '호위를 맡는다', check: { stat: 'vit', dc: 30 },
        success: { text: '대상 대장이 무기와 물통을 건넸다. 낙타 행렬이 모래 능선을 넘기 시작한다.', effect: { flags: ['ex_caravan'], stats: { vit: 1 } }, tone: 'good' },
        fail: { text: '낙타가 당신만 보면 고개를 홱 돌린다. 호위보다 낙타 달래기가 힘들 것 같아 물러났다.', effect: { stats: { cha: -1 } } } },
      { label: '정중히 사양한다', success: { text: '사막은 아직 무섭다. 대신 시장에서 모래 지도를 한 장 샀다.', effect: { gold: -5, stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_oasis_mirage', title: '사막의 신기루', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, flags: ['ex_caravan'] },
    text: '뜨거운 모래바람 너머로 푸른 호수와 야자수가 아른거린다. 낙타가 그쪽으로 걸음을 틀려 한다.',
    choices: [
      { label: '고삐를 당겨 막는다', check: { stat: 'int', dc: 32 },
        success: { text: '"저건 신기루야!" 방위를 확인하자 정말 반대편에 진짜 오아시스가 있었다.', effect: { stats: { int: 2, fame: 2 } }, tone: 'good' },
        fail: { text: '반쯤 속아 한참을 돌았다. 물이 바닥나 목이 바싹 말랐지만 대상단 덕에 살았다.', effect: { stats: { vit: -5 } } } },
      { label: '대장에게 맡긴다', success: { text: '노련한 대장이 코웃음을 치며 길을 돌렸다. 역시 경험은 못 이긴다.', effect: { stats: { luck: 1 } } } },
    ],
  },
  {
    id: 'a_ex_caravan_arrive', title: '오아시스 도시 도착', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, flags: ['ex_caravan'] },
    text: '황금빛 성벽과 시끌벅적한 시장이 시야에 들어왔다. 대상 대장이 웃으며 품삯 주머니를 던졌다.',
    choices: [
      { label: '시장을 마음껏 구경한다', success: { text: '향신료, 비단, 요상한 악기. 눈이 돌아갈 만큼 신기한 물건이 가득했다.', effect: { unflags: ['ex_caravan'], gold: 60, stats: { cha: 1, int: 1 }, mood: 'joy' } } },
      { label: '대상단 일을 더 돕는다', check: { stat: 'cha', dc: 30 },
        success: { text: '짐 정리를 도왔더니 대장이 수고비를 얹어 주었다. "다음에도 같이 가자!"', effect: { unflags: ['ex_caravan'], gold: 100, stats: { cha: 2, fame: 1 } }, tone: 'good' },
        fail: { text: '짐을 정리하다 항아리를 깨뜨렸다. 품삯에서 약간 깎였다.', effect: { unflags: ['ex_caravan'], gold: 30 } } },
    ],
  },

  // 숲의 정령
  {
    id: 'a_ex_spirit_path', title: '숲의 속삭임', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 60, notFlags: ['ex_spirit'] },
    text: '약초를 캐러 숲에 들어갔는데 나무들이 바스락거리며 길을 알려 주는 것 같다. 반딧불이 앞서 날아간다.',
    choices: [
      { label: '반딧불을 따라간다', check: { stat: 'luck', dc: 30 },
        success: { text: '이끼 낀 오솔길이 열렸다. 공기가 달콤해지고 숲 전체가 숨을 쉬는 듯하다.', effect: { flags: ['ex_spirit'], stats: { luck: 1, mana: 1 } }, tone: 'good' },
        fail: { text: '반딧불이 갑자기 흩어져 버렸다. 길을 잃고 한참 헤맸다.', effect: { stats: { vit: -2 } } } },
      { label: '길을 표시하고 돌아간다', success: { text: '나뭇가지에 리본을 묶어 놓았다. 내일 다시 오면 알 수 있겠지.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_spirit_grove', title: '정령의 쉼터', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 60, flags: ['ex_spirit'] },
    text: '오솔길 끝, 달빛이 고인 샘 위에서 작은 빛의 정령들이 춤추고 있다. 당신을 보고도 도망치지 않는다.',
    choices: [
      { label: '조용히 샘물을 마신다', success: { text: '차가운 물이 목을 타고 흐르자 온몸의 피로가 사라졌다. 정령들이 고개를 끄덕이는 듯했다.', effect: { unflags: ['ex_spirit'], stats: { vit: 2, mana: 2 }, stress: -15, mood: 'calm' }, tone: 'good' } },
      { label: '정령에게 말을 걸어 본다', check: { stat: 'cha', dc: 32 },
        success: { text: '정령이 당신 어깨에 앉아 속삭였다. 그 뒤로 숲길에서 이상하게 운이 따른다.', effect: { unflags: ['ex_spirit'], stats: { luck: 3, cha: 1 } }, tone: 'good' },
        fail: { text: '정령들이 까르르 웃으며 흩어졌다. 샘은 그대로지만 마음은 간질간질했다.', effect: { unflags: ['ex_spirit'], mood: 'joy' } } },
    ],
  },

  // 괴수 발자국
  {
    id: 'a_ex_giant_tracks', title: '거대한 발자국', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, notFlags: ['ex_beast'] },
    text: '진흙 위에 사람 몸통만 한 발자국이 선명하다. 나뭇가지가 꺾이고 풀이 눌린 흔적이 숲 안쪽으로 이어진다.',
    choices: [
      { label: '흔적을 따라가 본다', check: { stat: 'int', dc: 30 },
        success: { text: '발자국의 깊이와 간격으로 크기를 가늠했다. 큰 곰 비슷한 놈이다. 굴 근처까지 접근했다.', effect: { flags: ['ex_beast'], stats: { int: 2 } } },
        fail: { text: '흔적이 갑자기 끊겼다. 숲을 두 바퀴 돌고 나서야 제자리로 돌아왔다.', effect: { stats: { vit: -2 } } } },
      { label: '마을에 알린다', success: { text: '사냥꾼들이 고개를 끄덕이며 경계를 서기로 했다. 작은 사례금이 돌아왔다.', effect: { gold: 20, karma: 2 } } },
    ],
  },
  {
    id: 'a_ex_beast_den', title: '괴수의 굴 앞에서', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 55, flags: ['ex_beast'] },
    text: '굴 입구에서 낮은 콧김 소리가 새어 나온다. 안쪽에 커다란 그림자가 웅크리고 있다.',
    choices: [
      { label: '먹이를 놓고 조용히 물러난다', check: { stat: 'luck', dc: 30 },
        success: { text: '괴수는 고기 한 덩이를 물고 굴로 사라졌다. 알고 보니 새끼를 돌보는 어미였다. 평화로운 합의다.', effect: { unflags: ['ex_beast'], karma: 4, stats: { luck: 2 } }, tone: 'good' },
        fail: { text: '괴수가 으르렁대며 나왔다! 필사적으로 도망쳐 간신히 따돌렸다.', effect: { unflags: ['ex_beast'], stats: { vit: -6 } } } },
      { label: '횃불로 쫓아낸다', check: { stat: 'vit', dc: 34 },
        success: { text: '횃불을 휘두르자 괴수가 겁을 먹고 산속 깊이 도망쳤다. 마을 사람들이 고마워했다.', effect: { unflags: ['ex_beast'], stats: { vit: 2, fame: 3 } }, tone: 'good' },
        fail: { text: '앞머리가 훌러덩 그을렸다. 괴수는 코웃음을 치며 굴 안으로 들어가 버렸다.', effect: { unflags: ['ex_beast'], stats: { vit: -4, cha: -1 } } } },
    ],
  },

  // 숨겨진 문
  {
    id: 'a_ex_hidden_door', title: '수상한 벽', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 60, notFlags: ['ex_hidden'] },
    text: '오래된 여관 지하 창고에서 벽 한 곳만 공기가 다르다. 손을 대 보니 미세한 바람이 흘러나온다.',
    choices: [
      { label: '벽을 두드려 본다', check: { stat: 'int', dc: 30 },
        success: { text: '탁, 탁, 텅! 속이 빈 소리가 났다. 돌 하나를 누르자 벽이 스르륵 열렸다.', effect: { flags: ['ex_hidden'], stats: { int: 1 } }, tone: 'good' },
        fail: { text: '두드린 건 맞는데 주인에게 들켜 창고 정리를 도와야 했다.', effect: { stats: { vit: 1 } } } },
      { label: '못 본 척한다', success: { text: '호기심은 고양이를 죽인다고 했다. 포도주 한 병만 슬쩍 챙기고 올라왔다.', effect: { gold: -3 } } },
    ],
  },
  {
    id: 'a_ex_secret_passage', title: '비밀 통로', weight: 4, focus: 'explore',
    cond: { minAge: 18, maxAge: 60, flags: ['ex_hidden'] },
    text: '벽 너머로 좁은 통로가 어둠 속으로 이어진다. 바닥에 오래된 발자국이 하나 찍혀 있다.',
    choices: [
      { label: '등불을 들고 걸어 들어간다', check: { stat: 'vit', dc: 30 },
        success: { text: '통로 끝은 마을 밖 숲의 오래된 우물로 이어졌다! 밀수꾼들이 쓰던 길이었나 보다.', effect: { unflags: ['ex_hidden'], stats: { vit: 1, luck: 1, fame: 1 }, gold: 40 } },
        fail: { text: '거미줄과 먼지 때문에 재채기가 멈추지 않았다. 결국 되돌아 나왔다.', effect: { unflags: ['ex_hidden'], stats: { vit: -2 } } } },
      { label: '입구를 다시 막아 둔다', success: { text: '"비밀은 비밀로 두는 게 좋지." 벽을 원래대로 되돌렸다. 마음이 한결 편안해졌다.', effect: { unflags: ['ex_hidden'], karma: 2 } } },
    ],
  },

  // 단발 모험
  {
    id: 'a_ex_canyon_bridge', title: '협곡의 흔들다리', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 58 },
    text: '깊은 협곡 위에 낡은 밧줄 다리가 한 줄 걸려 있다. 건너편에 지름길이 보인다.',
    choices: [
      { label: '재빨리 건넌다', check: { stat: 'vit', dc: 30 },
        success: { text: '다리가 출렁거렸지만 끝까지 해냈다. 건너편에서 바라본 풍경이 장관이었다.', effect: { stats: { vit: 2, luck: 1 }, mood: 'joy' } },
        fail: { text: '발판 하나가 뚝 부러졌다! 아슬아슬하게 밧줄을 붙잡고 되돌아왔다.', effect: { stats: { vit: -4 }, mood: 'fear' } } },
      { label: '돌아서 먼 길로 간다', success: { text: '이틀이나 더 걸렸지만 발은 땅에 닿아 있었다. 안전이 제일이다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_hot_spring', title: '숨겨진 온천', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 60 },
    text: '산길을 오르는데 코끝에 유황 냄새가 스친다. 바위 사이로 김이 모락모락 피어오른다.',
    choices: [
      { label: '몸을 담근다', success: { text: '온몸의 근육이 사르르 풀렸다. 눈을 감자 산새 소리가 자장가처럼 들렸다.', effect: { stats: { vit: 2 }, stress: -20, mood: 'calm' }, tone: 'good' } },
      { label: '주변을 둘러본다', check: { stat: 'luck', dc: 28 },
        success: { text: '바위 틈에서 광석이 반짝였다. 작은 수정을 몇 개 주워 돌아왔다.', effect: { gold: 40, stats: { luck: 1 } } },
        fail: { text: '온천물을 튀기려다 오히려 홀딱 젖어 버렸다. 그래도 개운하다.', effect: { stats: { vit: 1 } } } },
    ],
  },
  {
    id: 'a_ex_glacier', title: '빙하 횡단', weight: 1, focus: 'explore',
    cond: { minAge: 18, maxAge: 52 },
    text: '북쪽 산맥의 빙하가 햇빛에 눈부시게 빛난다. 건너편 마을로 가는 가장 빠른 길이다.',
    choices: [
      { label: '아이젠을 차고 걷는다', check: { stat: 'vit', dc: 33 },
        success: { text: '얼음 갈라진 틈을 요리조리 피해 무사히 건넜다. 마을 사람들이 신기한 눈으로 쳐다봤다.', effect: { stats: { vit: 2, fame: 2 } }, tone: 'good' },
        fail: { text: '미끄러져 한참을 데굴데굴 굴렀다. 엉덩이에 멍이 들었지만 뼈는 무사하다.', effect: { stats: { vit: -5 } } } },
      { label: '안내인을 고용한다', success: { text: '안내인의 노련한 발걸음 덕에 순조로웠다. 길 위에서 들은 산 이야기가 재미났다.', effect: { gold: -20, stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_shipwreck', title: '해안의 난파선', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 58 },
    text: '썰물 때 드러난 모래톱 위에 오래된 난파선이 반쯤 묻혀 있다. 갑판 틈 사이로 무언가 반짝인다.',
    choices: [
      { label: '밀물 전에 뒤져 본다', check: { stat: 'luck', dc: 32 },
        success: { text: '녹슨 상자에서 금속 장신구와 오래된 동전이 쏟아졌다! 파도가 밀려오기 직전 탈출 성공.', effect: { gold: 90, stats: { luck: 2, fame: 1 } }, tone: 'good' },
        fail: { text: '밀물이 예상보다 빨랐다. 허리까지 젖은 채 빈손으로 도망쳐 나왔다.', effect: { stats: { vit: -3 } } } },
      { label: '선체를 스케치한다', success: { text: '선체의 문양을 그림으로 남겼다. 어느 나라 배일까, 상상하는 것만으로 즐겁다.', effect: { stats: { int: 1, cha: 1 } } } },
    ],
  },
  {
    id: 'a_ex_balloon', title: '시험 비행 기구', weight: 1, focus: 'explore',
    cond: { minAge: 18, maxAge: 55 },
    text: '마법 공방 앞마당에서 거대한 열기구가 부풀어 오른다. 기술자가 외친다. "시험 비행 동승자 구함!"',
    choices: [
      { label: '동승한다', check: { stat: 'luck', dc: 32 },
        success: { text: '구름 위로 올라서자 세상이 장난감처럼 작아졌다. 착륙은 조금 거칠었지만 평생 잊지 못할 경험이다.', effect: { stats: { luck: 2, fame: 2 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '바람이 변덕을 부려 엉뚱한 호수에 불시착했다. 흠뻑 젖었지만 모두 무사하다.', effect: { stats: { vit: -2 }, mood: 'joy' } } },
      { label: '지상에서 구경만 한다', success: { text: '둥실 떠오르는 모습을 한참 올려다보았다. 언젠가는 나도 타 보고 싶다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_floating_market', title: '수상 시장', weight: 1.5,
    cond: { minAge: 18, maxAge: 60 },
    text: '새벽 안개 속에서 수십 척의 조각배가 물 위에 모여든다. 과일, 비단, 보석이 배에서 배로 오간다.',
    choices: [
      { label: '배를 타고 흥정한다', check: { stat: 'cha', dc: 30 },
        success: { text: '흥정 끝에 희귀한 향료를 반값에 샀다. 되팔면 이득이 꽤 남을 것 같다.', effect: { gold: 60, stats: { cha: 2 } }, tone: 'good' },
        fail: { text: '바가지를 쓰고 말았다. 노를 놓쳐 물에 빠질 뻔한 것은 덤이다.', effect: { gold: -20, stats: { cha: 1 } } } },
      { label: '구경하며 간식을 먹는다', success: { text: '튀김과 단술을 맛보며 안개가 걷힐 때까지 시장 구경을 했다.', effect: { stats: { vit: 1 }, mood: 'joy' } } },
    ],
  },
  {
    id: 'a_ex_toll_gate', title: '산길의 통행료', weight: 1.5,
    cond: { minAge: 18, maxAge: 58 },
    text: '산길 한복판에 밧줄이 쳐져 있다. 허름한 차림의 사내가 손을 내밀었다. "통행료는 은화 두 닢이오."',
    choices: [
      { label: '통행료를 낸다', success: { text: '사내가 "고맙소" 하며 길을 터 주었다. 의외로 산적이 아니라 마을 주민이었다.', effect: { gold: -10, karma: 1 } } },
      { label: '말솜씨로 깎아 본다', check: { stat: 'cha', dc: 30 },
        success: { text: '이야기를 나누다 보니 사내가 오히려 간식을 나눠 줬다. 통행료는 면제!', effect: { stats: { cha: 2 }, mood: 'joy' } },
        fail: { text: '말다툼 끝에 통행료는 세 닢으로 올랐다. 입이 방정이다.', effect: { gold: -15, stats: { cha: -1 } } } },
      { label: '다른 길로 돌아간다', success: { text: '돌아가느라 한나절이 더 걸렸지만 길가의 야생 딸기를 실컷 따 먹었다.', effect: { stats: { vit: 1 } } } },
    ],
  },
  {
    id: 'a_ex_meteor_site', title: '별똥별 떨어진 자리', weight: 1,
    cond: { minAge: 18, maxAge: 60 },
    text: '어젯밤 하늘을 가른 별똥별이 근처 언덕에 떨어졌다는 소문이 돈다. 새벽부터 구경꾼이 줄을 섰다.',
    choices: [
      { label: '현장을 살펴본다', check: { stat: 'luck', dc: 32 },
        success: { text: '움푹 파인 땅 속에서 따뜻한 푸른 돌 조각을 주웠다. 불을 가까이하면 은은히 빛난다.', effect: { gold: 70, stats: { mana: 2, luck: 1 } }, tone: 'good' },
        fail: { text: '남은 건 그을린 땅과 인파뿐이었다. 그래도 하늘을 올려다볼 이유가 늘었다.', effect: { stats: { int: 1 } } } },
      { label: '밤하늘을 기록한다', success: { text: '별의 위치를 그려 두었다. 학자들이 보면 흥미를 가질 만한 기록이다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'a_ex_underground_river', title: '지하 강의 뗏목', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 55 },
    text: '동굴 안쪽에서 물 흐르는 소리가 울린다. 어둠 속에서 누군가 버린 뗏목이 물결에 흔들리고 있다.',
    choices: [
      { label: '뗏목을 타고 내려간다', check: { stat: 'vit', dc: 32 },
        success: { text: '물살이 빨라졌지만 노를 능숙하게 놀렸다. 끝에는 푸른 이끼로 빛나는 지하 정원이 펼쳐졌다!', effect: { stats: { vit: 2, fame: 2, luck: 1 } }, tone: 'good' },
        fail: { text: '물살에 휩쓸려 뗏목이 뒤집혔다. 온몸이 물에 젖은 채 기어 나왔다.', effect: { stats: { vit: -4 } } } },
      { label: '강가를 따라 걷는다', success: { text: '천장의 석순이 만들어 낸 풍경에 넋을 잃었다. 시간이 가는 줄 몰랐다.', effect: { stats: { int: 1 }, mood: 'calm' } } },
    ],
  },
  {
    id: 'a_ex_statue_puzzle', title: '조각상의 수수께끼', weight: 1.5, focus: 'study',
    cond: { minAge: 18, maxAge: 60 },
    text: '고대 광장의 석상 세 개가 서로 다른 방향을 가리키고 있다. 받침돌에는 이렇게 새겨져 있다. "진실을 가리키는 이는 하나."',
    choices: [
      { label: '수수께끼를 푼다', check: { stat: 'int', dc: 34 },
        success: { text: '순서대로 돌리자 받침돌 아래에서 작은 서랍이 열렸다. 오래된 금화 몇 닢이 들어 있다!', effect: { gold: 80, stats: { int: 2, fame: 1 } }, tone: 'good' },
        fail: { text: '아무리 돌려도 반응이 없다. 오히려 석상이 날 비웃는 듯하다.', effect: { stats: { int: 1 } } } },
      { label: '그냥 지나친다', success: { text: '옛사람의 장난이려니 했다. 골치 아픈 수수께끼는 사양이다.', effect: { stress: -3 } } },
    ],
  },
  {
    id: 'a_ex_swamp_hut', title: '늪지의 오두막', weight: 1.5, focus: 'explore',
    cond: { minAge: 18, maxAge: 58 },
    text: '안개 낀 늪 한가운데에 오두막이 있고 굴뚝에서 연기가 솔솔 올라온다. 문 앞에 개구리 인형이 줄지어 놓여 있다.',
    choices: [
      { label: '문을 두드린다', check: { stat: 'cha', dc: 30 },
        success: { text: '수상한 할머니가 약초차를 내주었다. 한 모금에 피로가 싹 풀렸다. "또 와도 좋다, 아해야."', effect: { stats: { vit: 2, mana: 1 }, stress: -10 }, tone: 'good' },
        fail: { text: '문이 벌컥 열리며 개구리 합창이 쏟아졌다. 도망치듯 나왔지만 이상하게 웃음이 났다.', effect: { stats: { luck: 1 }, mood: 'joy' } } },
      { label: '멀리서 지켜본다', success: { text: '연기 모양이 점점 개구리 형상으로 변했다. 역시 이곳은 수상쩍다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'a_ex_giant_mushroom', title: '거대 버섯 숲', weight: 1, focus: 'explore',
    cond: { minAge: 18, maxAge: 60 },
    text: '비 온 뒤의 숲에 집채만 한 버섯이 우후죽순 솟아 있다. 갓 아래에서 은은한 빛이 새어 나온다.',
    choices: [
      { label: '갓 아래를 탐험한다', check: { stat: 'luck', dc: 30 },
        success: { text: '버섯 포자가 반짝반짝 떠올라 숲 전체가 별밤처럼 빛났다. 희귀한 약초도 챙겼다.', effect: { gold: 50, stats: { luck: 2 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '포자를 들이마시고 재채기가 하루 종일 멈추지 않았다.', effect: { stats: { vit: -2 } } } },
      { label: '그림으로 남긴다', success: { text: '스케치북이 금세 버섯으로 가득 찼다. 이 풍경은 오래도록 기억에 남을 것이다.', effect: { stats: { int: 1, cha: 1 } } } },
    ],
  },
  {
    id: 'a_ex_lighthouse', title: '외딴 등대', weight: 1.5,
    cond: { minAge: 18, maxAge: 60 },
    text: '절벽 위 외딴 등대지기가 손짓한다. "오늘 밤 안개가 짙어서 말이야, 불 지피는 걸 도와줄 사람 없나?"',
    choices: [
      { label: '밤새 불을 지킨다', check: { stat: 'vit', dc: 28 },
        success: { text: '새벽녘, 안개 사이로 배들이 무사히 항구로 들어오는 것이 보였다. 등대지기가 따뜻한 차를 내밀었다.', effect: { stats: { vit: 1, fame: 1 }, karma: 4, mood: 'calm' }, tone: 'good' },
        fail: { text: '꾸벅꾸벅 졸다 불이 약해졌지만, 등대지기가 재빨리 수습했다. 얼굴이 화끈거린다.', effect: { stats: { cha: -1 }, karma: 1 } } },
      { label: '일몰만 구경한다', success: { text: '등대 위에서 본 석양은 말로 설명할 수 없는 색이었다.', effect: { mood: 'calm', stats: { luck: 1 } } } },
    ],
  },
  {
    id: 'a_ex_old_adventurer', title: '은퇴한 모험가', weight: 1.5, focus: 'social',
    cond: { minAge: 18, maxAge: 60 },
    text: '주점 한구석에서 팔뚝에 상처 투성이인 노인이 혼자 술잔을 기울인다. 모험담을 들려 달라는 아이들에게 둘러싸여 있다.',
    choices: [
      { label: '자리에 끼어 이야기를 듣는다', success: { text: '용 비늘을 닦던 이야기, 눈보라 속 탈출기. 노인의 이야기가 끝날 때쯤 소매에서 작은 부적이 굴러떨어졌다.', effect: { stats: { int: 1, cha: 1, luck: 1 }, mood: 'joy', trinket: { stat: 'luck', rarity: 'common' } }, tone: 'good' } },
      { label: '한 수 가르쳐 달라고 청한다', check: { stat: 'cha', dc: 30 },
        success: { text: '노인이 껄껄 웃으며 모험의 요령을 몇 가지 알려 주었다. "도망칠 때를 아는 게 제일 중요하지."', effect: { stats: { vit: 1, int: 2 } }, tone: 'good' },
        fail: { text: '"젊은 놈이 건방지게!" 호통만 듣고 쫓겨났다. 그래도 배운 건 하나 있다. 노인에게는 예의를.', effect: { stats: { cha: 1 } } } },
    ],
  },
  {
    id: 'a_ex_stray_cart', title: '고장 난 마차', weight: 1.5,
    cond: { minAge: 18, maxAge: 60 },
    text: '길가에서 바퀴가 빠진 상인 마차가 서 있다. 상인이 땀을 뻘뻘 흘리며 손짓한다. "어이, 거기! 힘 좀 빌려주겠나?"',
    choices: [
      { label: '바퀴를 함께 끼운다', check: { stat: 'vit', dc: 28 },
        success: { text: '영차! 바퀴가 철컥 들어맞았다. 상인이 감사의 뜻으로 신기한 과일 한 상자를 건넸다.', effect: { gold: 30, stats: { vit: 1 }, karma: 3 }, tone: 'good' },
        fail: { text: '힘을 주다 허리를 삐끗했다. 결국 둘이 앉아 마차 고치는 법을 한참 토론했다.', effect: { stats: { vit: -2, int: 1 } } } },
      { label: '지나가는 사람을 불러온다', success: { text: '마을에서 장정 두 명을 데려오자 순식간에 해결되었다. 상인이 연신 고개를 숙였다.', effect: { karma: 2, stats: { cha: 1 } } } },
    ],
  },
];
