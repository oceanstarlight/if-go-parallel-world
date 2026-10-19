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
};

const EYES: Record<string, string[]> = {
  farm: ['#3ec070', '#e89a30'],
  merchant: ['#e8a030', '#2ab0c0'],
  noble: ['#3a88ff', '#b05aff', '#ff5aa8'],
  demon: ['#ff2a50'],
  hero: ['#2ab0ff'],
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
};

// ───────────────────────── 기하 ─────────────────────────

interface Geo {
  cx: number;
  cy: number; // 머리 중심
  rx: number;
  ry: number;
  eyeY: number;
  eyeDx: number;
  eyeH: number;
  shoulderY: number;
  shoulderW: number;
}

// 애니풍: 머리가 크고 눈이 얼굴 아래쪽에 크게 자리한다
const GEO: Record<Stage, Geo> = {
  baby: { cx: 32, cy: 31, rx: 14, ry: 13, eyeY: 32, eyeDx: 6, eyeH: 6, shoulderY: 50, shoulderW: 16 },
  child: { cx: 32, cy: 28, rx: 12.5, ry: 12.5, eyeY: 29, eyeDx: 6, eyeH: 6, shoulderY: 46, shoulderW: 17 },
  teen: { cx: 32, cy: 27, rx: 11.5, ry: 12.5, eyeY: 28, eyeDx: 5, eyeH: 6, shoulderY: 45, shoulderW: 20 },
  adult: { cx: 32, cy: 26, rx: 11, ry: 12.5, eyeY: 27, eyeDx: 5, eyeH: 5, shoulderY: 44, shoulderW: 22 },
  elder: { cx: 32, cy: 26, rx: 11, ry: 12.5, eyeY: 27, eyeDx: 5, eyeH: 4, shoulderY: 44, shoulderW: 21 },
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

/**
 * blink: 눈 감은 프레임, sway: 머리카락 흔들림 프레임(0/1)
 */
export function drawPortrait(spec: PortraitSpec, blink = false, sway = 0): Painter {
  const g = GEO[spec.stage];
  const house = spec.houseId;
  const { hair, eye, skin, style, beard, job, outfit } = lookOf(spec);
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

  // 2-1) 뒷머리
  if (spec.stage !== 'baby') {
    fig.ellipse(g.cx, g.cy - 2, g.rx + 2, g.ry + 1, hair[1]);
    if (style === 'long') {
      fig.poly([[g.cx - g.rx - 3, g.cy - 2], [g.cx - g.rx + 3, g.cy - 2], [g.cx - g.rx + 2 + sw, g.cy + 24], [g.cx - g.rx - 4 + sw, g.cy + 22]], hair[1]);
      fig.poly([[g.cx + g.rx - 3, g.cy - 2], [g.cx + g.rx + 3, g.cy - 2], [g.cx + g.rx + 4 + sw, g.cy + 22], [g.cx + g.rx - 2 + sw, g.cy + 24]], hair[2]);
    }
    if (style === 'tied') {
      // 포니테일
      fig.ellipse(g.cx + g.rx + 2, g.cy - 7, 4, 4, hair[1]);
      fig.poly([[g.cx + g.rx + 1, g.cy - 5], [g.cx + g.rx + 7, g.cy - 3], [g.cx + g.rx + 6 + sw, g.cy + 12], [g.cx + g.rx + 2 + sw, g.cy + 8]], hair[2]);
      fig.rect(g.cx + g.rx - 1, g.cy - 9, 3, 3, outfit.trim); // 리본
    }
  }

  // 2-2) 몸
  drawBody(fig, g, spec, outfit);

  // 2-3) 목
  if (spec.stage !== 'baby') {
    const nw = spec.stage === 'child' ? 6 : 7;
    const ny = g.cy + g.ry - 4;
    fig.rect(g.cx - nw / 2, ny, nw, g.shoulderY - ny + 2, skin[1]);
    fig.rect(g.cx - nw / 2, ny, nw, 3, skin[2]); // 턱 그림자
  }
  drawCollar(fig, g, spec, outfit, job);

  // 2-4) 얼굴: 둥근 볼 + 작은 턱
  fig.ellipse(g.cx - g.rx, g.eyeY + 2, 1.5, 2.5, skin[1]);
  fig.ellipse(g.cx + g.rx, g.eyeY + 2, 1.5, 2.5, skin[1]);
  fig.ellipse(g.cx, g.cy - 1, g.rx, g.ry - 2, skin[1]);
  if (spec.stage !== 'baby') {
    const chinY = g.cy + g.ry - 1;
    fig.poly([[g.cx - g.rx, g.cy], [g.cx + g.rx, g.cy], [g.cx + g.rx - 2, g.cy + 5], [g.cx + 3, chinY - 1], [g.cx, chinY], [g.cx - 3, chinY - 1], [g.cx - g.rx + 2, g.cy + 5]], skin[1]);
  } else {
    fig.ellipse(g.cx, g.cy + 2, g.rx, g.ry - 1, skin[1]);
  }
  // 셀 셰이딩: 오른쪽 볼선만 한 톤
  fig.ellipseWhere(g.cx, g.cy, g.rx, g.ry, skin[2], (x, y) => fig.get(x, y) === skin[1] && x > g.cx + g.rx - 3 && y > g.eyeY - 2);
  // 볼 하이라이트
  fig.rect(g.cx - g.rx + 2, g.eyeY + 4, 2, 1, skin[0]);

  // 볼터치 (애니 특유의 사선 홍조)
  const blushOn = spec.stage === 'baby' || spec.stage === 'child' || spec.mood === 'happy' || spec.stage === 'teen';
  if (blushOn && !spec.dead) {
    const blush = mix(skin[1], '#ff6a8a', 0.4);
    for (const side of [-1, 1]) {
      const bx = g.cx + side * (g.eyeDx + 1) - 2;
      const by = g.eyeY + g.eyeH;
      fig.rect(bx, by, 4, 2, blush);
      fig.px(bx + 1, by, mix(blush, '#ff4a7a', 0.4));
      fig.px(bx + 3, by, mix(blush, '#ff4a7a', 0.4));
    }
  }

  // 2-5) 눈: 크고 반짝이는 애니 눈
  const lash = mix(darken(hair[2], 0.55), '#2a1030', 0.4);
  for (const side of [-1, 1]) {
    const ex = g.cx + side * g.eyeDx;
    const ey = g.eyeY;
    const h = g.eyeH;
    if (spec.dead || blink) {
      // 감은 눈: 아래로 휜 곡선
      fig.rect(ex - 2, ey + h - 2, 5, 1, lash);
      fig.px(ex - 3 * -side, ey + h - 3, lash);
      continue;
    }
    // 홍채: 눈 대부분을 채우고 위가 진하며 아래로 밝아진다
    const outer = ex + side * 2;
    for (let i = 0; i < h; i++) {
      const t = i / Math.max(1, h - 1);
      const c = t < 0.3 ? darken(eye, 0.45) : t < 0.65 ? eye : lighten(eye, 0.4);
      fig.rect(ex - 2, ey + i, 5, 1, c);
    }
    // 바깥쪽 흰자 (위쪽 절반)
    for (let i = 0; i < Math.ceil(h / 2); i++) fig.px(outer, ey + i, '#ffffff');
    // 동공
    fig.rect(ex - (side < 0 ? 0 : 1), ey + 1, 2, Math.max(1, h - 3), darken(eye, 0.7));
    // 하이라이트: 큰 것 하나 + 작은 것 하나
    const hx = ex - side;
    fig.rect(side < 0 ? hx : hx - 1, ey + 1, 2, h >= 5 ? 2 : 1, '#ffffff');
    fig.px(ex + side, ey + h - 2, '#ffffff');
    // 윗속눈썹 (굵게, 바깥 끝 삐침)
    fig.rect(ex - 2, ey - 1, 5, 1, lash);
    fig.rect(side < 0 ? ex - 3 : ex, ey - 2, 4, 1, lash);
    fig.px(outer + side, ey - 1, lash);
    fig.px(outer + side, ey - 3, lash);
    // 아랫눈썹
    fig.px(ex + side * 2, ey + h, mix(lash, skin[1], 0.5));
    // 눈썹
    if (spec.stage !== 'baby') {
      const by = ey - 5;
      if (spec.mood === 'sad') {
        fig.line(ex - side, by - 1, ex + side, by, hair[2]);
      } else {
        fig.rect(ex - 1, by, 3, 1, hair[2]);
      }
    }
  }
  // 코: 점 하나
  fig.px(g.cx + 1, g.eyeY + g.eyeH + 1, skin[2]);
  // 입
  const my = g.eyeY + g.eyeH + 4;
  const lip = spec.dead ? skin[2] : '#d8506a';
  if (!spec.dead && spec.mood === 'happy') {
    // 활짝 웃는 입 (작은 반원)
    fig.rect(g.cx - 2, my, 4, 1, lip);
    fig.rect(g.cx - 1, my + 1, 2, 1, '#ff8aa0');
  } else if (!spec.dead && spec.mood === 'sad') {
    fig.rect(g.cx - 1, my, 2, 1, lip);
    fig.px(g.cx - 2, my + 1, lip);
    fig.px(g.cx + 1, my + 1, lip);
  } else {
    fig.rect(g.cx - 1, my, 3, 1, lip);
  }
  // 노인: 눈가 주름, 둥근 안경 느낌의 부드러운 선
  if (spec.stage === 'elder') {
    fig.px(g.cx - g.eyeDx - 3, g.eyeY + 3, skin[2]);
    fig.px(g.cx + g.eyeDx + 3, g.eyeY + 3, skin[2]);
  }
  if (beard) {
    const by = g.eyeY + g.eyeH + 2;
    fig.poly([[g.cx - g.rx + 2, by], [g.cx + g.rx - 2, by], [g.cx + 6, by + 9], [g.cx, by + 12], [g.cx - 6, by + 9]], hair[1]);
    fig.rect(g.cx - 2, my, 4, 1, hair[2]);
    fig.line(g.cx - 4, by + 3, g.cx - 2, by + 8, hair[0]);
  }

  // 2-6) 앞머리
  drawFrontHair(fig, g, spec, hair, style, sw);

  // 부상: 반창고와 붕대 (귀엽게)
  if (spec.injured) {
    const fy = g.cy - g.ry + 6;
    fig.rect(g.cx - g.rx + 1, fy, g.rx * 2 - 1, 3, '#ffffff');
    fig.rect(g.cx - g.rx + 1, fy + 2, g.rx * 2 - 1, 1, '#d8e0f0');
    fig.rect(g.cx + 4, fy, 2, 2, '#ff6a7a');
    // 볼 반창고
    fig.rect(g.cx + g.eyeDx - 2, g.eyeY + g.eyeH + 1, 5, 2, '#ffd0a0');
    fig.px(g.cx + g.eyeDx, g.eyeY + g.eyeH + 1, '#e8a878');
  }

  // 2-7) 머리 장식
  drawHeadgear(fig, g, spec, job, outfit);

  fig.outlineTinted();

  // 3) 합성
  bg.blit(fig, 0, 0);
  // 사망: 부드러운 흑백 (천상의 빛)
  if (spec.dead) bg.map((c) => mix(grayscale(c), '#f4f4ff', 0.25));
  return bg;
}

function drawBody(fig: Painter, g: Geo, spec: PortraitSpec, o: Outfit) {
  const top = g.shoulderY;
  const w = g.shoulderW;
  if (spec.stage === 'baby') {
    // 포근한 강보
    fig.ellipse(32, 60, 20, 14, '#fff4fa');
    fig.ellipseWhere(32, 60, 20, 14, '#ffd8ea', (x) => x > 40);
    fig.rect(14, 52, 36, 2, '#ffb0d0');
    fig.ellipse(32, 53, 3, 2, '#ffe070');
    return;
  }
  fig.poly([[32 - w - 6, 64], [32 - w, top + 4], [32 - w + 6, top], [32 + w - 6, top], [32 + w, top + 4], [32 + w + 6, 64]], o.base);
  // 셀 셰이딩: 오른쪽 한 덩어리 그림자, 왼쪽 어깨 하이라이트
  fig.map((c, x, y) => {
    if (c !== o.base || y < top) return c;
    if (x > 32 + w * 0.5) return o.shadow;
    if (x < 32 - w * 0.45 && y < top + 6) return o.light;
    return c;
  });
  fig.line(32 - w + 8, top + 10, 32 - w + 7, 63, o.shadow);
}

function drawCollar(fig: Painter, g: Geo, spec: PortraitSpec, o: Outfit, job: string | null) {
  if (spec.stage === 'baby') return;
  const top = g.shoulderY;
  const w = g.shoulderW;
  switch (job) {
    case 'knight':
    case 'hero':
    case 'demon_officer': {
      const spiky = job === 'demon_officer';
      for (const side of [-1, 1]) {
        const px = 32 + side * (w - 2);
        fig.ellipse(px, top + 6, 8, 6, o.base);
        fig.ellipseWhere(px, top + 6, 8, 6, o.light, (_x, y) => y < top + 4);
        fig.ellipseWhere(px, top + 6, 8, 6, o.shadow, (_x, y) => y > top + 9);
        fig.rect(px - 7, top + 6, 15, 1, o.trim);
        if (spiky) fig.poly([[px - 3, top + 2], [px + side * 6, top - 9], [px + 3, top + 1]], o.shadow);
      }
      fig.rect(26, top - 1, 13, 4, o.shadow);
      fig.rect(26, top - 1, 13, 1, o.light);
      if (job === 'knight') {
        fig.rect(29, top + 6, 7, 18, o.trim);
        fig.poly([[32, top + 8], [34, top + 11], [32, top + 14], [30, top + 11]], '#ffffff');
      } else if (job === 'hero') {
        fig.poly([[32, top + 8], [36, top + 13], [32, top + 18], [28, top + 13]], o.trim);
        fig.px(32, top + 13, '#7ae8ff');
        fig.rect(8, top + 2, 4, 20, '#3a8aff');
        fig.rect(52, top + 2, 4, 20, '#2a62d0');
      } else {
        fig.poly([[32, top + 6], [37, top + 12], [32, top + 20], [27, top + 12]], o.trim);
        if (spec.jobRank >= 5) {
          fig.rect(6, top - 2, 5, 24, '#e83a6a');
          fig.rect(53, top - 2, 5, 24, '#b02050');
        }
      }
      break;
    }
    case 'mage':
      fig.poly([[24, top - 3], [32, top + 10], [40, top - 3], [42, top + 2], [32, top + 16], [22, top + 2]], o.shadow);
      fig.rect(31, top + 4, 3, 20, o.trim);
      fig.ellipse(32, top + 18, 2, 2, '#7ae8ff');
      break;
    case 'priest':
      fig.rect(27, top, 3, 18, '#5a8aff');
      fig.rect(35, top, 3, 18, '#5a8aff');
      fig.rect(31, top + 6, 3, 9, o.trim);
      fig.rect(29, top + 8, 7, 3, o.trim);
      break;
    case 'merchant':
      fig.poly([[26, top - 1], [32, top + 14], [38, top - 1]], '#ffffff');
      fig.poly([[29, top + 2], [35, top + 2], [33, top + 6], [31, top + 6]], o.trim); // 리본 타이
      if (spec.jobRank >= 4) {
        fig.ellipse(18, top + 2, 8, 4, '#fff0e0');
        fig.ellipse(46, top + 2, 8, 4, '#f0d8c0');
      }
      break;
    case 'adventurer':
      fig.ellipse(32, top + 1, 14, 4, o.shadow);
      fig.rect(27, top + 1, 11, 3, o.trim);
      fig.line(20, top + 4, 44, 63, '#a8683a');
      fig.line(21, top + 4, 45, 63, '#d08a50');
      break;
    case 'farmer':
      fig.rect(24, top + 2, 4, 20, '#e0a050');
      fig.rect(37, top + 2, 4, 20, '#e0a050');
      break;
    default:
      if (spec.houseId === 'noble') {
        for (let i = 0; i < 6; i++) fig.ellipse(23 + i * 3.6, top + 1, 2.5, 2.5, '#ffffff');
        fig.ellipse(32, top + 5, 2, 2, o.trim);
      } else if (spec.houseId === 'demon') {
        fig.rect(24, top, 17, 2, o.trim);
        fig.ellipse(32, top + 3, 2, 2, '#ff3a6a');
      } else {
        // 세일러풍 깃
        fig.poly([[24, top - 1], [32, top + 8], [40, top - 1], [42, top + 4], [32, top + 12], [22, top + 4]], '#ffffff');
        fig.poly([[30, top + 6], [34, top + 6], [33, top + 10], [31, top + 10]], o.trim);
      }
  }
}

function drawFrontHair(fig: Painter, g: Geo, spec: PortraitSpec, hair: Ramp, style: HairStyle, sw: number) {
  const { cx, cy, rx, ry } = g;
  if (spec.stage === 'baby') {
    // 정수리의 바보털
    fig.ellipse(cx, cy - ry + 2, 5, 2, hair[1]);
    fig.line(cx, cy - ry, cx + 2 + sw, cy - ry - 4, hair[1]);
    fig.line(cx + 2 + sw, cy - ry - 4, cx + 4 + sw, cy - ry - 3, hair[1]);
    fig.px(cx - 2, cy - ry + 1, hair[0]);
    return;
  }
  const top = cy - ry - 1;
  // 앞머리: 뾰족한 다발이 이마로 내려온다
  const fringe = (x: number): number => {
    const t = (x - (cx - rx)) / (2 * rx);
    const spike = Math.abs(((x - cx + 64) % 5) - 2); // 0~2 톱니
    switch (style) {
      case 'swept':
        return top + 5 + Math.round(t * 6) + (spike > 1 ? 1 : 0);
      case 'spiky':
        return top + 6 + spike;
      default:
        return top + 7 + spike - (Math.abs(x - cx) < 2 ? 2 : 0);
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
  // 옆머리: 얼굴선을 따라 뾰족하게 (흔들림 프레임은 1px 이동)
  const sideLen = style === 'long' ? 20 : style === 'short' || style === 'spiky' ? 9 : 13;
  for (const side of [-1, 1]) {
    const sx = side < 0 ? cx - rx - 2 : cx + rx - 1;
    fig.poly([[sx, cy - 6], [sx + 3, cy - 6], [sx + 2 + side * sw, cy - 6 + sideLen], [sx + 1 + side * sw, cy - 6 + sideLen + 2]], side < 0 ? hair[1] : hair[2]);
  }
  if (style === 'spiky') {
    for (let i = 0; i < 5; i++) {
      const sx = cx - rx + 2 + i * 5;
      fig.poly([[sx - 2, top + 2], [sx + 1 + sw, top - 5 - (i % 2) * 2], [sx + 3, top + 2]], hair[1]);
    }
  }
  // 바보털 (아호게)
  fig.line(cx - 1, top - 1, cx + 1 + sw, top - 6, hair[1]);
  fig.line(cx + 1 + sw, top - 6, cx + 4 + sw, top - 5, hair[1]);
  // 셀 셰이딩: 오른쪽 그림자
  fig.map((c, x) => (c === hair[1] && x > cx + rx * 0.45 ? hair[2] : c));
  // 천사링 (머리 윗부분 광택 띠)
  const ringY = top + 3;
  for (let x = Math.floor(cx - rx + 2); x <= cx + rx * 0.4; x++) {
    if (x % 4 === 3) continue;
    const y = ringY + Math.round(Math.abs(x - (cx - 2)) / 6);
    if (fig.get(x, y) === hair[1]) fig.px(x, y, hair[0]);
    if (fig.get(x, y + 1) === hair[1] && x % 4 === 0) fig.px(x, y + 1, '#ffffff');
  }
  // 앞머리가 이마에 드리우는 그림자
  for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const fy = fringe(x) + 1;
    if (fig.get(x, fy) && fig.get(x, fy) !== hair[1] && fig.get(x, fy) !== hair[2] && fig.get(x, fy) !== '#ffffff' && fy < g.eyeY - 1) {
      fig.px(x, fy, mix(hair[2], '#ffd0c0', 0.55));
    }
  }
}

function drawHeadgear(fig: Painter, g: Geo, spec: PortraitSpec, job: string | null, o: Outfit) {
  const { cx, cy, ry } = g;
  const top = cy - ry - 1;
  const demon = spec.houseId === 'demon' || job === 'demon_officer';

  if (demon && spec.stage !== 'baby') {
    // 작고 귀여운 뿔
    const hs = spec.stage === 'child' ? 0.7 : 1;
    for (const side of [-1, 1]) {
      const bx = cx + side * 7;
      fig.poly([[bx - 2, top + 3], [bx + side * 5 * hs, top - 6 * hs], [bx + side * 7 * hs, top - 10 * hs], [bx + side * 3 * hs, top - 3 * hs], [bx + 2, top + 4]], '#6a4aa0');
      fig.line(bx, top + 2, bx + side * 5 * hs, top - 7 * hs, '#b08ae0');
    }
  }
  if (spec.stage === 'baby' || spec.stage === 'child') return;

  switch (job) {
    case 'farmer':
      fig.ellipse(cx, top + 4, 18, 3.5, '#ffe080');
      fig.ellipse(cx, top - 1, 10, 6, '#ffd060');
      fig.rect(cx - 10, top + 1, 20, 2, '#ff6a5a');
      fig.ellipseWhere(cx, top + 4, 18, 3.5, '#e8b048', (x, y) => y > top + 4 || x > cx + 10);
      break;
    case 'mage': {
      const rank = spec.jobRank;
      const hatC = rank >= 4 ? '#4a2ad0' : o.base;
      fig.ellipse(cx, top + 4, 17, 3, hatC);
      fig.poly([[cx - 10, top + 3], [cx + 10, top + 3], [cx + 5, top - 10], [cx + 12, top - 18], [cx + 1, top - 12]], hatC);
      fig.ellipseWhere(cx, top + 4, 17, 3, darken(hatC, 0.25), (_x, y) => y > top + 4);
      fig.rect(cx - 9, top + 1, 18, 2, o.trim);
      fig.px(cx + 3, top - 4, '#ffe680');
      fig.px(cx - 2, top - 2, '#ffffff');
      if (rank >= 5) { fig.px(cx - 4, top - 6, '#9af0ff'); fig.px(cx + 12, top - 18, '#ffe680'); }
      break;
    }
    case 'priest': {
      fig.ellipseWhere(cx, cy - 2, g.rx + 3, ry + 2, '#ffffff', (x, y) => y < top + 4 || Math.abs(x - cx) > g.rx - 1);
      fig.rect(cx - 6, top + 2, 12, 1, o.trim);
      if (spec.jobRank >= 4) {
        fig.poly([[cx - 7, top + 1], [cx + 7, top + 1], [cx + 4, top - 12], [cx, top - 15], [cx - 4, top - 12]], '#ffffff');
        fig.rect(cx - 1, top - 11, 2, 9, o.trim);
        fig.rect(cx - 3, top - 8, 6, 2, o.trim);
      }
      break;
    }
    case 'hero':
      fig.rect(cx - 9, top + 4, 18, 1, '#ffd85a');
      fig.poly([[cx - 2, top + 4], [cx, top + 1], [cx + 2, top + 4]], '#ffd85a');
      fig.px(cx, top + 3, spec.jobRank >= 5 ? '#ffffff' : '#7ae8ff');
      break;
    case 'demon_officer':
      if (spec.jobRank >= 5) {
        for (let i = -2; i <= 2; i++) fig.poly([[cx + i * 4 - 2, top + 2], [cx + i * 4, top - 5 - (i === 0 ? 3 : 0)], [cx + i * 4 + 2, top + 2]], '#ffd85a');
        fig.rect(cx - 10, top + 1, 21, 2, '#ffd85a');
        fig.px(cx, top - 1, '#ff3a6a');
      }
      break;
    case 'knight':
      if (spec.jobRank >= 5) fig.rect(cx - 9, top + 3, 18, 1, '#ffffff');
      break;
    default:
      if (spec.houseId === 'noble') {
        // 작은 리본 머리핀
        fig.poly([[cx - 8, top + 2], [cx - 5, top + 4], [cx - 8, top + 6]], o.trim);
        fig.poly([[cx - 2, top + 2], [cx - 5, top + 4], [cx - 2, top + 6]], o.trim);
      }
  }
}
