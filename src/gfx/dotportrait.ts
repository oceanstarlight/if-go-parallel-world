import { Painter, darken, lighten, mix } from './painter';
import type { Mood, Outfit, Ramp, Stage } from './portrait';

/**
 * 도트 지도 초상화 (32×32). 손으로 찍은 도트처럼 보이도록 부위를 레이어로 겹친다.
 *   뒷머리 → 몸·옷 → 목 → 얼굴(+턱선) → 눈·눈썹·입 → 앞머리·옆머리 → 출신 표식
 * 턱선은 얼굴 둘레에 외곽선을 그려 목 위에 덮이므로, 턱과 목이 또렷하게 나뉜다.
 */

export type Bangs = 'straight' | 'center' | 'side' | 'messy' | 'swoop' | 'spiky' | 'crop' | 'tuft';
export type BackHair = 'short' | 'bob' | 'long' | 'ponytail' | 'twin' | 'bun' | 'none';

export interface Figure {
  gender: 'm' | 'f';
  stage: Stage;
  houseId: string;
  job: string | null;
  jobRank: number;
  mood: Mood;
  blink: boolean;
  dead: boolean;
  injured: boolean;
  sway: number;
  hair: Ramp;
  skin: Ramp;
  eye: string;
  outfit: Outfit;
  bangs: Bangs;
  back: BackHair;
  beard: boolean;
  /** 머리만 그린다 (몸·목 없이): 전투 스프라이트의 머리로 쓴다 */
  headOnly?: boolean;
}

/** 턱 끝 줄 (머리만 잘라 쓸 때 목에 맞추는 기준) */
export function figureChin(f: Pick<Figure, 'stage' | 'gender'>): number {
  const g = f.stage === 'baby' ? 'baby' : f.stage === 'child' ? 'child' : f.gender;
  return Math.max(...Object.keys(FACE[g]).map(Number));
}

const K = '#3a2440'; // 외곽선
const MOUTH = '#d8506a';
const BLUSH = '#ff9aae';

type Rows = Record<number, [number, number]>;

/** {y: [x0, x1]} 표를 펼친다. a..b 행을 같은 범위로 채우는 간단한 문법: rows([[a, b, x0, x1], …]) */
function rows(spec: [number, number, number, number][]): Rows {
  const out: Rows = {};
  for (const [y0, y1, x0, x1] of spec) for (let y = y0; y <= y1; y++) out[y] = [x0, x1];
  return out;
}

// ───── 얼굴 윤곽 (피부가 칠해지는 범위). 아래로 갈수록 좁아지며 턱 끝에서 닫힌다 ─────
const FACE: Record<'f' | 'm' | 'child' | 'baby', Rows> = {
  // 여성: 둥근 볼, 뾰족하지 않은 작은 턱 (턱 끝 y21)
  f: rows([[8, 8, 10, 21], [9, 17, 9, 22], [18, 18, 10, 21], [19, 19, 11, 20], [20, 20, 12, 19], [21, 21, 13, 18]]),
  // 남성: 턱선이 넓고 각진 턱 (턱 끝 y22)
  m: rows([[8, 8, 10, 21], [9, 18, 9, 22], [19, 19, 10, 21], [20, 20, 11, 20], [21, 22, 12, 19]]),
  // 어린이: 짧고 동그란 얼굴
  child: rows([[8, 8, 10, 21], [9, 17, 9, 22], [18, 18, 10, 21], [19, 19, 11, 20], [20, 20, 13, 18]]),
  // 아기: 더 크고 둥근 얼굴
  baby: rows([[7, 7, 11, 20], [8, 8, 9, 22], [9, 17, 8, 23], [18, 18, 9, 22], [19, 19, 10, 21], [20, 20, 12, 19]]),
};

// ───── 몸 (어깨선) ─────
const BODY: Record<'f' | 'm' | 'child' | 'baby', Rows> = {
  f: rows([[24, 24, 11, 20], [25, 25, 8, 23], [26, 26, 6, 25], [27, 27, 5, 26], [28, 31, 4, 27]]),
  m: rows([[24, 24, 10, 21], [25, 25, 7, 24], [26, 26, 5, 26], [27, 27, 4, 27], [28, 31, 3, 28]]),
  child: rows([[24, 24, 11, 20], [25, 25, 9, 22], [26, 26, 8, 23], [27, 31, 7, 24]]),
  baby: rows([[22, 22, 11, 20], [23, 23, 9, 22], [24, 31, 7, 24]]),
};

// ───── 뒷머리 (얼굴·몸 뒤) ─────
const CAP = rows([[1, 1, 12, 19], [2, 2, 10, 21], [3, 3, 9, 22], [4, 13, 8, 23]]);
const BACK: Record<BackHair, Rows> = {
  none: {},
  short: CAP,
  bob: { ...CAP, ...rows([[14, 20, 7, 24], [21, 21, 8, 23]]) },
  long: { ...CAP, ...rows([[4, 9, 7, 24], [10, 27, 6, 25], [28, 29, 7, 24]]) },
  ponytail: { ...CAP },
  twin: { ...CAP },
  bun: { ...CAP },
};

// ───── 앞머리 (y7~12, x8~23 의 16칸). H=머리 h=그림자 L=하이라이트 .=비움 ─────
const BANGS: Record<Bangs, string[]> = {
  straight: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'hHHhhHHhhHHhhHHh',
    'h..............h',
  ],
  center: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHhhHHHHHHH',
    'HHHHHHh..hHHHHHH',
    'HHHHHh....hHHHHH',
    'HHHh........hHHH',
    'Hh............hH',
  ],
  side: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'h.hHHHHHHHHHHHHH',
    'h...hHHHHHHHHHHH',
    'h......hhHHHHHHH',
    'h..........hhHHh',
  ],
  messy: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'HHhHHHHhHHHHHhHH',
    'Hh.hHHh.hHHHh.hH',
    'h...hh...hHh...h',
    'h.........h....h',
  ],
  swoop: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHh..hHH',
    'HHHHHHHHh.....hH',
    'HHHHHHh.......hH',
    'hHHHh.........hh',
  ],
  spiky: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'HHhHHHHhHHHHhHHH',
    'Hh.hHHh.hHHh.hHH',
    'h...Hh...hH...hH',
    'h....h....h....h',
  ],
  crop: [
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'hHhHhHhHhHhHhHhh',
    'h..............h',
    'h..............h',
    '................',
  ],
  tuft: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

// ───── 눈 (왼쪽 눈 기준, 오른쪽은 좌우 반전). K=외곽 E=동공 e=홍채 W=하이라이트 ─────
const EYES = {
  f: ['KKKK', 'KWEe', 'KeEe', '.ee.'],
  m: ['KKKK', 'KWEe', '.ee.'],
  happy: ['.KK.', 'K..K'],
  closed: ['KKKK'],
  afraid: ['KKKK', 'KW.e', 'K.E.', '.ee.'],
};

/** 그리기 도구: 32×32 위에 점을 찍고, 칠한 부위를 기억한다 (외곽선 계산용) */
class Canvas {
  readonly p = new Painter(32, 32);
  private mask = new Map<string, Set<number>>();
  /** dy: 모든 점을 아래로 밀어 그린다 (머리 위로 솟는 귀·뿔 자리를 남길 때) */
  constructor(private readonly dy = 0) {}
  put(x: number, y: number, c: string, part?: string) {
    y += this.dy;
    if (x < 0 || y < 0 || x >= 32 || y >= 32) return;
    this.p.px(x, y, c);
    if (part) {
      if (!this.mask.has(part)) this.mask.set(part, new Set());
      this.mask.get(part)!.add(y * 32 + x);
    }
  }
  erase(part: string, x: number, y: number) {
    this.mask.get(part)?.delete((y + this.dy) * 32 + x);
  }
  has(part: string, x: number, y: number) {
    return !!this.mask.get(part)?.has((y + this.dy) * 32 + x);
  }
  fill(r: Rows, c: string | ((x: number, y: number) => string), part: string, dx = 0) {
    for (const [ys, [x0, x1]] of Object.entries(r)) {
      const y = Number(ys);
      for (let x = x0; x <= x1; x++) this.put(x + dx, y, typeof c === 'string' ? c : c(x + dx, y), part);
    }
  }
  /** part 둘레에 외곽선. onlyEmpty 면 빈 칸에만 (다른 부위 위로는 그리지 않는다) */
  outline(part: string, color: string, onlyEmpty = false, avoid: string[] = []) {
    const m = this.mask.get(part);
    if (!m) return;
    const pts: [number, number][] = [];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (m.has(y * 32 + x)) continue;
        if (onlyEmpty && this.p.get(x, y)) continue;
        if (avoid.some((a) => this.has(a, x, y))) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => m.has((y + b) * 32 + (x + a)) && x + a >= 0 && x + a < 32);
        if (n) pts.push([x, y]);
      }
    }
    for (const [x, y] of pts) this.p.px(x, y, color);
  }
}

/** 32×32 인물 */
export function drawFigure(f: Figure): Painter {
  const cv = new Canvas();
  const g = f.stage === 'baby' ? 'baby' : f.stage === 'child' ? 'child' : f.gender;
  const face = FACE[g];
  const body = BODY[g];
  const chin = Math.max(...Object.keys(face).map(Number));
  const [hl, hb, hs] = f.hair;
  const [sl, sb, ss] = f.skin;
  const hairOutline = darken(hs, 0.45);

  // 1) 뒷머리 (긴 머리·묶은 머리는 아래쪽이 흔들린다)
  if (f.back !== 'none') {
    cv.fill(BACK[f.back], (x, y) => (x > 18 || y > 20 ? hs : hb), 'back');
    const sw = f.sway;
    if (f.back === 'ponytail') {
      cv.fill(rows([[5, 9, 23, 27], [10, 17, 24 + sw, 27 + sw], [18, 21, 25 + sw, 27 + sw]]), (x) => (x > 25 ? hs : hb), 'back');
      cv.put(23, 5, f.outfit.trim);
      cv.put(23, 6, f.outfit.trim);
    }
    if (f.back === 'twin') {
      cv.fill(rows([[5, 8, 4, 8], [9, 19, 3 + sw, 7 + sw], [20, 22, 4 + sw, 6 + sw]]), (x) => (x < 5 ? hs : hb), 'back');
      cv.fill(rows([[5, 8, 23, 27], [9, 19, 24 + sw, 28 + sw], [20, 22, 25 + sw, 27 + sw]]), (x) => (x > 26 ? hs : hb), 'back');
      for (const x of [7, 24]) {
        cv.put(x, 5, f.outfit.trim);
        cv.put(x, 6, f.outfit.trim);
      }
    }
    if (f.back === 'bun') {
      cv.fill(rows([[0, 0, 14, 17], [1, 2, 13, 18]]), hb, 'back');
      cv.put(15, 1, hl);
    }
    cv.outline('back', hairOutline, true);
  }

  // 2) 몸·옷
  const o = f.outfit;
  if (!f.headOnly) {
    cv.fill(body, (x, y) => (x >= 22 || y >= 30 ? o.shadow : x <= 8 && y <= 27 ? o.light : o.base), 'body');
    drawOutfit(cv, f, body);
    cv.outline('body', K);
  }

  // 3) 목 (턱 바로 아래 두 줄은 그림자)
  if (f.stage !== 'baby' && !f.headOnly) {
    const [nx0, nx1] = f.gender === 'm' && f.stage !== 'child' ? [13, 18] : [14, 17];
    for (let y = chin + 1; y <= 25; y++) {
      for (let x = nx0; x <= nx1; x++) cv.put(x, y, y <= chin + 2 ? ss : sb, 'neck');
    }
    cv.outline('neck', K, true);
    // 옷깃: 목을 V 로 감싼다
    cv.put(nx0 - 1, 24, o.trim);
    cv.put(nx1 + 1, 24, o.trim);
    cv.put(nx0, 25, o.trim);
    cv.put(nx1, 25, o.trim);
  }

  // 4) 얼굴 + 턱선 (얼굴 둘레 외곽선이 목 위에 그려져 턱과 목이 나뉜다)
  cv.fill(face, (x, y) => (x >= 21 && y >= 10 ? ss : x <= 10 && y <= 11 ? sl : sb), 'face');
  cv.outline('face', K);
  drawEars(cv, f, sb, ss, sl);

  // 5) 이목구비
  drawFace(cv, f, face, chin);

  // 6) 앞머리 · 옆머리
  drawFrontHair(cv, f);

  // 7) 출신 표식
  drawMarks(cv, f);

  // 8) 수염 (드워프 남성·노인)
  if (f.beard) drawBeard(cv, f, chin);

  // 9) 부상
  if (f.injured && !f.dead) {
    for (const [x, y] of [[19, 17], [20, 17], [21, 17], [20, 16]] as const) cv.put(x, y, '#ffffff');
    cv.put(11, 10, '#ff6a6a');
  }
  return cv.p;
}

function drawEars(cv: Canvas, f: Figure, sb: string, ss: string, sl: string) {
  const humanEar = () => {
    for (const side of [0, 1]) {
      const X = (x: number) => (side ? 31 - x : x);
      cv.put(X(8), 14, sb, 'ear');
      cv.put(X(8), 15, ss, 'ear');
    }
    cv.outline('ear', K, false, ['face', 'body', 'neck']);
  };
  if (f.houseId === 'elf') {
    // 위로 뾰족하게 뻗은 엘프 귀
    for (const side of [0, 1]) {
      const X = (x: number) => (side ? 31 - x : x);
      for (const [x, y, c] of [[8, 14, sb], [8, 15, ss], [7, 13, sb], [7, 14, sb], [6, 12, sl], [6, 13, sb], [5, 11, sl], [5, 12, sb], [4, 10, sl]] as const) {
        cv.put(X(x), y, c, 'ear');
      }
    }
    cv.outline('ear', K, false, ['face', 'body', 'neck']);
  } else if (f.houseId === 'mermaid') {
    // 귀 자리에 지느러미
    const fin = ['#8ef0f0', '#2ab8c8', '#16788e'];
    for (const side of [0, 1]) {
      const X = (x: number) => (side ? 31 - x : x);
      for (const [x, y, c] of [[8, 13, 1], [8, 14, 1], [8, 15, 2], [7, 12, 0], [7, 13, 1], [7, 14, 1], [7, 15, 2], [6, 11, 0], [6, 12, 1], [6, 14, 2], [5, 10, 0]] as const) {
        cv.put(X(x), y, fin[c], 'ear');
      }
    }
    cv.outline('ear', K, false, ['face', 'body', 'neck']);
  } else if (f.stage !== 'baby') {
    humanEar();
  }
}

function drawFace(cv: Canvas, f: Figure, face: Rows, chin: number) {
  const L = (x: number) => x;
  const R = (x: number) => 31 - x;
  const mood: Mood = f.dead ? 'neutral' : f.mood;
  const closed = f.blink || f.dead;
  const big = f.stage === 'baby' || f.stage === 'child';
  const fem = f.gender === 'f' || big;
  const eyeTop = fem ? 13 : 14;
  const eyeFor = (x: number, y: number, ch: string) => {
    const c = ch === 'K' ? K : ch === 'E' ? darken(f.eye, 0.65) : ch === 'e' ? f.eye : ch === 'W' ? '#ffffff' : '';
    if (c) cv.put(x, y, c, 'feat');
  };
  const drawEye = (rowsArr: string[], top: number) => {
    rowsArr.forEach((row, i) => {
      const swap = row.includes('W') && row.includes('E');
      const right = [...row].reverse().map((ch) => (swap && ch === 'W' ? 'E' : swap && ch === 'E' ? 'W' : ch));
      for (let j = 0; j < 4; j++) {
        eyeFor(L(10 + j), top + i, row[j]);
        eyeFor(18 + j, top + i, right[j]);
      }
    });
  };
  if (closed) drawEye(EYES.closed, eyeTop + 2);
  else if (mood === 'happy') drawEye(EYES.happy, eyeTop + 1);
  else if (mood === 'afraid') drawEye(EYES.afraid, eyeTop);
  else drawEye(fem ? EYES.f : EYES.m, eyeTop);
  // 속눈썹 꼬리 (여성)
  if (fem && !closed && mood !== 'happy') {
    cv.put(9, eyeTop, K, 'feat');
    cv.put(22, eyeTop, K, 'feat');
  }

  // 눈썹
  const by = eyeTop - 2;
  const brow = darken(f.hair[2], 0.15);
  const browPts: [number, number][] =
    mood === 'angry' ? [[10, by], [11, by], [12, by + 1], [13, by + 1]]
      : mood === 'sad' || mood === 'afraid' ? [[10, by + 1], [11, by + 1], [12, by], [13, by]]
        : fem ? [[10, by], [11, by], [12, by]] : [[10, by], [11, by], [12, by], [13, by]];
  for (const [x, y] of browPts) {
    cv.put(L(x), y, brow, 'feat');
    cv.put(R(x), y, brow, 'feat');
  }

  // 볼터치 · 코
  if ((fem || mood === 'happy') && !f.dead) {
    for (const x of [10, 11]) {
      cv.put(L(x), 17, BLUSH);
      cv.put(R(x), 17, BLUSH);
    }
  }
  cv.put(16, 17, f.skin[2]);

  // 입
  const my = Math.min(19, chin - 2);
  const lip = f.dead ? f.skin[2] : MOUTH;
  if (mood === 'happy' && !f.dead) {
    for (let x = 14; x <= 17; x++) cv.put(x, my, lip);
    cv.put(15, my + 1, '#ff8aa0');
    cv.put(16, my + 1, '#ff8aa0');
  } else if (mood === 'sad' && !f.dead) {
    cv.put(15, my, lip);
    cv.put(16, my, lip);
    cv.put(14, my + 1, lip);
    cv.put(17, my + 1, lip);
  } else if (mood === 'angry' && !f.dead) {
    for (let x = 14; x <= 17; x++) cv.put(x, my, darken(lip, 0.3));
  } else if (mood === 'afraid' && !f.dead) {
    for (const [x, y] of [[15, my], [16, my], [15, my + 1], [16, my + 1]] as const) cv.put(x, y, darken(lip, 0.35));
    cv.put(23, 10, '#9ad8ff');
    cv.put(23, 11, '#d8f0ff');
  } else {
    cv.put(15, my, lip);
    cv.put(16, my, lip);
  }

  // 노인: 눈가 주름
  if (f.stage === 'elder') {
    cv.put(9, eyeTop + 3, f.skin[2]);
    cv.put(22, eyeTop + 3, f.skin[2]);
    cv.put(12, my + 1, f.skin[2]);
    cv.put(19, my + 1, f.skin[2]);
  }
  void face;
}

function drawFrontHair(cv: Canvas, f: Figure) {
  const [hl, hb, hs] = f.hair;
  const color = (ch: string) => (ch === 'H' ? hb : ch === 'h' ? hs : ch === 'L' ? hl : '');
  if (f.stage === 'baby') {
    // 아기: 정수리의 동그란 머리와 꼬불한 한 가닥
    cv.fill(rows([[4, 4, 12, 19], [5, 6, 10, 21], [7, 7, 11, 20]]), hb, 'front');
    for (const [x, y] of [[15, 3], [16, 2], [17, 2], [17, 3]] as const) cv.put(x, y, hb, 'front');
    cv.outline('front', darken(hs, 0.45), true);
    cv.put(13, 5, hl);
    return;
  }
  // 정수리 (윤기 나는 천사링 자리 포함)
  cv.fill(rows([[1, 1, 12, 19], [2, 2, 10, 21], [3, 3, 9, 22], [4, 6, 8, 23]]), (x) => (x >= 20 ? hs : hb), 'front');
  // 앞머리 (y7~12): 패턴에 머리가 있는 칸만 칠한다
  BANGS[f.bangs].forEach((row, i) => {
    for (let j = 0; j < 16; j++) {
      const c = color(row[j]);
      if (c) cv.put(8 + j, 7 + i, c, 'front');
    }
  });
  // 귀밑머리: 얼굴 테두리를 따라 내려오는 머리
  for (let y = 7; y <= 13; y++) {
    cv.put(8, y, y > 10 ? hs : hb, 'front');
    cv.put(23, y, hs, 'front');
  }
  // 앞머리 아래 얼굴에 드리우는 그림자
  for (let x = 9; x <= 22; x++) {
    let low = -1;
    for (let y = 7; y <= 12; y++) if (cv.has('front', x, y)) low = y;
    const y = low + 1;
    if (low >= 0 && cv.has('face', x, y) && !cv.has('feat', x, y)) cv.put(x, y, f.skin[2]);
  }
  // 옆머리: 얼굴 양옆으로 늘어뜨린 머리 (어깨 위까지)
  const sw = f.sway;
  // 남자는 묶은 머리여도 옆머리를 내리지 않는다 (단발처럼 보이지 않게)
  const lockEnd = f.gender === 'm' && f.back !== 'long' ? 0 : f.back === 'long' ? 27 : f.back === 'bob' ? 20 : f.back === 'twin' || f.back === 'ponytail' || f.back === 'bun' ? 17 : 0;
  if (lockEnd) {
    for (let y = 10; y <= lockEnd; y++) {
      const d = y >= 18 ? sw : 0;
      cv.put(8 + d, y, hb, 'front');
      cv.put(9 + d, y, y > 13 ? hs : hb, 'front');
      cv.put(22 + d, y, hs, 'front');
      cv.put(23 + d, y, hb, 'front');
    }
  }
  cv.outline('front', darken(hs, 0.45), true);
  // 천사링 (윤기)
  for (const [x, y] of [[13, 4], [14, 4], [18, 4], [12, 5], [19, 5]] as const) cv.put(x, y, hl);
}

function drawBeard(cv: Canvas, f: Figure, chin: number) {
  const [, hb, hs] = f.hair;
  for (let y = 18; y <= chin + 2; y++) {
    const w = y < 20 ? 6 : y <= chin ? 5 - (y - 20) : 2;
    for (let x = 16 - w; x <= 15 + w; x++) cv.put(x, y, y >= chin ? hs : hb, 'beard');
  }
  cv.put(15, 19, MOUTH);
  cv.put(16, 19, MOUTH);
  cv.outline('beard', darken(hs, 0.45), true);
}

function drawMarks(cv: Canvas, f: Figure) {
  const [hl, hb, hs] = f.hair;
  const mirror = (pts: [number, number, string][]) => {
    for (const [x, y, c] of pts) {
      cv.put(x, y, c, 'mark');
      cv.put(31 - x, y, c, 'mark');
    }
  };
  switch (f.houseId) {
    case 'beastkin':
      mirror([[8, 0, hb], [8, 1, hb], [9, 1, hb], [8, 2, hb], [9, 2, '#ffb0c0'], [10, 2, hb], [8, 3, hb], [9, 3, '#ffb0c0'], [10, 3, hb], [11, 3, hb]]);
      cv.outline('mark', darken(hs, 0.45), true);
      break;
    case 'demon':
      mirror([[10, 3, '#fff0e0'], [10, 2, '#e8d8c8'], [9, 1, '#c8b0a0'], [9, 0, '#8a6a5a']]);
      cv.outline('mark', K, true);
      break;
    case 'sky':
      for (let x = 12; x <= 19; x++) cv.put(x, 0, '#ffe070');
      cv.put(11, 1, '#ffe070');
      cv.put(20, 1, '#ffe070');
      break;
    case 'eastern':
      for (const [x, y, c] of [[21, 3, '#ff6a8a'], [22, 3, '#ffb0c8'], [21, 4, '#ffb0c8'], [22, 4, '#ff6a8a'], [23, 5, '#c8a060'], [24, 6, '#c8a060']] as const) cv.put(x, y, c);
      break;
    case 'noble':
      if (f.gender === 'f' && f.stage !== 'baby') {
        for (let x = 13; x <= 18; x++) cv.put(x, 3, '#ffd85a');
        cv.put(15, 2, '#ffd85a');
        cv.put(16, 2, '#ff5aa8');
      }
      break;
    case 'witch': {
      if (f.stage === 'baby') break;
      const hat = '#3a2a6a', band = '#c8a0ff';
      cv.fill(rows([[0, 0, 15, 16], [1, 1, 14, 17], [2, 2, 13, 18], [3, 3, 12, 19], [4, 4, 10, 21], [5, 5, 6, 25]]), (_x, y) => (y === 4 ? band : hat), 'mark');
      cv.outline('mark', K, true);
      break;
    }
    case 'dwarf':
      if (f.gender === 'f') {
        // 땋은 머리 장식
        cv.put(8, 18, '#ffd05a');
        cv.put(23, 18, '#ffd05a');
      }
      break;
  }
  void hl;
}

/** 옷 무늬: 직업마다 다르다 */
function drawOutfit(cv: Canvas, f: Figure, body: Rows) {
  const o = f.outfit;
  const top = Math.min(...Object.keys(body).map(Number));
  const put = (x: number, y: number, c: string) => cv.put(x, y, c, 'body');
  const job = f.stage === 'adult' || f.stage === 'elder' || f.stage === 'teen' ? f.job : null;
  if (f.stage === 'baby') {
    // 아기 포대기: 가장자리 레이스
    for (let x = 8; x <= 23; x += 2) put(x, 24, '#ffffff');
    return;
  }
  switch (job) {
    case 'knight':
    case 'hero':
      // 어깨 갑옷 + 가운데 문장
      for (const [x0, x1] of [[4, 8], [23, 27]]) {
        for (let x = x0; x <= x1; x++) put(x, 26, o.light);
        for (let x = x0 + 1; x <= x1 - 1; x++) put(x, 27, o.light);
      }
      for (let y = 27; y <= 31; y++) {
        put(15, y, o.trim);
        put(16, y, o.trim);
      }
      break;
    case 'mage':
      for (const [x, y] of [[15, 28], [16, 28], [15, 27], [16, 29], [14, 28], [17, 28]] as const) put(x, y, o.trim);
      break;
    case 'priest':
      for (let y = 27; y <= 31; y++) {
        put(15, y, o.trim);
        put(16, y, o.trim);
      }
      for (let x = 13; x <= 18; x++) put(x, 28, o.trim);
      break;
    case 'merchant':
    case 'court':
      for (let y = 26; y <= 31; y++) for (let x = 14; x <= 17; x++) put(x, y, '#fff8ec');
      for (const y of [27, 29, 31]) put(15, y, o.trim);
      for (let y = 26; y <= 29; y++) {
        put(13, y, o.light);
        put(18, y, o.light);
      }
      break;
    case 'adventurer':
      for (let i = 0; i <= 8; i++) put(8 + i * 2, 26 + Math.floor(i / 2), '#8a5a3a');
      break;
    case 'farmer':
      for (let y = 25; y <= 31; y++) {
        put(10, y, o.trim);
        put(21, y, o.trim);
      }
      for (let y = 28; y <= 31; y++) for (let x = 11; x <= 20; x++) put(x, y, o.shadow);
      break;
    case 'demon_officer':
      put(11, 24, '#ff3a7a');
      put(20, 24, '#ff3a7a');
      for (let y = 27; y <= 31; y++) put(15, y, '#ff3a7a');
      break;
    case 'thief':
      for (let x = 11; x <= 20; x++) put(x, 25, '#5a3a7a');
      for (let x = 12; x <= 19; x++) put(x, 26, '#4a2a6a');
      break;
    default:
      // 기본 옷: 가슴 리본
      put(15, 26, o.trim);
      put(16, 26, o.trim);
  }
  if (job && f.jobRank >= 4) {
    // 높은 직위: 금 견장
    for (const x of [6, 7, 24, 25]) put(x, 26, '#ffd85a');
  }
  void top;
  void mix;
  void lighten;
}

/** 시드와 성별로 머리 모양을 고른다 */
export function hairStyleOf(gender: 'm' | 'f', stage: Stage, rnd: () => number): { bangs: Bangs; back: BackHair } {
  const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
  if (stage === 'baby') return { bangs: 'tuft', back: 'none' };
  if (gender === 'f') {
    const back = stage === 'elder' ? pick<BackHair>(['bun', 'bun', 'bob']) : pick<BackHair>(['long', 'long', 'bob', 'ponytail', 'twin', 'bun']);
    return { bangs: pick<Bangs>(['straight', 'center', 'side', 'messy', 'swoop']), back };
  }
  return {
    bangs: pick<Bangs>(stage === 'elder' ? ['crop', 'side', 'center'] : ['spiky', 'crop', 'side', 'messy', 'center']),
    back: pick<BackHair>(['short', 'short', 'short', 'short', 'short', 'ponytail']),
  };
}

// ───────────────────────── 옆모습 (전투 스프라이트의 머리) ─────────────────────────
// 정면 초상화와 같은 설정(머리색·앞머리·뒷머리·눈·출신 표식)으로, 오른쪽을 바라보는 옆얼굴을 그린다.

/** 옆얼굴 윤곽: 이마 → 콧날(오른쪽 끝) → 입 → 턱 */
const SIDE_FACE: Record<'f' | 'm' | 'child' | 'baby', Rows> = {
  f: rows([[7, 8, 12, 21], [9, 11, 11, 22], [12, 12, 11, 23], [13, 13, 11, 22], [14, 15, 12, 22], [16, 16, 12, 21], [17, 17, 13, 21], [18, 18, 14, 20], [19, 19, 16, 19]]),
  m: rows([[7, 8, 12, 21], [9, 11, 11, 22], [12, 12, 11, 23], [13, 13, 11, 22], [14, 16, 12, 22], [17, 17, 12, 21], [18, 18, 13, 21], [19, 19, 14, 20], [20, 20, 16, 19]]),
  child: rows([[7, 8, 12, 21], [9, 12, 11, 22], [13, 13, 11, 22], [14, 15, 12, 21], [16, 16, 13, 21], [17, 17, 14, 20], [18, 18, 16, 19]]),
  baby: rows([[6, 7, 12, 21], [8, 14, 10, 22], [15, 15, 11, 21], [16, 16, 12, 20], [17, 17, 14, 19]]),
};

/** 옆머리통 (뒤통수 + 정수리 + 목덜미) */
const SIDE_CAP = rows([[1, 1, 10, 17], [2, 2, 8, 19], [3, 3, 7, 20], [4, 6, 6, 21], [7, 12, 5, 12], [13, 15, 6, 12], [16, 16, 7, 12]]);

/** 옆에서 본 앞머리: [y, x0, x1] (이마 위로 늘어진 부분) */
const SIDE_BANGS: Record<Bangs, [number, number, number][]> = {
  straight: [[4, 15, 22], [5, 15, 23], [6, 15, 23], [7, 15, 23], [8, 16, 23], [9, 19, 23]],
  center: [[4, 15, 22], [5, 15, 23], [6, 16, 23], [7, 17, 22], [8, 19, 22]],
  side: [[4, 15, 23], [5, 15, 24], [6, 17, 24], [7, 19, 24], [8, 21, 23], [9, 22, 23]],
  messy: [[4, 15, 23], [5, 15, 24], [6, 16, 23], [7, 17, 24], [8, 18, 18], [8, 21, 22], [9, 22, 22]],
  swoop: [[4, 15, 23], [5, 15, 24], [6, 17, 25], [7, 20, 25], [8, 22, 24]],
  spiky: [[3, 17, 23], [4, 15, 25], [5, 15, 23], [5, 24, 25], [6, 17, 24], [7, 19, 22], [3, 25, 26], [2, 26, 26]],
  crop: [[4, 15, 22], [5, 15, 22], [6, 16, 21]],
  tuft: [[1, 18, 18], [0, 19, 19], [1, 20, 20]],
};

/** 옆얼굴 머리. 몸 없이 머리만 32×32 에 그린다 */
/** 옆얼굴은 머리 위로 솟는 귀·뿔·모자 자리를 위해 3줄 내려 그린다 */
const SIDE_DY = 3;

export function drawProfileHead(f: Figure): Painter {
  const cv = new Canvas(SIDE_DY);
  const g = f.stage === 'baby' ? 'baby' : f.stage === 'child' ? 'child' : f.gender;
  const face = SIDE_FACE[g];
  const chin = profileChin(f);
  const [hl, hb, hs] = f.hair;
  const [sl, sb, ss] = f.skin;
  const hairOutline = darken(hs, 0.45);
  const sw = f.sway;
  const hairShade = (x: number, y: number) => (x <= 7 || y >= 14 ? hs : hb);

  // 1) 뒷머리 (머리통 + 늘어진 머리)
  if (f.back !== 'none') {
    cv.fill(SIDE_CAP, hairShade, 'hair');
    if (f.back === 'bob') cv.fill(rows([[13, 19, 5, 12], [20, 20, 6, 11]]), hairShade, 'hair');
    if (f.back === 'long') cv.fill(rows([[8, 25, 4, 11], [26, 27, 5, 10]]), (x, y) => (x <= 6 || y >= 20 ? hs : hb), 'hair');
    if (f.back === 'ponytail') {
      cv.fill(rows([[6, 9, 2, 5], [10, 17, 2 + sw, 5 + sw], [18, 21, 3 + sw, 5 + sw]]), (x) => (x <= 3 + sw ? hs : hb), 'hair');
      cv.put(6, 7, f.outfit.trim);
      cv.put(6, 8, f.outfit.trim);
    }
    if (f.back === 'twin') {
      cv.fill(rows([[8, 9, 3, 6], [10, 19, 3 + sw, 6 + sw], [20, 21, 4 + sw, 5 + sw]]), (x) => (x <= 4 + sw ? hs : hb), 'hair');
      cv.put(7, 8, f.outfit.trim);
      cv.put(7, 9, f.outfit.trim);
    }
    if (f.back === 'bun') {
      cv.fill(rows([[2, 2, 5, 7], [3, 6, 3, 8], [7, 7, 4, 7]]), hb, 'hair');
      cv.put(5, 3, hl);
    }
  } else {
    // 아기: 솜털만
    cv.fill(rows([[2, 2, 11, 17], [3, 5, 9, 19]]), hb, 'hair');
  }

  // 2) 얼굴
  cv.fill(face, (x, y) => (y >= chin - 1 || x <= 13 ? ss : y <= 9 && x >= 18 ? sl : sb), 'face');
  cv.put(22, 13, ss, 'face'); // 콧날 그림자
  cv.outline('face', K, true);

  // 3) 귀 (출신에 따라)
  const ear = (pts: [number, number, string][]) => {
    for (const [x, y, c] of pts) cv.put(x, y, c, 'ear');
    // 머리카락 위에서도 보이게 외곽선을 덧그린다 (얼굴 쪽은 피한다)
    cv.outline('ear', K, false, ['face']);
  };
  if (f.houseId === 'elf') {
    // 뒤로 길게 뻗은 엘프 귀 (머리카락 위로 드러난다)
    ear([[13, 12, sb], [13, 13, ss], [12, 11, sb], [12, 12, sb], [12, 13, ss], [11, 10, sl], [11, 11, sb], [11, 12, ss], [10, 9, sl], [10, 10, sb],
      [9, 8, sl], [9, 9, sb], [8, 7, sl], [8, 8, sb], [7, 6, sl], [6, 5, sl]]);
  } else if (f.houseId === 'mermaid') {
    ear([[12, 11, '#8ef0f0'], [12, 12, '#2ab8c8'], [12, 13, '#2ab8c8'], [11, 10, '#8ef0f0'], [11, 11, '#2ab8c8'], [11, 12, '#16788e'], [10, 9, '#8ef0f0'], [10, 10, '#2ab8c8']]);
  } else {
    ear([[12, 11, sb], [13, 11, sb], [12, 12, sb], [13, 12, ss], [12, 13, sb], [13, 13, sb]]);
  }

  // 4) 눈·눈썹·입
  const mood = f.dead ? 'neutral' : f.mood;
  const fem = f.gender === 'f' && f.stage !== 'baby';
  const eyeDark = darken(f.eye, 0.35);
  const put = (x: number, y: number, c: string) => cv.put(x, y, c, 'feat');
  if (f.blink || f.dead) {
    for (let x = 19; x <= 21; x++) put(x, 11, K);
  } else if (mood === 'happy') {
    put(19, 11, K);
    put(20, 10, K);
    put(21, 11, K);
  } else {
    for (let x = 19; x <= 21; x++) put(x, 10, K);
    if (fem) put(22, 9, K); // 속눈썹 꼬리
    put(20, 11, eyeDark);
    put(21, 11, '#ffffff'); // 눈동자 하이라이트
    put(20, 12, f.eye);
    if (fem || f.stage === 'child') put(21, 12, f.eye);
  }
  const brow = darken(hs, 0.15);
  if (mood === 'angry') {
    put(19, 8, brow);
    put(20, 8, brow);
    put(21, 9, brow);
  } else if (mood === 'sad' || mood === 'afraid') {
    put(19, 9, brow);
    put(20, 8, brow);
    put(21, 8, brow);
  } else {
    for (let x = 19; x <= 21; x++) put(x, 8, brow);
  }
  if (fem || f.stage === 'child' || f.stage === 'baby') {
    put(19, 13, BLUSH);
    put(20, 13, BLUSH);
  }
  const my = g === 'm' ? 16 : 15;
  if (mood === 'afraid' || mood === 'angry') {
    put(21, my, K);
    if (mood === 'afraid') put(21, my + 1, K);
  } else put(21, my, mood === 'sad' ? darken(MOUTH, 0.2) : MOUTH);
  if (mood === 'happy') put(22, my - 1, MOUTH);
  if (f.stage === 'elder') {
    put(18, 14, ss);
    put(19, 15, ss);
  }

  // 5) 앞머리 · 옆머리 (귀 앞으로 내린 머리)
  for (const [y, x0, x1] of SIDE_BANGS[f.bangs]) {
    for (let x = x0; x <= x1; x++) cv.put(x, y, x >= x1 - 1 || y >= 8 ? hs : hb, 'hair');
  }
  if (f.back !== 'none') {
    const lockEnd = fem && (f.back === 'long' || f.back === 'bob' || f.back === 'twin') ? 17 : 12;
    for (let y = 7; y <= lockEnd; y++) for (const x of [14, 15]) cv.put(x, y, x === 14 ? hs : hb, 'hair');
    if (lockEnd > 12) cv.put(15, lockEnd + 1, hs, 'hair');
  }
  cv.outline('hair', hairOutline, true);
  // 천사 고리 (광택)
  for (const [x, y] of [[9, 3], [10, 3], [11, 2], [12, 2], [13, 2], [8, 4]] as const) if (cv.has('hair', x, y)) cv.put(x, y, hl, 'hair');

  // 6) 출신 표식
  const mark = (pts: [number, number, string][], outline = K) => {
    for (const [x, y, c] of pts) cv.put(x, y, c, 'mark');
    cv.outline('mark', outline, true);
  };
  switch (f.houseId) {
    case 'beastkin':
      // 머리 위로 솟은 고양이 귀 (앞쪽 귀는 안쪽이 분홍)
      mark([[16, -3, hb], [16, -2, hb], [17, -2, hb], [15, -1, hb], [16, -1, '#ffb0c0'], [17, -1, hb], [15, 0, hb], [16, 0, '#ffb0c0'], [17, 0, hb], [18, 0, hb],
        [10, -2, hs], [10, -1, hs], [11, -1, hs], [9, 0, hs], [10, 0, hs], [11, 0, hs]], hairOutline);
      break;
    case 'demon':
      // 이마 위에서 뒤로 휘어 오르는 뿔
      mark([[16, 1, '#fff0e0'], [15, 0, '#fff0e0'], [15, -1, '#e8d8c8'], [14, -2, '#c8b0a0'], [13, -3, '#8a6a5a']]);
      break;
    case 'sky':
      for (let x = 8; x <= 17; x++) cv.put(x, -2, '#ffe070');
      cv.put(7, -1, '#ffe070');
      cv.put(18, -1, '#ffe070');
      break;
    case 'eastern':
      for (const [x, y, c] of [[7, 3, '#c8a060'], [6, 2, '#c8a060'], [8, 4, '#ff6a8a'], [9, 4, '#ffb0c8'], [8, 5, '#ffb0c8']] as const) cv.put(x, y, c);
      break;
    case 'noble':
      if (fem) {
        for (let x = 14; x <= 18; x++) cv.put(x, 3, '#ffd85a');
        cv.put(17, 2, '#ff5aa8');
      }
      break;
    case 'witch':
      if (f.stage !== 'baby') {
        cv.fill(rows([[-3, -3, 5, 6], [-2, -2, 5, 8], [-1, -1, 6, 10], [0, 0, 7, 13], [1, 1, 8, 16], [2, 2, 9, 19], [3, 3, 3, 24]]), (_x, y) => (y === 2 ? '#c8a0ff' : '#3a2a6a'), 'mark');
        cv.outline('mark', K, true);
      }
      break;
    case 'dwarf':
      if (fem) cv.put(9, 17, '#ffd05a');
      break;
  }

  // 7) 수염
  if (f.beard) {
    cv.fill(rows([[16, 16, 18, 21], [17, 18, 15, 21], [19, chin + 1, 15, 20]]), (_x, y) => (y >= chin ? hs : hb), 'beard');
    cv.put(21, 16, MOUTH);
    cv.outline('beard', hairOutline, true);
  }

  // 8) 부상: 반창고
  if (f.injured && !f.dead) {
    cv.put(18, 13, '#ffffff');
    cv.put(19, 13, '#ffffff');
  }
  return cv.p;
}

/** 옆얼굴의 턱 끝 줄 */
export function profileChin(f: Pick<Figure, 'stage' | 'gender'>): number {
  const g = f.stage === 'baby' ? 'baby' : f.stage === 'child' ? 'child' : f.gender;
  return Math.max(...Object.keys(SIDE_FACE[g]).map(Number)) + SIDE_DY;
}
