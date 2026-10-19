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
      { label: '앞장서서 싸운다', check: { stat: 'vit', dc: 40 },
        success: { text: '고블린 왕의 목을 베었다! 아르센이 등을 두드렸다. "역시 내 눈은 틀리지 않았어!"', effect: { flags: ['hp_q1', 'hp_trust'], stats: { fame: 6 }, gold: 300 }, tone: 'good' },
        fail: { text: '고블린 왕의 몽둥이에 나가떨어졌다. 리리가 혀를 찼다. "생각보다 별로네?"', effect: { flags: ['hp_q1', 'hp_doubt'], stats: { vit: -10 } } } },
      { label: '뒤에서 작전을 짠다', check: { stat: 'int', dc: 32 },
        success: { text: '함정 작전이 완벽하게 들어맞았다! 리리가 처음으로 웃었다. "머리 좋네, 너."', effect: { flags: ['hp_q1', 'hp_trust'], stats: { int: 2 } }, tone: 'good' },
        fail: { text: '작전이 꼬였다. 결국 아르센이 혼자 다 해치웠다.', effect: { flags: ['hp_q1', 'hp_doubt'] } } },
    ],
  },
  {
    id: 'hp_campfire', title: '모닥불', once: true, weight: 7,
    cond: { flags: ['hero_party', 'hp_q1'] },
    text: '야영지의 밤. 다들 잠든 줄 알았는데, 성녀 세실이 모닥불에 무언가를 몰래 태우고 있다.',
    choices: [
      { label: '몰래 지켜본다', check: { stat: 'int', dc: 36 },
        success: { text: '타다 남은 편지 조각을 주웠다. 이웃 왕국의 문장… 「공주를 제거하라」? 세실은 첩자다!', effect: { flags: ['hp_camp', 'hp_suspect'] }, tone: 'milestone' },
        fail: { text: '발소리에 세실이 돌아봤다. "잠이 안 와요? 차 한 잔 하실래요?" 미소가 차갑다.', effect: { flags: ['hp_camp'], stress: 10, mood: 'fear' } } },
      { label: '아르센과 이야기한다',
        success: { text: '용사도 사실 무섭다고 했다. 둘은 별을 보며 밤새 이야기했다. 진짜 동료가 된 기분이다.', effect: { flags: ['hp_camp', 'hp_trust'], will: 10, stats: { cha: 2 } }, tone: 'good' } },
      { label: '일찍 잔다', success: { text: '피곤했다. 내일도 강행군이다.', effect: { flags: ['hp_camp'], stress: -5 } } },
    ],
  },
  {
    id: 'hp_dungeon_raid', title: '파티 던전 원정', once: true, weight: 6,
    cond: { flags: ['hero_party', 'hp_q1'], minAge: 19 },
    text: '파티가 고대 던전에 들어섰다. 최하층에 전설의 보물이 잠들어 있다고 한다.',
    choices: [
      { label: '최하층까지 밀어붙인다', check: { stat: 'vit', dc: 46 },
        success: { text: '보물고의 문이 열렸다! 금화가 산더미다. 아르센이 당신 몫을 두둑이 챙겨주었다.', effect: { flags: ['hp_raid', 'treasure'], gold: 1500, stats: { fame: 4 } }, tone: 'good' },
        fail: { text: '함정에 걸려 크게 다쳤다. 동료들이 당신을 업고 나왔다.', effect: { flags: ['hp_raid'], stats: { vit: -15 } } } },
      { label: '전리품을 동료에게 양보한다',
        success: { text: '"너 같은 녀석은 처음이야." 아르센이 당신을 다시 봤다.', effect: { flags: ['hp_raid', 'hp_trust'], karma: 6 } } },
    ],
  },
  {
    id: 'hp_exiled', title: '파티 추방', once: true, weight: 7,
    cond: { flags: ['hero_party', 'hp_doubt', 'hp_camp'], notFlags: ['hp_trust'] },
    text: '아르센이 눈을 피하며 말했다. "미안. 넌 우리 파티에 안 맞는 것 같아." 리리가 짐을 문밖에 내던졌다.',
    choices: [
      { label: '혼자의 길을 간다', success: { text: '추방당한 그날 밤, 숨겨져 있던 힘이 깨어났다. 이건 그 유명한… 추방 후 각성 루트?!', effect: { unflags: ['hero_party'], stats: { vit: 8, mana: 8 }, will: 20, mood: 'anger' }, tone: 'milestone' } },
      { label: '매달린다', check: { stat: 'cha', dc: 40 },
        success: { text: '"한 번만 더 기회를 줘!" 아르센이 고개를 끄덕였다.', effect: { flags: ['hp_trust'] }, tone: 'good' },
        fail: { text: '문이 닫혔다. 비참하다.', effect: { unflags: ['hero_party'], stress: 20, mood: 'gloom' } } },
    ],
  },
  {
    id: 'hp_final_march', title: '마왕성 진격', once: true, weight: 6,
    cond: { flags: ['hero_party', 'hp_raid', 'hp_trust'], minAge: 22 },
    text: '드디어 마왕성이다. 아르센이 성검을 높이 들었다. "모두, 끝내러 가자!"',
    choices: [
      { label: '선봉에 선다', check: { stat: 'vit', dc: 56 },
        success: { text: '용사의 성검과 당신의 일격이 동시에 꽂혔다. 마왕이 무너진다! 세계가 환호한다!', effect: { flags: ['slew_demon_lord', 'hp_victory'], unflags: ['hero_party'], stats: { fame: 25 }, gold: 5000, karma: 10 }, tone: 'milestone' },
        fail: { text: '마왕의 일격이 당신을 꿰뚫었다. 마지막으로 들린 건 아르센의 외침이었다.', effect: { death: 'war' } } },
      { label: '마지막 순간 등을 돌린다', will: 20,
        success: { text: '성문 앞에서 돌아섰다. 등 뒤로 아르센의 목소리가 들렸다. "…배신자!"', effect: { flags: ['hp_betrayer'], unflags: ['hero_party'], karma: -20, stats: { fame: -10 } } } },
    ],
  },
  {
    id: 'hp_victory_feast', title: '개선 축제', once: true, weight: 8,
    cond: { flags: ['hp_victory'] },
    text: '왕도가 꽃으로 뒤덮였다. 국왕이 당신을 불렀다. "용사의 동료여, 원하는 것을 말하라."',
    choices: [
      { label: '작위와 영지를 받는다', success: { text: '오늘부터 당신은 귀족이다! 성 하나가 통째로 내 것이 됐다.', effect: { flags: ['noble_title'], own: 'castle', stats: { fame: 10 } }, tone: 'milestone' } },
      { label: '아르센과 다시 모험을 떠난다', success: { text: '"마왕이 없어도 세상은 넓잖아!" 둘은 새 지도를 펼쳤다.', effect: { stats: { luck: 8 }, mood: 'joy', will: 20 }, tone: 'good' } },
    ],
  },
  {
    id: 'hp_cleared_reward', title: '진실의 대가', once: true, weight: 8,
    cond: { flags: ['hp_cleared'] },
    text: '세실의 정체가 밝혀지자 왕궁이 뒤집혔다. 공주가 직접 당신을 찾아왔다. "당신이 저를 구했군요."',
    choices: [
      { label: '왕실 기사가 된다', success: { text: '공주의 호위 기사로 임명되었다! 반짝이는 문장이 가슴에 달렸다.', effect: { job: 'knight', jobRank: 1, stats: { fame: 8 } }, tone: 'milestone' } },
      { label: '사례금을 받고 떠난다', success: { text: '묵직한 금화 주머니를 받았다. 왕궁의 암투는 이제 질렸다.', effect: { gold: 3000 } } },
    ],
  },
  {
    id: 'hp_hunted', title: '배신자 사냥', once: true, weight: 6,
    cond: { flags: ['hp_betrayer'] },
    text: '비 오는 밤, 문 앞에 아르센이 서 있다. 성검이 젖어 빛난다. "왜 그랬어. 대답해."',
    choices: [
      { label: '검을 뽑는다', check: { stat: 'vit', dc: 58 },
        success: { text: '용사를 쓰러뜨렸다. 이겼는데도… 가슴이 텅 빈 것 같다.', effect: { flags: ['hero_slain'], karma: -15, stats: { fame: 10 } } },
        fail: { text: '성검이 당신을 꿰뚫었다. 아르센이 울고 있었다.', effect: { death: 'duel' } } },
      { label: '진심으로 사과한다', check: { stat: 'cha', dc: 45 },
        success: { text: '아르센이 한참을 서 있다가 검을 거뒀다. "…다음엔 같이 끝까지 가자."', effect: { karma: 15, unflags: ['hp_betrayer'], will: 15 }, tone: 'good' },
        fail: { text: '"이제 와서?" 아르센은 등을 돌렸다. 용서받지 못했다.', effect: { stress: 25, mood: 'gloom' } } },
    ],
  },
  {
    id: 'hp_second_call', title: '다시 찾아온 용사', once: true, weight: 4,
    cond: { flags: ['hp_declined'], minAge: 24, stats: { fame: 25 }, notFlags: ['hero_party'] },
    text: '몇 년 전 거절했던 용사 아르센이 다시 찾아왔다. 망토가 해졌다. "아직도 네가 필요해."',
    choices: [
      { label: '이번엔 함께한다', success: { text: '"늦어서 미안." 이번엔 손을 잡았다.', effect: { flags: ['hero_party'], unflags: ['hp_declined'], stats: { fame: 5 } }, tone: 'good' } },
      { label: '그래도 거절한다', success: { text: '아르센은 웃으며 떠났다. 몇 달 뒤, 용사 파티가 크게 다쳤다는 소식이 들려왔다.', effect: { unflags: ['hp_declined'], stress: 10 } } },
    ],
  },

  // ═════ 성검을 거부한 용사의 핏줄 ═════
  {
    id: 'sword_crisis', title: '다시 우는 성검', once: true, weight: 6,
    cond: { flags: ['hero_refused'], minAge: 26, maxAge: 50 },
    text: '마왕군이 고향을 덮쳤다. 잠가두었던 지하실에서, 성검이 마지막으로 울고 있다.',
    choices: [
      { label: '이번엔 성검을 뽑는다', check: { stat: 'vit', dc: 30 },
        success: { text: '오랜 세월을 돌아 드디어 손에 쥐었다. 늦게 핀 용사의 이야기가 시작된다!', effect: { job: 'hero', flags: ['hero_awakened'], unflags: ['hero_refused'], stats: { fame: 15 } }, tone: 'milestone' },
        fail: { text: '성검은 이제 대답하지 않는다. 너무 늦었던 걸까.', effect: { flags: ['sword_given'] } } },
      { label: '끝까지 거부한다', success: { text: '그날 밤 성검이 사라졌다. 옆집 소년의 손에서 빛나고 있었다.', effect: { flags: ['sword_given'] } } },
    ],
  },
  {
    id: 'sword_new_bearer', title: '새 용사', once: true, weight: 6,
    cond: { flags: ['sword_given'] },
    text: '성검을 손에 넣은 옆집 소년이 찾아왔다. "{elder}… 아니, 선배! 검 쓰는 법 좀 알려주세요!"',
    choices: [
      { label: '가르친다', success: { text: '매일 아침 소년과 검을 맞댔다. 소년의 눈이 반짝인다.', effect: { flags: ['mentor_of_hero'], stats: { fame: 4, vit: 2 } }, tone: 'good' } },
      { label: '문을 닫는다', success: { text: '"내 일 아니야." 소년은 혼자 떠났다.', effect: { mood: 'gloom' } } },
    ],
  },
  {
    id: 'sword_bearer_return', title: '제자의 귀환', once: true, weight: 6,
    cond: { flags: ['mentor_of_hero'], minAge: 30 },
    text: '왕도에서 축포가 울렸다. 마왕을 쓰러뜨린 새 용사가, 개선 행진을 멈추고 당신에게 달려왔다.',
    auto: { success: { text: '"선배 덕분이에요!" 용사가 왕에게 받은 상금의 절반을 내밀었다. 사람들이 당신을 「용사의 스승」이라 부른다.', effect: { gold: 3000, stats: { fame: 12 } }, tone: 'milestone' } },
  },

  // ═════ 정략 약혼 (d_noble) ═════
  {
    id: 'betroth_meeting', title: '약혼자', once: true, weight: 7,
    cond: { flags: ['betrothed'], notRel: ['spouse'] },
    text: '정략 약혼 상대와의 첫 만남. 정원의 장미 사이로 낯선 얼굴이 고개를 숙인다.',
    choices: [
      { label: '마음을 열어본다', check: { stat: 'cha', dc: 30 },
        success: { text: '어색한 대화가 웃음으로 바뀌었다. 정략결혼이지만, 사랑이 될지도 모른다.', effect: { addRel: 'spouse', flags: ['arranged_love'] }, tone: 'good' },
        fail: { text: '대화가 이어지지 않았다. 차가운 결혼 생활이 기다리고 있다.', effect: { addRel: 'spouse', flags: ['cold_marriage'], rel: { spouse: -30 } } } },
      { label: '소꿉친구와 도망친다', cond: { hasRel: ['friend'] }, will: 25,
        success: { text: '혼례 전날 밤, {friend}의 손을 잡고 담을 넘었다! 대공가가 발칵 뒤집혔다.', effect: { promoteToSpouse: 'friend', flags: ['eloped'], unflags: ['betrothed'], stats: { fame: -8 } }, tone: 'milestone' } },
    ],
  },
  {
    id: 'arranged_child', title: '작은 기적', once: true, weight: 5,
    cond: { flags: ['arranged_love'], hasRel: ['spouse'], maxAge: 45 },
    text: '정략으로 시작한 결혼에, 어느새 진짜 사랑이 피었다. 그리고 오늘, 둘에게 반가운 소식이 찾아왔다.',
    auto: { success: { text: '아기가 태어났다! 대공가 전체가 축제 분위기다.', effect: { flags: ['has_child'], rel: { spouse: 15 }, mood: 'joy', stats: { fame: 3 } }, tone: 'milestone' } },
  },
  {
    id: 'cold_marriage_end', title: '차가운 결혼', once: true, weight: 5,
    cond: { flags: ['cold_marriage'], hasRel: ['spouse'] },
    text: '{spouse}에게는 사랑하는 사람이 따로 있었다. 오늘 그 사실을 털어놓았다.',
    choices: [
      { label: '놓아준다', success: { text: '"행복해." 이혼 서류에 서명했다. 이상하게 마음이 가볍다.', effect: { removeRel: ['spouse'], karma: 12, unflags: ['cold_marriage'], stress: -10 }, tone: 'good' } },
      { label: '체면을 지킨다', success: { text: '겉으로는 완벽한 부부. 속은 텅 빈 채로 세월이 흘렀다.', effect: { stress: 20, stats: { fame: 3 } } } },
    ],
  },
  {
    id: 'eloped_chase', title: '대공가의 추격대', once: true, weight: 6,
    cond: { flags: ['eloped'] },
    text: '대공가의 기사들이 국경까지 쫓아왔다. {spouse}의 손이 떨린다.',
    choices: [
      { label: '숲으로 숨는다', check: { stat: 'luck', dc: 38 },
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
    auto: { success: { text: '바닥을 친 사람은 강하다. 사람들이 당신을 「불사조」라 부른다.', effect: { stats: { fame: 10 }, unflags: ['bankrupted', 'comeback'], mood: 'joy' }, tone: 'milestone' } },
  },

  // ═════ 도망자 ═════
  {
    id: 'fugitive_bounty', title: '현상금 사냥꾼', once: true, weight: 5,
    cond: { flags: ['fugitive'] },
    text: '주점 문이 열리고 현상금 사냥꾼이 들어왔다. 손에 든 수배서에… 당신 얼굴이 있다.',
    choices: [
      { label: '맞서 싸운다', check: { stat: 'vit', dc: 42 },
        success: { text: '사냥꾼을 쓰러뜨리고 수배서를 불태웠다. 당분간은 안전하다.', effect: { stats: { fame: 2 } }, tone: 'good' },
        fail: { text: '두들겨 맞고 가진 돈을 빼앗겼다. 겨우 도망쳤다.', effect: { stats: { vit: -15 }, goldPct: -0.5 } } },
      { label: '뒷문으로 빠져나간다', check: { stat: 'luck', dc: 30 },
        success: { text: '그림자처럼 사라졌다.', effect: {} },
        fail: { text: '뒷문에도 사냥꾼의 동료가 있었다. 크게 다쳤다.', effect: { stats: { vit: -12 } } } },
    ],
  },
  {
    id: 'fugitive_choice', title: '쫓기는 삶', once: true, weight: 4,
    cond: { flags: ['fugitive'], minAge: 22 },
    text: '도망 다니는 것도 지쳤다. 이제 정해야 한다.',
    choices: [
      { label: '이름을 버리고 새로 산다', success: { text: '새 이름, 새 마을. 아무도 당신을 모른다. 명성도, 과거도 사라졌다.', effect: { stats: { fame: -20 }, unflags: ['fugitive'], flags: ['new_identity'], stress: -15 } } },
      { label: '돌아가서 결백을 증명한다', check: { stat: 'cha', dc: 48 },
        success: { text: '광장에서 진실을 외쳤다. 사람들이 당신을 믿어주었다! 이름을 되찾았다.', effect: { stats: { fame: 12 }, unflags: ['fugitive'] }, tone: 'milestone' },
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
      { label: '빵집에서 일한다', success: { text: '반죽 솜씨가 기가 막히다! (몸이 말랑해서일까) 손님이 줄을 섰다.', effect: { flags: ['slime_baker'], gold: 300, stats: { cha: 3 } }, tone: 'good' },
      },
      { label: '모험가 행세를 한다', check: { stat: 'luck', dc: 30 },
        success: { text: '아무도 슬라임인 줄 모른다. 오히려 "탄력 있는 몸놀림"이라고 칭찬받았다.', effect: { job: 'adventurer', stats: { fame: 2 } } },
        fail: { text: '비 맞고 녹아내리는 걸 들켰다! 마을이 발칵 뒤집혔다.', effect: { stats: { fame: -5 }, unflags: ['humanform'], mood: 'fear' } } },
    ],
  },
  {
    id: 'slime_love', title: '말랑한 고백', once: true, weight: 5,
    cond: { flags: ['slime_baker'], notRel: ['spouse'] },
    text: '빵집 단골이 매일 같은 시간에 온다. 오늘은 빵 대신 꽃을 들고 왔다.',
    choices: [
      { label: '정체를 밝히고 고백을 받는다', check: { stat: 'cha', dc: 32 },
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
      { label: '정령과 계약한다', success: { text: '"오래 기다렸어, 주인!" 정령이 어깨에 앉았다. 몸에 마력이 흐른다.', effect: { flags: ['relic_spirit'], stats: { mana: 8 } }, tone: 'milestone' } },
      { label: '골동품점에 판다', success: { text: '고대 정령석이었다! 상상도 못 한 값을 받았다.', effect: { gold: 1200, unflags: ['relic'] } } },
    ],
  },
  {
    id: 'relic_dungeon', title: '정령의 길잡이', once: true, weight: 6,
    cond: { flags: ['relic_spirit'], test: (s) => (s.dgBest ?? 0) >= 15 },
    text: '던전에서 돌아온 밤, 정령이 속삭였다. "그 던전, 내가 살던 곳이야. 숨겨진 방을 알아."',
    choices: [
      { label: '숨겨진 방으로 간다', success: { text: '정령이 벽을 통과하자 비밀 보물고가 열렸다! 고대 금화가 가득하다.', effect: { gold: 2500, stats: { luck: 4 } }, tone: 'good' } },
      { label: '정령의 고향을 지켜준다', success: { text: '"고마워." 정령이 더 밝게 빛났다. 축복이 깃든다.', effect: { stats: { mana: 6, luck: 6 }, karma: 8 }, tone: 'good' } },
    ],
  },

  // ═════ 왕궁 보물고를 턴 괴도 ═════
  {
    id: 'royal_manhunt', title: '왕국 전역 수배', once: true, weight: 6,
    cond: { flags: ['royal_heist'] },
    text: '왕궁 보물고 사건 이후, 왕국 전체에 검문이 깔렸다. 근위대장이 직접 수사에 나섰다.',
    choices: [
      { label: '숨죽이고 버틴다', check: { stat: 'luck', dc: 48 },
        success: { text: '근위대장이 바로 옆을 지나갔지만 알아보지 못했다. 전설은 계속된다!', effect: { stats: { fame: 5 } }, tone: 'good' },
        fail: { text: '변장이 벗겨졌다! 근위대에 붙잡혔다.', effect: { caught: true } } },
      { label: '보물 일부를 고아원에 뿌린다', success: { text: '「의적」이라는 소문이 퍼졌다. 백성들이 오히려 당신을 숨겨주었다.', effect: { goldPct: -0.3, karma: 20, stats: { fame: 8 } }, tone: 'good' } },
    ],
  },
  {
    id: 'royal_princess', title: '{royal}의 부탁', once: true, weight: 5,
    cond: { flags: ['royal_heist'], notRel: ['spouse'] },
    text: '한밤중 은신처에 {royal:이} 나타났다. "당신이 그 괴도죠? 나도 이 답답한 성에서 훔쳐가 줘요!"',
    choices: [
      { label: '{royal:을} 훔쳐 간다', success: { text: '왕국 최고의 보물을 훔쳤다. 이번엔 마음까지.', effect: { addRel: 'spouse', stats: { fame: 10 }, flags: ['stole_princess'] }, tone: 'milestone' } },
      { label: '정중히 돌려보낸다', success: { text: '"언젠가 당신 스스로 걸어 나오세요." {royal:이} 눈을 반짝였다.', effect: { karma: 5 } } },
    ],
  },
  {
    id: 'princess_ransom', title: '국왕의 편지', once: true, weight: 5,
    cond: { flags: ['stole_princess'], hasRel: ['spouse'] },
    text: '국왕에게서 편지가 왔다. "{royalChild:이} 행복하다면… 돌아오라. {inlaw:으로} 맞겠다."',
    choices: [
      { label: '왕궁으로 돌아간다', success: { text: '괴도가 왕실의 {inlaw:이} 되었다! 이세계 역사상 가장 이상한 결혼식이었다.', effect: { flags: ['noble_title'], gold: 10000, stats: { fame: 15 } }, tone: 'milestone' } },
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
      { label: '전력으로 맞선다', check: { stat: 'vit', dc: 55 },
        success: { text: '마지막 일격을 멈췄다. "…이제 됐다." 그녀가 검을 내렸다. 원한은 끝났다.', effect: { karma: 15, stats: { fame: 8 }, mood: 'calm' }, tone: 'milestone' },
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
      { label: '성대하게 집들이를 한다', success: { text: '밤새 웃음소리가 끊이지 않았다. 동네 인기인이 되었다.', effect: { gold: -200, stats: { cha: 4, fame: 2 }, rel: { friend: 10, spouse: 10 } }, tone: 'good' } },
      { label: '조용히 차만 대접한다', success: { text: '소박하지만 따뜻한 저녁이었다.', effect: { stress: -8 } } },
    ],
  },
  {
    id: 'own_horse_race', title: '왕도 경마 대회', once: true, weight: 4,
    cond: { owns: ['horse'], minAge: 16 },
    text: '왕도에서 경마 대회가 열린다! 우승 상금은 2,000G. 애마가 콧김을 뿜는다.',
    choices: [
      { label: '출전한다 (참가비 100G)', check: { stat: 'luck', dc: 40 },
        success: { text: '결승선을 1등으로 통과! 관중석이 들썩였다.', effect: { gold: 1900, stats: { fame: 5 } }, tone: 'good' },
        fail: { text: '마지막 코너에서 낙마했다. 참가비만 날렸다.', effect: { gold: -100, stats: { vit: -5 } } } },
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
      { label: '성벽 위에서 지휘한다', check: { stat: 'int', dc: 45 },
        success: { text: '공성전에서 대승! 이웃 영주가 무릎을 꿇고 영지 일부를 바쳤다.', effect: { gold: 8000, stats: { fame: 10 } }, tone: 'milestone' },
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
      { label: '교관이 된다', success: { text: '신입들이 당신을 「선생님」이라 부른다. 보수도 짭짤하다.', effect: { gold: 1500, stats: { fame: 6, cha: 3 } }, tone: 'good' } },
      { label: '아직 현역이다', success: { text: '"가르치는 건 나중에. 아직 더 깊이 내려갈 거야."', effect: { will: 15 } } },
    ],
  },
  {
    id: 'abyss_voice', title: '심연의 목소리', once: true, weight: 5,
    cond: { flags: ['depth_60'] },
    text: '60층에서 돌아온 뒤로, 꿈속에서 누군가 부른다. "더 내려와라… 왕좌가 기다린다…"',
    choices: [
      { label: '목소리에 답한다', success: { text: '어둠의 마력이 몸에 스며든다. 강해졌지만… 눈빛이 조금 변했다.', effect: { stats: { mana: 10 }, karma: -10, flags: ['abyss_mark'] } } },
      { label: '신전에서 정화한다', success: { text: '사제의 기도로 목소리가 잦아들었다. 마음이 맑아진다.', effect: { gold: -300, karma: 5, stress: -15 } } },
    ],
  },
  {
    id: 'abyss_mark_throne', title: '마왕의 초대', once: true, weight: 6,
    cond: { flags: ['abyss_mark'], notFlags: ['dungeon_conquered'] },
    text: '심연의 표식이 타오른다. 마왕의 목소리가 직접 들려온다. "내 후계자가 되어라."',
    choices: [
      { label: '받아들인다', success: { text: '마왕군의 문이 열렸다. 오늘부터 당신은 마왕의 후계자다.', effect: { job: 'demon_officer', jobRank: 3, karma: -20 }, tone: 'milestone' } },
      { label: '거절하고 마왕을 쓰러뜨리기로 맹세한다', success: { text: '"네 왕좌는 내가 부수러 간다." 표식이 빛을 잃었다.', effect: { will: 30, unflags: ['abyss_mark'], stats: { vit: 5 } }, tone: 'good' } },
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
];
