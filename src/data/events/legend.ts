import type { GameEvent, Legend, LifeState } from '../../types';
import { josa } from '../../engine/text';

/** 이 종류의 전설 중 가장 최근 것 */
const latest = (s: LifeState, kinds?: Legend['kind'][]) =>
  (s.legends ?? []).find((l) => !kinds || kinds.includes(l.kind));

const hasLegend = (kinds?: Legend['kind'][]) => (s: LifeState) => !!latest(s, kinds);

/** 「드래곤을 쓰러뜨린 영웅 아르테」 */
const title = (l: Legend | undefined) => (l ? `${l.deed} ${l.kind === 'villain' ? '마인' : l.kind === 'sage' ? '현자' : '영웅'} ${l.name}` : '');

/** 전생의 전설: 지난 생의 내가 이야기가 되어 돌아온다 (Wildermyth) */
export const LEGEND_EVENTS: GameEvent[] = [
  {
    id: 'lg_statue', title: '광장의 동상', once: true, weight: 2,
    cond: { minAge: 6, maxAge: 60, test: hasLegend(['hero']) },
    text: (s) => `마을 광장에 커다란 동상이 서 있다. 받침돌에는 「${title(latest(s, ['hero']))}」. …어쩐지 거울을 보는 기분이다. 저 포즈, 내가 자주 하던 건데?`,
    choices: [
      { label: '동상 앞에서 맹세한다',
        success: { text: '"이번 생도 멋지게 살아볼게." 동상이 햇빛을 받아 반짝 웃은 것 같았다.', effect: { will: 15, stats: { fame: 6 } }, tone: 'good' } },
      { label: '동상 머리 위에 올라가 본다', check: { stat: 'luck', dc: 70 },
        success: { text: '꼭대기에서 본 마을은 장난감 같았다. 동상 왕관 틈에서 낡은 금화 한 닢을 발견했다!', effect: { stats: { luck: 14 }, gold: 30 }, tone: 'good' },
        fail: { text: '경비병에게 딱 걸렸다. "위인의 머리를 밟다니!" 너도 그 위인이었다고 말해봤자 소용없다.', effect: { stats: { fame: -3 }, karma: -2 } } },
    ],
  },
  {
    id: 'lg_bard', title: '음유시인의 노래', once: true, weight: 2,
    cond: { minAge: 10, maxAge: 75, test: hasLegend() },
    text: (s) => `주점에서 음유시인이 노래한다. "옛날 옛적, ${josa(title(latest(s)), '이')} 살았다네~" 가사가 이상하게 구체적이다. 거기 그 부분, 실제로는 그렇게 멋있지 않았는데…`,
    choices: [
      { label: '따라 부른다',
        success: { text: '주점 전체가 합창했다. 누구보다 가사를 잘 아는 당신에게 박수가 쏟아졌다.', effect: { stats: { cha: 8 }, mood: 'joy' }, tone: 'good' } },
      { label: '"그거 사실 나야!" 라고 외친다', check: { stat: 'cha', dc: 98 },
        success: { text: '처음엔 다들 웃었지만, 당신만 아는 비화를 줄줄 늘어놓자 주점이 조용해졌다. 그날 밤 당신은 화제의 인물이 됐다.', effect: { stats: { fame: 14 } }, tone: 'good' },
        fail: { text: '"술 취했구먼." 주점 주인이 물 한 잔을 내밀었다. 억울하다. 진짜인데.', effect: { stats: { cha: -6 } } } },
    ],
  },
  {
    id: 'lg_book', title: '위인전', once: true, weight: 1.5, focus: 'study',
    cond: { minAge: 7, maxAge: 30, test: hasLegend(['hero', 'sage']) },
    text: (s) => `도서관 구석에서 낡은 위인전을 발견했다. 『${title(latest(s, ['hero', 'sage']))}의 생애』. 읽다 보니 페이지마다 기억이 새록새록 떠오른다.`,
    auto: { success: { text: '전생의 내가 남긴 메모가 책 여백에 적혀 있었다. "다음 생의 나에게: 너무 무리하지 마." 마음이 따뜻해졌다.',
      effect: { stats: { int: 8 }, will: 10, stress: -10 }, tone: 'good' } },
  },
  {
    id: 'lg_villain', title: '악명 높은 이름', once: true, weight: 2,
    cond: { minAge: 8, maxAge: 60, test: hasLegend(['villain']) },
    text: (s) => `"말 안 들으면 ${josa(latest(s, ['villain'])?.name ?? '', '이')} 잡아간다!" 엄마들이 아이를 겁줄 때 쓰는 이름. 그 이름이 왠지 귓가에 오래 남는다. …그거, 전생의 나잖아.`,
    choices: [
      { label: '전생의 죄를 갚기로 한다',
        success: { text: '마을 고아원에 몰래 금화를 두고 왔다. 조금은 가벼워진 기분이다.', effect: { karma: 12 }, tone: 'good' } },
      { label: '그 이름을 이어받는다',
        success: { text: '"후후후… 그 이름, 내가 다시 떨쳐주지." 어둠의 마력이 손끝에서 꿈틀댔다.', effect: { karma: -8, stats: { mana: 14 }, mood: 'anger' } } },
    ],
  },
  {
    id: 'lg_ghost', title: '작은 유령', once: true, weight: 2,
    cond: { minAge: 5, maxAge: 50, test: hasLegend(['ghost']) },
    text: (s) => {
      const l = latest(s, ['ghost'])!;
      return `무덤가에서 작은 유령이 훌쩍이고 있다. "나는 ${l.name}… ${l.age}살에 여기서 멈췄어." 고개를 든 유령이 당신을 보고 눈을 크게 떴다. "…어? 너, 나잖아?"`;
    },
    choices: [
      { label: '꼭 안아준다',
        success: { text: '"이번엔 오래오래 살아줘." 유령이 빛이 되어 당신 안으로 스며들었다. 몸이 따뜻하다.', effect: { stats: { vit: 14, luck: 14 }, karma: 5, mood: 'calm' }, tone: 'good' } },
      { label: '같이 숨바꼭질을 한다',
        success: { text: '해가 질 때까지 놀았다. 유령은 깔깔 웃다가 노을 속으로 사라졌다. 행운이 따라올 것 같다.', effect: { stats: { luck: 22 }, mood: 'joy' }, tone: 'good' } },
    ],
  },
];
