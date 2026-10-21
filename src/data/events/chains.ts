import type { GameEvent } from '../../types';

/**
 * 사건 사슬: 한 번의 선택이 플래그로 남고, 그 플래그가 다음 사건을 연다.
 * 줄기(첫 사건) → 가지(선택) → 결과(후속 사건)가 이어지도록, 모든 플래그는 어딘가에서 다시 읽힌다.
 * (tests/chains.test.ts 가 읽히지 않는 플래그가 없는지 검사한다)
 */
export const CHAIN_EVENTS: GameEvent[] = [
  // ═════ 용사 파티 (a_hero_party_invite → 첫 임무 → 모닥불 → 던전 원정 → 누명 / 마왕성) ═════
  {
    id: 'hp_first_quest', title: '파티의 첫 임무', once: true, weight: 7,
    cond: { flags: ['hero_party'] },
    text: '용사 아르센이 지도를 펼쳤다. "첫 임무다! 국경의 고블린 왕을 쓰러뜨린다." 성녀 세실과 마법사 리리가 당신을 바라본다.',
    choices: [
      { label: '앞장서서 싸운다', check: { stat: 'vit', dc: 112 },
        success: { text: '고블린 왕의 목을 베었다! 아르센이 등을 두드렸다. "역시 내 눈은 틀리지 않았어!"', effect: { flags: ['hp_q1', 'hp_trust'], stats: { fame: 17 }, gold: 300 }, tone: 'good' },
        fail: { text: '고블린 왕의 몽둥이에 나가떨어졌다. 리리가 혀를 찼다. "생각보다 별로네?"', effect: { flags: ['hp_q1', 'hp_doubt'], stats: { vit: -28 } } } },
      { label: '뒤에서 작전을 짠다', check: { stat: 'int', dc: 90 },
        success: { text: '함정 작전이 완벽하게 들어맞았다! 리리가 처음으로 웃었다. "머리 좋네, 너."', effect: { flags: ['hp_q1', 'hp_trust'], stats: { int: 6 } }, tone: 'good' },
        fail: { text: '작전이 꼬였다. 결국 아르센이 혼자 다 해치웠다.', effect: { flags: ['hp_q1', 'hp_doubt'] } } },
    ],
  },
  {
    id: 'hp_campfire', title: '모닥불', once: true, weight: 7,
    cond: { flags: ['hero_party', 'hp_q1'] },
    text: '야영지의 밤. 다들 잠든 줄 알았는데, 성녀 세실이 모닥불에 무언가를 몰래 태우고 있다.',
    choices: [
      { label: '몰래 지켜본다', check: { stat: 'int', dc: 101 },
        success: { text: '타다 남은 편지 조각을 주웠다. 이웃 왕국의 문장… 「공주를 제거하라」? 세실은 첩자다!', effect: { flags: ['hp_camp', 'hp_suspect'] }, tone: 'milestone' },
        fail: { text: '발소리에 세실이 돌아봤다. "잠이 안 와요? 차 한 잔 하실래요?" 미소가 차갑다.', effect: { flags: ['hp_camp'], stress: 10, mood: 'fear' } } },
      { label: '아르센과 이야기한다',
        success: { text: '용사도 사실 무섭다고 했다. 둘은 별을 보며 밤새 이야기했다. 진짜 동료가 된 기분이다.', effect: { flags: ['hp_camp', 'hp_trust'], will: 10, stats: { cha: 6 } }, tone: 'good' } },
      { label: '일찍 잔다', success: { text: '피곤했다. 내일도 강행군이다.', effect: { flags: ['hp_camp'], stress: -5 } } },
    ],
  },
  {
    id: 'hp_dungeon_raid', title: '파티 던전 원정', once: true, weight: 6,
    cond: { flags: ['hero_party', 'hp_q1'], minAge: 19 },
    text: '파티가 고대 던전에 들어섰다. 최하층에 전설의 보물이 잠들어 있다고 한다.',
    choices: [
      { label: '최하층까지 밀어붙인다', check: { stat: 'vit', dc: 129 },
        success: { text: '보물고의 문이 열렸다! 금화가 산더미다. 아르센이 당신 몫을 두둑이 챙겨주었다.', effect: { flags: ['hp_raid', 'treasure'], gold: 1500, stats: { fame: 11 }, trinket: { rarity: 'epic' } }, tone: 'good' },
        fail: { text: '함정에 걸려 크게 다쳤다. 동료들이 당신을 업고 나왔다.', effect: { flags: ['hp_raid'], stats: { vit: -42 } } } },
      { label: '전리품을 동료에게 양보한다',
        success: { text: '"너 같은 녀석은 처음이야." 아르센이 당신을 다시 봤다.', effect: { flags: ['hp_raid', 'hp_trust'], karma: 6 } } },
    ],
  },
  {
    id: 'hp_exiled', title: '파티 추방', once: true, weight: 7,
    cond: { flags: ['hero_party', 'hp_doubt', 'hp_camp'], notFlags: ['hp_trust'] },
    text: '아르센이 눈을 피하며 말했다. "미안. 넌 우리 파티에 안 맞는 것 같아." 리리가 짐을 문밖에 내던졌다.',
    choices: [
      { label: '혼자의 길을 간다', success: { text: '추방당한 그날 밤, 숨겨져 있던 힘이 깨어났다. 이건 그 유명한… 추방 후 각성 루트?!', effect: { unflags: ['hero_party'], stats: { vit: 22, mana: 22 }, will: 20, mood: 'anger' }, tone: 'milestone' } },
      { label: '매달린다', check: { stat: 'cha', dc: 112 },
        success: { text: '"한 번만 더 기회를 줘!" 아르센이 고개를 끄덕였다.', effect: { flags: ['hp_trust'] }, tone: 'good' },
        fail: { text: '문이 닫혔다. 비참하다.', effect: { unflags: ['hero_party'], stress: 20, mood: 'gloom' } } },
    ],
  },
  {
    id: 'hp_final_march', title: '마왕성 진격', once: true, weight: 6,
    cond: { flags: ['hero_party', 'hp_raid', 'hp_trust'], minAge: 22 },
    text: '드디어 마왕성이다. 아르센이 성검을 높이 들었다. "모두, 끝내러 가자!"',
    choices: [
      { label: '선봉에 선다', check: { stat: 'vit', dc: 157 },
        success: { text: '용사의 성검과 당신의 일격이 동시에 꽂혔다. 마왕이 무너진다! 세계가 환호한다!', effect: { flags: ['slew_demon_lord', 'hp_victory'], unflags: ['hero_party'], stats: { fame: 70 }, gold: 5000, karma: 10 }, tone: 'milestone' },
        fail: { text: '마왕의 일격이 당신을 꿰뚫었다. 마지막으로 들린 건 아르센의 외침이었다.', effect: { death: 'war' } } },
      { label: '마지막 순간 등을 돌린다', will: 20,
        success: { text: '성문 앞에서 돌아섰다. 등 뒤로 아르센의 목소리가 들렸다. "…배신자!"', effect: { flags: ['hp_betrayer'], unflags: ['hero_party'], karma: -20, stats: { fame: -28 } } } },
    ],
  },
  {
    id: 'hp_victory_feast', title: '개선 축제', once: true, weight: 8,
    cond: { flags: ['hp_victory'] },
    text: '왕도가 꽃으로 뒤덮였다. 국왕이 당신을 불렀다. "용사의 동료여, 원하는 것을 말하라."',
    choices: [
      { label: '작위와 영지를 받는다', success: { text: '오늘부터 당신은 귀족이다! 성 하나가 통째로 내 것이 됐다.', effect: { flags: ['noble_title'], own: 'castle', stats: { fame: 28 } }, tone: 'milestone' } },
      { label: '아르센과 다시 모험을 떠난다', success: { text: '"마왕이 없어도 세상은 넓잖아!" 둘은 새 지도를 펼쳤다.', effect: { stats: { luck: 22 }, mood: 'joy', will: 20 }, tone: 'good' } },
    ],
  },
  {
    id: 'hp_cleared_reward', title: '진실의 대가', once: true, weight: 8,
    cond: { flags: ['hp_cleared'] },
    text: '세실의 정체가 밝혀지자 왕궁이 뒤집혔다. 공주가 직접 당신을 찾아왔다. "당신이 저를 구했군요."',
    choices: [
      { label: '왕실 기사가 된다', success: { text: '공주의 호위 기사로 임명되었다! 반짝이는 문장이 가슴에 달렸다.', effect: { job: 'knight', jobRank: 1, stats: { fame: 22 } }, tone: 'milestone' } },
      { label: '사례금을 받고 떠난다', success: { text: '묵직한 금화 주머니를 받았다. 왕궁의 암투는 이제 질렸다.', effect: { gold: 3000 } } },
    ],
  },
  {
    id: 'hp_hunted', title: '배신자 사냥', once: true, weight: 6,
    cond: { flags: ['hp_betrayer'] },
    text: '비 오는 밤, 문 앞에 아르센이 서 있다. 성검이 젖어 빛난다. "왜 그랬어. 대답해."',
    choices: [
      { label: '검을 뽑는다', check: { stat: 'vit', dc: 162 },
        success: { text: '용사를 쓰러뜨렸다. 이겼는데도… 가슴이 텅 빈 것 같다.', effect: { flags: ['hero_slain'], karma: -15, stats: { fame: 28 } } },
        fail: { text: '성검이 당신을 꿰뚫었다. 아르센이 울고 있었다.', effect: { death: 'duel' } } },
      { label: '진심으로 사과한다', check: { stat: 'cha', dc: 126 },
        success: { text: '아르센이 한참을 서 있다가 검을 거뒀다. "…다음엔 같이 끝까지 가자."', effect: { karma: 15, unflags: ['hp_betrayer'], will: 15 }, tone: 'good' },
        fail: { text: '"이제 와서?" 아르센은 등을 돌렸다. 용서받지 못했다.', effect: { stress: 25, mood: 'gloom' } } },
    ],
  },
  {
    id: 'hp_second_call', title: '다시 찾아온 용사', once: true, weight: 4,
    cond: { flags: ['hp_declined'], minAge: 24, stats: { fame: 70 }, notFlags: ['hero_party'] },
    text: '몇 년 전 거절했던 용사 아르센이 다시 찾아왔다. 망토가 해졌다. "아직도 네가 필요해."',
    choices: [
      { label: '이번엔 함께한다', success: { text: '"늦어서 미안." 이번엔 손을 잡았다.', effect: { flags: ['hero_party'], unflags: ['hp_declined'], stats: { fame: 14 } }, tone: 'good' } },
      { label: '그래도 거절한다', success: { text: '아르센은 웃으며 떠났다. 몇 달 뒤, 용사 파티가 크게 다쳤다는 소식이 들려왔다.', effect: { unflags: ['hp_declined'], stress: 10 } } },
    ],
  },

  // ═════ 성검을 거부한 용사의 핏줄 ═════
  {
    id: 'sword_crisis', title: '다시 우는 성검', once: true, weight: 6,
    cond: { flags: ['hero_refused'], minAge: 26, maxAge: 44 },
    text: '마왕군이 고향을 덮쳤다. 잠가두었던 지하실에서, 성검이 마지막으로 울고 있다.',
    choices: [
      { label: '이번엔 성검을 뽑는다', check: { stat: 'vit', dc: 84 },
        success: { text: '오랜 세월을 돌아 드디어 손에 쥐었다. 늦게 핀 용사의 이야기가 시작된다!', effect: { job: 'hero', flags: ['hero_awakened'], unflags: ['hero_refused'], stats: { fame: 42 } }, tone: 'milestone' },
        fail: { text: '성검은 이제 대답하지 않는다. 너무 늦었던 걸까.', effect: { flags: ['sword_given'] } } },
      { label: '끝까지 거부한다', success: { text: '그날 밤 성검이 사라졌다. 옆집 소년의 손에서 빛나고 있었다.', effect: { flags: ['sword_given'] } } },
    ],
  },
  {
    id: 'sword_new_bearer', title: '새 용사', once: true, weight: 6,
    cond: { flags: ['sword_given'] },
    text: '성검을 손에 넣은 옆집 소년이 찾아왔다. "{elder}… 아니, 선배! 검 쓰는 법 좀 알려주세요!"',
    choices: [
      { label: '가르친다', success: { text: '매일 아침 소년과 검을 맞댔다. 소년의 눈이 반짝인다.', effect: { flags: ['mentor_of_hero'], stats: { fame: 11, vit: 6 } }, tone: 'good' } },
      { label: '문을 닫는다', success: { text: '"내 일 아니야." 소년은 혼자 떠났다.', effect: { mood: 'gloom' } } },
    ],
  },
  {
    id: 'sword_bearer_return', title: '제자의 귀환', once: true, weight: 6,
    cond: { flags: ['mentor_of_hero'], minAge: 30 },
    text: '왕도에서 축포가 울렸다. 마왕을 쓰러뜨린 새 용사가, 개선 행진을 멈추고 당신에게 달려왔다.',
    auto: { success: { text: '"선배 덕분이에요!" 용사가 왕에게 받은 상금의 절반을 내밀었다. 사람들이 당신을 「용사의 스승」이라 부른다.', effect: { gold: 3000, stats: { fame: 34 } }, tone: 'milestone' } },
  },

  // ═════ 정략 약혼 (d_noble) ═════
  {
    id: 'betroth_meeting', title: '약혼자', once: true, weight: 7,
    cond: { flags: ['betrothed'], notRel: ['spouse'] },
    text: '정략 약혼 상대와의 첫 만남. 정원의 장미 사이로 낯선 얼굴이 고개를 숙인다.',
    choices: [
      { label: '마음을 열어본다', check: { stat: 'cha', dc: 84 },
        success: { text: '어색한 대화가 웃음으로 바뀌었다. 정략결혼이지만, 사랑이 될지도 모른다.', effect: { addRel: 'spouse', flags: ['arranged_love'] }, tone: 'good' },
        fail: { text: '대화가 이어지지 않았다. 차가운 결혼 생활이 기다리고 있다.', effect: { addRel: 'spouse', flags: ['cold_marriage'], rel: { spouse: -30 } } } },
      { label: '소꿉친구와 도망친다', cond: { hasRel: ['friend'] }, will: 25,
        success: { text: '혼례 전날 밤, {friend}의 손을 잡고 담을 넘었다! 대공가가 발칵 뒤집혔다.', effect: { promoteToSpouse: 'friend', flags: ['eloped'], unflags: ['betrothed'], stats: { fame: -22 } }, tone: 'milestone' } },
    ],
  },
  {
    id: 'arranged_child', title: '작은 기적', once: true, weight: 5,
    cond: { flags: ['arranged_love'], hasRel: ['spouse'], maxAge: 42 },
    text: '정략으로 시작한 결혼에, 어느새 진짜 사랑이 피었다. 그리고 오늘, 둘에게 반가운 소식이 찾아왔다.',
    auto: { success: { text: '아기가 태어났다! 대공가 전체가 축제 분위기다.', effect: { flags: ['has_child'], rel: { spouse: 15 }, mood: 'joy', stats: { fame: 8 } }, tone: 'milestone' } },
  },
  {
    id: 'cold_marriage_end', title: '차가운 결혼', once: true, weight: 5,
    cond: { flags: ['cold_marriage'], hasRel: ['spouse'] },
    text: '{spouse}에게는 사랑하는 사람이 따로 있었다. 오늘 그 사실을 털어놓았다.',
    choices: [
      { label: '놓아준다', success: { text: '"행복해." 이혼 서류에 서명했다. 이상하게 마음이 가볍다.', effect: { removeRel: ['spouse'], karma: 12, unflags: ['cold_marriage'], stress: -10 }, tone: 'good' } },
      { label: '체면을 지킨다', success: { text: '겉으로는 완벽한 부부. 속은 텅 빈 채로 세월이 흘렀다.', effect: { stress: 20, stats: { fame: 8 } } } },
    ],
  },
  {
    id: 'eloped_chase', title: '대공가의 추격대', once: true, weight: 6,
    cond: { flags: ['eloped'], hasRel: ['spouse'] },
    text: '대공가의 기사들이 국경까지 쫓아왔다. {spouse}의 손이 떨린다.',
    choices: [
      { label: '숲으로 숨는다', check: { stat: 'luck', dc: 106 },
        success: { text: '추격대를 따돌렸다! 작은 마을에서 둘만의 새 삶이 시작됐다.', effect: { rel: { spouse: 20 }, mood: 'joy', unflags: ['eloped'] }, tone: 'good' },
        fail: { text: '붙잡혀 가문으로 끌려왔다. 대공이 한숨을 쉬었다. "…결혼은 허락하마. 대신 유산은 없다."', effect: { goldPct: -0.7, unflags: ['eloped'] } } },
    ],
  },

  // ═════ 파산에서 재기까지 ═════
  {
    id: 'bankrupt_bottom', title: '바닥', once: true, weight: 6,
    cond: { flags: ['bankrupted'] },
    text: '빈털터리가 된 지 한 달. 빵 한 조각이 사치다. 그런데 누군가 문을 두드린다.',
    choices: [
      { label: '노점부터 다시 시작한다', success: { text: '헌 수레 하나로 장사를 시작했다. 바닥은 더 내려갈 데가 없다!', effect: { job: 'merchant', flags: ['comeback'], will: 15 } } },
      { label: '던전에서 한탕을 노린다', success: { text: '낡은 검 한 자루 들고 모험가 길드에 등록했다. 잃을 것도 없다!', effect: { job: 'adventurer', flags: ['comeback'] } } },
    ],
  },
  {
    id: 'bankrupt_comeback', title: '재기', once: true, weight: 6,
    cond: { flags: ['comeback'], goldMin: 2000 },
    text: '파산했던 그 사람이 다시 일어섰다는 소문이 돌았다. 옛 빚쟁이들이 슬금슬금 인사를 한다.',
    auto: { success: { text: '바닥을 친 사람은 강하다. 사람들이 당신을 「불사조」라 부른다.', effect: { stats: { fame: 28 }, unflags: ['bankrupted', 'comeback'], mood: 'joy' }, tone: 'milestone' } },
  },

  // ═════ 도망자 ═════
  {
    id: 'fugitive_bounty', title: '현상금 사냥꾼', once: true, weight: 5,
    cond: { flags: ['fugitive'] },
    text: '주점 문이 열리고 현상금 사냥꾼이 들어왔다. 손에 든 수배서에… 당신 얼굴이 있다.',
    choices: [
      { label: '맞서 싸운다', check: { stat: 'vit', dc: 118 },
        success: { text: '사냥꾼을 쓰러뜨리고 수배서를 불태웠다. 당분간은 안전하다.', effect: { stats: { fame: 6 } }, tone: 'good' },
        fail: { text: '두들겨 맞고 가진 돈을 빼앗겼다. 겨우 도망쳤다.', effect: { stats: { vit: -42 }, goldPct: -0.5 } } },
      { label: '뒷문으로 빠져나간다', check: { stat: 'luck', dc: 84 },
        success: { text: '그림자처럼 사라졌다.', effect: {} },
        fail: { text: '뒷문에도 사냥꾼의 동료가 있었다. 크게 다쳤다.', effect: { stats: { vit: -34 } } } },
    ],
  },
  {
    id: 'fugitive_choice', title: '쫓기는 삶', once: true, weight: 4,
    cond: { flags: ['fugitive'], minAge: 22 },
    text: '도망 다니는 것도 지쳤다. 이제 정해야 한다.',
    choices: [
      { label: '이름을 버리고 새로 산다', success: { text: '새 이름, 새 마을. 아무도 당신을 모른다. 명성도, 과거도 사라졌다.', effect: { stats: { fame: -56 }, unflags: ['fugitive'], flags: ['new_identity'], stress: -15 } } },
      { label: '돌아가서 결백을 증명한다', check: { stat: 'cha', dc: 134 },
        success: { text: '광장에서 진실을 외쳤다. 사람들이 당신을 믿어주었다! 이름을 되찾았다.', effect: { stats: { fame: 34 }, unflags: ['fugitive'] }, tone: 'milestone' },
        fail: { text: '아무도 믿어주지 않았다. 교수대로 끌려갔다.', effect: { death: 'gallows' } } },
    ],
  },
  {
    id: 'new_identity_past', title: '옛 이름', once: true, weight: 3,
    cond: { flags: ['new_identity'], minAge: 30 },
    text: '시장에서 누군가 당신의 옛 이름을 불렀다. 돌아보니, 오래전 헤어진 친구다.',
    choices: [
      { label: '모른 척한다', success: { text: '"사람을 잘못 보셨어요." 친구의 얼굴이 쓸쓸해졌다.', effect: { stress: 10 } } },
      { label: '끌어안는다', success: { text: '"살아 있었구나!" 둘은 한참을 울었다. 과거도 나쁘지만은 않았다.', effect: { mood: 'joy', will: 10, karma: 5 }, tone: 'good' } },
    ],
  },

  // ═════ 슬라임의 인간 흉내 ═════
  {
    id: 'slime_town', title: '인간 마을', once: true, weight: 6,
    cond: { flags: ['humanform'] },
    text: '인간 모습으로 마을에 내려왔다. 걸음걸이가 아직 좀… 출렁거린다.',
    choices: [
      { label: '빵집에서 일한다', success: { text: '반죽 솜씨가 기가 막히다! (몸이 말랑해서일까) 손님이 줄을 섰다.', effect: { flags: ['slime_baker'], gold: 300, stats: { cha: 8 } }, tone: 'good' },
      },
      { label: '모험가 행세를 한다', check: { stat: 'luck', dc: 84 },
        success: { text: '아무도 슬라임인 줄 모른다. 오히려 "탄력 있는 몸놀림"이라고 칭찬받았다.', effect: { job: 'adventurer', stats: { fame: 6 } } },
        fail: { text: '비 맞고 녹아내리는 걸 들켰다! 마을이 발칵 뒤집혔다.', effect: { stats: { fame: -14 }, unflags: ['humanform'], mood: 'fear' } } },
    ],
  },
  {
    id: 'slime_love', title: '말랑한 고백', once: true, weight: 5,
    cond: { flags: ['slime_baker'], notRel: ['spouse'] },
    text: '빵집 단골이 매일 같은 시간에 온다. 오늘은 빵 대신 꽃을 들고 왔다.',
    choices: [
      { label: '정체를 밝히고 고백을 받는다', check: { stat: 'cha', dc: 90 },
        success: { text: '"슬라임이어도 좋아요!" 이세계는 역시 관대하다. 결혼식 케이크는 당신이 구웠다.', effect: { addRel: 'spouse', mood: 'joy' }, tone: 'milestone' },
        fail: { text: '단골이 기절했다. …다음 날 다시 왔지만, 빵만 사 갔다.', effect: { stress: 10 } } },
      { label: '빵만 건넨다', success: { text: '이대로도 좋다. 빵 냄새 나는 평화로운 나날.', effect: { stress: -5 } } },
    ],
  },

  // ═════ 숲에서 주운 파란 돌 (c_forest) ═════
  {
    id: 'relic_glow', title: '파란 돌의 정령', once: true, weight: 5,
    cond: { flags: ['relic'], minAge: 15 },
    text: '어릴 때 숲에서 주운 파란 돌이 오늘 밤 빛나기 시작했다. 돌 속에서 작은 정령이 기지개를 켠다.',
    choices: [
      { label: '정령과 계약한다', success: { text: '"오래 기다렸어, 주인!" 정령이 어깨에 앉았다. 몸에 마력이 흐른다.', effect: { flags: ['relic_spirit'], stats: { mana: 22 } }, tone: 'milestone' } },
      { label: '골동품점에 판다', success: { text: '고대 정령석이었다! 상상도 못 한 값을 받았다.', effect: { gold: 1200, unflags: ['relic'] } } },
    ],
  },
  {
    id: 'relic_dungeon', title: '정령의 길잡이', once: true, weight: 6,
    cond: { flags: ['relic_spirit'], test: (s) => (s.dgBest ?? 0) >= 15 },
    text: '던전에서 돌아온 밤, 정령이 속삭였다. "그 던전, 내가 살던 곳이야. 숨겨진 방을 알아."',
    choices: [
      { label: '숨겨진 방으로 간다', success: { text: '정령이 벽을 통과하자 비밀 보물고가 열렸다! 고대 금화와 반짝이는 장신구가 가득하다.', effect: { gold: 2500, stats: { luck: 11 }, trinket: { stat: 'mana', rarity: 'epic' } }, tone: 'good' } },
      { label: '정령의 고향을 지켜준다', success: { text: '"고마워." 정령이 더 밝게 빛났다. 축복이 깃든다.', effect: { stats: { mana: 17, luck: 17 }, karma: 8 }, tone: 'good' } },
    ],
  },

  // ═════ 왕궁 보물고를 턴 괴도 ═════
  {
    id: 'royal_manhunt', title: '왕국 전역 수배', once: true, weight: 6,
    cond: { flags: ['royal_heist'] },
    text: '왕궁 보물고 사건 이후, 왕국 전체에 검문이 깔렸다. 근위대장이 직접 수사에 나섰다.',
    choices: [
      { label: '숨죽이고 버틴다', check: { stat: 'luck', dc: 134 },
        success: { text: '근위대장이 바로 옆을 지나갔지만 알아보지 못했다. 전설은 계속된다!', effect: { stats: { fame: 14 } }, tone: 'good' },
        fail: { text: '변장이 벗겨졌다! 근위대에 붙잡혔다.', effect: { caught: true } } },
      { label: '보물 일부를 고아원에 뿌린다', success: { text: '「의적」이라는 소문이 퍼졌다. 백성들이 오히려 당신을 숨겨주었다.', effect: { goldPct: -0.3, karma: 20, stats: { fame: 22 } }, tone: 'good' } },
    ],
  },
  {
    id: 'royal_princess', title: '{royal}의 부탁', once: true, weight: 5,
    cond: { flags: ['royal_heist'], notRel: ['spouse'] },
    text: '한밤중 은신처에 {royal:이} 나타났다. "당신이 그 괴도죠? 나도 이 답답한 성에서 훔쳐가 줘요!"',
    choices: [
      { label: '{royal:을} 훔쳐 간다', success: { text: '왕국 최고의 보물을 훔쳤다. 이번엔 마음까지.', effect: { addRel: 'spouse', stats: { fame: 28 }, flags: ['stole_princess'] }, tone: 'milestone' } },
      { label: '정중히 돌려보낸다', success: { text: '"언젠가 당신 스스로 걸어 나오세요." {royal:이} 눈을 반짝였다.', effect: { karma: 5 } } },
    ],
  },
  {
    id: 'princess_ransom', title: '국왕의 편지', once: true, weight: 5,
    cond: { flags: ['stole_princess'], hasRel: ['spouse'] },
    text: '국왕에게서 편지가 왔다. "{royalChild:이} 행복하다면… 돌아오라. {inlaw:으로} 맞겠다."',
    choices: [
      { label: '왕궁으로 돌아간다', success: { text: '괴도가 왕실의 {inlaw:이} 되었다! 이세계 역사상 가장 이상한 결혼식이었다.', effect: { flags: ['noble_title'], gold: 10000, stats: { fame: 42 } }, tone: 'milestone' } },
      { label: '자유롭게 산다', success: { text: '"우린 이대로가 좋아요." {spouse}가 편지를 접어 비행기를 날렸다.', effect: { mood: 'joy', will: 15 } } },
    ],
  },

  // ═════ 대신 맞아준 칼날 (x_blow_*) ═════
  {
    id: 'blow_repay', title: '목숨의 빚', once: true, weight: 6,
    cond: { flags: ['took_blow'] },
    text: '당신이 대신 칼을 맞아주었던 그 사람이, 오래 품고 있던 작은 부적을 건넸다.',
    auto: { success: { text: '"이번엔 내가 지킬 차례야." 부적에서 따뜻한 빛이 스며든다. (불굴 목숨 +1)', effect: { extraLives: 1, will: 15 }, tone: 'milestone' } },
  },

  // ═════ 용사를 쓰러뜨린 자 ═════
  {
    id: 'hero_slain_avenger', title: '복수자', once: true, weight: 5,
    cond: { flags: ['hero_slain'], minAge: 25 },
    text: '용사의 무덤 앞에서 소녀가 칼을 갈고 있었다. 용사의 여동생이다. "언젠가 당신을 벨 거예요."',
    choices: [
      { label: '검술을 가르쳐 준다', success: { text: '"…왜 저를 가르치죠?" "언젠가 정정당당하게 베러 와라." 소녀가 울면서 웃었다.', effect: { karma: 20, flags: ['taught_avenger'] }, tone: 'good' } },
      { label: '무시한다', success: { text: '소녀는 떠났다. 등 뒤가 서늘하다.', effect: { stress: 15 } } },
    ],
  },
  {
    id: 'avenger_duel', title: '정정당당한 결투', once: true, weight: 6,
    cond: { flags: ['taught_avenger'], minAge: 32 },
    text: '그 소녀가 어른이 되어 돌아왔다. 성검을 들고. "약속대로, 정정당당하게."',
    choices: [
      { label: '전력으로 맞선다', check: { stat: 'vit', dc: 154 },
        success: { text: '마지막 일격을 멈췄다. "…이제 됐다." 그녀가 검을 내렸다. 원한은 끝났다.', effect: { karma: 15, stats: { fame: 22 }, mood: 'calm' }, tone: 'milestone' },
        fail: { text: '제자의 검이 스승을 넘었다. 당신은 웃으며 쓰러졌다.', effect: { death: 'duel' } } },
      { label: '검을 내려놓는다', success: { text: '그녀는 끝내 베지 못했다. 둘은 함께 용사의 무덤에 꽃을 놓았다.', effect: { karma: 25, will: 20 }, tone: 'good' } },
    ],
  },

  // ═════ 상점에서 산 것들이 일으키는 일 ═════
  {
    id: 'own_housewarming', title: '집들이', once: true, weight: 4,
    cond: { owns: ['house'] },
    text: '드디어 내 집! 이웃들이 떡과 꽃을 들고 찾아왔다.',
    choices: [
      { label: '성대하게 집들이를 한다', success: { text: '밤새 웃음소리가 끊이지 않았다. 동네 인기인이 되었다.', effect: { gold: -200, stats: { cha: 11, fame: 6 }, rel: { friend: 10, spouse: 10 } }, tone: 'good' } },
      { label: '조용히 차만 대접한다', success: { text: '소박하지만 따뜻한 저녁이었다.', effect: { stress: -8 } } },
    ],
  },
  {
    id: 'own_horse_race', title: '왕도 경마 대회', once: true, weight: 4,
    cond: { owns: ['horse'], minAge: 16 },
    text: '왕도에서 경마 대회가 열린다! 우승 상금은 2,000G. 애마가 콧김을 뿜는다.',
    choices: [
      { label: '출전한다 (참가비 100G)', check: { stat: 'luck', dc: 112 },
        success: { text: '결승선을 1등으로 통과! 관중석이 들썩였다.', effect: { gold: 1900, stats: { fame: 14 } }, tone: 'good' },
        fail: { text: '마지막 코너에서 낙마했다. 참가비만 날렸다.', effect: { gold: -100, stats: { vit: -14 } } } },
      { label: '구경만 한다', success: { text: '군것질하며 응원했다. 이것도 즐겁다.', effect: { stress: -5 } } },
    ],
  },
  {
    id: 'own_cat_gift', title: '고양이의 선물', once: true, weight: 4,
    cond: { owns: ['cat'] },
    text: '고양이가 무언가를 물고 와 발치에 툭 떨어뜨렸다. 반짝인다?!',
    auto: { success: { text: '귀족 부인이 잃어버린 반지였다! 사례금을 받았다. 고양이는 츄르를 받았다.', effect: { gold: 500, mood: 'joy' }, tone: 'good' } },
  },
  {
    id: 'own_castle_siege', title: '성의 주인', once: true, weight: 4,
    cond: { owns: ['castle'] },
    text: '성을 가진 자에겐 적도 생기는 법. 이웃 영주가 군대를 끌고 성문 앞에 나타났다!',
    choices: [
      { label: '성벽 위에서 지휘한다', check: { stat: 'int', dc: 126 },
        success: { text: '공성전에서 대승! 이웃 영주가 무릎을 꿇고 영지 일부를 바쳤다.', effect: { gold: 8000, stats: { fame: 28 } }, tone: 'milestone' },
        fail: { text: '성문이 뚫려 보물고를 털렸다. 성은 지켰지만 금고가 비었다.', effect: { goldPct: -0.4 } } },
      { label: '협상한다', success: { text: '금화로 평화를 샀다. 돈으로 해결되는 건 싸게 먹힌 거다.', effect: { gold: -3000 } } },
    ],
  },

  // ═════ 던전 깊이가 여는 사건 ═════
  {
    id: 'guild_instructor', title: '길드의 초청', once: true, weight: 5,
    cond: { flags: ['depth_40'] },
    text: '40층 너머를 다녀온 당신에게 모험가 길드가 정중히 요청했다. "신입들에게 던전을 가르쳐 주시겠습니까?"',
    choices: [
      { label: '교관이 된다', success: { text: '신입들이 당신을 「선생님」이라 부른다. 보수도 짭짤하다.', effect: { gold: 1500, stats: { fame: 17, cha: 8 } }, tone: 'good' } },
      { label: '아직 현역이다', success: { text: '"가르치는 건 나중에. 아직 더 깊이 내려갈 거야."', effect: { will: 15 } } },
    ],
  },
  {
    id: 'abyss_voice', title: '심연의 목소리', once: true, weight: 5,
    cond: { flags: ['depth_60'] },
    text: '60층에서 돌아온 뒤로, 꿈속에서 누군가 부른다. "더 내려와라… 왕좌가 기다린다…"',
    choices: [
      { label: '목소리에 답한다', success: { text: '어둠의 마력이 몸에 스며든다. 강해졌지만… 눈빛이 조금 변했다.', effect: { stats: { mana: 28 }, karma: -10, flags: ['abyss_mark'] } } },
      { label: '신전에서 정화한다', success: { text: '사제의 기도로 목소리가 잦아들었다. 마음이 맑아진다.', effect: { gold: -300, karma: 5, stress: -15 } } },
    ],
  },
  {
    id: 'abyss_mark_throne', title: '마왕의 초대', once: true, weight: 6,
    cond: { flags: ['abyss_mark'], notFlags: ['dungeon_conquered'] },
    text: '심연의 표식이 타오른다. 마왕의 목소리가 직접 들려온다. "내 후계자가 되어라."',
    choices: [
      { label: '받아들인다', success: { text: '마왕군의 문이 열렸다. 오늘부터 당신은 마왕의 후계자다.', effect: { job: 'demon_officer', jobRank: 3, karma: -20 }, tone: 'milestone' } },
      { label: '거절하고 마왕을 쓰러뜨리기로 맹세한다', success: { text: '"네 왕좌는 내가 부수러 간다." 표식이 빛을 잃었다.', effect: { will: 30, unflags: ['abyss_mark'], stats: { vit: 14 } }, tone: 'good' } },
    ],
  },
  {
    id: 'peace_after_demon_lord', title: '마왕 없는 세상', once: true, weight: 7,
    cond: { flags: ['dungeon_conquered'] },
    text: '던전 100층의 마왕이 쓰러진 뒤, 세상이 조금 심심해졌다. 국왕이 당신을 왕궁으로 불렀다.',
    choices: [
      { label: '왕국의 수호자가 된다', success: { text: '전설의 영웅으로서 왕국을 지키기로 했다. 매년 막대한 연금이 나온다.', effect: { job: 'knight', jobRank: 5, gold: 20000 }, tone: 'milestone' } },
      { label: '시골로 은퇴한다', success: { text: '농지와 작은 집. 전설의 영웅은 이제 호박을 키운다.', effect: { job: 'farmer', own: 'land', stress: -40, mood: 'joy' }, tone: 'good' } },
    ],
  },

  // ═════ 라이벌과의 십 년 (소년기 맹세 → 성장 → 재회 → 결전) ═════
  {
    id: 'rv_oath', title: '십 년 뒤의 약속', once: true, weight: 3,
    cond: { minAge: 13, maxAge: 17, hasRel: ['rival'] },
    text: '노을 진 언덕에서 {rival:이} 목검 끝을 당신에게 겨눴다. "오늘은 무승부로 해 두지. 십 년 뒤, 이 자리에서 진짜 승부다!"',
    choices: [
      { label: '"좋아, 약속이다!"', success: { text: '서로 목검을 부딪쳐 약속을 새겼다. 어쩐지 십 년 뒤가 벌써 기다려진다.', effect: { flags: ['rv_oath'], rel: { rival: 8 }, stats: { vit: 3 }, mood: 'joy' }, tone: 'good' } },
      { label: '"그때까지 기억하면"', success: { text: '{rival:은} 코웃음을 쳤지만 목검을 거두며 슬쩍 웃었다. 잊지 못할 것 같은 얼굴이다.', effect: { flags: ['rv_oath'], stats: { luck: 3 } } } },
      { label: '대답 없이 돌아선다', success: { text: '"도망치는 거냐!" {rival:의} 목소리가 노을 속에 울렸다. 이상하게 귀에 오래 남았다.', effect: { rel: { rival: -8 }, stats: { cha: 3 } } } },
    ],
  },
  {
    id: 'rv_rising', title: '들려오는 라이벌의 소문', once: true, weight: 6,
    cond: { minAge: 19, maxAge: 32, hasRel: ['rival'], flags: ['rv_oath'] },
    text: '장터에서 {rival:의} 소문이 들려온다. 요즘 눈에 띄게 이름을 날리고 있다고 한다. 가슴 한구석이 뜨끔하다.',
    choices: [
      { label: '지지 않으려 수련에 매달린다', check: { stat: 'vit', dc: 90 },
        success: { text: '매일 새벽 땀을 쏟았다. 몸이 눈에 띄게 달라졌다. 십 년의 약속은 반드시 지킨다.', effect: { flags: ['rv_rising'], stats: { vit: 8, mana: 6 } }, tone: 'good' },
        fail: { text: '무리하다 몸살이 났다. 그래도 {rival:에게} 질 수는 없다는 오기는 더 단단해졌다.', effect: { flags: ['rv_rising'], stats: { vit: -6, mana: 3 }, will: 5 } } },
      { label: '정보를 모아 약점을 분석한다', check: { stat: 'int', dc: 90 },
        success: { text: '{rival:의} 싸움 습관을 낱낱이 파악했다. 승부는 머리로 하는 거다.', effect: { flags: ['rv_rising'], stats: { int: 8, luck: 3 } }, tone: 'good' },
        fail: { text: '정보가 잔뜩 모였지만 서로 앞뒤가 맞지 않았다. 결국 직접 겨뤄 보는 수밖에 없다.', effect: { flags: ['rv_rising'], stats: { int: 3 } } } },
    ],
  },
  {
    id: 'rv_reunion', title: '길 위의 재회', once: true, weight: 6,
    cond: { minAge: 22, maxAge: 40, hasRel: ['rival'], flags: ['rv_rising'] },
    text: '낯선 마을의 주점 문을 열자, 구석 자리에서 {rival:이} 술잔을 기울이고 있었다. 눈이 마주치자 입꼬리가 올라갔다.',
    choices: [
      { label: '합석해서 술잔을 부딪친다', success: { text: '서로의 십 년을 안주 삼아 밤새 떠들었다. "약속의 날, 잊지 마라." {rival:이} 먼저 일어섰다.', effect: { flags: ['rv_final'], rel: { rival: 12 }, stats: { cha: 3 }, mood: 'joy' }, tone: 'good' } },
      { label: '눈인사만 하고 지나친다', success: { text: '"…기억하고 있었군." {rival:의} 중얼거림이 등 뒤로 들렸다. 굳이 말하지 않아도 알고 있다. 때가 되면 만날 것이다.', effect: { flags: ['rv_final'], stats: { luck: 3 } } } },
    ],
  },
  {
    id: 'rv_showdown', title: '십 년 만의 승부', once: true, weight: 7,
    cond: { minAge: 25, maxAge: 43, hasRel: ['rival'], flags: ['rv_final'] },
    text: '그 언덕에 다시 섰다. 노을도, 바람도 그날 그대로다. 맞은편에서 {rival:이} 목검 대신 진짜 검을 뽑았다. "자, 약속을 지킬 시간이다."',
    choices: [
      { label: '검으로 정면승부', check: { stat: 'vit', dc: 101 },
        success: { text: '마지막 일합에 승부가 갈렸다. 쓰러진 {rival:이} 하늘을 보며 웃었다. "…십 년 걸려서 졌네."', effect: { unflags: ['rv_oath', 'rv_rising', 'rv_final'], rel: { rival: 25 }, stats: { fame: 17, vit: 6 } }, tone: 'milestone' },
        fail: { text: '검이 허공을 날았다. 졌다. 그런데 {rival:이} 손을 내밀었다. "십 년 만에 이 정도라니, 다음 십 년이 기대되는데?"', effect: { unflags: ['rv_oath', 'rv_rising', 'rv_final'], rel: { rival: 15 }, stats: { vit: -14, fame: 6 }, will: 5 } } },
      { label: '마법으로 승부', check: { stat: 'mana', dc: 101 },
        success: { text: '언덕 위로 빛의 폭풍이 일었다. 먼지가 가라앉자 {rival:이} 검을 거두고 박수를 쳤다. "인정한다."', effect: { unflags: ['rv_oath', 'rv_rising', 'rv_final'], rel: { rival: 25 }, stats: { fame: 17, mana: 6 } }, tone: 'milestone' },
        fail: { text: '마력이 빗나가 언덕 한쪽이 움푹 파였다. {rival:이} 배를 잡고 웃었다. "여전하군!"', effect: { unflags: ['rv_oath', 'rv_rising', 'rv_final'], rel: { rival: 15 }, stats: { mana: -6, fame: 6 } } } },
      { label: '검을 내려놓고 악수를 청한다', success: { text: '"승부는 이미 십 년 동안 했잖아." {rival:은} 한참 침묵하다 손을 맞잡았다. 두 사람은 해가 질 때까지 언덕에서 나란히 앉아 있었다.', effect: { unflags: ['rv_oath', 'rv_rising', 'rv_final'], rel: { rival: 20 }, karma: 5, stats: { cha: 6 } }, tone: 'good' } },
    ],
  },

  // ═════ 마을 열병과 약초꾼 (구한 노파 → 번지는 열병 → 월광초 → 감사) ═════
  {
    id: 'herb_granny', title: '쓰러진 약초꾼', once: true, weight: 3,
    cond: { minAge: 12, maxAge: 47 },
    text: '숲길에서 약초 바구니를 안은 노파가 주저앉아 있다. 발목이 퉁퉁 부었다. "아이고… 이 늙은이를 좀 부축해 주겠나?"',
    choices: [
      { label: '업고 마을까지 간다', check: { stat: 'vit', dc: 73 },
        success: { text: '땀을 뻘뻘 흘리며 노파를 업어 날랐다. 노파가 등 뒤에서 껄껄 웃었다. "튼튼한 놈이구먼!"', effect: { flags: ['herb_granny'], karma: 5, stats: { vit: 3 } }, tone: 'good' },
        fail: { text: '비틀거리다 둘이 함께 진흙탕에 쓰러졌다. 노파는 깔깔 웃으며 약초 반죽을 발라 주었다.', effect: { flags: ['herb_granny'], karma: 3, stats: { vit: -3 } } } },
      { label: '근처 마을에 알린다', success: { text: '달려가 어른들을 데려왔다. 노파는 고맙다며 말린 약초 한 줌을 쥐여 주었다.', effect: { flags: ['herb_granny'], karma: 2, stats: { int: 3 } } } },
      { label: '바쁘다며 지나친다', success: { text: '길을 서두르는 사이 노파의 한숨이 등에 걸렸다. 마음 한구석이 무겁다.', effect: { karma: -5 } } },
    ],
  },
  {
    id: 'herb_fever', title: '마을에 번진 열병', once: true, weight: 6,
    cond: { minAge: 12, maxAge: 50, flags: ['herb_granny'] },
    text: '며칠 뒤, 마을 사람들이 줄줄이 열병에 쓰러졌다. 약초꾼 노파가 병상을 둘러보며 중얼거렸다. "월광초가 있어야 해… 절벽 위에 딱 한 군데 피는데."',
    choices: [
      { label: '내가 가져오겠다고 나선다', success: { text: '"맡겨 주세요!" 노파가 지도를 그려 주었다. 오늘 밤 보름달이 뜬다.', effect: { flags: ['herb_need'], stats: { vit: 3 }, karma: 3 }, tone: 'good' } },
      { label: '다른 약재를 구해 와 달라고 한다', success: { text: '시장을 뒤졌지만 구한 건 해열초뿐이었다. 효과는 있었지만 월광초를 대신하긴 어렵다.', effect: { flags: ['herb_need'], gold: -20 } } },
    ],
  },
  {
    id: 'herb_cliff', title: '절벽 위의 월광초', once: true, weight: 8, focus: 'explore',
    cond: { minAge: 12, maxAge: 50, flags: ['herb_need'] },
    text: '보름달 밤, 절벽 끝에 은빛 꽃이 반짝인다. 바람이 거세다. 한 발만 더 내딛으면 닿을 것 같은데.',
    choices: [
      { label: '밧줄을 묶고 내려간다', check: { stat: 'vit', dc: 84 },
        success: { text: '손끝에 닿은 꽃잎이 따뜻했다. 한 아름 꺾어 안고 무사히 올라왔다!', effect: { flags: ['herb_cure'], unflags: ['herb_need'], stats: { vit: 6, fame: 6 } }, tone: 'good' },
        fail: { text: '밧줄이 풀려 중간에 미끄러졌다. 멍투성이로 올라왔지만 꽃 몇 송이는 쥐고 있었다.', effect: { flags: ['herb_cure'], unflags: ['herb_need'], stats: { vit: -17 } } } },
      { label: '운에 맡기고 가까운 곳을 뒤진다', check: { stat: 'luck', dc: 78 },
        success: { text: '바위 틈에 숨은 월광초 군락을 발견했다! 달빛 아래 은빛으로 빛났다.', effect: { flags: ['herb_cure'], unflags: ['herb_need'], stats: { luck: 6, fame: 3 } }, tone: 'good' },
        fail: { text: '밤새 뒤졌지만 풀뿌리뿐이었다. 해가 뜰 때까지 숨을 몰아쉬다 빈손으로 돌아왔다.', effect: { stats: { vit: -6 }, mood: 'gloom' } } },
    ],
  },
  {
    id: 'herb_thanks', title: '약초꾼의 선물', once: true, weight: 8,
    cond: { minAge: 12, maxAge: 50, flags: ['herb_cure'] },
    text: '월광초 달인 약을 마신 마을 사람들이 하나둘 자리에서 일어났다. 약초꾼 노파가 당신을 불러 세웠다.',
    choices: [
      { label: '약초 달이는 법을 배운다', success: { text: '"눈썰미가 좋구먼." 노파가 비법서를 건넸다. 약초 냄새가 옷에 배었다.', effect: { unflags: ['herb_granny', 'herb_cure'], stats: { int: 8, vit: 3 }, karma: 4 }, tone: 'good' } },
      { label: '사례금을 받는다', success: { text: '마을 사람들이 십시일반 모은 은화 주머니가 당신 손에 쥐여졌다. 박수가 쏟아졌다.', effect: { unflags: ['herb_granny', 'herb_cure'], gold: 150, stats: { fame: 11 } }, tone: 'good' } },
      { label: '사양하고 조용히 돌아간다', success: { text: '"할 일을 했을 뿐이에요." 노파가 빙긋 웃으며 주머니에 약초 한 줌을 몰래 넣어 주었다.', effect: { unflags: ['herb_granny', 'herb_cure'], karma: 8, stats: { luck: 6 } } } },
    ],
  },

  // ═════ 옛 스승의 마지막 제자 (길 위의 노인 → 수련 → 시험 → 유산) ═════
  {
    id: 'sensei_roadside', title: '길가의 노인', once: true, weight: 3,
    cond: { minAge: 14, maxAge: 40, notRel: ['mentor'] },
    text: '나무 그늘에서 나이 든 방랑자가 막대기 하나로 땅에 묘한 문양을 그리고 있다. 눈이 마주치자 노인이 씩 웃었다. "자네, 재목이로군."',
    choices: [
      { label: '가르침을 청한다', success: { text: '"허허, 이 나이에 제자를 두게 될 줄은." 노인은 막대기를 건네며 스승이 되기로 했다.', effect: { addRel: 'mentor', flags: ['sensei_taught'], stats: { int: 3 } }, tone: 'good' } },
      { label: '문양에 대해 물어본다', check: { stat: 'int', dc: 73 },
        success: { text: '노인이 눈을 크게 떴다. "그걸 알아보다니!" 곧바로 수업이 시작되었다.', effect: { addRel: 'mentor', flags: ['sensei_taught'], stats: { int: 6 } }, tone: 'good' },
        fail: { text: '엉뚱한 대답을 했지만 노인은 껄껄 웃으며 수염을 쓰다듬었다. "그래도 용기는 가상하군."', effect: { addRel: 'mentor', flags: ['sensei_taught'] } } },
      { label: '목례만 하고 지나간다', success: { text: '노인은 아무 말 없이 다시 땅에 문양을 그렸다. 인연이 닿지 않은 것뿐이다.', effect: { stats: { luck: 3 } } } },
    ],
  },
  {
    id: 'sensei_training', title: '스승의 수련', once: true, weight: 6,
    cond: { minAge: 14, maxAge: 44, hasRel: ['mentor'], flags: ['sensei_taught'] },
    text: '{mentor:은} 잔소리 하나 없이 하루 종일 같은 동작만 시켰다. 사흘째, 팔은 후들거리고 머릿속은 하얘졌다.',
    choices: [
      { label: '입 다물고 끝까지 따른다', check: { stat: 'vit', dc: 78 },
        success: { text: '나흘째 새벽, 동작이 몸에 스며든 것을 느꼈다. {mentor:이} 말없이 고개를 끄덕였다.', effect: { flags: ['sensei_ready'], rel: { mentor: 15 }, stats: { vit: 8 } }, tone: 'good' },
        fail: { text: '중간에 팔이 풀려 주저앉았다. {mentor:은} 혀를 차면서도 물 한 바가지를 건넸다. "내일 다시."', effect: { rel: { mentor: 5 }, stats: { vit: 3 }, will: 3 } } },
      { label: '왜 이 동작인지 묻는다', check: { stat: 'int', dc: 78 },
        success: { text: '"그걸 묻는 자는 드물지." {mentor:이} 원리를 하나하나 풀어 주었다. 동작이 의미를 갖자 몸이 달라졌다.', effect: { flags: ['sensei_ready'], rel: { mentor: 12 }, stats: { int: 8 } }, tone: 'good' },
        fail: { text: '"묻기 전에 몸이 알게 하게." 호통과 함께 다시 동작을 반복했다.', effect: { rel: { mentor: 3 }, stats: { int: 3 } } } },
    ],
  },
  {
    id: 'sensei_trial', title: '스승의 시험', once: true, weight: 7,
    cond: { minAge: 15, maxAge: 45, hasRel: ['mentor'], flags: ['sensei_ready'] },
    text: '{mentor:이} 낡은 나무 막대기를 하나 던졌다. "마지막 시험일세. 이 막대로 저 바위를 갈라 보게."',
    choices: [
      { label: '숨을 고르고 힘을 모은다', check: { stat: 'vit', dc: 90 },
        success: { text: '막대가 바위에 닿는 순간, 소리 없이 바위가 둘로 갈라졌다! {mentor:이} 이를 드러내며 활짝 웃었다.', effect: { flags: ['sensei_heir'], unflags: ['sensei_ready'], stats: { vit: 8, fame: 6 } }, tone: 'milestone' },
        fail: { text: '막대만 부러졌다. {mentor:이} 박장대소했다. "부러진 막대로도 한번 해 보겠나?"', effect: { unflags: ['sensei_ready'], flags: ['sensei_taught'], stats: { vit: -6 } } } },
      { label: '바위의 결을 읽는다', check: { stat: 'int', dc: 90 },
        success: { text: '바위에 난 가는 금을 따라 가볍게 막대를 얹었다. 바위가 스르륵 갈라졌다. {mentor:이} 눈을 크게 떴다.', effect: { flags: ['sensei_heir'], unflags: ['sensei_ready'], stats: { int: 8, fame: 6 } }, tone: 'milestone' },
        fail: { text: '결을 잘못 읽어 막대가 튕겨 나왔다. 이마에 혹이 하나 났다. 처음부터 다시.', effect: { unflags: ['sensei_ready'], flags: ['sensei_taught'], stats: { int: 3, vit: -3 } } } },
    ],
  },
  {
    id: 'sensei_legacy', title: '마지막 가르침', once: true, weight: 8,
    cond: { minAge: 15, maxAge: 49, hasRel: ['mentor'], flags: ['sensei_heir'] },
    text: '{mentor:이} 보따리를 풀어 낡은 책 한 권과 막대기를 건넸다. "나는 이제 길을 떠나려 하네. 자네가 내 마지막 제자야."',
    choices: [
      { label: '책을 받고 가르침을 잇겠다 약속한다', success: { text: '책 첫 장에는 이렇게 적혀 있었다. "길은 멈춘 자에게는 닿지 않는다." {mentor:은} 웃으며 어깨를 두드렸다.', effect: { unflags: ['sensei_heir', 'sensei_taught'], stats: { int: 11, vit: 6, fame: 8 }, karma: 5 }, tone: 'milestone' } },
      { label: '"저와 함께 계시면 안 될까요?"', check: { stat: 'cha', dc: 78 },
        success: { text: '{mentor:은} 한참 고민하다 고개를 끄덕였다. "허허, 마지막 한 철만 더 신세 지겠네."', effect: { unflags: ['sensei_heir', 'sensei_taught'], rel: { mentor: 20 }, stats: { cha: 6, int: 6 } }, tone: 'good' },
        fail: { text: '"붙잡아 주는 마음만 받겠네." {mentor:은} 부드럽게 웃으며 길을 떠났다. 막대기 하나가 손에 남았다.', effect: { unflags: ['sensei_heir', 'sensei_taught'], stats: { int: 6, cha: 3 }, mood: 'calm' } } },
    ],
  },

  // ═════ 고향 축제 지키기 (위기 → 준비 → 비바람 → 성대한 마무리) ═════
  {
    id: 'fest_crisis', title: '축제 준비위원 모집', once: true, weight: 3,
    cond: { minAge: 14, maxAge: 45 },
    text: '촌장이 광장에서 한숨을 쉰다. "올해 축제는 일손이 없어서 접어야 할 판이야. 누가 나서 줄 사람 없나?"',
    choices: [
      { label: '내가 맡겠다고 손을 든다', success: { text: '"오오, 장하다!" 촌장이 두 손을 꼭 잡았다. 광장이 갑자기 활기를 띠었다.', effect: { flags: ['fest_host'], karma: 3, stats: { cha: 3 } }, tone: 'good' } },
      { label: '다른 일꾼을 추천한다', success: { text: '추천한 이는 처음엔 고개를 저었지만 결국 팔을 걷었다. 축제는 어떻게든 열릴 것 같다.', effect: { stats: { cha: 3 } } } },
      { label: '못 들은 척한다', success: { text: '축제는 소박하게 열렸다. 올해는 어쩐지 노래도 평소보다 작았다.', effect: { karma: -2, mood: 'gloom' } } },
    ],
  },
  {
    id: 'fest_prepare', title: '축제 준비', once: true, weight: 7,
    cond: { minAge: 14, maxAge: 46, flags: ['fest_host'] },
    text: '등불, 천막, 음식 재료, 무대. 해야 할 일이 산더미다. 마을 사람들이 눈을 반짝이며 지시를 기다린다.',
    choices: [
      { label: '일을 나눠 맡기고 진두지휘한다', check: { stat: 'cha', dc: 84 },
        success: { text: '일정이 착착 맞아떨어졌다. 마을 사람들이 "반장님!"이라며 따랐다. 광장이 화려하게 꾸며졌다.', effect: { flags: ['fest_ready'], stats: { cha: 6, fame: 6 } }, tone: 'good' },
        fail: { text: '중복 주문, 엇갈린 일정. 엉망이 되었지만 사람들이 서로 도와 어찌어찌 마무리했다.', effect: { flags: ['fest_ready'], stats: { cha: -3 }, stress: 8 } } },
      { label: '친구를 불러 함께 만든다', cond: { hasRel: ['friend'] }, success: { text: '{friend:이} 팔을 걷어붙이고 달려왔다. 둘이 하니 일이 반으로 줄고 웃음은 두 배가 되었다.', effect: { flags: ['fest_ready'], rel: { friend: 12 }, stats: { cha: 3 } }, tone: 'good' } },
      { label: '창의적인 장식에 집중한다', check: { stat: 'int', dc: 78 },
        success: { text: '마을 아이들과 종이 용을 만들었다. 광장 위로 거대한 용이 둥실 떠올랐다!', effect: { flags: ['fest_ready'], stats: { int: 6, fame: 6 } }, tone: 'good' },
        fail: { text: '용은 만들었는데 날지 않는다. 대신 어른들이 떠받쳐 들고 행진하는 이상한 풍경이 되었다.', effect: { flags: ['fest_ready'], stats: { int: 3 } } } },
    ],
  },
  {
    id: 'fest_storm', title: '축제 날의 소나기', once: true, weight: 8,
    cond: { minAge: 14, maxAge: 46, flags: ['fest_ready'] },
    text: '축제 당일, 해질녘에 먹구름이 몰려왔다. 우르릉 천둥과 함께 굵은 빗방울이 광장에 쏟아진다. 등불이 하나둘 꺼진다!',
    choices: [
      { label: '마법으로 빗줄기를 밀어낸다', check: { stat: 'mana', dc: 90 },
        success: { text: '광장 위로 투명한 지붕이 펼쳐졌다. 비는 사방으로 흩어지고, 등불이 다시 환하게 켜졌다!', effect: { flags: ['fest_grand'], unflags: ['fest_ready'], stats: { mana: 6, fame: 11 } }, tone: 'milestone' },
        fail: { text: '마력이 터져 비가 엉뚱하게 사람들에게 쏟아졌다. 흠뻑 젖은 사람들이 어이없게 웃었다.', effect: { flags: ['fest_grand'], unflags: ['fest_ready'], stats: { mana: 3 }, mood: 'joy' } } },
      { label: '모두 천막 아래로 모아 노래를 시작한다', check: { stat: 'cha', dc: 84 },
        success: { text: '선창을 하자 광장 가득 합창이 울려 퍼졌다. 빗소리가 반주가 되었다. 오늘만큼은 최고의 축제다.', effect: { flags: ['fest_grand'], unflags: ['fest_ready'], stats: { cha: 8, fame: 8 } }, tone: 'milestone' },
        fail: { text: '목소리가 갈라져 노래는 중구난방이 되었다. 그래도 서로 어깨를 두드리며 비 속에서 춤췄다.', effect: { flags: ['fest_grand'], unflags: ['fest_ready'], stats: { cha: 3 }, mood: 'joy' } } },
      { label: '아쉽지만 축제를 접자고 한다', success: { text: '모두 서운해하며 흩어졌다. 비가 그친 뒤에야 광장에 남은 등불 하나가 외로이 빛났다.', effect: { unflags: ['fest_ready', 'fest_host'], stress: 10, mood: 'gloom' } } },
    ],
  },
  {
    id: 'fest_finale', title: '불꽃 속의 마무리', once: true, weight: 9,
    cond: { minAge: 14, maxAge: 46, flags: ['fest_grand'] },
    text: '비가 그치자 하늘에 무지개가 걸렸다. 촌장이 마지막 불꽃을 쏘아 올리며 외쳤다. "올해 축제의 주인공은 바로 이 아이다!"',
    choices: [
      { label: '손을 흔들며 인사한다', success: { text: '광장이 박수로 가득 찼다. 마을 사람들이 어깨를 들썩이며 당신의 이름을 불렀다.', effect: { unflags: ['fest_grand', 'fest_host'], stats: { fame: 14, cha: 6 }, karma: 5, mood: 'joy' }, tone: 'milestone' } },
      { label: '공을 마을 사람들에게 돌린다', success: { text: '"여러분 덕분이에요!" 마을 전체가 서로를 얼싸안았다. 이 축제는 오래도록 기억될 것이다.', effect: { unflags: ['fest_grand', 'fest_host'], stats: { cha: 8 }, karma: 8, mood: 'joy' }, tone: 'good' } },
    ],
  },

  // ═════ 늑대에게 잡혀간 아이 (비명 → 추적 → 늑대와 전투 → 아이의 보답) ═════
  {
    id: 'wolf_child_cry', title: '마을 어귀의 비명', once: true, weight: 3,
    cond: { minAge: 12, maxAge: 44 },
    text: '마을 어귀에서 아이 엄마가 주저앉아 울부짖는다. "우리 아이가… 늑대가 물고 숲으로 갔어요!"',
    choices: [
      { label: '곧장 숲으로 달려간다', success: { text: '"제가 찾아올게요!" 말이 끝나기도 전에 몸이 먼저 달렸다. 발자국이 숲 안쪽으로 이어진다.', effect: { flags: ['wolf_chase'], stats: { vit: 3 }, karma: 4 }, tone: 'good' } },
      { label: '마을 사람들을 모아 함께 간다', check: { stat: 'cha', dc: 73 },
        success: { text: '횃불과 쇠스랑을 든 장정들이 모였다. 그러나 숲이 가까워지자 모두 멈춰 섰다. "여기서부터는 자네가 앞서게."', effect: { flags: ['wolf_chase'], stats: { cha: 6 }, karma: 3 } },
        fail: { text: '다들 우물쭈물하는 사이 시간이 흘렀다. 결국 혼자 앞서 달릴 수밖에 없었다.', effect: { flags: ['wolf_chase'], stats: { cha: -3 } } } },
      { label: '무서워 모른 척한다', success: { text: '떨리는 다리를 붙잡고 집으로 돌아왔다. 그날 밤 내내 엄마의 울음소리가 귓가를 맴돌았다.', effect: { karma: -8, mood: 'gloom' } } },
    ],
  },
  {
    id: 'wolf_child_trace', title: '숲속의 발자국', once: true, weight: 9, focus: 'explore',
    cond: { minAge: 12, maxAge: 44, flags: ['wolf_chase'] },
    text: '어두운 숲, 꺾인 가지와 작은 신발 한 짝. 멀리서 낮은 으르렁 소리와 아이의 훌쩍임이 들려온다.',
    choices: [
      { label: '흔적을 하나하나 짚어 따라간다', check: { stat: 'int', dc: 73 },
        success: { text: '진흙에 찍힌 발자국의 방향을 정확히 읽어 냈다. 바위 굴 입구까지 한걸음에 닿았다.', effect: { flags: ['wolf_found'], unflags: ['wolf_chase'], stats: { int: 6 } }, tone: 'good' },
        fail: { text: '길을 헤매느라 시간을 허비했다. 그러나 아이의 울음소리가 이정표가 되어 주었다.', effect: { flags: ['wolf_found'], unflags: ['wolf_chase'], stats: { vit: -6 } } } },
      { label: '아이의 울음소리를 따라 달린다', check: { stat: 'vit', dc: 73 },
        success: { text: '덤불을 헤치고 곧장 달려 굴 앞에 닿았다. 숨은 가쁘지만 시간은 벌었다.', effect: { flags: ['wolf_found'], unflags: ['wolf_chase'], stats: { vit: 6 } }, tone: 'good' },
        fail: { text: '가시덤불에 걸려 구르면서도 굴 앞에 닿았다. 온몸이 긁혔다.', effect: { flags: ['wolf_found'], unflags: ['wolf_chase'], stats: { vit: -8 } } } },
    ],
  },
  {
    id: 'wolf_child_battle', title: '늑대 두목과의 대치', once: true, weight: 10,
    cond: { minAge: 12, maxAge: 44, flags: ['wolf_found'] },
    text: '굴 안쪽, 아이가 웅크린 채 떨고 있다. 그 앞을 거대한 은빛 늑대가 가로막았다. 눈이 마주치자 으르렁 소리가 굴을 울렸다.',
    choices: [
      { label: '검으로 정면 돌파', check: { stat: 'vit', dc: 84 },
        success: { text: '일격에 늑대가 물러났다. 아이가 달려와 당신 다리를 꼭 안았다. 훌쩍이던 얼굴이 활짝 웃었다. 아이가 목에 걸린 은빛 펜던트를 쥐여 주었다. 「마력이 깃든 펜던트」다!', effect: { flags: ['wolf_saved'], unflags: ['wolf_found'], stats: { mana: 14, fame: 11 }, mood: 'joy' }, tone: 'milestone' },
        fail: { text: '늑대의 돌진에 나가떨어졌다. 정신을 차렸을 때, 굴 안에는 아이도 늑대도 없었다. 아이의 행방은 묘연하다.', effect: { unflags: ['wolf_found'], stats: { vit: -22 }, stress: 100, zeroCause: 'bandits', mood: 'gloom' }, tone: 'bad' } },
      { label: '마법으로 늑대를 제압', check: { stat: 'mana', dc: 84 },
        success: { text: '푸른 마법진이 굴을 비추자 늑대가 낑 소리를 내며 뒤로 물러났다. 아이가 달려와 품에 안겼다. 눈물 맺힌 얼굴로 웃으며 은빛 펜던트를 내밀었다. 「마력이 깃든 펜던트」다!', effect: { flags: ['wolf_saved'], unflags: ['wolf_found'], stats: { mana: 14, fame: 11 }, mood: 'joy' }, tone: 'milestone' },
        fail: { text: '마력이 빗나가 굴 천장이 무너져 내렸다. 흙먼지가 가라앉았을 때 아이의 모습은 어디에도 없었다. 아이의 행방은 묘연하다.', effect: { unflags: ['wolf_found'], stats: { mana: -6, vit: -17 }, stress: 100, zeroCause: 'bandits', mood: 'gloom' }, tone: 'bad' } },
      { label: '시선을 끌어 아이만 탈출시킨다', check: { stat: 'luck', dc: 84 },
        success: { text: '돌멩이를 던져 늑대의 시선을 돌렸다. 그 틈에 아이가 쪼르르 달려 나왔다. 아이가 웃으며 은빛 펜던트를 쥐여 주었다. 늑대는 낑낑대며 굴 안쪽으로 물러났다.', effect: { flags: ['wolf_saved'], unflags: ['wolf_found'], stats: { mana: 14, luck: 3, fame: 8 }, mood: 'joy' }, tone: 'milestone' },
        fail: { text: '늑대가 돌멩이에 속지 않았다. 순식간에 아이를 물고 숲 깊은 곳으로 사라졌다. 아이의 행방은 묘연하다.', effect: { unflags: ['wolf_found'], stress: 100, mood: 'gloom' }, tone: 'bad' } },
    ],
  },
  {
    id: 'wolf_child_thanks', title: '아이의 꽃다발', once: true, weight: 10,
    cond: { minAge: 12, maxAge: 45, flags: ['wolf_saved'] },
    text: '며칠 뒤, 문 앞에 작은 꽃다발이 놓여 있다. 삐뚤빼뚤한 글씨의 쪽지도 있다. "구해 줘서 고마워요! 커서 저도 영웅이 될래요!"',
    choices: [
      { label: '꽃다발을 소중히 간직한다', success: { text: '창가에 꽂아 둔 꽃이 시들 때까지 한참을 바라보았다. 그 아이의 웃음이 마음속에 오래도록 남았다.', effect: { unflags: ['wolf_saved'], stress: -30, karma: 5, mood: 'joy' }, tone: 'good' } },
      { label: '아이를 찾아가 모험 이야기를 들려준다', success: { text: '아이의 눈이 반짝반짝 빛났다. 어느새 동네 아이들이 모여들어 늑대 굴 이야기를 졸라 댔다.', effect: { unflags: ['wolf_saved'], stats: { cha: 6, fame: 6 }, stress: -20, mood: 'joy' }, tone: 'good' } },
    ],
  },
];
