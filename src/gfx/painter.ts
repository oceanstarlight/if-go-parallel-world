/**
 * 순수 픽셀 버퍼. DOM/Pixi 에 의존하지 않으므로 어디서든(테스트 포함) 그릴 수 있다.
 * 색은 '#rrggbb' 문자열, 투명은 null.
 */
export type Color = string | null;

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** 4×4 베이어 디더 임계값 (0~1) */
export const bayer = (x: number, y: number) => (BAYER4[y & 3][x & 3] + 0.5) / 16;

export class Painter {
  readonly data: (string | null)[];

  constructor(readonly w: number, readonly h: number) {
    this.data = new Array(w * h).fill(null);
  }

  get(x: number, y: number): Color {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.data[(y | 0) * this.w + (x | 0)];
  }

  px(x: number, y: number, c: Color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  /** 두 색 사이를 t(0~1) 비율로 디더링한 사각형 */
  ditherRect(x: number, y: number, w: number, h: number, a: Color, b: Color, t: number) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) this.px(x + i, y + j, bayer(x + i, y + j) < t ? b : a);
    }
  }

  /** 세로 그라데이션: stops 색들을 위에서 아래로 디더링하며 잇는다 */
  vGradient(x: number, y: number, w: number, h: number, stops: string[]) {
    const n = stops.length - 1;
    for (let j = 0; j < h; j++) {
      const f = (j / Math.max(1, h - 1)) * n;
      const k = Math.min(n - 1, Math.floor(f));
      const t = f - k;
      for (let i = 0; i < w; i++) this.px(x + i, y + j, bayer(x + i, y + j) < t ? stops[k + 1] : stops[k]);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
    }
  }

  /** 원 안쪽을 조건부로 칠하기 (그림자/하이라이트 용) */
  ellipseWhere(cx: number, cy: number, rx: number, ry: number, c: Color, pred: (x: number, y: number) => boolean) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1 && pred(x, y)) this.px(x, y, c);
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  /** 볼록/오목 다각형 채우기 (짝수-홀수 규칙) */
  poly(pts: [number, number][], c: Color) {
    const ys = pts.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const yc = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + ((yc - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.px(x, y, c);
      }
    }
  }

  /** 채워진 픽셀 바깥쪽 테두리를 c 로 그린다 */
  outline(c: string, diagonal = false) {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const n = this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1) ||
          (diagonal && (this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1)));
        if (n) add.push(y * this.w + x);
      }
    }
    for (const i of add) this.data[i] = c;
  }

  /**
   * 애니풍 '색 외곽선': 검정 대신 인접한 색을 어둡게 한 색으로 테두리를 두른다.
   * amount 가 클수록 진하다.
   */
  outlineTinted(amount = 0.62) {
    const add: [number, string][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const n = this.get(x, y + 1) || this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1);
        if (n) add.push([y * this.w + x, mix(darken(n, amount), '#3a1a4a', 0.25)]);
      }
    }
    for (const [i, c] of add) this.data[i] = c;
  }

  /** 특정 색을 다른 색으로 치환 */
  replace(from: string, to: Color) {
    for (let i = 0; i < this.data.length; i++) if (this.data[i] === from) this.data[i] = to;
  }

  /** 다른 버퍼를 (dx,dy) 위치에 덮어 그림 (투명 무시) */
  blit(src: Painter, dx: number, dy: number, flipX = false) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        if (c) this.px(dx + (flipX ? src.w - 1 - x : x), dy + y, c);
      }
    }
  }

  /** 모든 픽셀에 색 변환 함수 적용 */
  map(fn: (c: string, x: number, y: number) => Color) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        const c = this.data[i];
        if (c) this.data[i] = fn(c, x, y);
      }
    }
  }

  toRGBA(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (!c) continue;
      const n = parseInt(c.slice(1), 16);
      out[i * 4] = (n >> 16) & 255;
      out[i * 4 + 1] = (n >> 8) & 255;
      out[i * 4 + 2] = n & 255;
      out[i * 4 + 3] = 255;
    }
    return out;
  }

  toCanvas(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const ctx = cv.getContext('2d')!;
    ctx.putImageData(new ImageData(this.toRGBA() as unknown as Uint8ClampedArray<ArrayBuffer>, this.w, this.h), 0, 0);
    return cv;
  }
}

// ───────────────────────── 색 / 난수 유틸 ─────────────────────────

export function hexToRgb(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** a→b 로 t 만큼 섞기 */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export const darken = (c: string, t: number) => mix(c, '#0a0608', t);
export const lighten = (c: string, t: number) => mix(c, '#fff4dc', t);

export function grayscale(c: string): string {
  const [r, g, b] = hexToRgb(c);
  const v = r * 0.3 + g * 0.59 + b * 0.11;
  return rgbToHex(v * 0.95, v * 0.95, v);
}

/** 문자열 → 32bit 시드 */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 시드 고정 난수 (mulberry32) */
export function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const softCache = new Map<string, string>();
/** 배경 색 보정: 채도를 낮추고 너무 밝거나 어두운 끝을 눌러 차분하게 만든다 */
export function soften(c: string): string {
  let out = softCache.get(c);
  if (out) return out;
  const [r, g, b] = hexToRgb(c);
  const l = r * 0.299 + g * 0.587 + b * 0.114;
  const f = (v: number) => 14 + (l + (v - l) * 0.68) * 0.86;
  out = rgbToHex(f(r), f(g), f(b));
  softCache.set(c, out);
  return out;
}
