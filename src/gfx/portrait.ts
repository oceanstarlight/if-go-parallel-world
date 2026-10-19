import type { LifeState } from '../types';
import { Painter, bayer, grayscale, hashStr, lighten, mix, seeded } from './painter';
import { type BackHair, type Bangs, drawFigure, hairStyleOf } from './dotportrait';
import { genderOfName } from '../data/names';

export type Mood = 'neutral' | 'happy' | 'sad' | 'angry' | 'afraid';

export type Stage = 'baby' | 'child' | 'teen' | 'adult' | 'elder';

export interface PortraitSpec {
  seed: number;
  stage: Stage;
  houseId: string;
  jobId: string | null;
  jobRank: number;
  dead: boolean;
  /** 표정: 올해 일어난 일의 결과에 따라 */
  mood?: Mood;
  /** 체력이 낮으면 붕대와 멍 */
  injured?: boolean;
  /** 'm' | 'f'. 없으면 시드로 정한다 */
  gender?: 'm' | 'f';
}

export function stageOf(age: number): Stage {
  if (age < 3) return 'baby';
  if (age < 13) return 'child';
  if (age < 18) return 'teen';
  if (age < 55) return 'adult';
  return 'elder';
}

export function specFromLife(s: LifeState): PortraitSpec {
  return {
    seed: hashStr(s.name + s.houseId),
    stage: stageOf(s.age),
    houseId: s.houseId,
    jobId: s.jobId,
    jobRank: s.jobRank,
    dead: !!s.death,
    mood: moodOf(s),
    injured: !s.death && s.age >= 3 && s.stats.vit < 25,
    gender: s.gender ?? genderOfName(s.name),
  };
}

export const specKey = (p: PortraitSpec) =>
  `${p.seed}|${p.stage}|${p.houseId}|${p.jobId}|${p.jobRank}|${p.dead}|${p.mood ?? ''}|${p.injured ?? ''}|${p.gender ?? ''}`;

const MOOD_FACE: Record<string, Mood> = { joy: 'happy', gloom: 'sad', anger: 'angry', fear: 'afraid' };

/** 기분이 있으면 그 표정, 없으면 올해 기록의 마지막 결과로 표정을 정한다 */
function moodOf(s: LifeState): Mood {
  if (s.death || s.pendingEventId) return 'neutral';
  if (s.mood && MOOD_FACE[s.mood]) return MOOD_FACE[s.mood];
  for (let i = s.log.length - 1; i >= 0 && s.log[i].age === s.age; i--) {
    const t = s.log[i].tone;
    if (t === 'good') return 'happy';
    if (t === 'bad') return 'sad';
  }
  return 'neutral';
}

// ───────────────────────── 팔레트 (애니풍 비비드) ─────────────────────────

export type Ramp = [light: string, base: string, shadow: string];

const HAIR: Record<string, Ramp> = {
  chestnut: ['#e8a868', '#b8703c', '#7e4428'],
  gold: ['#fff2a0', '#ffd25a', '#e09a30'],
  auburn: ['#ffa070', '#e8603c', '#a83a2c'],
  mint: ['#c8ffe8', '#6ee0b8', '#2ea488'],
  raven: ['#7a8ac8', '#3a4078', '#1e2048'],
  teal: ['#8ef0f0', '#2ab8c8', '#16788e'],
  platinum: ['#ffffff', '#e8eef8', '#a8b4d0'],
  lavender: ['#f0d8ff', '#c49af0', '#8a5ac8'],
  pink: ['#ffd0e8', '#ff8cc0', '#d0508c'],
  crimson: ['#ff8a9a', '#e83a5a', '#9e1e44'],
  sky: ['#d0f0ff', '#68c0ff', '#3478d0'],
  silver: ['#ffffff', '#dcdcec', '#9a9ab8'],
};

const HOUSE_HAIR: Record<string, string[]> = {
  farm: ['chestnut', 'gold', 'auburn', 'mint'],
  merchant: ['raven', 'chestnut', 'teal', 'pink'],
  noble: ['platinum', 'gold', 'lavender', 'pink'],
  demon: ['lavender', 'crimson', 'raven'],
  hero: ['gold', 'sky', 'gold'],
  elf: ['platinum', 'gold', 'mint'],
  dwarf: ['auburn', 'chestnut', 'crimson'],
  beastkin: ['chestnut', 'gold', 'auburn', 'raven'],
  eastern: ['raven', 'raven', 'pink'],
  mermaid: ['teal', 'sky', 'pink'],
  sky: ['sky', 'platinum', 'lavender'],
  witch: ['raven', 'lavender', 'crimson'],
  slime: ['sky'],
};

const EYES: Record<string, string[]> = {
  farm: ['#3ec070', '#e89a30'],
  merchant: ['#e8a030', '#2ab0c0'],
  noble: ['#3a88ff', '#b05aff', '#ff5aa8'],
  demon: ['#ff2a50'],
  hero: ['#2ab0ff'],
  elf: ['#3ec070', '#2ab0c0'],
  dwarf: ['#e8a030', '#8a5a3a'],
  beastkin: ['#ffb020', '#3ec070'],
  eastern: ['#5a3a8a', '#e83a5a'],
  mermaid: ['#2ac0e0', '#b05aff'],
  sky: ['#68c0ff', '#ffd25a'],
  witch: ['#b05aff', '#3ec070'],
  slime: ['#2a5aa8'],
};

const SKINS: Ramp[] = [
  ['#fffaf6', '#ffece2', '#f8c4b8'],
  ['#fff6ee', '#ffe2d2', '#f4b8a8'],
  ['#fff0e4', '#fad6c0', '#eaa894'],
];
const DEMON_SKIN: Ramp = ['#fff0ff', '#ecdcf4', '#c0a4d8'];

/** 배경: [중심, 바깥] 파스텔 그라데이션 */
const BG: Record<string, [string, string]> = {
  farm: ['#e8fff0', '#8ad8b0'],
  merchant: ['#e4fbff', '#7ac8e8'],
  noble: ['#fff0fa', '#d8a0e0'],
  demon: ['#ffe4f4', '#a85ac8'],
  hero: ['#fffbe0', '#7ab8ff'],
  elf: ['#f0fff0', '#7ad8a0'],
  dwarf: ['#fff0e0', '#e8a070'],
  beastkin: ['#fffbe0', '#e8c870'],
  eastern: ['#fff0f6', '#ffa8c8'],
  mermaid: ['#e8fcff', '#58b8e8'],
  sky: ['#ffffff', '#a8d8ff'],
  witch: ['#f8f0ff', '#9a7ad0'],
  slime: ['#f0fbff', '#88d8f0'],
};

export interface Outfit {
  base: string;
  light: string;
  shadow: string;
  trim: string;
}

const HOUSE_OUTFIT: Record<string, Outfit> = {
  farm: { base: '#7ac85a', light: '#b0e888', shadow: '#4e9840', trim: '#fff0b0' },
  merchant: { base: '#3ab8b0', light: '#7ee0d8', shadow: '#22888a', trim: '#fff4dc' },
  noble: { base: '#5a7aff', light: '#98b0ff', shadow: '#3a50c8', trim: '#ffd85a' },
  demon: { base: '#8a4ac8', light: '#b880f0', shadow: '#5e2e98', trim: '#ff5a8a' },
  hero: { base: '#3aa0ff', light: '#88ccff', shadow: '#2a6ad0', trim: '#ffd85a' },
  elf: { base: '#5ac87a', light: '#9ae8a8', shadow: '#3a9858', trim: '#fff0a0' },
  dwarf: { base: '#c86a3a', light: '#e8986a', shadow: '#984a2a', trim: '#ffd05a' },
  beastkin: { base: '#e8a050', light: '#ffc888', shadow: '#b8783a', trim: '#7ac85a' },
  eastern: { base: '#ff6a8a', light: '#ffa8bc', shadow: '#d0406a', trim: '#ffffff' },
  mermaid: { base: '#3ac0d8', light: '#88e8f8', shadow: '#2a8aa8', trim: '#ffb8e0' },
  sky: { base: '#ffffff', light: '#ffffff', shadow: '#c8dcf8', trim: '#68c0ff' },
  witch: { base: '#4a3a8a', light: '#7a6ac0', shadow: '#2e2260', trim: '#c8a0ff' },
  slime: { base: '#68c0ff', light: '#a8e0ff', shadow: '#3a88d0', trim: '#ffffff' },
};

const JOB_OUTFIT: Record<string, Outfit> = {
  farmer: { base: '#8ac860', light: '#bce890', shadow: '#5a9a40', trim: '#ffd880' },
  knight: { base: '#c8d4ec', light: '#ffffff', shadow: '#8a9ac0', trim: '#ff5a6a' },
  mage: { base: '#7a5aff', light: '#b09aff', shadow: '#4e34c0', trim: '#ffd85a' },
  merchant: { base: '#ff8a5a', light: '#ffb890', shadow: '#d05a3a', trim: '#ffe070' },
  adventurer: { base: '#5ab878', light: '#8ee0a0', shadow: '#3a8858', trim: '#ff6a5a' },
  priest: { base: '#ffffff', light: '#ffffff', shadow: '#c8d4ec', trim: '#ffc83a' },
  demon_officer: { base: '#6a3aa8', light: '#9a6ad8', shadow: '#40207a', trim: '#ff3a7a' },
  hero: { base: '#e4ecff', light: '#ffffff', shadow: '#a4b4e0', trim: '#ffc83a' },
  court: { base: '#3a4a8a', light: '#5a6ab8', shadow: '#262f60', trim: '#ffd85a' },
  thief: { base: '#3e3a4a', light: '#5e5a70', shadow: '#26222e', trim: '#a07aff' },
};

export type HairStyle = 'short' | 'swept' | 'long' | 'tied' | 'spiky';

export interface Look {
  gender: 'm' | 'f';
  bangs: Bangs;
  back: BackHair;
  hair: Ramp;
  eye: string;
  skin: Ramp;
  style: HairStyle;
  beard: boolean;
  job: string | null;
  outfit: Outfit;
}

/** 시드로 정해지는 외형. 초상화와 전투 스프라이트가 공유한다. */
export function lookOf(spec: PortraitSpec): Look {
  const rnd = seeded(spec.seed);
  const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const house = spec.houseId;
  const hair = HAIR[spec.stage === 'elder' ? 'silver' : pick(HOUSE_HAIR[house] ?? HOUSE_HAIR.farm)];
  const eye = pick(EYES[house] ?? EYES.farm);
  const skin = house === 'demon' ? DEMON_SKIN : pick(SKINS);
  const style: HairStyle = pick(['short', 'swept', 'long', 'tied', 'spiky']);
  const gender = spec.gender ?? (spec.seed % 2 ? 'f' : 'm');
  const { bangs, back } = hairStyleOf(gender, spec.stage, rnd);
  const grown = spec.stage === 'adult' || spec.stage === 'elder';
  // 수염: 남성 노인 절반, 드워프 성인 남성은 언제나
  const beard = gender === 'm' && ((spec.stage === 'elder' && rnd() < 0.5) || (house === 'dwarf' && grown));
  const adultish = spec.stage === 'adult' || spec.stage === 'elder' || spec.stage === 'teen';
  const job = adultish ? spec.jobId : null;
  const outfit = (job && JOB_OUTFIT[job]) || HOUSE_OUTFIT[house] || HOUSE_OUTFIT.farm;
  return { gender, bangs, back, hair, eye, skin, style, beard, job, outfit };
}

/**
 * blink: 눈 감은 프레임, sway: 머리카락 흔들림 프레임(0/1)
 */
export function drawPortrait(spec: PortraitSpec, blink = false, sway = 0): Painter {
  const house = spec.houseId;
  const look = lookOf(spec);
  const { hair, eye, skin, beard, job, outfit } = look;
  const rnd = seeded(spec.seed + 7);

  // 1) 배경: 파스텔 원형 그라데이션 + 반짝이
  const bg = new Painter(64, 64);
  const [bl, bd] = BG[house] ?? BG.farm;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const t = Math.min(1, Math.hypot((x - 30) / 40, (y - 22) / 40));
      const steps = [bl, mix(bl, bd, 0.35), mix(bl, bd, 0.7), bd];
      const f = t * 3;
      const k = Math.min(2, Math.floor(f));
      bg.px(x, y, bayer(x, y) < f - k ? steps[k + 1] : steps[k]);
    }
  }
  // 보케 원
  for (let i = 0; i < 5; i++) {
    const x = rnd() * 64, y = rnd() * 40, r = 2 + rnd() * 4;
    bg.ellipseWhere(x, y, r, r, lighten(bd, 0.5), (px, py) => (px + py) % 2 === 0);
  }
  // 반짝이 별
  for (let i = 0; i < 4; i++) {
    const x = Math.round(4 + rnd() * 56), y = Math.round(3 + rnd() * 26);
    bg.px(x, y, '#ffffff');
    bg.px(x - 1, y, lighten(bl, 0.6));
    bg.px(x + 1, y, lighten(bl, 0.6));
    bg.px(x, y - 1, lighten(bl, 0.6));
    bg.px(x, y + 1, lighten(bl, 0.6));
  }

  // 2) 인물 레이어
  const fig = new Painter(64, 64);
  const sw = sway ? 1 : 0;

  if (house === 'slime') {
    drawSlime(fig, spec, eye, blink, sw);
    fig.outlineTinted();
    bg.blit(fig, 0, 0);
    if (spec.dead) bg.map((c) => mix(grayscale(c), '#f4f4ff', 0.25));
    return bg;
  }

  // 2-1) 인물: 32×32 도트 지도 레이어를 2배로 키운다
  const small = drawFigure({
    gender: look.gender, stage: spec.stage, houseId: house, job, jobRank: spec.jobRank,
    mood: spec.mood ?? 'neutral', blink, dead: spec.dead, injured: !!spec.injured, sway: sw,
    hair, skin, eye, outfit, bangs: look.bangs, back: look.back, beard,
  });
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const c = small.get(x, y);
      if (c) fig.rect(x * 2, y * 2, 2, 2, c);
    }
  }

  // 3) 합성
  bg.blit(fig, 0, 0);
  // 사망: 부드러운 흑백 (천상의 빛)
  if (spec.dead) bg.map((c) => mix(grayscale(c), '#f4f4ff', 0.25));
  return bg;
}

/** 슬라임: 사람 대신 말랑한 젤리 몸 */
function drawSlime(fig: Painter, spec: PortraitSpec, eye: string, blink: boolean, sw: number) {
  const body = '#68c0ff', light = '#b8e8ff', shade = '#3a88d0';
  const grow = { baby: 0.7, child: 0.82, teen: 0.92, adult: 1, elder: 1 }[spec.stage];
  const rx = 22 * grow, ry = 17 * grow - sw;
  const cy = 63 - ry;
  fig.ellipse(32, cy, rx, ry, body);
  fig.rect(32 - rx, cy, rx * 2, 63 - cy, body);
  fig.poly([[32 - 4, cy - ry + 1], [32 + sw, cy - ry - 7 * grow], [32 + 4, cy - ry + 1]], body); // 꼭지
  fig.ellipseWhere(32, cy, rx, ry, shade, (x, y) => x > 32 + rx * 0.45 || y > cy + ry * 0.55);
  fig.ellipse(32 - rx * 0.45, cy - ry * 0.35, rx * 0.22, ry * 0.18, light);
  fig.px(32 - rx * 0.6, cy - ry * 0.55, '#ffffff');
  const ey = cy - 1;
  for (const side of [-1, 1]) {
    const ex = 32 + side * 7 * grow;
    if (spec.dead || blink) {
      fig.rect(ex - 2, ey + 2, 4, 1, '#2a3a6a');
    } else {
      fig.rect(ex - 1, ey - 2, 3, 6, eye);
      fig.rect(ex - 1, ey - 2, 2, 2, '#ffffff');
    }
  }
  if (!spec.dead) {
    fig.rect(32 - 2, ey + 5, 4, 1, '#2a3a6a');
    if (spec.mood === 'happy') fig.rect(32 - 1, ey + 6, 2, 1, '#ff8aa0');
    fig.rect(32 - 14 * grow, ey + 4, 3, 1, '#ff9ab8');
    fig.rect(32 + 11 * grow, ey + 4, 3, 1, '#ff9ab8');
  }
  if (spec.stage === 'elder') fig.rect(26, cy - ry - 2, 12, 2, '#ffffff');
  if (spec.jobId === 'demon_officer' && spec.jobRank >= 5) fig.rect(26, cy - ry - 3, 12, 3, '#ffd85a');
}
