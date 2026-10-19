import type { Choice, GameEvent, RelKey } from '../../types';

/**
 * 출신의 숙명 (Sir Brante 의 의지력).
 * 출신이 정해준 길을 따르면 무난한 보상, 거스르려면 의지력을 써야 한다.
 */
const conform = (label: string, text: string, effect: Choice['success']['effect']): Choice =>
  ({ label, success: { text, effect, tone: 'good' } });

const defy = (label: string, will: number, text: string, effect: Choice['success']['effect']): Choice =>
  ({ label, will, success: { text, effect: { ...effect, flags: [...(effect?.flags ?? []), 'defied_fate'] }, tone: 'milestone' } });

const destiny = (id: string, house: string, title: string, text: string, choices: Choice[], minAge = 14, maxAge = 26): GameEvent =>
  ({ id, title, once: true, weight: 3, cond: { minAge, maxAge, houses: [house], ...(house === 'demon' ? { flags: ['demon_joined'] } : {}) }, text, choices });

export const DESTINY_EVENTS: GameEvent[] = [
  destiny('d_farm', 'farm', '물려받는 밭',
    '아버지가 흙 묻은 손으로 땅문서를 내밀었다. "이제 이 밭은 네 거다." 하지만 마음 한구석에선 왕도의 불빛이 반짝인다.', [
      conform('농부의 길을 걷는다', '씨를 뿌리고 해를 따라 사는 삶. 몸도 마음도 단단해졌다.', { stats: { vit: 5, luck: 3 }, karma: 3 }),
      defy('왕도로 떠난다고 선언한다', 25, '"죄송해요, 저는 더 넓은 세상을 보고 싶어요!" 짐 보따리 하나 들고 마을을 떠났다. 가슴이 두근거린다!',
        { stats: { fame: 4, int: 3 }, mood: 'joy' }),
    ]),
  destiny('d_merchant', 'merchant', '첫 장부',
    '"오늘부터 상단 견습이다." 두꺼운 장부가 책상 위에 쿵 놓였다. 창밖에선 음유시인의 노랫소리가 들려온다.', [
      conform('장부를 펼친다', '숫자 속에서 돈의 흐름이 보이기 시작했다. 장사꾼의 피는 못 속인다!', { stats: { int: 4, fame: 2, luck: 2 } }),
      defy('류트를 들고 거리로 나간다', 25, '"저는 노래로 먹고살 거예요!" 아버지의 고함을 뒤로하고 첫 공연을 했다. 동전이 쨍그랑 떨어졌다.',
        { stats: { cha: 8 }, mood: 'joy' }),
    ]),
  destiny('d_noble', 'noble', '정략 약혼',
    '대공이 무거운 목소리로 말했다. "이웃 영지의 후계자와 약혼이 정해졌다." 연회장의 모두가 당신을 바라본다.', [
      conform('가문의 뜻에 따른다', '우아하게 고개를 숙였다. 귀족 사회가 당신을 완벽한 후계자로 인정했다.', { stats: { fame: 6 }, flags: ['betrothed'] }),
      defy('모두 앞에서 약혼을 파기한다', 40, '"이 약혼, 없던 걸로 하겠어요!" 연회장이 술렁였다. 이건 그 유명한 악역영애 루트?! 하지만 속은 후련하다.',
        { stats: { cha: 5, fame: -2 }, mood: 'joy' }),
    ]),
  destiny('d_demon', 'demon', '첫 번째 명령',
    '군단장이 지도를 펼쳤다. "인간 마을을 습격해라. 마족으로서 첫 임무다." 지도 위 작은 마을에서 저녁 연기가 피어오르는 게 보인다.', [
      conform('명령대로 마을을 습격한다', '어둠 속에서 마력이 폭발했다. 군단장이 만족스럽게 웃었다. 하지만 마음 어딘가가 차갑다.', { stats: { mana: 6, fame: 3 }, karma: -15, mood: 'anger' }),
      defy('몰래 마을에 경고를 보낸다', 40, '한밤중, 마을 우물에 쪽지를 떨어뜨렸다. "도망쳐." 다음 날 마을은 텅 비어 있었다. 들키면 끝장이다…',
        { karma: 15, mood: 'fear' }),
    ]),
  destiny('d_elf', 'elf', '숲의 맹세',
    '세계수 아래 장로들이 모였다. "백 년 동안 숲을 떠나지 않겠다고 맹세하거라." 나뭇잎 사이로 인간 세상의 연기가 보인다.', [
      conform('세계수에 맹세한다', '세계수가 은빛 잎을 떨어뜨렸다. 숲의 마력이 몸에 스며든다.', { stats: { mana: 6 }, will: 10 }),
      defy('인간 세상을 보러 몰래 떠난다', 30, '달밤에 숲의 경계를 넘었다. 처음 본 인간 마을의 축제는 시끄럽고, 반짝이고, 너무 재밌다!',
        { stats: { cha: 5, luck: 5 }, mood: 'joy' }),
    ], 20, 60),
  destiny('d_dwarf', 'dwarf', '망치의 의식',
    '"드워프라면 망치를 들어야지!" 할아버지가 대대로 내려온 망치를 건넸다. 그런데 당신의 손끝에서 작은 불꽃 마법이 튄다.', [
      conform('망치를 든다', '땅! 땅! 첫 작품은 삐뚤빼뚤한 단검. 그래도 할아버지는 눈물을 글썽였다.', { stats: { vit: 6 } }),
      defy('"저는 마법사가 될래요!"', 30, '광산 도시 최초의 드워프 마법사 지망생. 다들 수염을 쓰다듬으며 웃었지만, 당신은 진지하다.',
        { stats: { mana: 8 }, mood: 'joy' }),
    ]),
  destiny('d_beastkin', 'beastkin', '성인식 사냥',
    '초원의 성인식. 혼자 사냥감을 잡아 와야 어른으로 인정받는다. 저 멀리 아기 사슴이 엄마를 찾아 울고 있다.', [
      { label: '사냥에 나선다', check: { stat: 'vit', dc: 30 },
        success: { text: '바람처럼 달려 큰 멧돼지를 잡았다! 부족 모두가 꼬리를 흔들며 환호했다.', effect: { stats: { vit: 5, fame: 3 } }, tone: 'good' },
        fail: { text: '멧돼지에게 쫓겨 나무 위로 도망쳤다… 성인식은 내년에 다시.', effect: { stats: { vit: -8 } } } },
      defy('사냥 대신 아기 사슴을 엄마에게 데려다준다', 30, '빈손으로 돌아왔지만, 족장은 한참 당신을 바라보다 고개를 끄덕였다. "새로운 어른의 방식이구나."',
        { stats: { cha: 6 }, karma: 8 }),
    ], 13, 16),
  destiny('d_eastern', 'eastern', '가문의 칼',
    '벚꽃 아래, 아버지가 가문의 칼을 내밀었다. "오늘부터 너는 무사다." 항구에서는 대륙으로 떠나는 배가 뱃고동을 울린다.', [
      conform('칼을 받든다', '칼날에 벚꽃잎이 내려앉아 둘로 갈라졌다. 무사의 길이 시작됐다.', { stats: { vit: 4, mana: 2 }, karma: 3 }),
      defy('배에 몰래 올라탄다', 30, '뱃전에서 멀어지는 섬을 바라봤다. "아버지, 죄송해요. 세상이 보고 싶어요!" 바닷바람이 짜고 시원하다.',
        { stats: { luck: 6, fame: 2 }, mood: 'joy' }),
    ]),
  destiny('d_mermaid', 'mermaid', '해변의 인간',
    '인어의 규율: 절대 인간과 말을 섞지 말 것. 그런데 폭풍이 지나간 해변에 인간 하나가 쓰러져 있다.', [
      conform('규율대로 바다로 돌아간다', '파도 속으로 몸을 돌렸다. 산호 궁전의 노래가 당신을 반겨준다.', { stats: { mana: 4 } }),
      defy('인간을 구하고 말을 건다', 35, '"괜찮아요?" 처음 내뱉은 인간의 말. 눈을 뜬 인간이 당신을 보고 말을 잃었다. 이건… 동화 속 이야기 같다.',
        { stats: { cha: 6 }, karma: 8 }),
    ]),
  destiny('d_sky', 'sky', '지상 금지령',
    '천공국의 법: 구름 아래로 내려가지 말 것. 하지만 구름 틈으로 보이는 초록빛 땅이 자꾸 손짓한다.', [
      conform('구름 위에 머문다', '천공 도서관에서 별의 지도를 공부했다. 하늘의 지혜가 쌓인다.', { stats: { int: 5 } }),
      defy('구름 아래로 뛰어내린다', 35, '바람을 가르며 떨어졌다! 날개 대신 망토가 펄럭인다. 처음 밟은 풀밭은 폭신하고 향기롭다.',
        { stats: { luck: 8, vit: -3 }, mood: 'joy' }),
    ]),
  destiny('d_witch', 'witch', '마녀 집회',
    '보름달 마녀 집회. 대마녀가 말했다. "이번엔 네 차례다. 저 마을에 저주를 걸어라." 냄비가 보글보글 끓는다.', [
      conform('저주를 건다', '마을에 사흘 내내 개구리 비가 내렸다. 대마녀가 깔깔 웃었다. 마력이 한층 진해졌다.', { stats: { mana: 6 }, karma: -10 }),
      defy('몰래 축복을 섞는다', 30, '저주 대신 풍년의 축복이 흩뿌려졌다. 대마녀는 눈을 가늘게 떴지만… 마을 아이들이 웃고 있다.',
        { stats: { cha: 3 }, karma: 10 }),
    ], 12, 30),
  destiny('d_slime', 'slime', '진화의 갈림길',
    '몸속에서 마력이 꿈틀댄다. 진화의 순간이다! 머릿속에 선택지가 떠오른다. [말랑말랑 계속하기] [인간의 모습 흉내 내기]', [
      conform('말랑말랑을 유지한다', '더 크고, 더 말랑하고, 더 튼튼해졌다! 슬라임 최고!', { stats: { vit: 6, luck: 3 } }),
      defy('인간의 모습을 흉내 낸다', 40, '쭈욱… 뿅! 거울 속에 인간 비슷한 무언가가 서 있다. 걸음마부터 다시 시작이다!',
        { stats: { cha: 8, int: 3 }, flags: ['humanform'] }),
    ], 8, 20),
];

/** 소중한 사람이 위험할 때 (Sir Brante 의 '대신 죽어주기') */
const blow = (key: RelKey, who: string): GameEvent => ({
  id: `x_blow_${key}`, title: '날아드는 칼날', once: true, weight: 0.8,
  cond: { minAge: 16, maxAge: 75, hasRel: [key], notFlags: ['blow_event'] },
  text: `한밤중의 습격! 어둠 속에서 번뜩인 칼날이 ${who} {${key}}에게 날아든다. 생각할 틈이 없다!`,
  choices: [
    { label: '몸을 던져 대신 맞는다 (불굴 목숨 -1)', cond: { test: (s) => s.extraLives > 0 },
      success: { text: `칼날이 가슴을 꿰뚫었다… 그리고 불굴의 육체가 다시 당신을 일으켜 세웠다. {${key}:이} 울면서 당신을 끌어안았다.`,
        effect: { extraLives: -1, rel: { [key]: 30 }, karma: 10, mood: 'joy', flags: ['blow_event', 'took_blow'] }, tone: 'milestone' } },
    { label: '몸을 던져 대신 맞는다', will: 40, cond: { test: (s) => s.extraLives === 0 },
      success: { text: `망설임 없이 {${key}}의 앞을 막아섰다. "괜찮아, 넌 살아." 마지막으로 본 건 {${key}}의 얼굴이었다.`,
        effect: { flags: ['blow_event', 'took_blow'], karma: 20, death: 'sacrifice' } } },
    { label: '끌어당겨 함께 피한다', check: { stat: 'vit', dc: 40 },
      success: { text: `{${key}:을} 끌어안고 바닥을 굴렀다! 칼날이 머리카락을 스치고 지나갔다. 둘 다 무사하다!`,
        effect: { rel: { [key]: 15 }, flags: ['blow_event'] }, tone: 'good' },
      fail: { text: `손이 한 뼘 모자랐다. {${key}:이} 당신의 품에서 천천히 눈을 감았다…`,
        effect: { removeRel: [key], flags: ['blow_event'], mood: 'gloom', stress: 25 } } },
  ],
});

export const BLOW_EVENTS: GameEvent[] = [blow('spouse', '반려'), blow('friend', '소꿉친구'), blow('mentor', '스승')];
