import { Painter, bayer, darken, lighten, mix, seeded, soften } from './painter';

export const SCENE_W = 240;
export const SCENE_H = 135;

export type SceneKind =
  | 'title' | 'village' | 'snow' | 'room' | 'port' | 'castle' | 'demon_castle' | 'forest'
  | 'temple' | 'academy' | 'library' | 'dungeon' | 'road' | 'battlefield' | 'tavern'
  | 'throne' | 'graveyard' | 'grave' | 'burning';

export type TimeOfDay = 'day' | 'dusk' | 'night';

export type ParticleKind = 'embers' | 'snow' | 'rain' | 'fireflies' | 'dust' | 'ash' | 'petals' | 'leaves' | 'sparkles';

/** Pixi 에서 애니메이션으로 덧입힐 효과 */
export type Fx =
  | { kind: 'twinkle'; pts: [number, number][] }
  | { kind: 'glow'; pts: [number, number, number, string][] } // x, y, 반경, 색 (깜빡이는 빛)
  | { kind: 'particles'; type: ParticleKind; count: number; area: [number, number, number, number] }
  | { kind: 'fog'; y: number; h: number; color: string }
  /** 흘러가는 구름: [x, y, 폭] */
  | { kind: 'clouds'; items: [number, number, number][]; speed: number; tint: string }
  /** 날아가는 새 떼 */
  | { kind: 'birds'; count: number; color: string };

export interface Scene {
  p: Painter;
  fx: Fx[];
  /** 전투 시 인물이 서는 지면 높이 */
  groundY: number;
}

/** 애니 배경 특유의 맑고 진한 하늘 */
const SKY: Record<TimeOfDay, string[]> = {
  day: ['#5a8cc8', '#72a0d2', '#8eb6dc', '#b2cde4', '#d6e4ec'],
  dusk: ['#4a4888', '#7a5a98', '#b87a98', '#d89a8c', '#ecc4a0'],
  night: ['#161c44', '#222c5e', '#33437c', '#485c94'],
};

/** 시간대별 색 보정: 밤에는 파랗게, 노을에는 분홍빛으로 */
function tint(c: string, time: TimeOfDay): string {
  if (time === 'night') return mix(darken(c, 0.25), '#3a4aa8', 0.35);
  if (time === 'dusk') return mix(c, '#ff8a9a', 0.18);
  return c;
}

type Rnd = () => number;

// ───────────────────────── 공용 그리기 도구 ─────────────────────────

function sky(p: Painter, time: TimeOfDay, h: number) {
  p.vGradient(0, 0, p.w, h, SKY[time]);
}

/** 완만하게 굽이치는 언덕 (사인파 합) */
function hills(p: Painter, rnd: Rnd, baseY: number, amp: number, color: string, light: string): number[] {
  const f1 = 0.015 + rnd() * 0.02, f2 = 0.04 + rnd() * 0.03, ph1 = rnd() * 6, ph2 = rnd() * 6;
  const out: number[] = [];
  for (let x = 0; x < p.w; x++) {
    const y = Math.round(baseY + Math.sin(x * f1 + ph1) * amp + Math.sin(x * f2 + ph2) * amp * 0.35);
    out.push(y);
    p.rect(x, y, 1, p.h - y, color);
    p.px(x, y, light);
    if (x % 3 === 0) p.px(x, y + 1, light);
  }
  return out;
}

/** 멀리 보이는 눈 덮인 산맥 */
function mountains(p: Painter, rnd: Rnd, baseY: number, color: string, snow: string) {
  let x = -20;
  while (x < p.w + 20) {
    const w = 40 + rnd() * 50, h = 22 + rnd() * 26;
    const peak = x + w / 2;
    p.poly([[x, baseY], [peak, baseY - h], [x + w, baseY]], color);
    p.poly([[peak, baseY - h], [x + w, baseY], [peak + w * 0.15, baseY]], darken(color, 0.12));
    p.poly([[peak - w * 0.12, baseY - h * 0.72], [peak, baseY - h], [peak + w * 0.12, baseY - h * 0.72], [peak + 3, baseY - h * 0.64], [peak - 3, baseY - h * 0.68]], snow);
    x += w * 0.65;
  }
}

/** 몽실몽실한 적운 */
export function cloudPainter(w: number, seed = 1, tintColor = '#ffffff'): Painter {
  const rnd = seeded(seed);
  const h = Math.round(w * 0.45);
  const p = new Painter(w, h + 2);
  const base = tintColor;
  const shade = mix(base, '#a8c8f0', 0.55);
  const n = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const cx = w * (0.15 + t * 0.7);
    const r = w * (0.14 + rnd() * 0.12) * (1 - Math.abs(t - 0.5) * 0.6);
    p.ellipse(cx, h - r * 0.9, r, r * 0.9, base);
  }
  p.rect(Math.round(w * 0.1), h - 3, Math.round(w * 0.8), 3, base);
  // 아랫부분 그림자
  p.map((c, x, y) => (c === base && y > h * 0.7 && (y > h * 0.82 || (x + y) % 2 === 0) ? shade : c));
  return p;
}

function staticClouds(p: Painter, rnd: Rnd, n: number, maxY: number, time: TimeOfDay) {
  const tintC = time === 'dusk' ? '#ffe4ec' : time === 'night' ? '#8a9ad8' : '#ffffff';
  for (let i = 0; i < n; i++) {
    const c = cloudPainter(30 + Math.floor(rnd() * 40), Math.floor(rnd() * 1000), tintC);
    p.blit(c, Math.floor(rnd() * (p.w - 20)) - 10, Math.floor(rnd() * maxY));
  }
}

function driftClouds(rnd: Rnd, n: number, maxY: number, time: TimeOfDay): Fx {
  const items: [number, number, number][] = [];
  for (let i = 0; i < n; i++) items.push([rnd() * SCENE_W, 4 + rnd() * maxY, 24 + Math.floor(rnd() * 30)]);
  return { kind: 'clouds', items, speed: 0.004 + rnd() * 0.004, tint: time === 'dusk' ? '#ffe4ec' : time === 'night' ? '#8a9ad8' : '#ffffff' };
}

function stars(p: Painter, rnd: Rnd, count: number, maxY: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * p.w), y = Math.floor(rnd() * maxY);
    const bright = rnd() < 0.2;
    p.px(x, y, bright ? '#ffffff' : rnd() < 0.5 ? '#a8c0ff' : '#ffe8ff');
    if (bright) pts.push([x, y]);
  }
  return pts;
}

function moon(p: Painter, x: number, y: number, r: number) {
  p.ellipse(x, y, r + 3, r + 3, '#6a80d0');
  p.ellipse(x, y, r + 1, r + 1, '#a8b8f0');
  p.ellipse(x, y, r, r, '#fffbe8');
  p.ellipse(x - r * 0.3, y - r * 0.2, r * 0.22, r * 0.22, '#f0ead0');
  p.ellipse(x + r * 0.25, y + r * 0.3, r * 0.15, r * 0.15, '#f0ead0');
}

function sun(p: Painter, x: number, y: number, r: number, time: TimeOfDay) {
  const core = time === 'dusk' ? '#fff0a0' : '#ffffff';
  const halo = time === 'dusk' ? '#ffc070' : '#d8f0ff';
  p.ellipseWhere(x, y, r * 2.2, r * 2.2, halo, (px, py) => bayer(px, py) < 0.4);
  p.ellipse(x, y, r * 1.3, r * 1.3, mix(core, halo, 0.5));
  p.ellipse(x, y, r, r, core);
}

/** 둥글둥글한 활엽수 */
function roundTree(p: Painter, x: number, baseY: number, h: number, leaf: string, rnd: Rnd) {
  const trunk = '#a86a3a';
  p.rect(x - 1, baseY - h * 0.4, 3, h * 0.4, trunk);
  p.px(x + 1, baseY - h * 0.3, darken(trunk, 0.25));
  const r = h * 0.38;
  const cy = baseY - h * 0.62;
  const light = lighten(leaf, 0.35), dark = darken(leaf, 0.22);
  p.ellipse(x, cy, r, r * 0.9, leaf);
  p.ellipse(x - r * 0.55, cy + r * 0.3, r * 0.6, r * 0.55, leaf);
  p.ellipse(x + r * 0.55, cy + r * 0.3, r * 0.6, r * 0.55, leaf);
  p.ellipseWhere(x, cy, r * 1.4, r * 1.3, dark, (px, py) => p.get(px, py) === leaf && px - x + (py - cy) * 0.8 > r * 0.45);
  p.ellipseWhere(x - r * 0.3, cy - r * 0.35, r * 0.45, r * 0.35, light, (px, py) => p.get(px, py) === leaf);
  if (rnd() < 0.4) {
    // 열매
    p.px(x - 2, cy + 1, '#ff5a6a');
    p.px(x + 3, cy - 2, '#ff5a6a');
  }
}

function pine(p: Painter, x: number, baseY: number, h: number, c: string, snowy = false) {
  const w = h * 0.38;
  const light = lighten(c, 0.3);
  for (let i = 0; i < 4; i++) {
    const ty = baseY - h + i * h * 0.2;
    const tw = w * (0.45 + i * 0.2);
    p.poly([[x - tw, ty + h * 0.32], [x, ty], [x + tw, ty + h * 0.32]], c);
    p.poly([[x - tw, ty + h * 0.32], [x, ty], [x - tw * 0.2, ty + h * 0.32]], light);
    if (snowy) p.line(x - tw, ty + h * 0.32, x + tw, ty + h * 0.32, '#ffffff');
  }
  p.rect(x - 1, baseY - h * 0.12, 2, h * 0.12, '#8a5a32');
}

function flowers(p: Painter, rnd: Rnd, y0: number, y1: number, n: number) {
  const cols = ['#ff7aa8', '#ffe05a', '#ffffff', '#8ad0ff', '#c89aff'];
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd() * p.w), y = Math.floor(y0 + rnd() * (y1 - y0));
    const c = cols[Math.floor(rnd() * cols.length)];
    p.px(x, y, c);
    if (rnd() < 0.4) { p.px(x - 1, y, c); p.px(x + 1, y, c); p.px(x, y - 1, c); p.px(x, y, '#fff6a0'); }
  }
}

function grass(p: Painter, y: number, time: TimeOfDay) {
  p.vGradient(0, y, p.w, p.h - y, [tint('#7ae070', time), tint('#4ab858', time), tint('#38984a', time)]);
  for (let x = 0; x < p.w; x += 2) {
    const gy = y + ((x * 37) % (p.h - y));
    p.px(x, gy, tint('#a8f090', time));
    p.px(x, gy - 1, tint('#a8f090', time));
  }
}

function cottage(p: Painter, x: number, baseY: number, w: number, h: number, wall: string, roof: string, glows: Fx & { kind: 'glow' }, time: TimeOfDay) {
  p.rect(x, baseY - h, w, h, wall);
  p.rect(x + w - 3, baseY - h, 3, h, darken(wall, 0.12));
  // 목조 기둥 (하프팀버)
  p.rect(x, baseY - h, 1, h, '#a87a50');
  p.rect(x + w - 1, baseY - h, 1, h, '#a87a50');
  p.rect(x, baseY - h + Math.floor(h / 2), w, 1, '#a87a50');
  p.poly([[x - 3, baseY - h + 1], [x + w / 2, baseY - h - w * 0.45], [x + w + 3, baseY - h + 1]], roof);
  p.poly([[x - 3, baseY - h + 1], [x + w / 2, baseY - h - w * 0.45], [x + w / 2, baseY - h + 1]], lighten(roof, 0.2));
  p.line(x - 3, baseY - h + 1, x + w + 3, baseY - h + 1, darken(roof, 0.3));
  p.rect(x + w * 0.65, baseY - h - w * 0.42, 3, w * 0.28, '#c86a5a');
  const lit = time !== 'day';
  const wc = lit ? '#ffe070' : '#8ad8ff';
  const wx = x + 3, wy = baseY - h + 4;
  p.rect(wx, wy, 5, 4, wc);
  p.rect(wx + 2, wy, 1, 4, '#ffffff');
  p.px(wx, wy, '#ffffff');
  if (lit) glows.pts.push([wx + 2, wy + 2, 7, '#ffd060']);
  // 화분과 문
  p.rect(x + w - 9, baseY - 8, 5, 8, '#c8784a');
  p.px(x + w - 5, baseY - 4, '#ffe070');
  p.rect(wx - 1, wy + 4, 7, 1, '#ff7aa8');
}

/** 동화풍 성: 흰 벽에 푸른 원뿔 지붕 */
function castle(p: Painter, x: number, baseY: number, w: number, h: number, wall: string, roof: string, glows: Fx & { kind: 'glow' }, time: TimeOfDay, spiky = false) {
  const wallShade = darken(wall, 0.15);
  const win = time === 'day' ? '#5aa8ff' : '#ffe070';
  const tower = (tx: number, tw: number, th: number) => {
    p.rect(tx, baseY - th, tw, th, wall);
    p.rect(tx + tw - 2, baseY - th, 2, th, wallShade);
    const rh = spiky ? tw * 1.8 : tw * 1.3;
    p.poly([[tx - 2, baseY - th + 1], [tx + tw / 2, baseY - th - rh], [tx + tw + 2, baseY - th + 1]], roof);
    p.poly([[tx - 2, baseY - th + 1], [tx + tw / 2, baseY - th - rh], [tx + tw / 2, baseY - th + 1]], lighten(roof, 0.22));
    p.rect(tx + tw / 2, baseY - th - rh - 5, 1, 5, '#a87a50');
    p.poly([[tx + tw / 2 + 1, baseY - th - rh - 5], [tx + tw / 2 + 5, baseY - th - rh - 4], [tx + tw / 2 + 1, baseY - th - rh - 3]], spiky ? '#ff3a7a' : '#ff5a6a');
    for (let i = 0; i < th / 11; i++) {
      const wy = baseY - th + 5 + i * 10;
      if (wy > baseY - 8) break;
      p.rect(tx + tw / 2 - 1, wy, 3, 4, win);
      p.ellipse(tx + tw / 2 + 0.5, wy, 1.5, 1, win);
      if (time !== 'day') glows.pts.push([tx + tw / 2, wy + 2, 5, win]);
    }
  };
  p.rect(x, baseY - h * 0.45, w, h * 0.45, wall);
  for (let i = 0; i < w; i += 4) p.rect(x + i, baseY - h * 0.45 - 2, 2, 2, wall);
  tower(x - 4, 11, h * 0.7);
  tower(x + w - 7, 11, h * 0.75);
  tower(x + w * 0.3, 13, h);
  tower(x + w * 0.58, 10, h * 0.82);
  p.rect(x + w / 2 - 4, baseY - 11, 8, 11, '#a86a3a');
  p.ellipse(x + w / 2, baseY - 11, 4, 3, '#a86a3a');
  p.rect(x + w / 2 - 1, baseY - 11, 1, 11, '#d8a060');
}

function bricks(p: Painter, x0: number, y0: number, w: number, h: number, base: string, rnd: Rnd) {
  const mortar = darken(base, 0.2);
  p.rect(x0, y0, w, h, base);
  for (let y = y0; y < y0 + h; y += 6) {
    p.rect(x0, y, w, 1, mortar);
    const off = ((y - y0) / 6) % 2 === 0 ? 0 : 6;
    for (let x = x0 + off; x < x0 + w; x += 12) {
      p.rect(x, y, 1, 6, mortar);
      const v = rnd();
      if (v < 0.25) p.rect(x + 1, y + 1, 11, 5, darken(base, 0.06));
      else if (v > 0.8) p.rect(x + 1, y + 1, 11, 1, lighten(base, 0.2));
    }
  }
}

function floorPlanks(p: Painter, y0: number, base: string) {
  for (let y = y0; y < p.h; y++) {
    const t = (y - y0) / (p.h - y0);
    for (let x = 0; x < p.w; x++) {
      const seam = Math.round((x - p.w / 2) / (6 + t * 18)) !== Math.round((x - 1 - p.w / 2) / (6 + t * 18));
      p.px(x, y, seam ? darken(base, 0.18) : bayer(x, y) < t * 0.5 ? lighten(base, 0.08) : base);
    }
  }
}

function torch(p: Painter, x: number, y: number, glows: Fx & { kind: 'glow' }, flame = '#ffa040') {
  p.rect(x - 1, y, 3, 7, '#8a5a32');
  p.ellipse(x, y - 2, 2.5, 3.5, flame);
  p.ellipse(x, y - 1, 1.2, 2, '#fff4a0');
  glows.pts.push([x, y - 2, 18, flame]);
}

function pillar(p: Painter, x: number, top: number, bottom: number, w: number, c: string) {
  p.rect(x, top, w, bottom - top, c);
  p.rect(x + 1, top, 2, bottom - top, lighten(c, 0.3));
  p.rect(x + w - 3, top, 3, bottom - top, darken(c, 0.15));
  p.rect(x - 2, top, w + 4, 4, lighten(c, 0.15));
  p.rect(x - 2, bottom - 4, w + 4, 4, darken(c, 0.08));
}

function banner(p: Painter, x: number, y: number, c: string) {
  p.rect(x, y, 1, 30, '#a87a50');
  p.poly([[x + 1, y + 1], [x + 12, y + 3], [x + 9, y + 7], [x + 12, y + 11], [x + 1, y + 10]], c);
  p.line(x + 1, y + 1, x + 11, y + 3, lighten(c, 0.3));
}

function crystal(p: Painter, x: number, baseY: number, h: number, c: string, glows: Fx & { kind: 'glow' }) {
  const w = h * 0.35;
  p.poly([[x - w, baseY], [x - w * 0.6, baseY - h * 0.7], [x, baseY - h], [x + w * 0.6, baseY - h * 0.7], [x + w, baseY]], c);
  p.poly([[x, baseY - h], [x + w * 0.6, baseY - h * 0.7], [x + w, baseY], [x, baseY]], darken(c, 0.2));
  p.line(x - w * 0.4, baseY - h * 0.6, x - 1, baseY - h * 0.95, '#ffffff');
  glows.pts.push([x, baseY - h * 0.5, h * 0.9, c]);
}

// ───────────── 시안 참고 배경용 도구 (v0.9) ─────────────

/** 몽글몽글한 덤불: 위는 밝게, 아래는 어둡게 */
function bush(p: Painter, x: number, y: number, r: number, c: string, rnd: Rnd) {
  const lt = lighten(c, 0.14), dk = darken(c, 0.2);
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) p.ellipse(x + (rnd() - 0.5) * r * 1.6, y - rnd() * r * 0.5, r * (0.55 + rnd() * 0.4), r * (0.45 + rnd() * 0.3), c);
  for (let py = Math.floor(y - r * 1.4); py <= y + r; py++) for (let px = Math.floor(x - r * 2); px <= x + r * 2; px++) {
    if (p.get(px, py) !== c) continue;
    if (py > y + r * 0.1 || (py > y - r * 0.2 && bayer(px, py) < 0.5)) p.px(px, py, dk);
    else if (py < y - r * 0.55 && bayer(px, py) < 0.45) p.px(px, py, lt);
  }
}

/** 3/4 시점 시골집: 박공 앞면 + 오른쪽으로 물러나는 옆벽과 지붕 */
function house(p: Painter, x: number, baseY: number, w: number, d: number, h: number, wall: string, roof: string, glows: Fx & { kind: 'glow' }, time: TimeOfDay) {
  const sk = 0.42;
  const top = baseY - h;
  const wallSh = darken(wall, 0.16), roofSh = darken(roof, 0.2), roofLt = lighten(roof, 0.1);
  const apexX = x + w / 2, apexY = top - w * 0.48;
  // 옆벽
  p.poly([[x + w, baseY], [x + w + d, baseY - d * sk], [x + w + d, top - d * sk], [x + w, top]], wallSh);
  // 앞벽 + 박공
  p.rect(x, top, w, h, wall);
  p.poly([[x, top + 0.5], [apexX, apexY], [x + w, top + 0.5]], wall);
  // 지붕면 (기와 줄무늬는 처마와 나란히)
  const roofPts: [number, number][] = [[apexX, apexY - 1], [apexX + d, apexY - 1 - d * sk], [x + w + d + 2, top - d * sk + 2], [x + w + 2, top + 2]];
  p.poly(roofPts, roof);
  for (let py = Math.floor(apexY - d * sk - 2); py <= top + 3; py++) for (let px = Math.floor(apexX); px <= x + w + d + 3; px++) {
    if (p.get(px, py) !== roof) continue;
    const v = py + (px - x) * sk;
    if (Math.floor(v) % 3 === 0) p.px(px, py, roofSh);
    else if (bayer(px, py) < 0.18) p.px(px, py, roofLt);
  }
  // 박공 테두리 (처마 끝)
  p.line(x - 2, top + 2, apexX, apexY - 1, roofSh);
  p.line(x - 1, top + 2, apexX, apexY, roof);
  p.line(apexX, apexY - 1, x + w + 2, top + 2, roof);
  // 굴뚝
  const chx = apexX + d * 0.6, chy = apexY - d * 0.6 * sk;
  p.rect(chx, chy - 4, 3, 6, darken(wall, 0.3));
  // 창과 문
  const lit = time !== 'day';
  const glass = lit ? '#e8c878' : '#5a6070';
  const frame = darken(wall, 0.35);
  const winW = Math.max(3, Math.round(w * 0.16));
  const fwx = Math.round(x + w * 0.2), fwy = Math.round(top + h * 0.28);
  p.rect(fwx - 1, fwy - 1, winW + 2, winW + 1, frame);
  p.rect(fwx, fwy, winW, winW - 1, glass);
  const dw = Math.max(3, Math.round(w * 0.18));
  const dx = Math.round(x + w * 0.62);
  p.rect(dx, baseY - Math.round(h * 0.55), dw, Math.round(h * 0.55), '#6e4e3a');
  p.rect(dx, baseY - Math.round(h * 0.55), dw, 1, frame);
  for (let i = 0; i < 2; i++) {
    const sx = x + w + 2 + i * (d / 2), sy = top + h * 0.3 - (sx - x - w) * sk;
    p.rect(sx, sy, 2, 3, glass);
    if (lit) glows.pts.push([sx + 1, sy + 1, 5, '#e8b060']);
  }
  if (lit) glows.pts.push([fwx + winW / 2, fwy + 1, 7, '#e8b060']);
  // 벽 아래 그늘
  p.rect(x, baseY - 1, w, 1, darken(wall, 0.25));
}

/** 언덕 위 풍차 */
function windmill(p: Painter, x: number, baseY: number, h: number, wall: string, roof: string, blade: string) {
  p.poly([[x - h * 0.22, baseY], [x - h * 0.13, baseY - h], [x + h * 0.13, baseY - h], [x + h * 0.22, baseY]], wall);
  p.poly([[x + 0.5, baseY], [x + h * 0.06, baseY - h], [x + h * 0.13, baseY - h], [x + h * 0.22, baseY]], darken(wall, 0.15));
  p.poly([[x - h * 0.17, baseY - h], [x, baseY - h * 1.25], [x + h * 0.17, baseY - h]], roof);
  const hx = x, hy = baseY - h * 0.95;
  for (let k = 0; k < 4; k++) {
    const a = 0.35 + (k * Math.PI) / 2;
    const ex = hx + Math.cos(a) * h * 0.85, ey = hy + Math.sin(a) * h * 0.85;
    p.line(hx, hy, ex, ey, blade);
    const nx = -Math.sin(a) * 2, ny = Math.cos(a) * 2;
    p.line(hx + Math.cos(a) * h * 0.25 + nx, hy + Math.sin(a) * h * 0.25 + ny, ex + nx, ey + ny, mix(blade, wall, 0.5));
  }
  p.px(hx, hy, darken(roof, 0.3));
}

/** 커다란 돌벽 (돌마다 톤이 조금씩 다르다) */
function stoneWall(p: Painter, x0: number, y0: number, w: number, h: number, base: string, rnd: Rnd) {
  const mortar = darken(base, 0.3);
  p.rect(x0, y0, w, h, mortar);
  for (let y = y0, row = 0; y < y0 + h; y += 11, row++) {
    for (let x = x0 - (row % 2 ? 9 : 0); x < x0 + w;) {
      const bw = 14 + Math.floor(rnd() * 8);
      const tone = mix(base, rnd() < 0.5 ? '#ffffff' : '#000000', rnd() * 0.08);
      p.rect(x + 1, y + 1, bw - 1, 10, tone);
      p.rect(x + 1, y + 1, bw - 1, 1, lighten(tone, 0.1));
      p.rect(x + 1, y + 10, bw - 1, 1, darken(tone, 0.12));
      x += bw;
    }
  }
}

interface GothicPalette { stone: string; shade: string; roof: string; win: string; base: string; lit: boolean }

/** 시안의 고딕 성: 가운데 높은 탑을 중심으로 첨탑이 층층이 솟는다 */
function gothicCastle(p: Painter, rnd: Rnd, cx: number, baseY: number, c: GothicPalette, glows: Fx & { kind: 'glow' }) {
  // 바위 기단
  const rock: [number, number][] = [[cx - 120, 135], [cx - 104, baseY + 4]];
  for (let x = cx - 96; x <= cx + 96; x += 8) rock.push([x, baseY - 2 + rnd() * 6]);
  rock.push([cx + 106, baseY + 4], [cx + 122, 135]);
  p.poly(rock, c.base);
  for (let i = 0; i < 26; i++) {
    const rx = cx - 100 + rnd() * 200, ry = baseY + 4 + rnd() * 24;
    p.line(rx, ry, rx + (rnd() - 0.5) * 6, ry + 4 + rnd() * 6, darken(c.base, 0.22));
  }
  p.map((col, x, y) => (col === c.base && y > baseY && x > cx + 10 && bayer(x, y) < 0.5 + (x - cx) / 240 ? darken(col, 0.14) : col));
  // 성벽
  p.rect(cx - 94, baseY - 22, 188, 24, c.stone);
  p.rect(cx + 20, baseY - 22, 74, 24, c.shade);
  for (let x = cx - 94; x < cx + 94; x += 5) p.rect(x, baseY - 25, 3, 3, x > cx + 20 ? c.shade : c.stone);
  const win = c.lit ? c.win : darken(c.shade, 0.35);
  const tower = (tx: number, w: number, h: number, spire: number) => {
    const top = baseY - h;
    p.rect(tx - w / 2, top, w, h, c.stone);
    p.rect(tx + w / 6, top, w / 3 + 0.5, h, c.shade);
    p.rect(tx - w / 2 - 1, top, w + 2, 2, lighten(c.stone, 0.08));
    for (let y = top + 6; y < baseY - 10; y += 13) {
      p.rect(tx - 1, y, 2, 6, win);
      p.px(tx - 1, y - 1, win);
      if (c.lit && rnd() < 0.6) glows.pts.push([tx, y + 3, 5, c.win]);
    }
    p.poly([[tx - w / 2 - 1, top], [tx, top - spire], [tx + w / 2 + 1, top]], c.roof);
    p.poly([[tx, top - spire], [tx + w / 2 + 1, top], [tx + 0.5, top]], darken(c.roof, 0.18));
    p.line(tx, top - spire - 3, tx, top - spire, darken(c.roof, 0.3));
    // 모서리 작은 첨탑
    for (const s of [-1, 1]) p.poly([[tx + s * (w / 2) - 1.5, top], [tx + s * (w / 2), top - spire * 0.35], [tx + s * (w / 2) + 1.5, top]], c.roof);
  };
  const towers: [number, number, number, number][] = [
    [-86, 9, 34, 12], [86, 9, 36, 13], [-68, 10, 46, 16], [68, 11, 50, 18],
    [-48, 12, 62, 20], [50, 12, 66, 22], [-27, 14, 76, 24], [28, 14, 80, 26],
  ];
  for (const [dx, w, h, s] of towers) tower(cx + dx, w, h, s);
  // 가운데 큰 탑: 장미창과 정문
  tower(cx, 28, 96, 32);
  p.ellipse(cx, baseY - 58, 7, 7, darken(c.stone, 0.25));
  p.ellipse(cx, baseY - 58, 6, 6, c.lit ? c.win : mix(c.win, c.shade, 0.5));
  for (let k = 0; k < 8; k++) p.line(cx, baseY - 58, cx + Math.cos((k * Math.PI) / 4) * 6, baseY - 58 + Math.sin((k * Math.PI) / 4) * 6, darken(c.stone, 0.25));
  glows.pts.push([cx, baseY - 58, 16, c.win]);
  p.ellipse(cx, baseY - 20, 8, 8, darken(c.shade, 0.45));
  p.rect(cx - 8, baseY - 20, 17, 20, darken(c.shade, 0.45));
  for (let x = cx - 6; x <= cx + 6; x += 3) p.line(x, baseY - 26, x, baseY - 2, darken(c.shade, 0.2));
}

// ───────────────────────── 장면 ─────────────────────────

/** 장면마다 기본 시간대. 호출자가 덮어쓸 수 있다 */
export const DEFAULT_TIME: Record<SceneKind, TimeOfDay> = {
  title: 'dusk', village: 'day', snow: 'day', room: 'day', port: 'day', castle: 'day',
  demon_castle: 'dusk', forest: 'day', temple: 'day', academy: 'day', library: 'day',
  dungeon: 'night', road: 'day', battlefield: 'day', tavern: 'night', throne: 'day',
  graveyard: 'dusk', grave: 'dusk', burning: 'night',
};

export function drawScene(kind: SceneKind, seed = 1, time: TimeOfDay = DEFAULT_TIME[kind]): Scene {
  const rnd = seeded(seed * 7919 + kind.length * 104729);
  const p = new Painter(SCENE_W, SCENE_H);
  const glows: Fx & { kind: 'glow' } = { kind: 'glow', pts: [] };
  const fx: Fx[] = [glows];
  let groundY = 116;
  const T = (c: string) => tint(c, time);

  /** 바깥 장면 공통: 하늘 + 해/달 + 구름 + 새 */
  const outdoor = (skyH: number, cloudN = 3) => {
    sky(p, time, skyH);
    if (time === 'night') {
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 90, skyH * 0.7) });
      moon(p, 196, 24, 9);
    } else {
      sun(p, time === 'dusk' ? 190 : 40, time === 'dusk' ? skyH - 26 : 20, time === 'dusk' ? 9 : 6, time);
      fx.push({ kind: 'birds', count: 3 + Math.floor(rnd() * 3), color: time === 'dusk' ? '#5a3a6a' : '#3a5a8a' });
    }
    staticClouds(p, rnd, cloudN, skyH * 0.45, time);
    fx.push(driftClouds(rnd, 3, skyH * 0.4, time));
  };

  switch (kind) {
    case 'title': {
      outdoor(110, 4);
      mountains(p, rnd, 92, T('#9ab0f0'), '#ffffff');
      hills(p, rnd, 100, 5, T('#6ad07a'), T('#a8f0a0'));
      // 언덕 위의 성
      p.ellipse(60, 120, 70, 26, T('#58c068'));
      castle(p, 26, 102, 60, 50, T('#ffffff'), T('#4a7aff'), glows, time);
      hills(p, rnd, 118, 3, T('#4ab858'), T('#7ae070'));
      flowers(p, rnd, 120, 135, 40);
      fx.push({ kind: 'particles', type: 'petals', count: 24, area: [0, -10, 240, 145] });
      fx.push({ kind: 'particles', type: 'sparkles', count: 14, area: [0, 0, 240, 100] });
      groundY = 126;
      break;
    }
    case 'village': {
      // 시안: 겹겹이 구르는 언덕, 언덕 위 풍차, 흰 벽에 갈색 지붕을 얹은 집들
      outdoor(70, 4);
      const far = hills(p, rnd, 52, 5, T('#86a894'), T('#9cb8a0'));
      windmill(p, 74, far[74] + 3, 16, T('#e8e0d0'), T('#8a5a44'), T('#f0e8da'));
      p.rect(46, far[46] - 9, 4, 11, T('#e0dace'));
      p.poly([[45, far[46] - 9], [48, far[46] - 13], [51, far[46] - 9]], T('#8a5a44'));
      const mid = hills(p, rnd, 68, 7, T('#6f9a62'), T('#85ad72'));
      for (let i = 0; i < 9; i++) {
        const bx = rnd() * 240;
        bush(p, bx, mid[Math.max(0, Math.min(239, Math.round(bx)))] + 4, 5 + rnd() * 5, T('#557f4c'), rnd);
      }
      hills(p, rnd, 86, 5, T('#7fac64'), T('#94bf78'));
      p.vGradient(0, 98, p.w, 37, [T('#7aa860'), T('#6e9c56'), T('#62904e')]);
      for (let i = 0; i < 260; i++) {
        const gx = Math.floor(rnd() * 240), gy = 90 + Math.floor(rnd() * 45);
        if (p.get(gx, gy)) p.px(gx, gy, rnd() < 0.5 ? T('#8cb874') : T('#5a8648'));
      }
      // 흙길
      p.poly([[96, 135], [150, 135], [134, 112], [150, 98], [140, 96], [120, 110]], T('#c4b48c'));
      p.poly([[100, 135], [110, 135], [124, 112], [120, 110]], T('#b0a07a'));
      bush(p, 196, 104, 9, T('#5a8650'), rnd);
      bush(p, 16, 108, 8, T('#5a8650'), rnd);
      const wall = T('#ece4d2'), roofs = [T('#a8603c'), T('#9a5838'), T('#b06a42'), T('#94563a')];
      house(p, 126, 92, 22, 14, 12, wall, roofs[0], glows, time);
      house(p, 172, 102, 22, 14, 13, wall, roofs[1], glows, time);
      house(p, 146, 118, 24, 16, 14, wall, roofs[2], glows, time);
      house(p, 20, 128, 34, 18, 18, wall, roofs[3], glows, time);
      bush(p, 70, 126, 7, T('#5a8650'), rnd);
      flowers(p, rnd, 112, 135, 14);
      fx.push({ kind: 'particles', type: time === 'night' ? 'fireflies' : 'leaves', count: 10, area: [0, 0, 240, 135] });
      groundY = 128;
      break;
    }
    case 'snow': {
      outdoor(90, 3);
      mountains(p, rnd, 78, T('#b8c8f0'), '#ffffff');
      hills(p, rnd, 88, 4, T('#e8f0ff'), '#ffffff');
      p.vGradient(0, 100, p.w, 35, [T('#f4f8ff'), T('#d0dcf4')]);
      fx.push({ kind: 'particles', type: 'snow', count: 70, area: [0, -10, 240, 145] });
      for (let i = 0; i < 7; i++) pine(p, 10 + i * 36 + rnd() * 10, 101, 16 + rnd() * 8, T('#3a9a7a'), true);
      cottage(p, 40, 112, 26, 16, T('#fff4e4'), '#ffffff', glows, time);
      cottage(p, 120, 108, 22, 14, T('#fff0dc'), '#ffffff', glows, time);
      cottage(p, 182, 114, 28, 17, T('#fff4e4'), '#ffffff', glows, time);
      for (let x = 0; x < p.w; x += 6) p.rect(x, 121, 2, 6, T('#e8c08a'));
      p.rect(0, 123, p.w, 1, T('#d0a070'));
      groundY = 128;
      break;
    }
    case 'room': {
      p.rect(0, 0, p.w, 100, '#ffe8d0');
      for (let x = 0; x < p.w; x += 14) p.rect(x, 0, 1, 100, '#f4d4b8');
      p.rect(0, 0, p.w, 6, '#d8a878');
      p.rect(0, 92, p.w, 8, '#e8b888');
      floorPlanks(p, 100, '#d89a68');
      // 창: 시간대에 맞는 하늘
      p.rect(36, 18, 42, 36, '#ffffff');
      p.vGradient(38, 20, 38, 32, SKY[time].slice(1));
      if (time === 'night') moon(p, 64, 30, 4);
      else p.blit(cloudPainter(18, 3), 42, 26);
      p.rect(56, 18, 2, 36, '#ffffff');
      p.rect(36, 35, 42, 2, '#ffffff');
      p.rect(30, 16, 6, 42, '#ff9ab8');
      p.rect(78, 16, 6, 42, '#ff9ab8');
      p.rect(34, 54, 46, 3, '#c8885a');
      p.rect(46, 50, 4, 4, '#ff7a8a'); // 화분 꽃
      p.rect(47, 47, 2, 3, '#5ac860');
      // 난로 대신 따뜻한 책장과 장난감
      p.rect(150, 40, 60, 60, '#c8885a');
      for (let sy = 46; sy < 96; sy += 16) {
        p.rect(152, sy + 12, 56, 2, '#a86a3a');
        for (let bx = 154; bx < 206; bx += 4) p.rect(bx, sy + 3 + Math.floor(rnd() * 3), 3, 9, ['#ff7aa8', '#5aa8ff', '#ffd05a', '#7ae07a', '#b07aff'][Math.floor(rnd() * 5)]);
      }
      // 요람
      p.ellipse(100, 108, 18, 8, '#ffffff');
      p.ellipseWhere(100, 108, 18, 8, '#ffd0e4', (_x, y) => y > 108);
      p.rect(84, 112, 2, 10, '#c8885a');
      p.rect(114, 112, 2, 10, '#c8885a');
      p.ellipse(100, 101, 6, 3, '#ffe8f0');
      // 창으로 드는 햇빛
      if (time !== 'night') p.map((c, x, y) => (y > 56 && y < 100 && x - (y - 56) * 0.6 > 34 && x - (y - 56) * 0.6 < 80 && bayer(x, y) < 0.3 ? lighten(c, 0.25) : c));
      fx.push({ kind: 'particles', type: 'dust', count: 16, area: [30, 20, 100, 80] });
      groundY = 124;
      break;
    }
    case 'port': {
      outdoor(80, 3);
      p.vGradient(0, 80, p.w, 55, [T('#5ac0ff'), T('#2a8ae8'), T('#1a68c0')]);
      for (let y = 82; y < 135; y += 3) for (let x = (y * 7) % 11; x < p.w; x += 9 + (y % 5)) p.rect(x, y, 3, 1, T('#c8ecff'));
      const ship = (x: number, y: number, s: number) => {
        p.poly([[x - 16 * s, y], [x + 18 * s, y], [x + 12 * s, y + 7 * s], [x - 12 * s, y + 7 * s]], T('#c8784a'));
        p.rect(x - 14 * s, y, 30 * s, 1, T('#ffffff'));
        p.rect(x - 1, y - 30 * s, 2, 30 * s, T('#8a5a32'));
        p.poly([[x + 1, y - 28 * s], [x + 14 * s, y - 8 * s], [x + 1, y - 6 * s]], T('#ffffff'));
        p.poly([[x - 1, y - 24 * s], [x - 12 * s, y - 6 * s], [x - 1, y - 6 * s]], T('#f0f4ff'));
        p.poly([[x + 1, y - 30 * s], [x + 6 * s, y - 28 * s], [x + 1, y - 26 * s]], '#ff5a6a');
      };
      ship(60, 92, 1);
      ship(170, 86, 0.6);
      p.rect(0, 102, 240, 33, T('#e8c08a'));
      p.rect(0, 102, 240, 2, T('#c8985a'));
      const roofs = ['#ff6a5a', '#5a8aff', '#ffa040', '#7ad06a'];
      for (let i = 0; i < 4; i++) cottage(p, 8 + i * 62, 118, 34, 18, T('#fffaf0'), T(roofs[i]), glows, time);
      groundY = 128;
      break;
    }
    case 'castle': {
      // 시안: 아래에서 올려다본 고딕 왕성. 낮에는 흰 돌, 청회색 첨탑
      outdoor(118, 3);
      mountains(p, rnd, 92, T('#98a8c0'), T('#e8eef4'));
      hills(p, rnd, 100, 3, T('#7f9c86'), T('#93ad96'));
      gothicCastle(p, rnd, 120, 108, { stone: T('#d8d2c6'), shade: T('#aaa3a2'), roof: T('#56688a'), win: time === 'day' ? '#4a5470' : '#e8b870', base: T('#8a8274'), lit: time !== 'day' }, glows);
      banner(p, 84, 46, T('#a85a5a'));
      banner(p, 150, 44, T('#c8a050'));
      hills(p, rnd, 124, 3, T('#6f9a5c'), T('#86ad6e'));
      fx.push({ kind: 'particles', type: time === 'night' ? 'sparkles' : 'leaves', count: 10, area: [0, 0, 240, 135] });
      groundY = 128;
      break;
    }
    case 'demon_castle': {
      // 시안: 보랏빛 노을 아래 첨탑이 빽빽한 마왕성
      p.vGradient(0, 0, p.w, 110, ['#2e2650', '#4a3a70', '#6e4f86', '#a06c8c', '#cc8e8a']);
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 30, 34) });
      p.ellipse(196, 30, 10, 10, '#d8a8b8');
      p.ellipse(196, 30, 8, 8, '#f0d4d8');
      staticClouds(p, rnd, 3, 40, 'dusk');
      gothicCastle(p, rnd, 116, 108, { stone: '#584a78', shade: '#41365e', roof: '#2e2648', win: '#e89070', base: '#3a3052', lit: true }, glows);
      p.vGradient(0, 118, p.w, 17, ['#3a3052', '#251e38']);
      for (let i = 0; i < 4; i++) crystal(p, 14 + i * 66 + rnd() * 10, 132, 8 + rnd() * 6, '#a07ac8', glows);
      fx.push({ kind: 'fog', y: 100, h: 24, color: '#9a7ab0' });
      fx.push({ kind: 'particles', type: 'ash', count: 20, area: [0, 0, 240, 135] });
      groundY = 126;
      break;
    }
    case 'forest': {
      // 시안: 양옆의 굵은 나무가 액자처럼 감싸고, 가운데 안개 낀 빛 속으로 길이 난다
      p.vGradient(0, 0, p.w, 135, [T('#2f4844'), T('#4f6e5e'), T('#88a486'), T('#a6b892'), T('#6a845e')]);
      // 가운데 빛무리
      p.map((c, x, y) => {
        const d = Math.hypot((x - 140) / 70, (y - 46) / 48);
        return d < 1 && bayer(x, y) < (1 - d) * 0.9 ? mix(c, T('#e4e4c0'), 0.45 * (1 - d) + 0.2) : c;
      });
      // 먼 나무 줄기 (안개에 묻힌다)
      for (let i = 0; i < 16; i++) {
        const tx = rnd() * 240, tw = 2 + rnd() * 3;
        const c = mix(T('#6d8a72'), T('#b4c4a0'), Math.max(0, 1 - Math.abs(tx - 140) / 90) * 0.6);
        p.rect(tx, 10, tw, 92, c);
      }
      // 가까운 줄기
      for (let i = 0; i < 7; i++) {
        const tx = 30 + rnd() * 180, tw = 4 + rnd() * 4;
        if (Math.abs(tx - 132) < 18) continue;
        p.rect(tx, 0, tw, 112, T('#46594a'));
        p.rect(tx + tw - 2, 0, 2, 112, T('#3a4a3e'));
      }
      // 우거진 잎 지붕
      for (let i = 0; i < 26; i++) {
        const lx = rnd() * 260 - 10, ly = rnd() * 26 - 4;
        if (Math.abs(lx - 140) < 30 && ly > 8) continue;
        bush(p, lx, ly, 8 + rnd() * 10, T('#33503f'), rnd);
      }
      // 덤불과 땅
      p.vGradient(0, 108, p.w, 27, [T('#5a7a52'), T('#48663f'), T('#3a5434')]);
      for (let i = 0; i < 14; i++) {
        const bx = rnd() * 240;
        if (Math.abs(bx - 132) < 22) continue;
        bush(p, bx, 108 + rnd() * 10, 7 + rnd() * 6, T(rnd() < 0.5 ? '#4f6e48' : '#5f7f52'), rnd);
      }
      // 빛이 비치는 오솔길
      p.poly([[84, 135], [176, 135], [140, 104], [128, 104]], T('#b8b490'));
      p.poly([[100, 135], [150, 135], [136, 106], [131, 106]], T('#ccc8a0'));
      // 액자처럼 감싸는 굵은 나무: 나무껍질 결 + 숲 안쪽 빛을 받은 테두리
      const bark = T('#2c3830'), barkDk = T('#212a25'), rim = T('#5c7262');
      const trunk = (edge: number, dir: 1 | -1) => {
        const xAt = (y: number) => edge + dir * (13 + Math.sin(y / 17) * 2 + (y > 104 ? (y - 104) * 0.7 : 0));
        for (let y = 0; y < 135; y++) {
          const x1 = xAt(y);
          for (let x = Math.min(edge, x1); x <= Math.max(edge, x1); x++) {
            const k = Math.abs(x - edge);
            p.px(x, y, (k * 7 + Math.floor(y / 5) * 3) % 11 < 2 ? barkDk : bark);
          }
          p.px(x1, y, rim);
          if (bayer(x1, y) < 0.5) p.px(x1 - dir, y, rim);
        }
        // 안쪽으로 뻗은 가지
        p.line(xAt(30), 30, xAt(30) + dir * 26, 14, bark);
        p.line(xAt(30), 31, xAt(30) + dir * 26, 15, bark);
        p.line(xAt(30), 32, xAt(30) + dir * 24, 17, rim);
      };
      trunk(0, 1);
      trunk(239, -1);
      bush(p, 34, 10, 12, T('#2c4436'), rnd);
      bush(p, 206, 8, 13, T('#2c4436'), rnd);
      // 나뭇잎 사이로 드는 빛줄기
      if (time !== 'night') p.map((c, x, y) => (Math.abs(x - 150 + y * 0.45) < 9 && y < 110 && bayer(x, y) < 0.22 ? lighten(c, 0.22) : c));
      p.ellipse(150, 96, 2, 2, '#e8fff0');
      glows.pts.push([150, 96, 24, '#bfe8d8']);
      fx.push({ kind: 'particles', type: time === 'night' ? 'fireflies' : 'leaves', count: 16, area: [0, 0, 240, 135] });
      fx.push({ kind: 'particles', type: 'dust', count: 14, area: [100, 20, 90, 80] });
      fx.push({ kind: 'fog', y: 90, h: 22, color: '#c8d4b8' });
      groundY = 126;
      break;
    }
    case 'temple': {
      outdoor(100, 3);
      hills(p, rnd, 86, 4, T('#a8c8ff'), '#ffffff');
      p.vGradient(0, 102, p.w, 33, [T('#fff4dc'), T('#f0dcb0')]);
      for (let i = 0; i < 4; i++) p.rect(60 - i * 6, 102 + i * 4, 120 + i * 12, 4, i % 2 ? T('#ffffff') : T('#f0ecf8'));
      p.rect(66, 58, 108, 6, T('#ffffff'));
      p.poly([[60, 58], [120, 34], [180, 58]], T('#ffffff'));
      p.poly([[72, 56], [120, 40], [168, 56]], T('#e4ecff'));
      p.poly([[60, 58], [120, 34], [120, 36], [62, 58]], T('#ffd85a'));
      for (let i = 0; i < 6; i++) pillar(p, 72 + i * 18, 64, 102, 8, T('#ffffff'));
      p.ellipse(120, 48, 4, 4, '#ffe070');
      glows.pts.push([120, 48, 24, '#fff0a0']);
      flowers(p, rnd, 118, 135, 20);
      fx.push({ kind: 'particles', type: 'sparkles', count: 20, area: [40, 20, 160, 90] });
      groundY = 124;
      break;
    }
    case 'academy': {
      outdoor(120, 3);
      const wall = T('#fff4e4'), roof = T('#4a6aff');
      p.rect(50, 40, 140, 80, wall);
      p.rect(186, 40, 4, 80, darken(wall, 0.12));
      p.poly([[44, 42], [120, 14], [196, 42]], roof);
      p.poly([[44, 42], [120, 14], [120, 42]], lighten(roof, 0.2));
      p.rect(28, 30, 22, 90, wall);
      p.poly([[24, 30], [39, 4], [54, 30]], roof);
      p.rect(190, 30, 22, 90, wall);
      p.poly([[186, 30], [201, 4], [216, 30]], roof);
      const win = time === 'day' ? '#5ab0ff' : '#ffe070';
      for (let y = 50; y < 112; y += 14) {
        for (let x = 58; x < 184; x += 12) {
          p.rect(x, y, 5, 8, win);
          p.ellipse(x + 2.5, y, 2.5, 2, win);
          p.px(x + 1, y, '#ffffff');
          if (time !== 'day' && rnd() < 0.7) glows.pts.push([x + 2, y + 4, 5, win]);
        }
      }
      p.ellipse(120, 30, 7, 7, '#ffffff');
      p.ellipse(120, 30, 6, 6, '#ffe8a0');
      p.line(120, 30, 120, 25, '#5a3a2a');
      p.line(120, 30, 124, 31, '#5a3a2a');
      grass(p, 120, time);
      flowers(p, rnd, 122, 135, 20);
      fx.push({ kind: 'particles', type: 'petals', count: 18, area: [0, 0, 240, 135] });
      groundY = 128;
      break;
    }
    case 'library': {
      p.rect(0, 0, p.w, 110, '#ffe4c8');
      // 큰 아치창
      p.ellipse(120, 30, 22, 22, '#ffffff');
      p.rect(98, 30, 44, 50, '#ffffff');
      p.ellipse(120, 30, 20, 20, '#a8daff');
      p.rect(100, 30, 40, 48, '#a8daff');
      p.rect(119, 10, 2, 68, '#ffffff');
      p.rect(100, 44, 40, 2, '#ffffff');
      glows.pts.push([120, 40, 40, '#fff4d0']);
      const spines = ['#ff7a8a', '#5aa8ff', '#7ad07a', '#ffb05a', '#b07aff', '#ffd85a'];
      for (const sx of [6, 60, 150, 196]) {
        const w = sx === 196 ? 40 : 44;
        p.rect(sx, 10, w, 96, '#c8885a');
        for (let sy = 16; sy < 100; sy += 18) {
          p.rect(sx + 2, sy + 14, w - 4, 3, '#a86a3a');
          for (let bx = sx + 3; bx < sx + w - 3;) {
            const bw = 2 + Math.floor(rnd() * 3);
            const bh = 9 + Math.floor(rnd() * 5);
            p.rect(bx, sy + 14 - bh, bw, bh, spines[Math.floor(rnd() * spines.length)]);
            p.px(bx, sy + 14 - bh + 2, '#ffffff');
            bx += bw + (rnd() < 0.1 ? 3 : 0);
          }
        }
      }
      floorPlanks(p, 110, '#d89a68');
      p.rect(80, 104, 80, 6, '#b8784a');
      p.rect(86, 110, 4, 14, '#a86a3a');
      p.rect(150, 110, 4, 14, '#a86a3a');
      p.rect(108, 96, 20, 8, '#ffffff');
      p.rect(118, 96, 1, 8, '#d8d0e8');
      // 떠다니는 마법 책
      p.rect(170, 86, 10, 7, '#b07aff');
      p.rect(171, 87, 8, 5, '#ffffff');
      glows.pts.push([175, 89, 12, '#c8a0ff']);
      p.map((c, x, y) => (y < 110 && Math.abs(x - 120 - (y - 40) * 0.5) < 14 && y > 40 && bayer(x, y) < 0.25 ? lighten(c, 0.3) : c));
      fx.push({ kind: 'particles', type: 'sparkles', count: 16, area: [0, 0, 240, 110] });
      fx.push({ kind: 'particles', type: 'dust', count: 14, area: [90, 30, 80, 80] });
      groundY = 126;
      break;
    }
    case 'dungeon': {
      // 시안: 화면을 채우는 돌 아치, 반쯤 열린 나무문, 안쪽은 푸른 안개 낀 통로
      stoneWall(p, 0, 0, p.w, 135, '#5e5682', rnd);
      const cx = 120, cy = 66;
      const inArch = (x: number, y: number, rx: number, ry: number, bottom: number) =>
        y <= bottom && (y >= cy ? Math.abs(x - cx) <= rx : ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
      // 아치 돌 (홍예석): 왼쪽은 밝게, 오른쪽은 어둡게
      p.map((c, x, y) => {
        if (!inArch(x, y, 76, 60, 124) || inArch(x, y, 60, 46, 124)) return c;
        const base = mix('#8e84b4', '#5c5484', (x - 44) / 152);
        if (y < cy) {
          const a = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
          if (a % 15 < 1.6) return darken(base, 0.35);
        } else if ((y - cy) % 11 === 0) return darken(base, 0.35);
        return bayer(x, y) < 0.15 ? lighten(base, 0.08) : base;
      });
      // 안쪽 통로: 가운데로 갈수록 밝은 푸른 안개
      p.map((c, x, y) => {
        if (!inArch(x, y, 60, 46, 124)) return c;
        const d = Math.min(1, Math.hypot((x - cx) / 46, (y - 70) / 50));
        const t = (1 - d) * 1.1;
        const col = t > 0.75 ? '#a8c4dc' : t > 0.5 ? '#6f92be' : t > 0.28 ? '#405e94' : t > 0.1 ? '#2a3c6c' : '#1c2448';
        const next = t > 0.5 ? '#a8c4dc' : t > 0.28 ? '#6f92be' : t > 0.1 ? '#405e94' : '#2a3c6c';
        return bayer(x, y) < (t * 4) % 1 * 0.5 ? next : col;
      });
      // 멀리 물러나는 아치들
      for (const k of [0.72, 0.5, 0.32]) {
        for (let a = 0; a <= Math.PI; a += 0.01) {
          const x = cx + Math.cos(a) * 60 * k, y = 84 - (84 - cy) * k - Math.sin(a) * 46 * k;
          p.px(x, y, k > 0.6 ? '#33497c' : '#557ab0');
        }
        for (const s of [-1, 1]) p.line(cx + s * 60 * k, 84 - (84 - cy) * k, cx + s * 60 * k, 84 + (124 - 84) * k, k > 0.6 ? '#33497c' : '#557ab0');
      }
      // 바닥 줄눈 (소실점으로 모인다)
      for (let i = -4; i <= 4; i++) p.line(cx + i * 4, 98, cx + i * 16, 124, '#2e4272');
      // 빛 구슬
      p.ellipse(cx, 34, 5, 5, '#c8dcec');
      p.ellipse(cx, 34, 3, 3, '#f0f6fa');
      glows.pts.push([cx, 34, 26, '#9ac0e8']);
      // 반쯤 열린 나무문 (왼쪽 안으로)
      p.poly([[61, 26], [84, 38], [84, 116], [61, 124]], '#5e4434');
      for (let x = 65; x < 84; x += 5) p.line(x, 28 + (x - 61) * 0.52, x, 124 - (x - 61) * 0.35, '#4a3428');
      for (const y of [44, 100]) p.line(61, y, 84, y + (y < 70 ? 6 : -2), '#3a3036');
      p.ellipse(80, 74, 2, 2, '#9a8aa0');
      p.map((c, x, y) => (x > 61 && x < 85 && y > 26 && y < 124 && c !== '#3a3036' && x > 76 && bayer(x, y) < 0.35 ? lighten(c, 0.12) : c));
      // 앞쪽 돌바닥
      p.vGradient(0, 124, p.w, 11, ['#3e3858', '#2c2844']);
      torch(p, 26, 54, glows, '#8ab8e0');
      torch(p, 214, 54, glows, '#8ab8e0');
      fx.push({ kind: 'particles', type: 'dust', count: 18, area: [70, 20, 100, 100] });
      fx.push({ kind: 'fog', y: 100, h: 24, color: '#8aa4d0' });
      groundY = 126;
      break;
    }
    case 'road': {
      outdoor(90, 3);
      mountains(p, rnd, 70, T('#9ab0f0'), '#ffffff');
      hills(p, rnd, 82, 6, T('#7ad06a'), T('#b0f09a'));
      grass(p, 94, time);
      p.poly([[110, 94], [130, 94], [200, 135], [40, 135]], T('#f0d0a0'));
      p.poly([[116, 94], [124, 94], [150, 135], [90, 135]], T('#f8e0b8'));
      for (let i = 0; i < 6; i++) {
        const rx = rnd() * 240, ry = 100 + rnd() * 30;
        if (Math.abs(rx - 120) < 40) continue;
        p.ellipse(rx, ry, 4 + rnd() * 4, 2 + rnd() * 2, T('#c8c0d8'));
        p.ellipseWhere(rx, ry, 4, 2, T('#ffffff'), (_x, y) => y < ry);
      }
      roundTree(p, 30, 112, 40, T('#4ac860'), rnd);
      pine(p, 214, 118, 40, T('#3aa070'));
      // 이정표
      p.rect(160, 100, 2, 14, '#a86a3a');
      p.poly([[156, 100], [170, 100], [173, 103], [170, 106], [156, 106]], '#e8b878');
      flowers(p, rnd, 100, 135, 30);
      fx.push({ kind: 'particles', type: 'leaves', count: 12, area: [0, 0, 240, 135] });
      groundY = 128;
      break;
    }
    case 'battlefield': {
      outdoor(96, 2);
      mountains(p, rnd, 80, T('#a8b8f0'), '#ffffff');
      hills(p, rnd, 88, 5, T('#7ad06a'), T('#b0f09a'));
      grass(p, 96, time);
      for (let i = 0; i < 7; i++) banner(p, 10 + i * 34 + rnd() * 10, 70 + rnd() * 20, rnd() < 0.5 ? '#ff5a6a' : '#4a7aff');
      for (let i = 0; i < 10; i++) {
        const sx = rnd() * 240, sy = 102 + rnd() * 28;
        p.line(sx, sy, sx + (rnd() - 0.5) * 6, sy - 10, '#c8d0e0');
        p.rect(sx - 2, sy - 7, 5, 1, '#ffd05a');
      }
      fx.push({ kind: 'particles', type: 'leaves', count: 16, area: [0, 0, 240, 135] });
      groundY = 126;
      break;
    }
    case 'tavern': {
      p.rect(0, 0, p.w, 104, '#e8a868');
      for (let x = 0; x < p.w; x += 20) p.rect(x, 0, 3, 104, '#c8885a');
      p.rect(0, 20, p.w, 3, '#c8885a');
      floorPlanks(p, 104, '#c88a5a');
      bricks(p, 170, 40, 60, 64, '#e8c0a8', rnd);
      p.rect(182, 66, 36, 38, '#5a2a1e');
      p.ellipse(200, 98, 12, 6, '#ff8a3a');
      p.ellipse(200, 95, 6, 5, '#fff070');
      glows.pts.push([200, 92, 46, '#ffa040']);
      fx.push({ kind: 'particles', type: 'embers', count: 8, area: [188, 70, 24, 26] });
      for (const tx of [40, 110]) {
        p.ellipse(tx, 108, 26, 6, '#b8784a');
        p.ellipse(tx, 106, 26, 5, '#d8985a');
        p.rect(tx - 2, 110, 4, 14, '#a86a3a');
        p.rect(tx - 10, 97, 5, 8, '#ffd05a');
        p.rect(tx - 10, 97, 5, 2, '#ffffff');
        p.rect(tx + 6, 99, 6, 6, '#ff7a8a');
        p.rect(tx - 1, 101, 2, 4, '#ffffff');
        glows.pts.push([tx, 100, 16, '#ffd070']);
      }
      // 걸린 깃발 장식
      for (let x = 10; x < 160; x += 12) p.poly([[x, 6], [x + 10, 6], [x + 5, 14]], ['#ff6a8a', '#5aa8ff', '#ffd05a', '#7ae07a'][(x / 12) % 4 | 0]);
      p.line(0, 6, 170, 6, '#a86a3a');
      fx.push({ kind: 'particles', type: 'dust', count: 10, area: [0, 20, 240, 80] });
      groundY = 126;
      break;
    }
    case 'throne': {
      p.rect(0, 0, p.w, 108, '#f4ecff');
      for (let i = 0; i < 4; i++) {
        pillar(p, 16 + i * 30, 10, 108, 12, '#ffffff');
        pillar(p, 212 - i * 30, 10, 108, 12, '#ffffff');
      }
      // 스테인드글라스
      for (let y = 12; y < 50; y++) for (let x = 104; x < 136; x++) {
        const dx = (x - 120) / 14, dy = (y - 30) / 18;
        const r2 = dx * dx + dy * dy;
        if (r2 >= 1) continue;
        const a = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8);
        const ring = r2 < 0.12 ? 2 : r2 > 0.8 ? 3 : a % 2;
        const lead = Math.abs(r2 - 0.12) < 0.04 || Math.abs(r2 - 0.8) < 0.05;
        p.px(x, y, lead ? '#a88ac8' : ['#ff7aa8', '#5aa8ff', '#ffd85a', '#b07aff'][ring]);
      }
      glows.pts.push([120, 30, 34, '#ffd0f0']);
      p.vGradient(0, 108, p.w, 27, ['#e8dcf8', '#c8b8e8']);
      p.poly([[106, 108], [134, 108], [170, 135], [70, 135]], '#ff5a7a');
      p.poly([[110, 108], [130, 108], [160, 135], [80, 135]], '#ff8aa0');
      p.rect(108, 60, 24, 48, '#ffd85a');
      p.poly([[106, 62], [120, 46], [134, 62]], '#ffd85a');
      p.rect(104, 86, 32, 6, '#ffe890');
      p.rect(112, 66, 16, 20, '#ff5a7a');
      torch(p, 60, 60, glows);
      torch(p, 180, 60, glows);
      fx.push({ kind: 'particles', type: 'sparkles', count: 18, area: [0, 0, 240, 108] });
      groundY = 126;
      break;
    }
    case 'graveyard':
    case 'grave': {
      outdoor(100, 2);
      hills(p, rnd, 88, 4, T('#8ad0a0'), T('#c0f0c0'));
      grass(p, 100, time);
      roundTree(p, 34, 106, 54, T('#ffa8c8'), rnd); // 벚나무
      for (let i = 0; i < 7; i++) {
        const gx = 70 + i * 24 + rnd() * 8, gy = 104 + (i % 3) * 7;
        const gh = 10 + rnd() * 6;
        p.rect(gx - 4, gy - gh, 9, gh, T('#e0e4f0'));
        p.ellipse(gx, gy - gh, 4.5, 3, T('#e0e4f0'));
        p.rect(gx + 3, gy - gh, 2, gh, T('#b8c0d8'));
        p.rect(gx - 1, gy - gh + 3, 3, 1, T('#a8b0c8'));
        p.rect(gx, gy - gh + 2, 1, 4, T('#a8b0c8'));
      }
      if (kind === 'grave') {
        // 주인공의 묘비
        const gx = 120, gy = 118;
        p.ellipse(gx, gy + 2, 30, 4, T('#4aa060'));
        p.rect(gx - 16, gy - 42, 32, 42, T('#f4f4ff'));
        p.ellipse(gx, gy - 42, 16, 12, T('#f4f4ff'));
        p.rect(gx + 10, gy - 44, 6, 44, T('#c8d0e8'));
        p.rect(gx - 2, gy - 46, 4, 18, T('#a8b0d8'));
        p.rect(gx - 8, gy - 40, 16, 4, T('#a8b0d8'));
        for (let i = 0; i < 3; i++) p.rect(gx - 9, gy - 22 + i * 5, 18, 1, T('#d0d8f0'));
        p.rect(gx - 20, gy - 2, 40, 3, T('#c8d0e8'));
        // 꽃다발
        for (let i = 0; i < 9; i++) p.px(gx - 14 + i * 3.5, gy + (i % 2), ['#ff7aa8', '#ffe05a', '#ffffff', '#8ad0ff'][i % 4]);
      }
      flowers(p, rnd, 112, 135, 40);
      fx.push({ kind: 'particles', type: 'petals', count: 26, area: [0, -10, 240, 145] });
      if (kind === 'graveyard') fx.push({ kind: 'particles', type: 'fireflies', count: 8, area: [0, 90, 240, 40] });
      groundY = 128;
      break;
    }
    case 'burning': {
      p.vGradient(0, 0, p.w, 110, ['#2a1a6a', '#7a2a8a', '#e85a6a', '#ffa04a']);
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 30, 30) });
      // 용 실루엣
      const dx = 160, dy = 30, dc = '#4a1a5a';
      p.poly([[dx - 30, dy - 4], [dx - 6, dy + 2], [dx - 18, dy - 22]], dc);
      p.poly([[dx + 30, dy - 4], [dx + 6, dy + 2], [dx + 22, dy - 24]], dc);
      p.ellipse(dx, dy + 2, 10, 4, dc);
      p.poly([[dx + 8, dy], [dx + 20, dy - 4], [dx + 22, dy - 1], [dx + 10, dy + 4]], dc);
      p.poly([[dx - 8, dy + 2], [dx - 30, dy + 10], [dx - 8, dy + 5]], dc);
      p.px(dx + 18, dy - 2, '#fff070');
      for (let i = 0; i < 12; i++) {
        const bx = i * 21 + rnd() * 6, bh = 20 + rnd() * 30;
        p.rect(bx, 110 - bh, 16, bh, '#5a2a5a');
        p.poly([[bx - 1, 110 - bh], [bx + 8, 110 - bh - 8], [bx + 17, 110 - bh]], '#7a3a6a');
        p.rect(bx + 4, 116 - bh, 3, 4, '#ffd070');
        if (rnd() < 0.7) {
          p.ellipse(bx + 8, 110 - bh, 6, 8, '#ff7a3a');
          p.ellipse(bx + 8, 110 - bh + 2, 3, 5, '#fff070');
          glows.pts.push([bx + 8, 108 - bh, 18, '#ff8a40']);
        }
      }
      p.vGradient(0, 110, p.w, 25, ['#5a2a4a', '#2a1030']);
      fx.push({ kind: 'particles', type: 'embers', count: 60, area: [0, 40, 240, 95] });
      groundY = 126;
      break;
    }
  }
  // 전체 색 보정: 채도와 명암 폭을 눌러 시안처럼 차분한 톤으로
  p.map(soften);
  // 도형 사이로 빈 픽셀이 남으면 바로 위 색으로 메운다 (검은 점 방지)
  for (let y = 1; y < p.h; y++) for (let x = 0; x < p.w; x++) if (!p.get(x, y)) p.px(x, y, p.get(x, y - 1));
  return { p, fx, groundY };
}

export const ALL_SCENES: SceneKind[] = [
  'title', 'village', 'snow', 'room', 'port', 'castle', 'demon_castle', 'forest', 'temple',
  'academy', 'library', 'dungeon', 'road', 'battlefield', 'tavern', 'throne', 'graveyard', 'grave', 'burning',
];
