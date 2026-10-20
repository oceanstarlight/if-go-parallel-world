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

  // ───── 소년기 범용 일상 (13~17세 · 누구에게나 · 반복) ─────
  // 연결: 짝사랑→고백→축제→결말 · 친구 비밀 · 라이벌 · 아르바이트→첫 월급 · 새벽 수련→대회 · 낡은 지도→유적 · 길드 기웃→심부름 · 수상한 소문 · 스터디→시험

  // 연애
  {
    id: 'y_crush', title: '두근거리는 시선', weight: 2,
    cond: { minAge: 13, maxAge: 17, notFlags: ['yt_crush', 'yt_first_love'] },
    text: '우물가에서 마주친 또래가 자꾸 눈에 밟힌다. 이상하다, 심장이 이렇게 빨리 뛸 일이 아닌데.',
    choices: [
      { label: '용기 내어 인사한다', check: { stat: 'cha', dc: 22 },
        success: { text: '"안, 안녕!" 상대가 웃으며 손을 흔들었다. 하루 종일 발이 땅에 닿지 않는 기분이다.', effect: { flags: ['yt_crush'], stats: { cha: 1 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '인사가 "안녕녀!"로 나와 버렸다. 상대는 웃음을 참으며 지나갔다. 아직 마음은 그대로다.', effect: { flags: ['yt_crush'], mood: 'gloom' } } },
      { label: '멀리서 바라만 본다', success: { text: '눈이 마주치자 얼굴이 홧홧해져 고개를 숙였다. 오늘도 말은 못 걸었다.', effect: { flags: ['yt_crush'], mood: 'calm' } } },
      { label: '그냥 지나친다', success: { text: '"쓸데없는 감정이야." 발걸음을 재촉했지만 이상하게 자꾸 뒤를 돌아보았다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_love_letter', title: '밤새 쓴 편지', weight: 3,
    cond: { minAge: 13, maxAge: 17, flags: ['yt_crush'] },
    text: '종이 열 장을 구겨 던진 끝에 편지가 완성되었다. 이걸 전해 줘야 할까, 말아야 할까.',
    choices: [
      { label: '직접 건넨다', check: { stat: 'cha', dc: 24 },
        success: { text: '상대가 편지를 받아 들고 귀 끝까지 빨개졌다. "…답장, 할게."', effect: { flags: ['yt_first_love'], unflags: ['yt_crush'], stats: { cha: 2 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '긴장해서 편지를 거꾸로 건넸다. 상대는 곤란한 듯 웃었다. 가슴이 철렁했다.', effect: { unflags: ['yt_crush'], stats: { cha: -1 }, mood: 'gloom' } } },
      { label: '서랍 깊숙이 넣어 둔다', success: { text: '언젠가 다시 꺼내 볼 날이 오겠지. 편지는 어둠 속에서 조용히 기다린다.', effect: { unflags: ['yt_crush'], stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_festival_date', title: '축제의 약속', weight: 3,
    cond: { minAge: 14, maxAge: 17, flags: ['yt_first_love'] },
    text: '축제 전날, 그 아이가 조그맣게 말했다. "내일 광장 분수대 앞에서… 기다릴게."',
    choices: [
      { label: '일찍 가서 기다린다', success: { text: '해가 지자 불꽃이 올랐다. 나란히 올려다본 하늘은 평생 잊지 못할 것 같다.', effect: { stats: { cha: 2, luck: 1 }, mood: 'joy' }, tone: 'good' } },
      { label: '친구들과 놀러 가 버린다', success: { text: '뒤늦게 생각나 달려갔을 땐 분수대가 텅 비어 있었다. 후회가 불꽃보다 크게 터졌다.', effect: { stats: { cha: -1 }, mood: 'gloom' }, tone: 'bad' } },
    ],
  },
  {
    id: 'y_first_love_end', title: '첫사랑의 끝', weight: 3,
    cond: { minAge: 14, maxAge: 17, flags: ['yt_first_love'] },
    text: '시간이 흐르자 둘 사이에 조금씩 거리가 생겼다. 오늘, 그 아이가 조용히 말을 꺼냈다.',
    choices: [
      { label: '웃으며 보내 준다', success: { text: '"고마웠어." 마지막 인사를 하고 돌아서자 눈물이 쏟아졌다. 그래도 좋은 추억으로 남을 것이다.', effect: { unflags: ['yt_first_love'], stats: { cha: 2, int: 1 }, karma: 3, mood: 'calm' } } },
      { label: '붙잡아 본다', check: { stat: 'cha', dc: 26 },
        success: { text: '진심이 닿았다. 서로 어색하게 웃으며 처음부터 다시 시작해 보기로 했다.', effect: { stats: { cha: 2 }, mood: 'joy' }, tone: 'good' },
        fail: { text: '말은 길어질수록 엉망이 되었다. 결국 돌아선 건 상대였다.', effect: { unflags: ['yt_first_love'], stats: { cha: -1 }, mood: 'gloom' } } },
    ],
  },

  // 친구
  {
    id: 'y_friend_favor', title: '친구의 부탁', weight: 2.5,
    cond: { minAge: 13, maxAge: 17, hasRel: ['friend'] },
    text: '{friend:이} 난처한 얼굴로 다가왔다. "있잖아, 이번 한 번만 도와줄 수 있어?"',
    choices: [
      { label: '무슨 일이든 돕는다', check: { stat: 'vit', dc: 24 },
        success: { text: '하루 종일 짐을 나르고 나서야 끝났다. {friend:은} 눈물이 날 만큼 고마워했다.', effect: { rel: { friend: 15 }, stats: { vit: 1 }, karma: 3 }, tone: 'good' },
        fail: { text: '도와주겠다고 큰소리쳤지만 허리를 삐끗했다. {friend:은} 오히려 당신을 업고 갔다.', effect: { rel: { friend: 8 }, stats: { vit: -3 } } } },
      { label: '핑계를 대고 거절한다', success: { text: '"미안, 바빠." {friend:은} 괜찮다고 웃었지만 등이 조금 쓸쓸해 보였다.', effect: { rel: { friend: -10 } } } },
    ],
  },
  {
    id: 'y_group_hangout', title: '친구들과 어울리는 날', weight: 2.5, focus: 'social',
    cond: { minAge: 13, maxAge: 17, hasRel: ['friend'] },
    text: '{friend:이} 동네 또래를 몇 명 데려왔다. "다 같이 강가에서 놀자!"',
    choices: [
      { label: '분위기를 띄운다', check: { stat: 'cha', dc: 24 },
        success: { text: '노래, 게임, 장난. 해가 지기 전에 모두 당신의 친구가 되어 있었다.', effect: { rel: { friend: 10 }, stats: { cha: 2, fame: 1 }, mood: 'joy' } },
        fail: { text: '농담이 두 번 연속 빗나갔다. 분위기가 싸해졌지만 {friend:이} 슬쩍 수습해 주었다.', effect: { rel: { friend: 5 }, stats: { cha: -1 } } } },
      { label: '구석에서 지켜본다', success: { text: '사람이 많으니 조금 어색했지만, 나름대로 즐거웠다. 다음엔 조금 더 어울려 볼까.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_friend_secret', title: '친구의 비밀', weight: 2,
    cond: { minAge: 13, maxAge: 17, hasRel: ['friend'], notFlags: ['yt_friend_secret'] },
    text: '{friend:이} 주위를 둘러보더니 목소리를 낮췄다. "너한테만 말하는 건데… 사실 나, 하고 싶은 게 있어."',
    choices: [
      { label: '끝까지 들어 준다', success: { text: '속마음을 털어놓은 {friend:의} 얼굴이 한결 가벼워졌다. 둘만의 비밀이 하나 생겼다.', effect: { flags: ['yt_friend_secret'], rel: { friend: 15 }, stats: { cha: 1 } }, tone: 'good' } },
      { label: '농담으로 넘긴다', success: { text: '"에이, 설마!" 웃어넘기자 {friend:은} 입을 다물었다. 분위기가 묘해졌다.', effect: { rel: { friend: -10 } } } },
    ],
  },
  {
    id: 'y_keep_secret', title: '새어 나간 이야기', weight: 3,
    cond: { minAge: 13, maxAge: 17, hasRel: ['friend'], flags: ['yt_friend_secret'] },
    text: '장터에서 들려오는 수군거림. 어디선가 {friend:의} 비밀이 퍼지고 있다.',
    choices: [
      { label: '자기가 말했다고 둘러댄다', check: { stat: 'cha', dc: 26 },
        success: { text: '"그거 내가 지어낸 얘기야!" 소문은 시들해졌고 {friend:은} 평생 갚을 은혜라며 울먹였다.', effect: { unflags: ['yt_friend_secret'], rel: { friend: 25 }, stats: { cha: 2, fame: -1 } }, tone: 'good' },
        fail: { text: '변명은 오히려 소문에 기름을 부었다. 그래도 {friend:은} 끝까지 곁에 있어 주었다.', effect: { unflags: ['yt_friend_secret'], rel: { friend: 10 }, stats: { cha: -1 } } } },
      { label: '모른 척 입을 닫는다', success: { text: '소문은 며칠 뒤 다른 소문에 덮였다. 하지만 {friend:의} 눈빛에서 무언가 달라진 게 느껴졌다.', effect: { unflags: ['yt_friend_secret'], rel: { friend: -12 } } } },
    ],
  },

  // 라이벌
  {
    id: 'y_rival_taunt', title: '라이벌의 도발', weight: 2.5,
    cond: { minAge: 13, maxAge: 17, hasRel: ['rival'] },
    text: '{rival:이} 길을 막아섰다. "요즘 좀 컸다고 우쭐거리지? 나랑 겨뤄 보자!"',
    choices: [
      { label: '받아들인다', check: { stat: 'vit', dc: 26 },
        success: { text: '진흙투성이 승부 끝에 쓰러진 건 {rival:이} 쪽이었다. 분한 눈빛 속에 인정이 섞여 있었다.', effect: { rel: { rival: 10 }, stats: { vit: 2, fame: 2 } } },
        fail: { text: '아슬아슬하게 졌다. {rival:은} 당당히 가슴을 폈고, 당신은 이를 갈았다.', effect: { rel: { rival: -8 }, stats: { vit: -3, fame: -1 } } } },
      { label: '못 들은 척 지나간다', success: { text: '"겁쟁이!" 뒤통수에 꽂히는 소리를 애써 무시했다. 이상하게 손이 떨렸다.', effect: { rel: { rival: -10 }, stats: { cha: 1 } } } },
    ],
  },
  {
    id: 'y_rival_truce', title: '의외의 도움', weight: 2,
    cond: { minAge: 13, maxAge: 17, hasRel: ['rival'] },
    text: '비 오는 날, 진흙길에서 수레 바퀴가 빠졌다. 지나가던 {rival:이} 발을 멈췄다.',
    choices: [
      { label: '손을 내밀어 함께 민다', success: { text: '"…이번만이야." {rival:은} 투덜대면서도 끝까지 같이 밀어 주었다.', effect: { rel: { rival: 15 }, karma: 3, stats: { vit: 1 } }, tone: 'good' } },
      { label: '"필요 없어!"라고 쏘아붙인다', success: { text: '{rival:은} 어깨를 으쓱하고 지나갔다. 수레는 혼자서 한 시간을 더 씨름해야 했다.', effect: { rel: { rival: -5 }, stats: { vit: 1 } } } },
    ],
  },

  // 아르바이트
  {
    id: 'y_part_time', title: '첫 아르바이트', weight: 2,
    cond: { minAge: 13, maxAge: 17, notFlags: ['yt_part_job'] },
    text: '장터 국밥집 주인이 구인 팻말을 내걸었다. "일손이 모자라서 말이야, 꼬마 일꾼 구한다!"',
    choices: [
      { label: '설거지를 자청한다', success: { text: '허리가 휘도록 그릇을 닦았다. 주인이 "내일도 오거라" 하고 웃었다.', effect: { flags: ['yt_part_job'], stats: { vit: 1 } } } },
      { label: '손님맞이를 맡는다', check: { stat: 'cha', dc: 22 },
        success: { text: '"어서 오세요!" 활기찬 인사에 손님이 두 배로 늘었다. 주인의 입이 귀에 걸렸다.', effect: { flags: ['yt_part_job'], stats: { cha: 2 } }, tone: 'good' },
        fail: { text: '주문을 세 번 틀리는 바람에 국밥이 엉뚱한 상에 갔다. 그래도 일은 계속할 수 있다.', effect: { flags: ['yt_part_job'], stats: { cha: -1 } } } },
    ],
  },
  {
    id: 'y_first_wage', title: '첫 월급', weight: 4,
    cond: { minAge: 13, maxAge: 17, flags: ['yt_part_job'] },
    text: '한 달이 지났다. 주인이 작은 주머니를 내밀었다. 묵직한 동전 소리가 났다.',
    choices: [
      { label: '꼭 쥐고 집으로 간다', success: { text: '부모님 앞에 주머니를 내려놓자 어머니의 눈가가 붉어졌다. 뿌듯함이 가슴에 번졌다.', effect: { unflags: ['yt_part_job'], gold: 40, karma: 3, stats: { cha: 1 } }, tone: 'good' } },
      { label: '장터에서 마음껏 쓴다', success: { text: '군것질과 신기한 장난감으로 주머니가 홀쭉해졌다. 즐거웠지만 조금 허전했다.', effect: { unflags: ['yt_part_job'], gold: 10, mood: 'joy' } } },
    ],
  },
  {
    id: 'y_saving_up', title: '모은 동전', weight: 1.5,
    cond: { minAge: 13, maxAge: 17, goldMin: 30 },
    text: '서랍 속에 모아 둔 동전이 제법 쌓였다. 이걸로 무엇을 할 수 있을까.',
    choices: [
      { label: '책과 도구를 산다', success: { text: '새 책 냄새를 맡으니 왠지 똑똑해진 기분이다. 한 권씩 아껴 읽기로 했다.', effect: { gold: -20, stats: { int: 2 } } } },
      { label: '낡은 검을 맞춘다', success: { text: '대장장이 아저씨가 손에 맞게 다듬어 주었다. 휘두를 때마다 바람 소리가 달라졌다.', effect: { gold: -25, stats: { vit: 2 } } } },
      { label: '그냥 아껴 둔다', success: { text: '동전을 세어 보는 것만으로도 든든했다. 언젠가 쓸 날이 올 것이다.', effect: { stats: { luck: 1 } } } },
    ],
  },

  // 수련·대회·마법
  {
    id: 'y_dawn_training', title: '새벽 수련', weight: 2, focus: 'train',
    cond: { minAge: 13, maxAge: 17, notFlags: ['yt_trained'] },
    text: '닭이 울기도 전에 눈이 떠졌다. 안개 자욱한 마당에서 목검 하나를 쥐었다.',
    choices: [
      { label: '해가 뜰 때까지 휘두른다', check: { stat: 'vit', dc: 24 },
        success: { text: '팔이 후들거렸지만 끝까지 해냈다. 해가 뜨는 순간 몸이 한결 가벼워졌다.', effect: { flags: ['yt_trained'], stats: { vit: 3 } }, tone: 'good' },
        fail: { text: '중간에 팔이 풀려 목검이 날아갔다. 그래도 내일 또 해 보기로 했다.', effect: { flags: ['yt_trained'], stats: { vit: 1 } } } },
      { label: '다시 이불 속으로 들어간다', success: { text: '5분만 더 자려던 것이 정오가 되었다. 잠이 보약이라고 믿기로 했다.', effect: { stats: { vit: 1 }, mood: 'calm' } } },
    ],
  },
  {
    id: 'y_sparring', title: '마을 스파링', weight: 2, focus: 'train',
    cond: { minAge: 13, maxAge: 17 },
    text: '마을 광장에서 또래들이 목검을 맞대고 있다. "너도 한번 해 볼래?"',
    choices: [
      { label: '당당히 나선다', check: { stat: 'vit', dc: 24 },
        success: { text: '세 합 만에 상대의 목검을 튕겨 냈다! 주변에서 환호가 터졌다.', effect: { stats: { vit: 2, fame: 2 } }, tone: 'good' },
        fail: { text: '엉덩방아를 찧었다. 일어나 보니 코피가 조금 났다. 그래도 즐거웠다.', effect: { stats: { vit: -2, cha: 1 } } } },
      { label: '구경하며 자세를 배운다', success: { text: '남의 칼질을 보는 것도 공부다. 눈으로 익힌 동작이 몸에 남았다.', effect: { stats: { int: 1, vit: 1 } } } },
    ],
  },
  {
    id: 'y_tournament', title: '소년 무예 대회', weight: 3, focus: 'train',
    cond: { minAge: 14, maxAge: 17, flags: ['yt_trained'] },
    text: '수확제의 하이라이트, 소년 무예 대회가 열린다. 꾸준히 갈고닦은 실력을 보여 줄 때다.',
    choices: [
      { label: '정면 돌파로 우승을 노린다', check: { stat: 'vit', dc: 28 },
        success: { text: '결승에서 상대의 검을 쳐내고 번쩍 팔을 들었다! 우승 상품은 번쩍이는 은화 주머니다.', effect: { unflags: ['yt_trained'], gold: 50, stats: { vit: 2, fame: 4 } }, tone: 'good' },
        fail: { text: '8강에서 탈락했다. 분했지만 한 단계 성장한 기분이다.', effect: { unflags: ['yt_trained'], stats: { vit: 1, fame: 1 } } } },
      { label: '지혜로 허점을 노린다', check: { stat: 'int', dc: 28 },
        success: { text: '상대의 습관을 파악해 단번에 허를 찔렀다! 관중이 감탄했다.', effect: { unflags: ['yt_trained'], gold: 30, stats: { int: 2, fame: 3 } }, tone: 'good' },
        fail: { text: '머리로 계산하다 몸이 따라가지 못했다. 다음엔 몸도 쓰자.', effect: { unflags: ['yt_trained'], stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_magic_trial', title: '마력 연습', weight: 2,
    cond: { minAge: 13, maxAge: 17 },
    text: '손바닥에 모은 마력이 이상하게 꿈틀거린다. 혼자서 몰래 연습하기엔 지금이 딱이다.',
    choices: [
      { label: '작은 불꽃을 만든다', check: { stat: 'mana', dc: 24 },
        success: { text: '손바닥 위에 반짝이는 불씨가 피어올랐다. 숨죽여 지켜보다 환호성이 터졌다.', effect: { stats: { mana: 3, int: 1 } }, tone: 'good' },
        fail: { text: '불씨가 손가락을 스쳤다. 앗, 뜨거! 앞머리가 살짝 그을렸다.', effect: { stats: { mana: 1, vit: -2 } } } },
      { label: '물을 불러내 본다', check: { stat: 'mana', dc: 22 },
        success: { text: '공기 중의 습기가 물방울이 되어 모였다. 반짝이는 물방울이 손 위를 굴러다녔다.', effect: { stats: { mana: 2, luck: 1 } } },
        fail: { text: '물이 폭발하듯 튀어 온몸이 젖었다. 방이 물바다가 되었다.', effect: { stats: { mana: 1 }, mood: 'gloom' } } },
      { label: '안전하게 이론서를 읽는다', success: { text: '마력의 흐름에 대한 설명은 어려웠지만, 이해하자 눈이 번쩍 뜨였다.', effect: { stats: { int: 2 } } } },
    ],
  },

  // 지도 → 유적
  {
    id: 'y_old_map', title: '낡은 지도', weight: 1.5, focus: 'explore',
    cond: { minAge: 13, maxAge: 17, notFlags: ['yt_old_map'] },
    text: '헌책방 구석에서 빛바랜 지도 한 장이 떨어졌다. 마을 외곽 숲에 빨간 점이 찍혀 있다.',
    choices: [
      { label: '몰래 가져온다', success: { text: '주인 몰래 지도를 품에 넣었다. 심장이 쿵쾅거렸다.', effect: { flags: ['yt_old_map'], karma: -3, stats: { luck: 1 } } } },
      { label: '값을 치르고 산다', success: { text: '"허허, 눈썰미가 좋구나." 주인이 지도를 곱게 싸 주었다.', effect: { flags: ['yt_old_map'], gold: -10, karma: 1, stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_ruins_dive', title: '숲속의 유적', weight: 3, focus: 'explore',
    cond: { minAge: 14, maxAge: 17, flags: ['yt_old_map'] },
    text: '지도가 가리킨 곳에는 덩굴에 뒤덮인 작은 유적이 있었다. 돌문 안쪽에서 서늘한 바람이 불어 나온다.',
    choices: [
      { label: '횃불을 들고 들어간다', check: { stat: 'luck', dc: 26 },
        success: { text: '벽 틈에서 오래된 은화 주머니와 반짝이는 조각을 찾아냈다! 마을에 돌아와서도 가슴이 두근거렸다.', effect: { unflags: ['yt_old_map'], gold: 60, stats: { luck: 2, mana: 2 } }, tone: 'good' },
        fail: { text: '함정 바닥이 쿵 꺼지는 바람에 먼지 구덩이를 굴렀다. 겨우 기어 나왔다.', effect: { unflags: ['yt_old_map'], stats: { vit: -5 } } } },
      { label: '입구의 문양만 베껴 온다', success: { text: '문양을 꼼꼼히 베껴 와 책과 비교해 보니 고대 문자의 일종이었다. 지식이 쌓였다.', effect: { unflags: ['yt_old_map'], stats: { int: 3 } } } },
    ],
  },

  // 성장·진로
  {
    id: 'y_future_worry', title: '진로 고민', weight: 2,
    cond: { minAge: 14, maxAge: 17 },
    text: '밤하늘을 보며 문득 생각했다. 나는 앞으로 무엇이 되고 싶은 걸까.',
    choices: [
      { label: '어른들에게 물어본다', success: { text: '농사, 장사, 기사, 마법사. 어른마다 말이 다 달랐지만, 이야기를 들을수록 마음이 정리되었다.', effect: { stats: { int: 1, cha: 1 } } } },
      { label: '혼자 일기에 적어 본다', check: { stat: 'int', dc: 22 },
        success: { text: '적다 보니 하고 싶은 것과 하기 싫은 것이 또렷해졌다. 아주 작은 목표가 생겼다.', effect: { stats: { int: 2, luck: 1 }, mood: 'calm' } },
        fail: { text: '쓰다 보니 걱정만 늘었다. 결국 이불 속으로 파고들었다.', effect: { mood: 'gloom' } } },
    ],
  },
  {
    id: 'y_growth_spurt', title: '쑥쑥 크는 키', weight: 1.5,
    cond: { minAge: 13, maxAge: 16 },
    text: '어느 날 아침, 바지가 짧아졌다. 이번 달에만 벌써 세 번째 옷 수선이다.',
    auto: { check: { stat: 'vit', dc: 20 },
      success: { text: '키가 훌쩍 자랐다! 거울 속의 자신이 어쩐지 믿음직스럽다.', effect: { stats: { vit: 3, cha: 1 } } },
      fail: { text: '뼈마디가 쑤셔서 한동안 계단 오르기도 힘들었다. 성장통이란 이런 거구나.', effect: { stats: { vit: 1 } } } },
  },
  {
    id: 'y_old_dog', title: '늙어 가는 강아지', weight: 3,
    cond: { minAge: 13, maxAge: 17, flags: ['has_pup'] },
    text: '어릴 적 데려온 강아지가 이제 눈빛이 흐리다. 예전처럼 달리지 못하고 볕 아래에서 졸기만 한다.',
    choices: [
      { label: '옆에서 오래 쓰다듬어 준다', success: { text: '강아지가 가르랑거리듯 낑 소리를 냈다. 함께한 시간이 하나하나 떠올라 눈이 뜨거워졌다.', effect: { stats: { cha: 1 }, karma: 3, mood: 'calm' } } },
      { label: '산책에 데리고 나간다', check: { stat: 'vit', dc: 20 },
        success: { text: '느릿느릿 걷는 산책이었지만 노을이 아름다웠다. 강아지는 오랜만에 꼬리를 흔들었다.', effect: { stats: { luck: 2, vit: 1 }, mood: 'joy' } },
        fail: { text: '조금 걷다 지친 강아지를 품에 안고 돌아왔다. 그것만으로도 충분했다.', effect: { stats: { vit: -1 }, mood: 'calm' } } },
    ],
  },

  // 마을 밤·괴담
  {
    id: 'y_night_market', title: '밤 장터', weight: 2,
    cond: { minAge: 13, maxAge: 17 },
    text: '해가 지자 장터가 다른 얼굴을 드러냈다. 등불이 늘어서고 낮에는 보지 못한 노점이 길을 메운다.',
    choices: [
      { label: '신기한 가게를 돌아다닌다', check: { stat: 'luck', dc: 24 },
        success: { text: '노점 구석에서 숨은 보물 같은 소품을 싼값에 건졌다. 장사꾼이 한숨을 쉬었다.', effect: { gold: 15, stats: { luck: 2, int: 1 } }, tone: 'good' },
        fail: { text: '바가지를 쓰고 말았다. 반짝이는 돌멩이가 알고 보니 유리조각이었다.', effect: { gold: -10, stats: { int: 1 } } } },
      { label: '군것질로 배를 채운다', success: { text: '꼬치, 호떡, 달콤한 시럽. 배가 빵빵해질 때까지 먹고 나서야 집으로 향했다.', effect: { stats: { vit: 1 }, mood: 'joy' } } },
    ],
  },
  {
    id: 'y_haunted_house', title: '폐가의 소문', weight: 2, focus: 'explore',
    cond: { minAge: 13, maxAge: 17 },
    text: '마을 끝 폐가에 밤마다 불이 켜진다는 소문이 돌고 있다. "누가 진실을 밝혀 볼 테냐?"',
    choices: [
      { label: '한밤중에 몰래 가 본다', check: { stat: 'vit', dc: 24 },
        success: { text: '창가에서 흔들리던 불빛의 정체는 새끼 고양이를 돌보던 노인이었다. 괴담은 따뜻한 이야기가 되었다.', effect: { stats: { vit: 1, fame: 2 }, karma: 3 }, tone: 'good' },
        fail: { text: '삐걱 소리에 놀라 도망치다 개울에 풍덩! 괴담보다 무서운 건 젖은 옷이었다.', effect: { stats: { vit: -3 }, mood: 'fear' } } },
      { label: '낮에 친구와 함께 살펴본다', success: { text: '먼지 쌓인 낡은 가구들뿐이었다. 괴담은 역시 괴담이다.', effect: { stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_pickpocket', title: '소매치기 소동', weight: 1.5,
    cond: { minAge: 13, maxAge: 17 },
    text: '붐비는 장터에서 한 아이가 노점 주인의 주머니에 손을 넣는 것을 보았다.',
    choices: [
      { label: '큰 소리로 외친다', check: { stat: 'cha', dc: 24 },
        success: { text: '"도둑이야!" 소매치기는 허둥지둥 달아났다. 노점 주인이 약과를 한 보따리 안겨 주었다.', effect: { stats: { cha: 2, fame: 2 }, karma: 5 }, tone: 'good' },
        fail: { text: '외침이 소음에 묻혀 버렸다. 그 사이 소매치기는 군중 속으로 사라졌다.', effect: { karma: 1, stats: { cha: -1 } } } },
      { label: '본 척하지 않는다', success: { text: '옆구리가 간질거려 얼른 자리를 떴다. 마음 한구석이 찜찜했다.', effect: { karma: -4 } } },
    ],
  },
  {
    id: 'y_lost_traveler', title: '길 잃은 여행자', weight: 2,
    cond: { minAge: 13, maxAge: 17 },
    text: '해 질 녘 갈림길에서 지도를 거꾸로 든 여행자가 서성이고 있다. "이 길이 도시로 가는 길 맞니?"',
    choices: [
      { label: '직접 마을 입구까지 안내한다', success: { text: '가는 동안 먼 나라 이야기를 많이 들었다. 여행자는 작은 동전 한 닢을 쥐여 주고 떠났다.', effect: { gold: 5, karma: 4, stats: { int: 1, cha: 1 } }, tone: 'good' } },
      { label: '길만 가르쳐 준다', success: { text: '"고맙다, 꼬마야!" 여행자는 손을 흔들며 멀어졌다. 가볍게 한 일이지만 기분이 좋았다.', effect: { karma: 2 } } },
      { label: '엉뚱한 길을 알려 준다', check: { stat: 'luck', dc: 22 },
        success: { text: '장난으로 알려 준 길인데 여행자는 오히려 지름길을 찾았다고 한다. 어째 억울하다.', effect: { karma: -2, stats: { luck: 1 } } },
        fail: { text: '여행자가 되돌아와 따끔하게 혼을 냈다. 얼굴이 화끈거렸다.', effect: { karma: -5, stats: { cha: -2 } } } },
    ],
  },

  // 길드 기웃
  {
    id: 'y_guild_peek', title: '길드 문턱', weight: 2, focus: 'explore',
    cond: { minAge: 14, maxAge: 17, notFlags: ['yt_guild_peek'] },
    text: '장터 맞은편의 모험가 길드는 늘 시끌벅적하다. 문틈으로 갑옷 차림의 모험가들이 보인다.',
    choices: [
      { label: '문을 열고 들어간다', check: { stat: 'cha', dc: 24 },
        success: { text: '접수원이 "아직 어린데… 심부름이라면 맡길게요"라며 웃었다. 길드 게시판 앞에 서니 심장이 뛴다.', effect: { flags: ['yt_guild_peek'], stats: { cha: 1, fame: 1 } }, tone: 'good' },
        fail: { text: '문을 열자마자 술 취한 모험가와 부딪쳤다. 쫓겨나듯 도망쳤지만 구경은 제대로 했다.', effect: { flags: ['yt_guild_peek'], stats: { cha: -1 } } } },
      { label: '창밖에서 지켜본다', success: { text: '게시판에 붙은 의뢰서를 베껴 적었다. 언젠가 저 안에 서 있겠다고 마음먹었다.', effect: { flags: ['yt_guild_peek'], stats: { int: 1 } } } },
    ],
  },
  {
    id: 'y_guild_errand', title: '길드의 심부름', weight: 4, focus: 'explore',
    cond: { minAge: 14, maxAge: 17, flags: ['yt_guild_peek'] },
    text: '길드의 접수원이 당신을 알아봤다. "마침 잘 왔다. 이 약초 꾸러미, 숲 오두막까지 좀 전해 줄래?"',
    choices: [
      { label: '지름길로 서둘러 간다', check: { stat: 'vit', dc: 24 },
        success: { text: '해 지기 전에 도착했다. 오두막 노인이 고마워하며 은화를 건넸다.', effect: { unflags: ['yt_guild_peek'], gold: 35, stats: { vit: 1, fame: 2 } }, tone: 'good' },
        fail: { text: '지름길에서 길을 잃어 한밤중에야 도착했다. 노인은 웃으며 따뜻한 차를 내주었다.', effect: { unflags: ['yt_guild_peek'], gold: 10, stats: { vit: -2 } } } },
      { label: '안전한 큰길로 간다', success: { text: '느리지만 틀림없이 전달했다. 접수원이 "믿음직하네" 하고 고개를 끄덕였다.', effect: { unflags: ['yt_guild_peek'], gold: 20, karma: 2, stats: { fame: 1 } } } },
    ],
  },

  // 공부·시험
  {
    id: 'y_study_group', title: '스터디 모임', weight: 2, focus: 'study',
    cond: { minAge: 13, maxAge: 17, notFlags: ['yt_study_mate'] },
    text: '글방 친구들이 시험 대비 모임을 만들었다. "같이 하면 능률이 오른대!"',
    choices: [
      { label: '함께 공부한다', success: { text: '서로 모르는 부분을 가르쳐 주며 밤이 깊었다. 혼자였다면 어려웠을 문제도 풀렸다.', effect: { flags: ['yt_study_mate'], stats: { int: 2, cha: 1 } }, tone: 'good' } },
      { label: '독학이 낫다고 한다', success: { text: '혼자 책상에 앉으니 집중이 잘 되었다. 하지만 가끔은 말동무가 그립다.', effect: { stats: { int: 2 } } } },
    ],
  },
  {
    id: 'y_exam_pressure', title: '시험 전날 밤', weight: 4, focus: 'study',
    cond: { minAge: 13, maxAge: 17, flags: ['yt_study_mate'] },
    text: '내일이 시험이다. 스터디 친구들과 함께 마지막 정리를 하고 있는데 졸음이 쏟아진다.',
    choices: [
      { label: '밤을 새워 외운다', check: { stat: 'int', dc: 26 },
        success: { text: '새벽까지 쥐어짜 외운 것들이 시험장에서 쏙쏙 튀어나왔다! 합격점을 훌쩍 넘었다.', effect: { unflags: ['yt_study_mate'], stats: { int: 3, fame: 1 } }, tone: 'good' },
        fail: { text: '시험 중에 졸음이 쏟아져 답안지에 침을 흘렸다. 점수는 보잘것없었다.', effect: { unflags: ['yt_study_mate'], stats: { int: 1, vit: -2 } } } },
      { label: '일찍 자고 컨디션을 챙긴다', success: { text: '푹 자고 일어나 머리가 맑았다. 점수는 무난했고 기분은 상쾌했다.', effect: { unflags: ['yt_study_mate'], stats: { int: 1, vit: 1 } } } },
    ],
  },

  // 일상·소문·졸업
  {
    id: 'y_rainy_day', title: '비 오는 오후', weight: 1.5,
    cond: { minAge: 13, maxAge: 17 },
    text: '하루 종일 비가 내린다. 처마 끝에서 떨어지는 물방울 소리만 규칙적으로 울린다.',
    choices: [
      { label: '창가에서 멍하니 비를 본다', success: { text: '아무것도 하지 않는 시간이 의외로 마음을 가라앉혔다. 머릿속이 맑아졌다.', effect: { stress: -10, mood: 'calm' } } },
      { label: '빗속을 뛰어다닌다', success: { text: '온몸이 흠뻑 젖도록 웃으며 달렸다. 감기에 걸릴지도 모르지만 후회는 없다.', effect: { stats: { vit: 1 }, mood: 'joy' } } },
    ],
  },
  {
    id: 'y_diary', title: '비밀 일기장', weight: 1.5,
    cond: { minAge: 13, maxAge: 17 },
    text: '낡은 노트를 샀다. 첫 장을 펴자 하고 싶은 말이 줄줄이 떠오른다.',
    choices: [
      { label: '오늘 일을 솔직하게 적는다', success: { text: '적고 나니 마음이 가벼워졌다. 글에는 이상한 힘이 있다.', effect: { stats: { int: 1 }, stress: -8, mood: 'calm' } } },
      { label: '멋진 모험담을 지어낸다', check: { stat: 'int', dc: 22 },
        success: { text: '용사와 마왕과 숨겨진 비밀. 쓰다 보니 해가 졌고, 이야기의 주인공은 어딘가 낯익은 얼굴이었다.', effect: { stats: { int: 2, cha: 1 }, mood: 'joy' } },
        fail: { text: '설정이 너무 거창해서 3장 만에 막혔다. 노트는 서랍 속으로 들어갔다.', effect: { mood: 'gloom' } } },
    ],
  },
  {
    id: 'y_strange_rumor', title: '수상한 소문', weight: 2,
    cond: { minAge: 14, maxAge: 17, notFlags: ['yt_odd_rumor'] },
    text: '요즘 숲길에 낯선 마차가 밤마다 지나간다는 소문이 돌고 있다. 어른들은 입을 다문다.',
    choices: [
      { label: '몰래 살펴본다', check: { stat: 'luck', dc: 24 },
        success: { text: '덤불 속에서 숨죽이고 있자 정말 마차가 지나갔다. 수레 위의 상자에서 낯선 문양이 보였다.', effect: { flags: ['yt_odd_rumor'], stats: { luck: 1, int: 1 } } },
        fail: { text: '발소리가 너무 컸는지 마부가 이쪽을 돌아보았다. 서둘러 도망쳤다.', effect: { flags: ['yt_odd_rumor'], stats: { vit: -1 }, mood: 'fear' } } },
      { label: '어른들에게 알린다', success: { text: '어른들은 "신경 쓰지 말거라"라고 했지만, 표정이 심상치 않았다. 뭔가 있긴 있나 보다.', effect: { flags: ['yt_odd_rumor'], karma: 2 } } },
    ],
  },
  {
    id: 'y_rumor_truth', title: '소문의 정체', weight: 4,
    cond: { minAge: 14, maxAge: 17, flags: ['yt_odd_rumor'] },
    text: '며칠 뒤 마을 어귀에 붙은 공고문을 읽고서야 알았다. 밤마다 지나가던 마차의 정체가 밝혀졌다.',
    choices: [
      { label: '공고문을 끝까지 읽는다', success: { text: '상단이 야간 운송을 시작했다는 평범한 이야기였다. 괜히 긴장했나 싶어 피식 웃음이 나왔다.', effect: { unflags: ['yt_odd_rumor'], stats: { int: 1 }, mood: 'calm' } } },
      { label: '상단을 찾아가 말을 걸어 본다', check: { stat: 'cha', dc: 24 },
        success: { text: '상단 사람들이 의외로 친절했다. 먼 도시 이야기를 한 아름 들었고 작은 선물까지 받았다.', effect: { unflags: ['yt_odd_rumor'], gold: 15, stats: { cha: 2, fame: 1 } }, tone: 'good' },
        fail: { text: '경계하는 눈초리에 한 마디도 못 하고 돌아섰다. 소문은 소문일 뿐이었다.', effect: { unflags: ['yt_odd_rumor'], stats: { cha: -1 } } } },
    ],
  },
  {
    id: 'y_graduation_eve', title: '떠날 날이 다가온다', weight: 2,
    cond: { minAge: 16, maxAge: 17 },
    text: '어릴 때 뛰놀던 마을 풍경이 이제는 좁게 느껴진다. 짐 보따리를 싸면서 문득 발걸음이 멈췄다.',
    choices: [
      { label: '마을을 한 바퀴 돌며 인사한다', success: { text: '정든 얼굴들이 하나하나 손을 흔들어 주었다. 돌아올 곳이 있다는 건 든든한 일이다.', effect: { stats: { cha: 2, luck: 1 }, karma: 3, mood: 'calm' }, tone: 'good' } },
      { label: '새벽에 조용히 길을 나선다', check: { stat: 'vit', dc: 24 },
        success: { text: '고요한 새벽 공기 속을 홀로 걸었다. 어깨에 얹힌 해가 길을 비추었다. 이상하게 두렵지 않았다.', effect: { stats: { vit: 2, int: 1 }, mood: 'joy' } },
        fail: { text: '어둠 속에서 길을 헛디뎌 발목을 접질렸다. 결국 집으로 되돌아와 어머니의 잔소리를 들었다.', effect: { stats: { vit: -3 }, mood: 'gloom' } } },
    ],
  },
];
