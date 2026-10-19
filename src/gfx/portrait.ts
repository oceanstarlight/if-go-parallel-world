import type { LifeState } from '../types';
import { Painter, bayer, darken, grayscale, hashStr, lighten, mix, seeded } from './painter';

export type Mood = 'neutral' | 'happy' | 'sad';

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
  };
}

export const specKey = (p: PortraitSpec) =>
  `${p.seed}|${p.stage}|${p.houseId}|${p.jobId}|${p.jobRank}|${p.dead}|${p.mood ?? ''}|${p.injured ?? ''}`;

/** 올해 기록의 마지막 결과로 표정을 정한다 */
function moodOf(s: LifeState): Mood {
  if (s.death || s.pendingEventId) return 'neutral';
  for (let i = s.log.length - 1; i >= 0 && s.log[i].age === s.age; i--) {
    const t = s.log[i].tone;
    if (t === 'good') return 'happy';
    if (t === 'bad') return 'sad';
  }
  return 'neutral';
}

// ───────────────────────── 팔레트 ─────────────────────────

export type Ramp = [light: string, base: string, shadow: string];

const HAIR: Record<string, Ramp> = {
  brown: ['#b07c44', '#7a4e2a', '#4a2e1a'],
  auburn: ['#d0703c', '#984428', '#5e281c'],
  black: ['#56506a', '#302a3e', '#1a1624'],
  blonde: ['#f4d878', '#c8a040', '#8a6626'],
  platinum: ['#f4f0e0', '#cac2b0', '#8a8474'],
  crimson: ['#d04a52', '#8e2636', '#541422'],
  violet: ['#9464bc', '#623c86', '#3a2252'],
  silver: ['#ececf0', '#b4b4c0', '#7a7a8e'],
};

const HOUSE_HAIR: Record<string, string[]> = {
  farm: ['brown', 'auburn', 'blonde', 'brown'],
  merchant: ['black', 'brown', 'auburn'],
  noble: ['platinum', 'blonde', 'platinum'],
  demon: ['black', 'violet', 'crimson'],
  hero: ['blonde', 'blonde', 'auburn'],
};

const EYES: Record<string, string[]> = {
  farm: ['#5a8a4a', '#7a5a3a'],
  merchant: ['#6a4a2a', '#3a3a4a'],
  noble: ['#4a78c8', '#7a5ab0'],
  demon: ['#e8303e'],
  hero: ['#3e8ae0'],
};

const SKINS: Ramp[] = [
  ['#f8d8b4', '#eab48c', '#c08066'],
  ['#f0c49c', '#d89a72', '#a86c54'],
  ['#d8a478', '#b47c56', '#7e5440'],
];
const DEMON_SKIN: Ramp = ['#e0d4e4', '#b8a6c4', '#7e6a90'];

const BG: Record<string, [string, string]> = {
  farm: ['#3e5238', '#141a14'],
  merchant: ['#38506a', '#10161e'],
  noble: ['#5a3e6e', '#18101e'],
  demon: ['#6e2228', '#1a080c'],
  hero: ['#3e5a8e', '#0e1424'],
};

const OUTLINE = '#120c10';

export interface Outfit {
  base: string;
  light: string;
  shadow: string;
  trim: string;
}

const HOUSE_OUTFIT: Record<string, Outfit> = {
  farm: { base: '#8a6a48', light: '#ae8c64', shadow: '#5e4630', trim: '#c8b080' },
  merchant: { base: '#3e6a5a', light: '#5a8e7a', shadow: '#26443a', trim: '#e8dcc0' },
  noble: { base: '#3a4a8e', light: '#5a6cb4', shadow: '#232e5e', trim: '#e0b850' },
  demon: { base: '#3a2232', light: '#5a3650', shadow: '#22121e', trim: '#b02a3a' },
  hero: { base: '#4a6aa4', light: '#6a8cc8', shadow: '#2e4470', trim: '#e0c070' },
};

const JOB_OUTFIT: Record<string, Outfit> = {
  farmer: { base: '#7a6a44', light: '#9e8c60', shadow: '#52462c', trim: '#c8a060' },
  knight: { base: '#8e98a6', light: '#d0d8e2', shadow: '#545c6a', trim: '#a8303a' },
  mage: { base: '#463a80', light: '#6656a8', shadow: '#2a2252', trim: '#e0c060' },
  merchant: { base: '#7a3a2a', light: '#a45640', shadow: '#4e2218', trim: '#e0b850' },
  adventurer: { base: '#4e5a3a', light: '#6e7c50', shadow: '#323a24', trim: '#b04a32' },
  priest: { base: '#e2dccc', light: '#fffaf0', shadow: '#a8a090', trim: '#d0a640' },
  demon_officer: { base: '#2e2838', light: '#4a4058', shadow: '#18141e', trim: '#b8283a' },
  hero: { base: '#b8c4d4', light: '#eef2f8', shadow: '#76829a', trim: '#e0b850' },
};

// ───────────────────────── 기하 ─────────────────────────

interface Geo {
  cx: number;
  cy: number; // 머리 중심
  rx: number;
  ry: number;
  eyeY: number;
  eyeDx: number;
  shoulderY: number;
  shoulderW: number;
}

const GEO: Record<Stage, Geo> = {
  baby: { cx: 32, cy: 31, rx: 13, ry: 12.5, eyeY: 33, eyeDx: 5, shoulderY: 49, shoulderW: 16 },
  child: { cx: 32, cy: 28, rx: 11.5, ry: 12, eyeY: 30, eyeDx: 5, shoulderY: 46, shoulderW: 18 },
  teen: { cx: 32, cy: 27, rx: 10.5, ry: 12, eyeY: 28, eyeDx: 5, shoulderY: 44, shoulderW: 21 },
  adult: { cx: 32, cy: 26, rx: 10, ry: 12, eyeY: 27, eyeDx: 5, shoulderY: 43, shoulderW: 23 },
  elder: { cx: 32, cy: 26, rx: 10, ry: 12, eyeY: 27, eyeDx: 5, shoulderY: 44, shoulderW: 22 },
};

export type HairStyle = 'short' | 'swept' | 'long' | 'tied' | 'spiky';

export interface Look {
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
  const beard = spec.stage === 'elder' && rnd() < 0.5;
  const adultish = spec.stage === 'adult' || spec.stage === 'elder' || spec.stage === 'teen';
  const job = adultish ? spec.jobId : null;
  const outfit = (job && JOB_OUTFIT[job]) || HOUSE_OUTFIT[house] || HOUSE_OUTFIT.farm;
  return { hair, eye, skin, style, beard, job, outfit };
}

export function drawPortrait(spec: PortraitSpec, blink = false): Painter {
  const g = GEO[spec.stage];
  const house = spec.houseId;
  const demon = house === 'demon';
  const { hair, eye, skin, style, beard, job, outfit } = lookOf(spec);

  // 1) 배경
  const bg = new Painter(64, 64);
  const [bl, bd] = BG[house] ?? BG.farm;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const d = Math.hypot((x - 32) / 34, (y - 26) / 34);
      const t = Math.min(1, d);
      const steps = [bl, mix(bl, bd, 0.45), mix(bl, bd, 0.75), bd];
      const f = t * 3;
      const k = Math.min(2, Math.floor(f));
      bg.px(x, y, bayer(x, y) < f - k ? steps[k + 1] : steps[k]);
    }
  }

  // 2) 인물 레이어
  const fig = new Painter(64, 64);

  // 2-1) 뒷머리
  if (spec.stage !== 'baby') {
    fig.ellipse(g.cx, g.cy - 2, g.rx + 2, g.ry + 1, hair[1]);
    if (style === 'long') {
      fig.rect(g.cx - g.rx - 2, g.cy, 5, 22, hair[2]);
      fig.rect(g.cx + g.rx - 2, g.cy, 5, 22, hair[2]);
    }
    if (style === 'tied') fig.ellipse(g.cx + g.rx + 1, g.cy - 6, 4, 5, hair[2]);
  }

  // 2-2) 몸
  drawBody(fig, g, spec, outfit);

  // 2-3) 목
  if (spec.stage !== 'baby') {
    const nw = spec.stage === 'child' ? 8 : 10;
    fig.rect(g.cx - nw / 2, g.cy + g.ry - 4, nw, g.shoulderY - (g.cy + g.ry - 4) + 2, skin[2]);
    fig.rect(g.cx - nw / 2, g.cy + g.ry - 4, 2, g.shoulderY - (g.cy + g.ry - 4) + 2, skin[1]);
  }
  // 깃 / 옷 위 장식은 목 위에
  drawCollar(fig, g, spec, outfit, job);

  // 2-4) 얼굴
  fig.ellipse(g.cx - g.rx - 0.5, g.eyeY + 1, 1.6, 2.6, skin[1]);
  fig.ellipse(g.cx + g.rx + 0.5, g.eyeY + 1, 1.6, 2.6, skin[2]);
  fig.ellipse(g.cx, g.cy, g.rx, g.ry - (spec.stage === 'baby' ? 0 : 1), skin[1]);
  if (spec.stage !== 'baby') {
    const chinY = g.cy + g.ry;
    fig.poly([[g.cx - g.rx + 1, g.cy + 2], [g.cx + g.rx, g.cy + 2], [g.cx + 5, chinY - 2], [g.cx, chinY], [g.cx - 5, chinY - 2]], skin[1]);
  }
  // 음영: 오른쪽 아래
  fig.ellipseWhere(g.cx, g.cy, g.rx, g.ry + 1, skin[2], (x, y) => {
    const s = (x - g.cx) / g.rx + (y - g.cy) / g.ry * 0.4;
    return fig.get(x, y) === skin[1] && (s > 0.72 || (s > 0.64 && (x + y) % 2 === 0));
  });
  // 하이라이트: 이마와 왼쪽 볼에 작게
  fig.rect(g.cx - 5, g.cy - g.ry + 4, 3, 2, skin[0]);
  fig.rect(g.cx - g.rx + 2, g.eyeY + 3, 2, 2, skin[0]);

  // 볼 홍조 (아이)
  if (spec.stage === 'baby' || spec.stage === 'child') {
    const blush = mix(skin[1], '#e06070', 0.45);
    fig.rect(g.cx - g.eyeDx - 2, g.eyeY + 3, 3, 1, blush);
    fig.rect(g.cx + g.eyeDx, g.eyeY + 3, 3, 1, blush);
  }

  // 2-5) 눈 / 눈썹 / 코 / 입
  const big = spec.stage === 'baby' || spec.stage === 'child';
  for (const side of [-1, 1]) {
    const ex = g.cx + side * g.eyeDx;
    const ey = g.eyeY;
    if (spec.dead || blink) {
      fig.rect(ex - 2, ey + 1, 5, 1, darken(skin[2], 0.4));
      continue;
    }
    fig.rect(ex - 2, ey - 1, 5, 1, OUTLINE);
    fig.rect(ex - 2, ey, 5, big ? 3 : 2, '#f4f0ea');
    fig.rect(ex - 1, ey, 3, big ? 3 : 2, eye);
    fig.px(ex, ey + 1, darken(eye, 0.55));
    if (big) fig.px(ex, ey + 2, darken(eye, 0.55));
    fig.px(ex - 1, ey, '#ffffff');
    if (demon) fig.px(ex + 1, ey, lighten(eye, 0.4));
    // 눈썹
    if (spec.stage !== 'baby') {
      const by = ey - 3 - (big ? 1 : 0);
      if (spec.mood === 'sad') {
        // 안쪽 끝이 올라간 눈썹
        fig.rect(ex - 2, by + 1, 5, 1, hair[2]);
        fig.px(side < 0 ? ex + 2 : ex - 2, by, hair[2]);
        fig.px(side < 0 ? ex + 2 : ex - 2, by + 1, null);
      } else {
        fig.rect(ex - 2, by, 5, 1, hair[2]);
        fig.px(side < 0 ? ex - 2 : ex + 2, by + 1, hair[2]);
      }
    }
  }
  // 코
  fig.px(g.cx + 1, g.eyeY + 4, skin[2]);
  if (!big) fig.px(g.cx + 1, g.eyeY + 5, skin[2]);
  // 입
  const my = g.eyeY + (big ? 7 : 8);
  const lip = spec.dead ? darken(skin[2], 0.3) : mix(skin[2], '#902838', 0.5);
  if (!spec.dead && spec.mood === 'happy') {
    fig.rect(g.cx - 1, my + 1, 2, 1, lip);
    fig.px(g.cx - 2, my, lip);
    fig.px(g.cx + 1, my, lip);
  } else if (!spec.dead && spec.mood === 'sad') {
    fig.rect(g.cx - 1, my, 2, 1, lip);
    fig.px(g.cx - 2, my + 1, lip);
    fig.px(g.cx + 1, my + 1, lip);
  } else {
    fig.rect(g.cx - 2, my, 4, 1, lip);
  }
  // 주름 (노인)
  if (spec.stage === 'elder') {
    fig.px(g.cx - g.eyeDx - 2, g.eyeY + 2, skin[2]);
    fig.px(g.cx + g.eyeDx + 2, g.eyeY + 2, skin[2]);
    fig.line(g.cx - 3, g.eyeY + 5, g.cx - 4, g.eyeY + 8, skin[2]);
    fig.line(g.cx + 4, g.eyeY + 5, g.cx + 5, g.eyeY + 8, skin[2]);
  }
  if (beard) {
    const by = g.eyeY + 6;
    fig.poly([[g.cx - g.rx + 1, by], [g.cx + g.rx - 1, by], [g.cx + 6, by + 10], [g.cx, by + 13], [g.cx - 6, by + 10]], hair[1]);
    fig.rect(g.cx - 2, my, 4, 1, hair[2]);
    fig.ellipseWhere(g.cx, by + 5, g.rx, 8, hair[0], (x, y) => fig.get(x, y) === hair[1] && (x + y) % 3 === 0 && x < g.cx);
  }

  // 2-6) 앞머리
  drawFrontHair(fig, g, spec, hair, style);

  // 부상: 이마의 붕대, 볼의 멍, 반쯤 감긴 눈
  if (spec.injured) {
    const fy = g.cy - g.ry + 5;
    fig.rect(g.cx - g.rx, fy, g.rx * 2 + 1, 3, '#ece4d4');
    fig.rect(g.cx - g.rx, fy + 2, g.rx * 2 + 1, 1, '#b8ae9c');
    fig.rect(g.cx + 3, fy, 2, 2, '#b8323a');
    fig.px(g.cx + g.rx + 1, fy + 3, '#ece4d4');
    fig.px(g.cx + g.rx + 2, fy + 4, '#ece4d4');
    fig.rect(g.cx + g.eyeDx - 1, g.eyeY + 3, 3, 2, mix(skin[2], '#6a3a7a', 0.45));
    for (const side of [-1, 1]) fig.rect(g.cx + side * g.eyeDx - 2, g.eyeY, 5, 1, skin[2]);
    fig.line(g.cx - g.eyeDx - 3, g.eyeY + 4, g.cx - g.eyeDx - 1, g.eyeY + 6, '#a83a3a');
  }

  // 2-7) 머리 장식 (뿔, 모자, 관)
  drawHeadgear(fig, g, spec, job, outfit, hair);

  fig.outline(OUTLINE);

  // 3) 합성
  bg.blit(fig, 0, 0);
  // 사망: 흑백 + 어둡게
  if (spec.dead) bg.map((c) => darken(grayscale(c), 0.25));
  return bg;
}

function drawBody(fig: Painter, g: Geo, spec: PortraitSpec, o: Outfit) {
  const top = g.shoulderY;
  const w = g.shoulderW;
  if (spec.stage === 'baby') {
    // 강보
    fig.ellipse(32, 60, 20, 14, '#e8e0d0');
    fig.ellipseWhere(32, 60, 20, 14, '#c0b4a0', (x, y) => x > 36 || (y > 58 && (x + y) % 2 === 0));
    fig.rect(14, 52, 36, 2, '#d0a860');
    return;
  }
  fig.poly([[32 - w - 6, 64], [32 - w, top + 4], [32 - w + 6, top], [32 + w - 6, top], [32 + w, top + 4], [32 + w + 6, 64]], o.base);
  // 명암: 오른쪽 어둡게, 왼쪽 위 밝게
  fig.map((c, x, y) => {
    if (c !== o.base || y < top) return c;
    if (x > 32 + w * 0.55) return x > 32 + w * 0.62 || (x + y) % 2 === 0 ? o.shadow : c;
    if (x < 32 - w * 0.5 && y < top + 7) return o.light;
    return c;
  });
  // 옷 주름
  fig.line(32 - w + 8, top + 8, 32 - w + 6, 63, o.shadow);
  fig.line(32 + w - 10, top + 6, 32 + w - 8, 63, o.shadow);
}

function drawCollar(fig: Painter, g: Geo, spec: PortraitSpec, o: Outfit, job: string | null) {
  if (spec.stage === 'baby') return;
  const top = g.shoulderY;
  const w = g.shoulderW;
  switch (job) {
    case 'knight':
    case 'hero':
    case 'demon_officer': {
      // 견갑
      const spiky = job === 'demon_officer';
      for (const side of [-1, 1]) {
        const px = 32 + side * (w - 2);
        fig.ellipse(px, top + 6, 8, 6, o.base);
        fig.ellipseWhere(px, top + 6, 8, 6, o.light, (_x, y) => y < top + 3);
        fig.ellipseWhere(px, top + 6, 8, 6, o.shadow, (_x, y) => y > top + 9);
        fig.rect(px - 7, top + 6, 15, 1, o.trim);
        if (spiky) fig.poly([[px - 3, top + 2], [px + side * 6, top - 9], [px + 3, top + 1]], o.shadow);
      }
      // 고르젯
      fig.rect(25, top - 2, 15, 5, o.shadow);
      fig.rect(25, top - 2, 15, 1, o.light);
      // 흉갑 문장 / 망토 깃
      if (job === 'knight') {
        fig.rect(29, top + 6, 7, 18, o.trim);
        fig.rect(31, top + 9, 3, 5, '#e8d8a0');
      } else if (job === 'hero') {
        fig.poly([[32, top + 8], [36, top + 13], [32, top + 18], [28, top + 13]], '#e0b850');
        fig.px(32, top + 13, '#7ad0ff');
        fig.rect(8, top + 2, 4, 20, '#2e5aa8');
        fig.rect(52, top + 2, 4, 20, '#1e3e7a');
      } else {
        fig.poly([[32, top + 6], [37, top + 12], [32, top + 20], [27, top + 12]], o.trim);
        if (spec.jobRank >= 5) {
          fig.rect(6, top - 2, 5, 24, '#8a1422');
          fig.rect(53, top - 2, 5, 24, '#5a0c16');
        }
      }
      break;
    }
    case 'mage':
      fig.poly([[24, top - 3], [32, top + 10], [40, top - 3], [42, top + 2], [32, top + 16], [22, top + 2]], o.shadow);
      fig.rect(31, top + 4, 3, 20, o.trim);
      fig.px(32, top + 18, '#9adcff');
      break;
    case 'priest':
      fig.rect(27, top, 3, 18, '#3e5aa8');
      fig.rect(35, top, 3, 18, '#3e5aa8');
      fig.rect(31, top + 6, 3, 9, o.trim);
      fig.rect(29, top + 8, 7, 3, o.trim);
      break;
    case 'merchant':
      fig.poly([[26, top - 1], [32, top + 14], [38, top - 1]], '#f0ead8');
      fig.poly([[30, top + 2], [34, top + 2], [33, top + 9], [31, top + 9]], o.trim);
      if (spec.jobRank >= 4) {
        fig.ellipse(18, top + 2, 8, 4, '#8a6a4a');
        fig.ellipse(46, top + 2, 8, 4, '#6a4e36');
      }
      break;
    case 'adventurer':
      fig.ellipse(32, top + 1, 14, 4, o.shadow); // 내려간 후드
      fig.rect(27, top + 1, 11, 3, o.trim); // 스카프
      fig.line(20, top + 4, 44, 63, '#5a3a22'); // 가죽끈
      fig.line(21, top + 4, 45, 63, '#7a5232');
      break;
    case 'farmer':
      fig.rect(24, top + 2, 4, 20, '#5a4a30');
      fig.rect(37, top + 2, 4, 20, '#5a4a30');
      break;
    default:
      if (spec.houseId === 'noble') {
        // 프릴 깃
        for (let i = 0; i < 6; i++) fig.ellipse(23 + i * 3.6, top + 1, 2.5, 2.5, '#f4f0e6');
        fig.rect(30, top + 4, 5, 2, o.trim);
      } else if (spec.houseId === 'merchant') {
        fig.poly([[26, top - 1], [32, top + 8], [38, top - 1]], o.trim);
      } else if (spec.houseId === 'demon') {
        fig.rect(24, top, 17, 2, o.trim);
      } else {
        fig.poly([[28, top - 1], [32, top + 6], [36, top - 1]], o.shadow);
      }
  }
}

function drawFrontHair(fig: Painter, g: Geo, spec: PortraitSpec, hair: Ramp, style: HairStyle) {
  const { cx, cy, rx, ry } = g;
  if (spec.stage === 'baby') {
    // 정수리의 작은 곱슬
    fig.ellipse(cx, cy - ry + 2, 4, 2, hair[1]);
    fig.px(cx + 1, cy - ry - 1, hair[1]);
    fig.px(cx + 2, cy - ry - 2, hair[1]);
    fig.px(cx - 1, cy - ry + 1, hair[0]);
    return;
  }
  const top = cy - ry - 1;
  // 앞머리 아래선
  const fringe = (x: number): number => {
    const t = (x - (cx - rx)) / (2 * rx); // 0~1
    switch (style) {
      case 'swept':
        return top + 4 + Math.round(t * 6) + ((x & 1) ? 0 : 1);
      case 'spiky':
        return top + 6 + ((x % 4) < 2 ? 2 : 0);
      default:
        return top + 6 + ((x % 3 === 0) ? 2 : 0) + (Math.abs(x - cx) < 2 ? -1 : 0);
    }
  };
  for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
    const fy = fringe(x);
    for (let y = top - 2; y <= fy; y++) {
      const dx = (x - cx) / (rx + 2);
      const dy = (y - (cy - 2)) / (ry + 1);
      if (dx * dx + dy * dy <= 1) fig.px(x, y, hair[1]);
    }
  }
  // 옆머리 (구레나룻)
  const sideLen = style === 'long' ? 18 : style === 'short' || style === 'spiky' ? 6 : 9;
  fig.rect(cx - rx - 2, cy - 4, 3, sideLen, hair[1]);
  fig.rect(cx + rx, cy - 4, 3, sideLen, hair[2]);
  if (style === 'spiky') {
    for (let i = 0; i < 5; i++) {
      const sx = cx - rx + 2 + i * 4.5;
      fig.poly([[sx - 2, top + 2], [sx + 1, top - 5 - (i % 2) * 2], [sx + 3, top + 2]], hair[1]);
    }
  }
  // 명암
  fig.map((c, x, y) => {
    if (c !== hair[1]) return c;
    if (y < top + 3 && x < cx + 2 && x > cx - rx + 1 && (x + y) % 2 === 0) return hair[0];
    if (x > cx + rx * 0.4) return hair[2];
    return c;
  });
  // 광택 띠
  fig.line(cx - rx + 3, top + 2, cx - 1, top, hair[0]);
}

function drawHeadgear(fig: Painter, g: Geo, spec: PortraitSpec, job: string | null, o: Outfit, hair: Ramp) {
  const { cx, cy, ry } = g;
  const top = cy - ry - 1;
  const demon = spec.houseId === 'demon' || job === 'demon_officer';
  void hair;

  if (demon && spec.stage !== 'baby') {
    const hs = spec.stage === 'child' ? 0.7 : 1;
    for (const side of [-1, 1]) {
      const bx = cx + side * 7;
      fig.poly([[bx - 2, top + 3], [bx + side * 6 * hs, top - 7 * hs], [bx + side * 9 * hs, top - 12 * hs], [bx + side * 4 * hs, top - 4 * hs], [bx + 2, top + 4]], '#3a3044');
      fig.line(bx, top + 2, bx + side * 7 * hs, top - 9 * hs, '#6e5e7e');
    }
  }
  if (spec.stage === 'baby' || spec.stage === 'child') return;

  switch (job) {
    case 'farmer':
      fig.ellipse(cx, top + 4, 18, 3.5, '#d8b860');
      fig.ellipse(cx, top - 1, 10, 6, '#c8a448');
      fig.rect(cx - 10, top + 1, 20, 2, '#8a3a2a');
      fig.ellipseWhere(cx, top + 4, 18, 3.5, '#a8883e', (x, y) => y > top + 4 || x > cx + 10);
      break;
    case 'mage': {
      const rank = spec.jobRank;
      const hatC = rank >= 4 ? '#2a1e5a' : o.base;
      fig.ellipse(cx, top + 4, 17, 3, hatC);
      fig.poly([[cx - 10, top + 3], [cx + 10, top + 3], [cx + 5, top - 10], [cx + 12, top - 18], [cx + 1, top - 12]], hatC);
      fig.ellipseWhere(cx, top + 4, 17, 3, darken(hatC, 0.35), (_x, y) => y > top + 4);
      fig.rect(cx - 9, top + 1, 18, 2, o.trim);
      if (rank >= 3) fig.px(cx + 3, top - 4, '#ffe680');
      if (rank >= 5) { fig.px(cx - 3, top - 1, '#9adcff'); fig.px(cx + 12, top - 18, '#ffe680'); }
      break;
    }
    case 'priest': {
      // 두건
      fig.ellipseWhere(cx, cy - 2, g.rx + 3, ry + 2, '#ece6d6', (x, y) => y < top + 4 || Math.abs(x - cx) > g.rx - 1);
      fig.rect(cx - 6, top + 2, 12, 1, o.trim);
      if (spec.jobRank >= 4) {
        fig.poly([[cx - 7, top + 1], [cx + 7, top + 1], [cx + 4, top - 12], [cx, top - 15], [cx - 4, top - 12]], '#f4f0e4');
        fig.rect(cx - 1, top - 11, 2, 9, o.trim);
        fig.rect(cx - 3, top - 8, 6, 2, o.trim);
      }
      break;
    }
    case 'hero': {
      fig.rect(cx - 9, top + 4, 18, 1, '#e0b850');
      fig.poly([[cx - 2, top + 4], [cx, top + 1], [cx + 2, top + 4]], '#e0b850');
      fig.px(cx, top + 3, spec.jobRank >= 5 ? '#ffffff' : '#7ad0ff');
      break;
    }
    case 'demon_officer':
      if (spec.jobRank >= 5) {
        for (let i = -2; i <= 2; i++) fig.poly([[cx + i * 4 - 2, top + 2], [cx + i * 4, top - 5 - (i === 0 ? 3 : 0)], [cx + i * 4 + 2, top + 2]], '#2a2230');
        fig.rect(cx - 10, top + 1, 21, 2, '#2a2230');
        fig.px(cx, top - 1, '#e8303e');
      }
      break;
    case 'knight':
      if (spec.jobRank >= 5) fig.rect(cx - 9, top + 3, 18, 1, '#c8ccd6');
      break;
  }
}
