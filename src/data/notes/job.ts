import type { YearNote } from './types';

/** 직업별 기록: cond.jobs 로 직업을, cond.minJobRank 로 직급을 건다 */
export const JOB_NOTES: YearNote[] = [
  { id: 'nj_mage_lecture', minAge: 25, maxAge: 70, cond: { jobs: ['mage'], minJobRank: 3 }, text: '3등급 모험가들을 상대로 마법 이론 강의를 했다. 반응이 뜨거워 질문이 밤까지 이어졌다.', effect: { stats: { fame: 2 } } },
  { id: 'nj_knight_polish', minAge: 18, maxAge: 60, cond: { jobs: ['knight'] }, text: '새벽마다 갑옷을 닦는 게 습관이 되었다. 반짝이는 흉갑에 비친 얼굴이 조금 늠름해졌다.' },
  { id: 'nj_farmer_rain', minAge: 16, maxAge: 80, cond: { jobs: ['farmer'] }, text: '가뭄 끝에 단비가 내렸다. 논두렁에 서서 한참 동안 비를 맞았다.' },

  // ───── farmer ─────
  { id: 'nj_farmer_plow', minAge: 16, maxAge: 60, cond: { jobs: ['farmer'], maxJobRank: 2 }, text: '이른 새벽 소를 끌고 밭을 갈았다. 고랑이 삐뚤빼뚤했지만 씨앗은 정직하게 싹을 틔웠다.' },
  { id: 'nj_farmer_blister', minAge: 16, maxAge: 60, cond: { jobs: ['farmer'], maxJobRank: 2 }, text: '낫질에 손바닥 물집이 잡혔다. 며칠 뒤 굳은살이 되자 낫이 손에 붙는 느낌이다.', effect: { stats: { vit: 2 } } },
  { id: 'nj_farmer_stall', minAge: 16, maxAge: 60, cond: { jobs: ['farmer'], maxJobRank: 2 }, text: '장날에 직접 키운 채소를 팔았다. 첫 손님이 「싱싱하네!」라고 해서 하루 종일 기분이 좋았다.', tone: 'good' },
  { id: 'nj_farmer_land_buy', minAge: 25, maxAge: 70, cond: { jobs: ['farmer'], minJobRank: 3, maxJobRank: 3 }, text: '이웃의 밭 한 뙈기를 사들였다. 문서에 도장을 찍는 손이 살짝 떨렸다.' },
  { id: 'nj_farmer_help_neighbors', minAge: 22, maxAge: 75, cond: { jobs: ['farmer'], minJobRank: 3, maxJobRank: 3 }, text: '이웃의 모내기를 도왔다. 품앗이 끝에 나눠 마신 막걸리 한 사발이 달았다.', effect: { mood: 'joy' } },
  { id: 'nj_farmer_harvest_feast', minAge: 25, maxAge: 80, cond: { jobs: ['farmer'], minJobRank: 3 }, text: '풍년 잔치를 열었다. 마을 사람 모두가 마당에 모여 밤새 노래했다.', tone: 'good' },
  { id: 'nj_farmer_chief_mediate', minAge: 30, maxAge: 80, cond: { jobs: ['farmer'], minJobRank: 4 }, text: '물길 분쟁을 중재했다. 양쪽이 서로 사과하며 마무리돼 한시름 놓았다.' },
  { id: 'nj_farmer_old_hands', minAge: 35, maxAge: 90, cond: { jobs: ['farmer'], minJobRank: 4 }, text: '굳은살 박인 손을 가만히 내려다보았다. 이 손이 마을을 먹여 살렸다.', effect: { mood: 'calm' } },

  // ───── knight ─────
  { id: 'nj_knight_squire_chores', minAge: 16, maxAge: 40, cond: { jobs: ['knight'], maxJobRank: 2 }, text: '선배 기사의 말을 닦고 갑옷을 날랐다. 잔소리는 많았지만 어깨너머로 배우는 검술이 쏠쏠했다.' },
  { id: 'nj_knight_first_patrol', minAge: 18, maxAge: 45, cond: { jobs: ['knight'], maxJobRank: 2 }, text: '처음으로 순찰을 돌았다. 아무 일도 없었지만 보람찬 하루였다.', tone: 'good' },
  { id: 'nj_knight_oath', minAge: 18, maxAge: 45, cond: { jobs: ['knight'], minJobRank: 2, maxJobRank: 2 }, text: '정식 서약식에서 검을 이마에 대고 맹세했다. 목소리가 갈라져 선배들이 웃음을 참았다.', tone: 'good' },
  { id: 'nj_knight_joust', minAge: 20, maxAge: 50, cond: { jobs: ['knight'], minJobRank: 2, maxJobRank: 3 }, text: '마상 창 시합에서 두 번째 라운드까지 갔다. 말이 먼저 지쳐 주저앉았다.' },
  { id: 'nj_knight_train_recruits', minAge: 25, maxAge: 60, cond: { jobs: ['knight'], minJobRank: 3, maxJobRank: 3 }, text: '신병들을 훈련시켰다. 처음 입대하던 날의 내가 그 줄에 서 있었다.', effect: { stats: { cha: 2 } } },
  { id: 'nj_knight_armor_dents', minAge: 20, maxAge: 70, cond: { jobs: ['knight'] }, text: '갑옷의 흠집 하나하나에 사연이 있다. 오늘은 그중 하나를 쓰다듬었다.', effect: { mood: 'calm' } },
  { id: 'nj_knight_command_idea', minAge: 30, maxAge: 65, cond: { jobs: ['knight'], minJobRank: 4 }, text: '지휘관 회의에서 처음으로 작전을 제안했다. 장군들이 고개를 끄덕였다.', tone: 'good' },
  { id: 'nj_knight_peaceful_year', minAge: 35, maxAge: 70, cond: { jobs: ['knight'], minJobRank: 4 }, text: '평화로운 해가 이어졌다. 검을 휘두를 일이 없으니 훈련장의 잡초만 신경 쓰인다.' },

  // ───── mage ─────
  { id: 'nj_mage_ink_spill', minAge: 16, maxAge: 40, cond: { jobs: ['mage'], maxJobRank: 2 }, text: '마법 문서를 필사하다 잉크를 쏟았다. 손가락이 사흘간 푸르스름했다.' },
  { id: 'nj_mage_first_circle', minAge: 16, maxAge: 40, cond: { jobs: ['mage'], maxJobRank: 2 }, text: '처음으로 제대로 된 마법진을 완성했다. 불꽃이 알맞은 크기로 타올랐다.', tone: 'good', effect: { stats: { mana: 2 } } },
  { id: 'nj_mage_library_night', minAge: 16, maxAge: 45, cond: { jobs: ['mage'], maxJobRank: 2 }, text: '도서관에서 밤을 새워 마법서를 읽었다. 새벽 종소리에야 고개를 들었다.', effect: { stats: { int: 2 } } },
  { id: 'nj_mage_mana_overflow', minAge: 18, maxAge: 50, cond: { jobs: ['mage'], minJobRank: 2, maxJobRank: 2 }, text: '마력 조절에 실패해 연구실 창문을 날렸다. 학장이 한숨을 쉬며 수리비를 청구했다.', tone: 'bad' },
  { id: 'nj_mage_thesis', minAge: 25, maxAge: 65, cond: { jobs: ['mage'], minJobRank: 3, maxJobRank: 3 }, text: '마법 이론 논문을 학회에 제출했다. 심사위원의 첫 질문이 가장 어려웠다.' },
  { id: 'nj_mage_mentor_junior', minAge: 25, maxAge: 70, cond: { jobs: ['mage'], minJobRank: 3 }, text: '후배 마법사에게 마력 순환법을 가르쳤다. 알려 주다 보니 내가 몰랐던 걸 알게 되었다.', effect: { stats: { int: 2 } } },
  { id: 'nj_mage_court_fireworks', minAge: 30, maxAge: 70, cond: { jobs: ['mage'], minJobRank: 4 }, text: '궁정 연회의 불꽃놀이를 맡았다. 왕이 박수를 치자 어깨가 으쓱했다.', tone: 'good' },
  { id: 'nj_mage_tower_tea', minAge: 35, maxAge: 90, cond: { jobs: ['mage'], minJobRank: 4 }, text: '높은 탑 꼭대기에서 별을 보며 차를 마셨다. 마력보다 고요가 더 귀하다는 걸 알았다.', effect: { mood: 'calm' } },

  // ───── court ─────
  { id: 'nj_court_paperwork', minAge: 18, maxAge: 50, cond: { jobs: ['court'], maxJobRank: 2 }, text: '서류 더미에 파묻혀 하루를 보냈다. 인장 찍는 소리가 자장가처럼 들렸다.' },
  { id: 'nj_court_error_found', minAge: 18, maxAge: 50, cond: { jobs: ['court'], maxJobRank: 2 }, text: '장부의 숫자 오류를 찾아냈다. 상관이 놀라 이름을 기억해 두었다.', tone: 'good', effect: { stats: { int: 2 } } },
  { id: 'nj_court_night_duty', minAge: 18, maxAge: 55, cond: { jobs: ['court'], maxJobRank: 2 }, text: '야근 당직을 섰다. 등불 아래 졸다가 붓에 코를 박았다.' },
  { id: 'nj_court_budget_night', minAge: 25, maxAge: 65, cond: { jobs: ['court'], minJobRank: 3, maxJobRank: 3 }, text: '예산안을 밤새 정리했다. 숫자가 겨우 맞아떨어졌을 때는 동틀 무렵이었다.', effect: { stress: 5 } },
  { id: 'nj_court_petitioner', minAge: 25, maxAge: 70, cond: { jobs: ['court'], minJobRank: 3, maxJobRank: 3 }, text: '억울한 사정의 평민 청원을 직접 받았다. 문서보다 그 사람 얼굴이 오래 남았다.', effect: { stats: { cha: 2 } } },
  { id: 'nj_court_royal_report', minAge: 30, maxAge: 70, cond: { jobs: ['court'], minJobRank: 4 }, text: '왕 앞에서 보고를 올렸다. 손에 땀이 났지만 목소리는 떨리지 않았다.', tone: 'good' },
  { id: 'nj_court_court_intrigue', minAge: 30, maxAge: 70, cond: { jobs: ['court'], minJobRank: 4 }, text: '궁정 회의에서 반대파의 눈치를 살폈다. 한마디 한마디가 칼날 같았다.' },
  { id: 'nj_court_garden_walk', minAge: 40, maxAge: 90, cond: { jobs: ['court'], minJobRank: 5 }, text: '퇴청길에 궁정 정원을 걸었다. 책임의 무게가 어깨에 내려앉았다.', effect: { mood: 'calm' } },

  // ───── merchant ─────
  { id: 'nj_merchant_peddling', minAge: 16, maxAge: 45, cond: { jobs: ['merchant'], maxJobRank: 1 }, text: '짐수레를 끌고 마을을 돌며 물건을 팔았다. 첫 손님이 흥정을 길게 걸어 곤란했다.' },
  { id: 'nj_merchant_bargain_win', minAge: 16, maxAge: 50, cond: { jobs: ['merchant'], maxJobRank: 2 }, text: '흥정에서 이겼다. 상대가 투덜거리면서도 웃으며 악수를 청했다.', tone: 'good', effect: { stats: { cha: 2 } } },
  { id: 'nj_merchant_shop_open', minAge: 20, maxAge: 55, cond: { jobs: ['merchant'], minJobRank: 2, maxJobRank: 2 }, text: '작은 가게를 열었다. 간판은 아직 비뚤지만 첫 손님이 들어왔다.', tone: 'good' },
  { id: 'nj_merchant_late_goods', minAge: 18, maxAge: 60, cond: { jobs: ['merchant'], maxJobRank: 3 }, text: '물건이 제때 도착하지 않아 하루 종일 항구에서 발을 동동 굴렀다.', tone: 'bad' },
  { id: 'nj_merchant_teach_ledger', minAge: 25, maxAge: 70, cond: { jobs: ['merchant'], minJobRank: 3, maxJobRank: 3 }, text: '견습생들에게 장부 쓰는 법을 가르쳤다. 숫자엔 정직이 최고라고 말했다.' },
  { id: 'nj_merchant_foreign_deal', minAge: 28, maxAge: 70, cond: { jobs: ['merchant'], minJobRank: 3 }, text: '먼 나라 상인과 계약을 맺었다. 통역이 엉뚱하게 전해 한참을 웃었다.' },
  { id: 'nj_merchant_board_meeting', minAge: 32, maxAge: 75, cond: { jobs: ['merchant'], minJobRank: 4 }, text: '상회 회의에서 주주들을 설득했다. 마지막 한마디에 침묵이 내려앉았다.', tone: 'good' },
  { id: 'nj_merchant_night_ledger', minAge: 35, maxAge: 90, cond: { jobs: ['merchant'], minJobRank: 4 }, text: '밤늦게 금고를 열어 장부를 맞췄다. 숫자보다 사람 얼굴이 먼저 떠올랐다.', effect: { mood: 'calm' } },

  // ───── adventurer ─────
  { id: 'nj_adventurer_first_quest', minAge: 16, maxAge: 40, cond: { jobs: ['adventurer'], maxJobRank: 1 }, text: '길드에서 처음 받은 의뢰는 잃어버린 고양이 찾기였다. 고양이는 의뢰인의 침대 밑에 있었다.' },
  { id: 'nj_adventurer_slime_hunt', minAge: 16, maxAge: 45, cond: { jobs: ['adventurer'], maxJobRank: 2 }, text: '슬라임 사냥에서 장화가 녹았다. 보상보다 신발값이 더 들었다.', tone: 'bad' },
  { id: 'nj_adventurer_guild_hall', minAge: 16, maxAge: 50, cond: { jobs: ['adventurer'], maxJobRank: 2 }, text: '길드 홀에서 선배들의 무용담을 안주 삼아 국밥을 먹었다.' },
  { id: 'nj_adventurer_party_split', minAge: 20, maxAge: 55, cond: { jobs: ['adventurer'], minJobRank: 2, maxJobRank: 3 }, text: '보상 분배로 파티가 한바탕 다퉜다. 저녁에는 모두 같은 식탁에서 웃고 있었다.' },
  { id: 'nj_adventurer_dungeon_return', minAge: 22, maxAge: 60, cond: { jobs: ['adventurer'], minJobRank: 3, maxJobRank: 3 }, text: '던전에서 살아 돌아왔다. 입구의 햇빛이 이렇게 눈부신 줄 처음 알았다.', tone: 'good' },
  { id: 'nj_adventurer_known_face', minAge: 25, maxAge: 65, cond: { jobs: ['adventurer'], minJobRank: 3 }, text: '길드 접수원이 먼저 이름을 불러 인사했다. 이제 얼굴이 알려진 모양이다.', effect: { stats: { fame: 2 } } },
  { id: 'nj_adventurer_aching_bones', minAge: 35, maxAge: 75, cond: { jobs: ['adventurer'], minJobRank: 4 }, text: '몸 곳곳이 쑤신다. 언제까지 검을 쥘 수 있을지 생각하는 밤이 늘었다.', tone: 'bad' },
  { id: 'nj_adventurer_s_rank_habit', minAge: 35, maxAge: 80, cond: { jobs: ['adventurer'], minJobRank: 5 }, text: '최고 등급이 되었지만 여전히 새벽마다 장비를 손질한다. 습관이란 그런 거다.', effect: { mood: 'calm' } },

  // ───── thief ─────
  { id: 'nj_thief_alley_run', minAge: 16, maxAge: 45, cond: { jobs: ['thief'], maxJobRank: 2 }, text: '골목길을 달려 추격을 따돌렸다. 숨을 고르며 지붕 위에서 웃음이 터졌다.' },
  { id: 'nj_thief_lockpick', minAge: 16, maxAge: 45, cond: { jobs: ['thief'], maxJobRank: 2 }, text: '새 자물쇠 따는 법을 익혔다. 연습용 상자의 비밀은 의외로 사과 한 알이었다.', effect: { stats: { luck: 2 } } },
  { id: 'nj_thief_roof_walk', minAge: 16, maxAge: 55, cond: { jobs: ['thief'], maxJobRank: 3 }, text: '달 없는 밤 지붕 위를 걸었다. 도시가 별처럼 반짝였다.', effect: { mood: 'calm' } },
  { id: 'nj_thief_guild_rules', minAge: 20, maxAge: 55, cond: { jobs: ['thief'], minJobRank: 2, maxJobRank: 3 }, text: '도적 길드의 규칙 세 가지는 「들키지 말 것」, 「다치지 말 것」, 「다음에 또 올 것」이었다.' },
  { id: 'nj_thief_close_call', minAge: 22, maxAge: 60, cond: { jobs: ['thief'], minJobRank: 3, maxJobRank: 3 }, text: '순찰대와 마주쳤지만 시치미를 떼고 지나쳤다. 심장 소리가 귓가에 울렸다.', tone: 'bad' },
  { id: 'nj_thief_teach_rookie', minAge: 30, maxAge: 70, cond: { jobs: ['thief'], minJobRank: 4 }, text: '신입에게 지붕 위 걷는 법을 가르쳤다. 첫마디는 「아래는 보지 마」였다.' },
  { id: 'nj_thief_legend_talk', minAge: 30, maxAge: 75, cond: { jobs: ['thief'], minJobRank: 4 }, text: '술집에서 내 별명이 전설처럼 오가는 걸 들었다. 모른 척 술잔을 들었다.', effect: { stats: { fame: 2 } } },
  { id: 'nj_thief_empty_hands', minAge: 40, maxAge: 90, cond: { jobs: ['thief'], minJobRank: 5 }, text: '훔친 것 하나 없는 밤, 지붕 위에 누워 별만 헤아렸다.', effect: { mood: 'calm' } },

  // ───── priest ─────
  { id: 'nj_priest_morning_prayer', minAge: 16, maxAge: 50, cond: { jobs: ['priest'], maxJobRank: 2 }, text: '새벽 기도를 드리다 졸아서 꾸벅 인사를 했다. 선배 사제가 아무 말 없이 담요를 덮어 주었다.' },
  { id: 'nj_priest_soup_charity', minAge: 16, maxAge: 55, cond: { jobs: ['priest'], maxJobRank: 2 }, text: '신전 앞에서 수프를 나눠 주었다. 빈 그릇과 함께 돌아오는 「고맙습니다」가 보상이다.', tone: 'good', effect: { stats: { cha: 2 } } },
  { id: 'nj_priest_first_blessing', minAge: 16, maxAge: 50, cond: { jobs: ['priest'], maxJobRank: 2 }, text: '처음으로 축복을 내렸다. 떨리는 손끝에 작은 빛이 앉았다.', tone: 'good', effect: { stats: { mana: 2 } } },
  { id: 'nj_priest_listening_night', minAge: 22, maxAge: 65, cond: { jobs: ['priest'], minJobRank: 2, maxJobRank: 3 }, text: '한 사람의 고민을 밤새 들었다. 내가 한 일은 고개를 끄덕이는 게 전부였다.' },
  { id: 'nj_priest_festival_mass', minAge: 22, maxAge: 70, cond: { jobs: ['priest'], minJobRank: 2, maxJobRank: 3 }, text: '축제 미사에서 합창단이 음정을 놓쳤다. 신도들이 웃으며 함께 불러 주었다.', tone: 'good' },
  { id: 'nj_priest_diocese_mediate', minAge: 30, maxAge: 75, cond: { jobs: ['priest'], minJobRank: 3 }, text: '교구 분쟁을 중재했다. 양쪽 모두의 말을 끝까지 듣는 일이 가장 어려웠다.' },
  { id: 'nj_priest_pilgrims', minAge: 30, maxAge: 80, cond: { jobs: ['priest'], minJobRank: 3 }, text: '순례자들이 신전을 찾아왔다. 먼지 낀 신발을 보며 그들의 길을 헤아렸다.' },
  { id: 'nj_priest_holy_quiet', minAge: 40, maxAge: 90, cond: { jobs: ['priest'], minJobRank: 4 }, text: '높은 자리에서 보는 신전은 조용했다. 기도 외에 아무것도 필요 없는 저녁이었다.', effect: { mood: 'calm' } },

  // ───── demon_officer ─────
  { id: 'nj_demon_officer_barracks_soup', minAge: 16, maxAge: 45, cond: { jobs: ['demon_officer'], maxJobRank: 2 }, text: '병영의 아침은 요란했다. 취사병이 만든 수프에서 이상한 맛이 났다.' },
  { id: 'nj_demon_officer_drill_laps', minAge: 16, maxAge: 45, cond: { jobs: ['demon_officer'], maxJobRank: 2 }, text: '오늘도 훈련장을 세 바퀴 돌았다. 교관이 「우리는 악당이지만 체력은 정직하다」고 외쳤다.', effect: { stats: { vit: 2 } } },
  { id: 'nj_demon_officer_scouting_bread', minAge: 16, maxAge: 55, cond: { jobs: ['demon_officer'], maxJobRank: 3 }, text: '인간 마을을 정찰하다 시장의 빵 냄새에 임무를 잊을 뻔했다.' },
  { id: 'nj_demon_officer_horn_stuck', minAge: 20, maxAge: 55, cond: { jobs: ['demon_officer'], minJobRank: 2, maxJobRank: 2 }, text: '백부장 임명식에서 투구 뿔이 문틀에 걸렸다. 부하들은 웃음을 참느라 어깨를 떨었다.', tone: 'bad' },
  { id: 'nj_demon_officer_troop_supper', minAge: 20, maxAge: 60, cond: { jobs: ['demon_officer'], minJobRank: 2, maxJobRank: 3 }, text: '부하들과 마왕성 앞 광장에서 야식을 즐겼다. 오늘만큼은 직급이 없었다.', tone: 'good', effect: { mood: 'joy' } },
  { id: 'nj_demon_officer_war_table', minAge: 28, maxAge: 70, cond: { jobs: ['demon_officer'], minJobRank: 3 }, text: '군단 작전 회의에서 지도 위의 말을 옮겼다. 전선은 먼 이야기처럼 느껴졌다.' },
  { id: 'nj_demon_officer_lord_praise', minAge: 32, maxAge: 75, cond: { jobs: ['demon_officer'], minJobRank: 4 }, text: '마왕 앞에 무릎 꿇을 때마다 어깨가 무겁다. 하지만 오늘은 칭찬을 들었다.', tone: 'good' },
  { id: 'nj_demon_officer_tower_tea', minAge: 35, maxAge: 90, cond: { jobs: ['demon_officer'], minJobRank: 4 }, text: '마왕성 탑에서 별빛 아래 홀로 차를 마셨다. 악당에게도 평화로운 밤은 필요하다.', effect: { mood: 'calm' } },

  // ───── hero ─────
  { id: 'nj_hero_sword_train', minAge: 16, maxAge: 40, cond: { jobs: ['hero'], maxJobRank: 2 }, text: '성검이 오늘도 무겁다. 한 번 더 휘두르자 칼끝이 바르게 섰다.', effect: { stats: { vit: 2 } } },
  { id: 'nj_hero_villagers_cheer', minAge: 16, maxAge: 40, cond: { jobs: ['hero'], maxJobRank: 2 }, text: '마을 사람들이 응원 깃발을 흔들며 배웅했다. 어색하지만 힘이 났다.', tone: 'good' },
  { id: 'nj_hero_first_monster', minAge: 16, maxAge: 40, cond: { jobs: ['hero'], maxJobRank: 2 }, text: '처음으로 마물을 베었다. 베고 나서 한참 동안 손이 떨렸다.' },
  { id: 'nj_hero_party_stars', minAge: 18, maxAge: 50, cond: { jobs: ['hero'], minJobRank: 2, maxJobRank: 3 }, text: '동료들과 모닥불 앞에 앉아 이름 모를 별자리를 지어냈다. 가장 웃긴 건 「양말자리」였다.', effect: { mood: 'joy' } },
  { id: 'nj_hero_fame_autograph', minAge: 20, maxAge: 55, cond: { jobs: ['hero'], minJobRank: 3, maxJobRank: 3 }, text: '가는 곳마다 사인 요청을 받았다. 용사라는 직함이 몸에 맞기 시작했다.' },
  { id: 'nj_hero_banquet_fork', minAge: 20, maxAge: 60, cond: { jobs: ['hero'], minJobRank: 3 }, text: '왕궁 연회에 초대받았다. 포크를 어느 쪽에 들어야 할지 몰라 한참 눈치를 봤다.' },
  { id: 'nj_hero_hero_doubt', minAge: 28, maxAge: 70, cond: { jobs: ['hero'], minJobRank: 4 }, text: '정말 용사다운 사람이 되고 있는지 문득 의문이 들었다. 답은 오래 걸릴 것 같다.' },
  { id: 'nj_hero_peace_cat', minAge: 30, maxAge: 90, cond: { jobs: ['hero'], minJobRank: 5 }, text: '마왕이 사라진 세상, 용사의 일은 길 잃은 고양이 찾기로 바뀌었다. 나쁘지 않다.', tone: 'good' },
];
