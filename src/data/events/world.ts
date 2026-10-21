import type { GameEvent } from '../../types';
import { MASKED_HINTS, TRUTH } from '../world';

/**
 * 세계의 끝과 진실 사건. 플래그는 엔진(src/engine/world.ts)이 정해진 나이에 세운다.
 *  - masked_1~3: 가면 쓴 사람 (1~3회차, 20~22세)
 *  - doom_*_now: 멸망의 날 (48~52세)
 *  - truth_open: 진실 루트가 열린 생 (4회차~)
 *  - white_dragon: 진실 루트를 끝까지 밟은 생의 마지막 날
 */
const masked = (n: number): GameEvent => ({
  id: `w_masked_${n}`, title: '가면 쓴 사람', once: true, milestone: true,
  cond: { flags: [`masked_${n}`] },
  text: `여관 구석에서, 가면을 쓰고 검은 옷을 뒤집어쓴 사람이 내 앞에 앉았다. 얼굴은 보이지 않았다. 그는 흥얼거리듯 노래를 불렀다. ${MASKED_HINTS[n - 1]}`,
  choices: [
    { label: '누구냐고 묻는다', success: { text: '대답 대신 노래만 한 번 더 들려주고, 그는 문밖의 어둠 속으로 사라졌다. 이상하게 그 가락이 귀에서 떠나지 않았다.', effect: { flags: ['heard_masked'] }, tone: 'milestone' } },
    { label: '가사를 받아 적는다', success: { text: '떨리는 손으로 노랫말을 수첩에 적었다. 고개를 들었을 때, 맞은편 의자는 비어 있었다.', effect: { flags: ['heard_masked'], stats: { int: 3 } }, tone: 'milestone' } },
  ],
});

const doom = (id: string, title: string, text: string, fight: string, stay: string, end: string): GameEvent => ({
  id: `w_${id}`, title, once: true, milestone: true,
  cond: { flags: [`${id}_now`] },
  text,
  choices: [
    { label: fight, success: { text: end, effect: { death: id }, tone: 'milestone' } },
    { label: stay, success: { text: end, effect: { death: id }, tone: 'milestone' } },
  ],
});

export const WORLD_EVENTS: GameEvent[] = [
  masked(1), masked(2), masked(3),

  doom('doom_dragon', '흑룡',
    '마침내 그날. 잿빛 하늘이 갈라지며 거대한 흑룡이 내려왔다. 나라는 순식간에 불바다가 되었다. 사람들은 비명을 지르고, 부모들은 아이를 찾아 울부짖었다. 불붙은 개가 거리를 헤매고, 양팔을 잃은 기사가 무릎을 꿇고 있었다.',
    '흑룡에게 맞선다 (전투력 1,000,000)', '불길 속에서 사람들을 끌어낸다',
    '내 모든 것을 걸었지만, 흑룡의 날개 한 번에 하늘과 땅이 뒤집혔다. 그렇게 나는, 이 세계와 함께 영원히 잠들었다.'),
  doom('doom_moon', '여섯째 달',
    '그날 밤, 일곱 개의 달 가운데 가장 큰 여섯째 달이 하늘에서 떨어지기 시작했다. 바다가 일어서고 산이 무너졌다. 하늘 전체가 달빛으로 하얗게 타올랐다.',
    '마지막까지 하늘을 올려다본다', '가장 소중한 사람의 손을 잡는다',
    '세상이 하얗게 지워졌다. 소리도, 빛도, 나도. 그렇게 나는, 이 세계와 함께 영원히 잠들었다.'),
  doom('doom_war', '세계대전',
    '모든 나라가 같은 날 서로에게 칼을 겨눴다. 하늘은 불화살로 붉었고, 땅은 군화 소리로 울렸다. 어제의 이웃이 오늘의 적이 되었다.',
    '전장으로 나간다', '피난민들을 이끌고 도망친다',
    '어느 편이 이겼는지 아는 사람은 아무도 남지 않았다. 그렇게 나는, 이 세계와 함께 영원히 잠들었다.'),
  doom('doom_vanish', '사라지는 사람들',
    '아침에 눈을 떴을 때, 거리에는 아무도 없었다. 빵집의 빵은 아직 따뜻했고, 광장의 분수는 그대로 흘렀다. 사람만이 사라져 있었다. 그리고 내 손끝도 조금씩 투명해지고 있었다.',
    '남은 사람을 찾아 헤맨다', '이름을 하나씩 소리 내어 부른다',
    '마지막으로 부른 이름이 누구였는지도 잊혀 갔다. 그렇게 나는, 이 세계와 함께 영원히 잠들었다.'),
  doom('doom_flood', '대홍수',
    '그치지 않던 비가 마침내 바다가 되었다. 성벽도, 탑도, 산꼭대기의 신전도 물 아래로 가라앉았다. 떠다니는 지붕 위에서 사람들이 서로를 끌어올렸다.',
    '물살을 거슬러 헤엄친다', '아이를 지붕 위로 올려 준다',
    '물이 모든 소리를 덮었다. 그렇게 나는, 이 세계와 함께 영원히 잠들었다.'),

  // ───── 진실 루트: 궁정 마법사 ─────
  {
    id: 'w_forbidden_library', title: '금서고', once: true, weight: 8,
    cond: { minAge: 22, jobs: ['mage'], minJobRank: 3, flags: ['truth_open'], notFlags: ['tr_lib'] },
    text: '수석 연구원이 되어 처음으로 금서고의 열쇠를 받았다. 먼지 쌓인 책장 사이에서, 노랫말과 똑같은 구절이 적힌 책을 발견했다. "금지된 책장 사이, 이름 없는 이가 기다리네."',
    choices: [
      { label: '책을 끝까지 읽는다', success: { text: '마지막 장에는 지도가 그려져 있었다. 「진리자」가 산다는 곳. 대마법사만이 들어갈 수 있는 봉인의 탑이었다.', effect: { flags: ['tr_lib'], stats: { int: 8, mana: 6 } }, tone: 'milestone' } },
      { label: '책을 덮고 잊는다', success: { text: '모르는 게 나을지도 모른다. 하지만 그날 밤, 꿈에서 하얀 날개를 보았다.', effect: { stress: 10 } } },
    ],
  },
  {
    id: 'w_truth_seeker', title: '진리자', once: true, weight: 10,
    cond: { minAge: 30, jobs: ['mage'], minJobRank: 5, flags: ['truth_open', 'tr_lib'], notFlags: ['tr_truth'] },
    text: '대마법사의 인장으로 봉인의 탑을 열었다. 꼭대기 방에는 얼굴 없는 노인이 앉아 있었다. 「진리자」. 그가 입을 열었다.',
    choices: [
      { label: '진실을 듣는다', success: { text: TRUTH.join(' '), effect: { flags: ['tr_truth'] }, tone: 'milestone' } },
    ],
  },

  // ───── 진실 루트: 용사 ─────
  {
    id: 'w_comrade_1', title: '첫 번째 동료', once: true, weight: 8,
    cond: { minAge: 20, jobs: ['hero'], flags: ['truth_open'], notFlags: ['tr_comp1'] },
    text: '노랫말이 떠올랐다. "세 사람의 손을 잡고." 국경의 성채에서, 혼자 마물 떼를 막아 내던 방패병을 만났다.',
    choices: [{ label: '함께 가자고 손을 내민다', success: { text: '방패병은 말없이 내 손을 잡았다. 첫 번째 동료다.', effect: { flags: ['tr_comp1'], stats: { def: 6 } }, tone: 'milestone' } }],
  },
  {
    id: 'w_comrade_2', title: '두 번째 동료', once: true, weight: 8,
    cond: { minAge: 20, jobs: ['hero'], flags: ['truth_open', 'tr_comp1'], notFlags: ['tr_comp2'] },
    text: '숲 속 마녀의 오두막. 쫓겨난 마녀는 내가 오기를 알고 있었다는 듯 차를 따르고 있었다.',
    choices: [{ label: '함께 가자고 손을 내민다', success: { text: '"노래를 들었구나. 나도 들었어." 두 번째 동료다.', effect: { flags: ['tr_comp2'], stats: { mana: 6 } }, tone: 'milestone' } }],
  },
  {
    id: 'w_comrade_3', title: '세 번째 동료', once: true, weight: 8,
    cond: { minAge: 20, jobs: ['hero'], flags: ['truth_open', 'tr_comp2'], notFlags: ['tr_comp3'] },
    text: '뒷골목에서 내 지갑을 노리던 소매치기의 손목을 붙잡았다. 손목에, 노랫말과 같은 문양의 문신이 있었다.',
    choices: [{ label: '함께 가자고 손을 내민다', success: { text: '"…세 번째 손이라는 게 나야?" 세 번째 동료다. 이제 성검을 뽑을 차례다.', effect: { flags: ['tr_comp3'], stats: { luck: 6 } }, tone: 'milestone' } }],
  },

  // ───── 백룡: 진실 루트의 마지막 날 ─────
  {
    id: 'w_white_dragon_mage', title: '백룡', once: true, milestone: true,
    cond: { flags: ['white_dragon', 'tr_truth'] },
    text: '하늘이 물들던 한 해가 끝나고, 그날이 왔다. 그러나 내려온 것은 흑룡이 아니라 눈부신 백룡이었다. 전투력 1,000,000. 진리자의 말이 떠올랐다. "아무것도 갖지 않은 자만이 닿는다."',
    choices: [
      { label: '모든 힘을 내려놓는다 (전투력 0)', success: { text: '지팡이를, 마력을, 이름을 내려놓았다. 전투력 0. 아무것도 아닌 손끝이 백룡의 비늘에 닿는 순간, 백룡은 소리 없이 무너졌다. 하늘이 원래 빛으로 돌아왔다. 사람들은 아무것도 모른 채 내일을 맞이했다.', effect: { death: 'happy_end' }, tone: 'milestone' } },
    ],
  },
  {
    id: 'w_white_dragon_hero', title: '백룡', once: true, milestone: true,
    cond: { flags: ['white_dragon', 'tr_comp3', 'slew_demon_lord'] },
    text: '하늘이 물들던 한 해가 끝나고, 그날이 왔다. 내려온 것은 눈부신 백룡이었다. 전투력 1,000,000. 세 동료가 내 등 뒤에 섰다. 성검이 처음으로 떨고 있었다.',
    choices: [
      { label: '동료들과 함께 성검을 내리친다', success: { text: '방패가 숨결을 막고, 마녀의 불꽃이 길을 열고, 소매치기의 단검이 비늘 틈을 찔렀다. 그리고 성검이 백룡의 심장에 닿았다. 하늘이 원래 빛으로 돌아왔다. 사람들은 아무것도 모른 채 내일을 맞이했다.', effect: { death: 'happy_end' }, tone: 'milestone' } },
    ],
  },
];
