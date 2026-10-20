import type { Trait } from '../types';

/**
 * 타고난 특성. 태어날 때 0~2개를 받는다 (Rogue Legacy 의 유전 특성 방식).
 * 희귀도 1·2·3 을 55·33·12% 로 고른 뒤 그 안에서 하나를 뽑고, 서로 모순되면 다시 뽑는다.
 */
export const TRAITS: Trait[] = [
  // ── 흔함 ──
  { id: 'lost', name: '길치', rarity: 1, desc: '지도를 거꾸로 든다. 탐험 성장 -30%, 대신 엉뚱한 곳에서 행운을 줍는다.',
    focusMul: { explore: 0.7 }, stats: { luck: 11 } },
  { id: 'glutton', name: '대식가', rarity: 1, desc: '밥이 보약. 시작 체력 +12, 매력 -4.', stats: { vit: 17, cha: -6 } },
  { id: 'early_bird', name: '아침형 인간', rarity: 1, desc: '새벽 수련이 즐겁다. 수련 성장 +25%.',
    focusMul: { train: 1.25 }, conflicts: ['night_owl'] },
  { id: 'night_owl', name: '올빼미족', rarity: 1, desc: '밤에 머리가 맑아진다. 학업 성장 +25%.',
    focusMul: { study: 1.25 }, conflicts: ['early_bird'] },
  { id: 'chatty', name: '수다쟁이', rarity: 1, desc: '입이 쉬지 않는다. 교류 성장 +25%, 지성 판정 -5.',
    focusMul: { social: 1.25 }, checkBonus: { int: -5 }, conflicts: ['shy'] },
  { id: 'shy', name: '낯가림', rarity: 1, desc: '사람이 무섭다. 교류 성장 -25%, 대신 의지력 +15.',
    focusMul: { social: 0.75 }, will: 15, conflicts: ['chatty'] },
  { id: 'clumsy', name: '덜렁이', rarity: 1, desc: '아무것도 없는 데서 넘어진다. 체력 판정 -5, 매력 +6 (귀엽다).',
    checkBonus: { vit: -5 }, stats: { cha: 8 } },
  { id: 'acrophobia', name: '고소공포증', rarity: 1, desc: '높은 곳은 무리. 탐험 성장 -15%, 마력 +6.',
    focusMul: { explore: 0.85 }, stats: { mana: 8 } },
  { id: 'carefree', name: '태평함', rarity: 1, desc: '어떻게든 되겠지~ 스트레스가 절반만 쌓인다. 지성 -8.',
    stressMul: 0.5, stats: { int: -11 }, conflicts: ['sensitive'] },
  { id: 'sensitive', name: '예민함', rarity: 1, desc: '사소한 것도 신경 쓰인다. 스트레스 1.5배, 지성 판정 +6.',
    stressMul: 1.5, checkBonus: { int: 6 }, conflicts: ['carefree'] },
  { id: 'cat_allergy', name: '고양이 알레르기', rarity: 1, desc: '에취! 이세계에도 고양이는 많다. 매력 -4, 행운 +4.',
    stats: { cha: -6, luck: 6 } },

  // ── 드묾 ──
  { id: 'perfect_pitch', name: '절대음감', rarity: 2, desc: '노래 한 소절에 다들 돌아본다. 매력 +10, 매력 판정 +5.',
    stats: { cha: 14 }, checkBonus: { cha: 5 } },
  { id: 'iron_stomach', name: '강철 위장', rarity: 2, desc: '독도 소화한다(?). 체력 +6, 체력 판정 +6.',
    stats: { vit: 8 }, checkBonus: { vit: 6 } },
  { id: 'lucky_mole', name: '복점', rarity: 2, desc: '입가의 점이 복을 부른다. 행운 +20.', stats: { luck: 28 } },
  { id: 'stubborn', name: '고집불통', rarity: 2, desc: '한다면 한다. 의지력 +30, 매력 -6.', will: 30, stats: { cha: -8 } },
  { id: 'animal_friend', name: '동물 친화', rarity: 2, desc: '들짐승도 꼬리를 흔든다. 탐험 성장 +20%, 행운 +6.',
    focusMul: { explore: 1.2 }, stats: { luck: 8 } },
  { id: 'bookworm', name: '책벌레', rarity: 2, desc: '책만 있으면 행복하다. 학업 성장 +30%, 체력 -6.',
    focusMul: { study: 1.3 }, stats: { vit: -8 }, conflicts: ['meathead'] },
  { id: 'meathead', name: '근육뇌', rarity: 2, desc: '생각보다 몸이 먼저. 수련 성장 +30%, 지성 -10.',
    focusMul: { train: 1.3 }, stats: { int: -14 }, conflicts: ['bookworm'] },
  { id: 'gorgeous', name: '눈부신 외모', rarity: 2, desc: '지나가면 꽃잎이 흩날린다(는 소문). 매력 +20.', stats: { cha: 28 } },
  { id: 'unnoticed', name: '존재감 제로', rarity: 2, desc: '아무도 못 본다. 명성 성장 절반, 행운 판정 +8.',
    growthMul: { fame: 0.5 }, checkBonus: { luck: 8 } },

  // ── 희귀 ──
  { id: 'plot_armor', name: '주인공 보정', rarity: 3, desc: '이야기는 아직 안 끝났다. 죽음을 한 번 버틴다.', extraLives: 1 },
  { id: 'genius', name: '천재', rarity: 3, desc: '한 번 보면 안다. 지성 +20, 지성 성장 +30%.',
    stats: { int: 28 }, growthMul: { int: 1.3 } },
  { id: 'mana_surge', name: '마력 과다', rarity: 3, desc: '몸에서 마력이 넘친다. 마력 +30, 대신 스트레스 1.3배.',
    stats: { mana: 42 }, stressMul: 1.3 },
  { id: 'longevity', name: '장수 유전자', rarity: 3, desc: '할머니도 증조할머니도 백 살. 노화가 20% 느리다.', agingMul: 0.8 },
  { id: 'past_echo', name: '전생의 잔상', rarity: 3, desc: '꿈에서 지난 생을 본다. 의지력 +15, 행운 +10.', will: 15, stats: { luck: 14 } },
  { id: 'trouble_magnet', name: '사건 자석', rarity: 3, desc: '가는 곳마다 일이 터진다. 사건 발생 +30%, 행운 -16.',
    eventRate: 1.3, stats: { luck: -22 } },
];

export const traitById = (id: string) => TRAITS.find((t) => t.id === id);

/** 특성 개수 확률: 0개 15% · 1개 50% · 2개 35% */
export function rollTraits(rng: () => number): string[] {
  const r = rng();
  const n = r < 0.15 ? 0 : r < 0.65 ? 1 : 2;
  const out: string[] = [];
  for (let guard = 0; out.length < n && guard < 50; guard++) {
    const q = rng();
    const rarity = q < 0.55 ? 1 : q < 0.88 ? 2 : 3;
    const pool = TRAITS.filter((t) => t.rarity === rarity);
    const t = pool[Math.floor(rng() * pool.length)];
    // 같은 특성이나 모순되는 특성이면 다시 뽑는다
    if (out.includes(t.id) || out.some((o) => t.conflicts?.includes(o) || traitById(o)?.conflicts?.includes(t.id))) continue;
    out.push(t.id);
  }
  return out;
}

export const RARITY_NAME = ['', '흔함', '드묾', '희귀'] as const;
