import { Painter, bayer, darken, lighten, mix, seeded } from './painter';

export const SCENE_W = 240;
export const SCENE_H = 135;

export type SceneKind =
  | 'title' | 'village' | 'snow' | 'room' | 'port' | 'castle' | 'demon_castle' | 'forest'
  | 'temple' | 'academy' | 'library' | 'dungeon' | 'road' | 'battlefield' | 'tavern'
  | 'throne' | 'graveyard' | 'grave' | 'burning';

/** Pixi 에서 애니메이션으로 덧입힐 효과 */
export type Fx =
  | { kind: 'twinkle'; pts: [number, number][] }
  | { kind: 'glow'; pts: [number, number, number, string][] } // x, y, 반경, 색 (깜빡이는 빛)
  | { kind: 'particles'; type: 'embers' | 'snow' | 'rain' | 'fireflies' | 'dust' | 'ash'; count: number; area: [number, number, number, number] }
  | { kind: 'fog'; y: number; h: number; color: string };

export interface Scene {
  p: Painter;
  fx: Fx[];
  /** 전투 시 인물이 서는 지면 높이 */
  groundY: number;
}

const SKY = {
  night: ['#06081a', '#0e1430', '#1a2348', '#2a365e'],
  dusk: ['#16142e', '#3a2448', '#7a3648', '#c8644a', '#eca05a'],
  day: ['#36609e', '#5284be', '#80acd2', '#bcd4de'],
  blood: ['#140406', '#320a10', '#5e1616', '#982c1c', '#d45a26'],
  gold: ['#2e3a6a', '#6e6494', '#c89a7e', '#ecca94'],
  gray: ['#141418', '#26262e', '#3e3c44', '#5e5a5c'],
};

type Rnd = () => number;

// ───────────────────────── 공용 그리기 도구 ─────────────────────────

/** 중점 변위로 만든 능선 아래를 칠한다. 반환: x → 능선 y */
function ridge(p: Painter, rnd: Rnd, baseY: number, amp: number, color: string, rough = 0.55, top?: string): number[] {
  const n = 256;
  const ys = new Array(n + 1).fill(0);
  ys[0] = rnd() * 2 - 1;
  ys[n] = rnd() * 2 - 1;
  for (let step = n; step > 1; step /= 2) {
    const half = step / 2;
    const scale = Math.pow(rough, Math.log2(n / step));
    for (let i = half; i < n; i += step) ys[i] = (ys[i - half] + ys[i + half]) / 2 + (rnd() * 2 - 1) * scale;
  }
  const out: number[] = [];
  for (let x = 0; x < p.w; x++) {
    const y = Math.round(baseY + ys[Math.floor((x / p.w) * n)] * amp);
    out.push(y);
    p.rect(x, y, 1, p.h - y, color);
    if (top) p.px(x, y, top);
  }
  return out;
}

function stars(p: Painter, rnd: Rnd, count: number, maxY: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * p.w), y = Math.floor(rnd() * maxY);
    const bright = rnd() < 0.15;
    p.px(x, y, bright ? '#fff6dc' : rnd() < 0.5 ? '#8a94c0' : '#c8ccdc');
    if (bright) pts.push([x, y]);
  }
  return pts;
}

function moon(p: Painter, x: number, y: number, r: number, c = '#f0e6c8') {
  p.ellipse(x, y, r + 2, r + 2, mix(c, '#1a2348', 0.75));
  p.ellipse(x, y, r, r, c);
  p.ellipseWhere(x, y, r, r, darken(c, 0.15), (px, py) => px > x + r * 0.3 || (px - x) * 0.6 + (py - y) > r * 0.6);
  p.ellipse(x - r * 0.35, y - r * 0.2, r * 0.22, r * 0.22, darken(c, 0.1));
  p.ellipse(x + r * 0.2, y + r * 0.35, r * 0.15, r * 0.15, darken(c, 0.1));
}

function pine(p: Painter, x: number, baseY: number, h: number, c: string, light?: string) {
  const w = h * 0.38;
  for (let i = 0; i < 4; i++) {
    const ty = baseY - h + i * h * 0.2;
    const tw = w * (0.45 + i * 0.2);
    p.poly([[x - tw, ty + h * 0.32], [x, ty], [x + tw, ty + h * 0.32]], c);
    if (light) p.line(x, ty + 1, x - tw * 0.7, ty + h * 0.3, light);
  }
  p.rect(x - 1, baseY - h * 0.12, 2, h * 0.12, darken(c, 0.4));
}

function deadTree(p: Painter, x: number, baseY: number, h: number, c: string) {
  p.rect(x - 1, baseY - h, 3, h, c);
  const branch = (bx: number, by: number, dx: number, len: number) => {
    p.line(bx, by, bx + dx * len, by - len * 0.7, c);
    p.line(bx + dx * len, by - len * 0.7, bx + dx * len * 1.4, by - len * 0.6, c);
  };
  branch(x, baseY - h * 0.6, -1, h * 0.35);
  branch(x + 1, baseY - h * 0.75, 1, h * 0.3);
  branch(x, baseY - h * 0.9, -1, h * 0.2);
  branch(x + 1, baseY - h, 1, h * 0.15);
}

function cottage(p: Painter, x: number, baseY: number, w: number, h: number, wall: string, roof: string, lit: string | null, glows: Fx & { kind: 'glow' }) {
  p.rect(x, baseY - h, w, h, wall);
  p.rect(x + w - 3, baseY - h, 3, h, darken(wall, 0.3));
  p.poly([[x - 3, baseY - h + 1], [x + w / 2, baseY - h - w * 0.45], [x + w + 3, baseY - h + 1]], roof);
  p.line(x - 3, baseY - h + 1, x + w / 2, baseY - h - w * 0.45, lighten(roof, 0.2));
  p.rect(x + w * 0.62, baseY - h - w * 0.45, 3, w * 0.3, darken(wall, 0.4)); // 굴뚝
  if (lit) {
    const wx = x + 3, wy = baseY - h + 4;
    p.rect(wx, wy, 4, 4, lit);
    p.rect(wx + 2, wy, 1, 4, darken(lit, 0.4));
    glows.pts.push([wx + 2, wy + 2, 6, lit]);
  }
  p.rect(x + w - 8, baseY - 7, 4, 7, darken(wall, 0.55)); // 문
}

function castle(p: Painter, x: number, baseY: number, w: number, h: number, c: string, lit: string, glows: Fx & { kind: 'glow' }, spiky = false) {
  const tower = (tx: number, tw: number, th: number) => {
    p.rect(tx, baseY - th, tw, th, c);
    if (spiky) p.poly([[tx - 1, baseY - th], [tx + tw / 2, baseY - th - tw * 1.4], [tx + tw + 1, baseY - th]], c);
    else {
      for (let i = 0; i < tw; i += 3) p.rect(tx + i, baseY - th - 2, 2, 2, c);
      p.poly([[tx - 1, baseY - th - 2], [tx + tw / 2, baseY - th - tw], [tx + tw + 1, baseY - th - 2]], darken(c, 0.2));
    }
    for (let i = 0; i < th / 10; i++) {
      if ((tx + i) % 3 === 0) continue;
      const wy = baseY - th + 5 + i * 9;
      if (wy > baseY - 6) break;
      p.rect(tx + tw / 2 - 1, wy, 2, 3, lit);
      glows.pts.push([tx + tw / 2, wy + 1, 4, lit]);
    }
  };
  p.rect(x, baseY - h * 0.45, w, h * 0.45, c);
  for (let i = 0; i < w; i += 4) p.rect(x + i, baseY - h * 0.45 - 2, 2, 2, c);
  tower(x - 4, 10, h * 0.7);
  tower(x + w - 6, 10, h * 0.75);
  tower(x + w * 0.3, 12, h);
  tower(x + w * 0.58, 9, h * 0.82);
  p.rect(x + w / 2 - 4, baseY - 10, 8, 10, darken(c, 0.5));
  p.ellipse(x + w / 2, baseY - 10, 4, 3, darken(c, 0.5));
}

function bricks(p: Painter, x0: number, y0: number, w: number, h: number, base: string, rnd: Rnd) {
  const mortar = darken(base, 0.45);
  p.rect(x0, y0, w, h, base);
  for (let y = y0; y < y0 + h; y += 6) {
    p.rect(x0, y, w, 1, mortar);
    const off = ((y - y0) / 6) % 2 === 0 ? 0 : 6;
    for (let x = x0 + off; x < x0 + w; x += 12) {
      p.rect(x, y, 1, 6, mortar);
      const v = rnd();
      if (v < 0.25) p.rect(x + 1, y + 1, 11, 5, darken(base, 0.12));
      else if (v > 0.85) p.rect(x + 1, y + 1, 11, 1, lighten(base, 0.12));
    }
  }
}

function floorPlanks(p: Painter, y0: number, base: string) {
  for (let y = y0; y < p.h; y++) {
    const t = (y - y0) / (p.h - y0);
    for (let x = 0; x < p.w; x++) {
      const seam = Math.round((x - p.w / 2) / (6 + t * 18)) !== Math.round((x - 1 - p.w / 2) / (6 + t * 18));
      p.px(x, y, seam ? darken(base, 0.4) : bayer(x, y) < t * 0.6 ? lighten(base, 0.08) : base);
    }
  }
}

function torch(p: Painter, x: number, y: number, glows: Fx & { kind: 'glow' }) {
  p.rect(x - 1, y, 3, 7, '#4a3020');
  p.ellipse(x, y - 2, 2.5, 3.5, '#f09030');
  p.ellipse(x, y - 1, 1.2, 2, '#ffe080');
  glows.pts.push([x, y - 2, 18, '#f0a040']);
}

function pillar(p: Painter, x: number, top: number, bottom: number, w: number, c: string) {
  p.rect(x, top, w, bottom - top, c);
  p.rect(x, top, 2, bottom - top, lighten(c, 0.15));
  p.rect(x + w - 3, top, 3, bottom - top, darken(c, 0.3));
  p.rect(x - 2, top, w + 4, 4, lighten(c, 0.1));
  p.rect(x - 2, bottom - 4, w + 4, 4, darken(c, 0.15));
}

function groundFill(p: Painter, y: number, top: string, bottom: string) {
  p.vGradient(0, y, p.w, p.h - y, [top, bottom]);
}

function banner(p: Painter, x: number, y: number, c: string) {
  p.rect(x, y, 1, 30, '#3a2a1e');
  p.poly([[x + 1, y + 1], [x + 12, y + 3], [x + 9, y + 7], [x + 12, y + 11], [x + 1, y + 10]], c);
}

// ───────────────────────── 장면 ─────────────────────────

export function drawScene(kind: SceneKind, seed = 1): Scene {
  const rnd = seeded(seed * 7919 + kind.length * 104729);
  const p = new Painter(SCENE_W, SCENE_H);
  const glows: Fx & { kind: 'glow' } = { kind: 'glow', pts: [] };
  const fx: Fx[] = [glows];
  let groundY = 116;

  switch (kind) {
    case 'title': {
      p.vGradient(0, 0, p.w, 100, SKY.night);
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 130, 80) });
      moon(p, 178, 34, 16);
      ridge(p, rnd, 82, 10, '#161c34', 0.6);
      ridge(p, rnd, 96, 7, '#10142a', 0.6);
      // 절벽 위의 성
      p.poly([[0, 135], [0, 92], [30, 86], [62, 90], [80, 100], [92, 135]], '#0a0c1a');
      castle(p, 14, 90, 48, 44, '#0a0c1a', '#f0b860', glows);
      ridge(p, rnd, 118, 4, '#080a14', 0.5);
      fx.push({ kind: 'particles', type: 'fireflies', count: 14, area: [90, 96, 150, 36] });
      fx.push({ kind: 'fog', y: 100, h: 20, color: '#2a3460' });
      groundY = 124;
      break;
    }
    case 'village':
    case 'snow': {
      const snowy = kind === 'snow';
      p.vGradient(0, 0, p.w, 90, snowy ? SKY.gray : SKY.dusk);
      if (snowy) fx.push({ kind: 'particles', type: 'snow', count: 70, area: [0, -10, 240, 145] });
      ridge(p, rnd, 70, 12, snowy ? '#5a5e6e' : '#3a2a44', 0.6, snowy ? '#9aa0b0' : undefined);
      ridge(p, rnd, 88, 6, snowy ? '#7a8090' : '#2a2436', 0.5, snowy ? '#c8ccd8' : undefined);
      groundFill(p, 100, snowy ? '#c8ccd8' : '#3e4a2a', snowy ? '#8a90a0' : '#1e2614');
      for (let i = 0; i < 9; i++) pine(p, 8 + i * 27 + rnd() * 8, 101, 14 + rnd() * 10, snowy ? '#3a4a46' : '#1e2a1e', snowy ? '#dce0ea' : undefined);
      cottage(p, 40, 112, 26, 16, snowy ? '#6a5a4e' : '#6a5038', snowy ? '#d8dce6' : '#7a3a2a', '#f4b860', glows);
      cottage(p, 120, 108, 22, 14, snowy ? '#5e5046' : '#5e4632', snowy ? '#d8dce6' : '#6a3424', '#f4b860', glows);
      cottage(p, 182, 114, 28, 17, snowy ? '#6a5a4e' : '#6a5038', snowy ? '#d8dce6' : '#7a3a2a', '#f4b860', glows);
      for (let x = 0; x < p.w; x += 6) p.rect(x, 121, 1, 5, '#4a3a28');
      p.rect(0, 122, p.w, 1, '#4a3a28');
      if (!snowy) fx.push({ kind: 'particles', type: 'fireflies', count: 8, area: [0, 100, 240, 30] });
      groundY = 128;
      break;
    }
    case 'room': {
      p.rect(0, 0, p.w, 100, '#3a2a1e');
      for (let x = 0; x < p.w; x += 14) p.rect(x, 0, 1, 100, '#2a1e14');
      p.rect(0, 0, p.w, 6, '#22160e');
      floorPlanks(p, 100, '#4a3424');
      // 창 (밤)
      p.rect(40, 24, 34, 30, '#1a1e36');
      p.vGradient(42, 26, 30, 26, SKY.night);
      moon(p, 64, 34, 4);
      p.rect(56, 24, 2, 30, '#5a4028');
      p.rect(40, 38, 34, 2, '#5a4028');
      p.rect(38, 54, 38, 3, '#6a4a30');
      // 벽난로
      bricks(p, 150, 46, 56, 54, '#5a4a44', rnd);
      p.rect(160, 70, 36, 30, '#120a08');
      p.ellipse(178, 94, 12, 6, '#d06020');
      p.ellipse(178, 92, 6, 5, '#f0b040');
      glows.pts.push([178, 90, 40, '#f08030']);
      fx.push({ kind: 'particles', type: 'embers', count: 10, area: [166, 70, 24, 24] });
      // 요람
      p.ellipse(100, 108, 18, 8, '#7a5838');
      p.rect(82, 100, 36, 6, '#e0d4c0');
      p.rect(84, 112, 2, 10, '#5a3e26');
      p.rect(114, 112, 2, 10, '#5a3e26');
      groundY = 124;
      break;
    }
    case 'port': {
      p.vGradient(0, 0, p.w, 80, SKY.dusk);
      p.ellipse(120, 78, 18, 18, '#f4c070');
      p.vGradient(0, 80, p.w, 55, ['#6a3a4a', '#3a2a44', '#1a1a30']);
      for (let y = 82; y < 135; y += 3) for (let x = (y * 7) % 11; x < p.w; x += 9 + (y % 5)) p.rect(x, y, 3, 1, mix('#f4c070', '#3a2a44', (y - 80) / 60));
      // 배
      const ship = (x: number, y: number, s: number) => {
        p.poly([[x - 16 * s, y], [x + 18 * s, y], [x + 12 * s, y + 7 * s], [x - 12 * s, y + 7 * s]], '#1a1420');
        p.rect(x - 1, y - 30 * s, 2, 30 * s, '#1a1420');
        p.poly([[x + 1, y - 28 * s], [x + 14 * s, y - 8 * s], [x + 1, y - 6 * s]], '#2a2230');
        p.poly([[x - 1, y - 24 * s], [x - 12 * s, y - 6 * s], [x - 1, y - 6 * s]], '#2a2230');
      };
      ship(60, 92, 1);
      ship(170, 86, 0.6);
      // 부두 창고
      p.rect(0, 100, 240, 35, '#1a1218');
      for (let i = 0; i < 4; i++) cottage(p, 8 + i * 62, 116, 34, 18, '#3a2a2a', '#4a2a28', '#f4b860', glows);
      groundY = 128;
      break;
    }
    case 'castle': {
      p.vGradient(0, 0, p.w, 100, SKY.night);
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 80, 60) });
      moon(p, 40, 28, 10);
      ridge(p, rnd, 86, 8, '#141a30', 0.6);
      p.ellipse(130, 140, 110, 44, '#0e1222');
      castle(p, 92, 100, 80, 64, '#1a1e34', '#f0c070', glows);
      banner(p, 102, 46, '#8a2a3a');
      banner(p, 158, 48, '#2a4a8a');
      groundFill(p, 118, '#141826', '#0a0c16');
      groundY = 126;
      break;
    }
    case 'demon_castle': {
      p.vGradient(0, 0, p.w, 100, SKY.blood);
      p.ellipse(190, 30, 14, 14, '#e8402e');
      p.ellipse(190, 30, 11, 11, '#f87040');
      ridge(p, rnd, 80, 14, '#2a0a10', 0.65);
      castle(p, 70, 104, 96, 80, '#120408', '#ff3a3a', glows, true);
      groundFill(p, 108, '#1a0608', '#080204');
      for (let i = 0; i < 6; i++) {
        const lx = rnd() * 240;
        p.ellipse(lx, 122 + rnd() * 8, 10 + rnd() * 10, 2, '#c8401a');
        glows.pts.push([lx, 124, 14, '#e0501a']);
      }
      fx.push({ kind: 'particles', type: 'embers', count: 40, area: [0, 60, 240, 75] });
      groundY = 126;
      break;
    }
    case 'forest': {
      p.vGradient(0, 0, p.w, 135, ['#0a1418', '#12242a', '#1a3634', '#0e1a1a']);
      for (let layer = 0; layer < 3; layer++) {
        const c = ['#18302e', '#10221f', '#0a1614'][layer];
        const l = ['#24443e', '#1a3430', undefined][layer];
        for (let i = 0; i < 12 - layer * 2; i++) pine(p, rnd() * 250 - 5, 100 + layer * 12, 50 + layer * 18 + rnd() * 20, c, l);
      }
      // 신비한 빛
      p.ellipse(150, 98, 3, 3, '#9af0ff');
      glows.pts.push([150, 98, 30, '#5ad0e0']);
      groundFill(p, 118, '#0e1c18', '#060c0a');
      fx.push({ kind: 'particles', type: 'fireflies', count: 24, area: [0, 40, 240, 90] });
      fx.push({ kind: 'fog', y: 96, h: 26, color: '#2a4a4a' });
      groundY = 126;
      break;
    }
    case 'temple': {
      p.vGradient(0, 0, p.w, 100, SKY.gold);
      ridge(p, rnd, 84, 6, '#8a7488', 0.5);
      groundFill(p, 102, '#c8b490', '#7a6a54');
      // 계단 + 신전
      for (let i = 0; i < 4; i++) p.rect(60 - i * 6, 102 + i * 4, 120 + i * 12, 4, i % 2 ? '#d8d0c0' : '#c4bcac');
      p.rect(66, 58, 108, 6, '#e8e0d0');
      p.poly([[60, 58], [120, 34], [180, 58]], '#e0d8c8');
      p.poly([[72, 56], [120, 40], [168, 56]], '#c8bca8');
      for (let i = 0; i < 6; i++) pillar(p, 72 + i * 18, 64, 102, 8, '#ece4d4');
      p.ellipse(120, 48, 4, 4, '#f0c860');
      glows.pts.push([120, 48, 22, '#f8d880']);
      // 빛줄기
      for (let i = 0; i < 4; i++) p.map((c, x, y) => (Math.abs(x - (30 + i * 60) - y * 0.4) < 4 && y < 100 && bayer(x, y) < 0.3 ? lighten(c, 0.25) : c));
      fx.push({ kind: 'particles', type: 'dust', count: 20, area: [40, 30, 160, 80] });
      groundY = 124;
      break;
    }
    case 'academy': {
      p.vGradient(0, 0, p.w, 120, SKY.night);
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 70, 50) });
      moon(p, 206, 22, 8);
      const c = '#1e2240';
      p.rect(50, 40, 140, 80, c);
      p.poly([[44, 42], [120, 14], [196, 42]], '#262a4e');
      p.rect(28, 30, 22, 90, c);
      p.poly([[24, 30], [39, 6], [54, 30]], '#262a4e');
      p.rect(190, 30, 22, 90, c);
      p.poly([[186, 30], [201, 6], [216, 30]], '#262a4e');
      for (let y = 50; y < 112; y += 14) {
        for (let x = 58; x < 184; x += 12) {
          const lit = rnd() < 0.6;
          p.rect(x, y, 5, 8, lit ? '#f0c878' : '#141830');
          p.ellipse(x + 2.5, y, 2.5, 2, lit ? '#f0c878' : '#141830');
          if (lit) glows.pts.push([x + 2, y + 4, 5, '#f0c070']);
        }
      }
      p.ellipse(120, 30, 7, 7, '#e8dcb0');
      p.line(120, 30, 120, 25, '#1e2240');
      p.line(120, 30, 124, 31, '#1e2240');
      groundFill(p, 120, '#1a2030', '#0a0c16');
      groundY = 128;
      break;
    }
    case 'library': {
      p.rect(0, 0, p.w, 110, '#2a1e18');
      const spines = ['#7a2a2a', '#2a4a6a', '#5a6a2a', '#6a4a2a', '#4a2a5a', '#8a6a3a'];
      for (let sx = 6; sx < 234; sx += 58) {
        p.rect(sx, 10, 50, 96, '#4a3020');
        for (let sy = 16; sy < 100; sy += 18) {
          p.rect(sx + 2, sy + 14, 46, 3, '#5a3a26');
          for (let bx = sx + 3; bx < sx + 47;) {
            const bw = 2 + Math.floor(rnd() * 3);
            const bh = 9 + Math.floor(rnd() * 5);
            p.rect(bx, sy + 14 - bh, bw, bh, spines[Math.floor(rnd() * spines.length)]);
            p.px(bx, sy + 14 - bh + 2, '#e0c060');
            bx += bw + (rnd() < 0.1 ? 3 : 0);
          }
        }
      }
      floorPlanks(p, 110, '#3a281a');
      p.rect(80, 104, 80, 6, '#5a3c26');
      p.rect(86, 110, 4, 14, '#4a3020');
      p.rect(150, 110, 4, 14, '#4a3020');
      p.rect(110, 96, 18, 8, '#e8dcc0');
      p.rect(140, 97, 2, 7, '#e8e0d0');
      p.px(141, 95, '#ffd060');
      glows.pts.push([141, 95, 28, '#f0b040']);
      fx.push({ kind: 'particles', type: 'dust', count: 25, area: [0, 0, 240, 110] });
      groundY = 126;
      break;
    }
    case 'dungeon': {
      bricks(p, 0, 0, p.w, 112, '#3a3a44', rnd);
      // 아치 통로
      p.ellipse(120, 60, 34, 34, '#2a2a32');
      p.rect(86, 60, 68, 52, '#2a2a32');
      p.ellipse(120, 62, 28, 28, '#06060a');
      p.rect(92, 62, 56, 50, '#06060a');
      p.ellipse(120, 78, 3, 2, '#e04040');
      p.ellipse(128, 78, 3, 2, '#e04040');
      p.vGradient(0, 112, p.w, 23, ['#2a2a30', '#121216']);
      torch(p, 60, 50, glows);
      torch(p, 180, 50, glows);
      // 해골 더미
      p.ellipse(34, 114, 5, 4, '#c8c0a8');
      p.px(32, 114, '#1a1a1a');
      p.px(35, 114, '#1a1a1a');
      p.ellipse(204, 116, 4, 3, '#b8b098');
      fx.push({ kind: 'particles', type: 'embers', count: 8, area: [50, 30, 140, 30] });
      fx.push({ kind: 'fog', y: 104, h: 20, color: '#3a3a4a' });
      groundY = 126;
      break;
    }
    case 'road': {
      p.vGradient(0, 0, p.w, 90, SKY.dusk);
      ridge(p, rnd, 60, 18, '#3a2a40', 0.65);
      ridge(p, rnd, 80, 10, '#2a2234', 0.55);
      groundFill(p, 94, '#3a3a24', '#1e1e12');
      p.poly([[110, 94], [130, 94], [200, 135], [40, 135]], '#5a4a32');
      p.poly([[116, 94], [124, 94], [150, 135], [90, 135]], '#6a583a');
      for (let i = 0; i < 6; i++) {
        const rx = rnd() * 240, ry = 100 + rnd() * 30;
        if (Math.abs(rx - 120) < 40) continue;
        p.ellipse(rx, ry, 4 + rnd() * 4, 2 + rnd() * 2, '#4a4434');
      }
      deadTree(p, 30, 112, 40, '#1a1418');
      pine(p, 214, 118, 40, '#1a221a');
      groundY = 128;
      break;
    }
    case 'battlefield': {
      p.vGradient(0, 0, p.w, 100, ['#1a1416', '#3a2220', '#6a3220', '#8a4428']);
      ridge(p, rnd, 78, 10, '#2a1a1a', 0.6);
      groundFill(p, 96, '#3a2e22', '#1a140e');
      for (let i = 0; i < 7; i++) banner(p, 10 + i * 34 + rnd() * 10, 70 + rnd() * 20, rnd() < 0.5 ? '#8a2a2a' : '#2a3a6a');
      for (let i = 0; i < 18; i++) {
        const sx = rnd() * 240, sy = 100 + rnd() * 30;
        p.line(sx, sy, sx + (rnd() - 0.5) * 12, sy - 8 - rnd() * 6, '#5a4a3a');
      }
      fx.push({ kind: 'particles', type: 'ash', count: 40, area: [0, 0, 240, 135] });
      fx.push({ kind: 'fog', y: 80, h: 30, color: '#4a3a34' });
      groundY = 126;
      break;
    }
    case 'tavern': {
      p.rect(0, 0, p.w, 104, '#4a3220');
      for (let x = 0; x < p.w; x += 20) p.rect(x, 0, 3, 104, '#3a2616');
      p.rect(0, 20, p.w, 3, '#3a2616');
      floorPlanks(p, 104, '#3e2a1a');
      // 벽난로
      bricks(p, 170, 40, 60, 64, '#5a4a40', rnd);
      p.rect(182, 66, 36, 38, '#140a06');
      p.ellipse(200, 98, 12, 6, '#d06020');
      p.ellipse(200, 95, 6, 5, '#f8c040');
      glows.pts.push([200, 92, 46, '#f08030']);
      fx.push({ kind: 'particles', type: 'embers', count: 10, area: [188, 70, 24, 26] });
      // 테이블과 잔
      for (const tx of [40, 110]) {
        p.ellipse(tx, 108, 26, 6, '#6a4628');
        p.ellipse(tx, 106, 26, 5, '#7e5634');
        p.rect(tx - 2, 110, 4, 14, '#4a3020');
        p.rect(tx - 10, 98, 5, 7, '#c8c0b0');
        p.rect(tx - 10, 98, 5, 2, '#f8f4e8');
        p.rect(tx + 6, 99, 5, 6, '#a07040');
        p.rect(tx - 1, 101, 2, 4, '#e8e0d0');
        glows.pts.push([tx, 100, 14, '#f0b050']);
      }
      // 걸린 방패
      p.ellipse(80, 50, 10, 12, '#6a2a2a');
      p.ellipse(80, 50, 3, 3, '#c8a050');
      groundY = 126;
      break;
    }
    case 'throne': {
      p.rect(0, 0, p.w, 108, '#16121e');
      for (let i = 0; i < 4; i++) {
        pillar(p, 16 + i * 30, 10, 108, 12, '#2a2434');
        pillar(p, 212 - i * 30, 10, 108, 12, '#2a2434');
      }
      // 스테인드글라스
      p.ellipse(120, 30, 16, 20, '#3a1a2a');
      for (let y = 12; y < 50; y++) for (let x = 104; x < 136; x++) {
        const dx = (x - 120) / 14, dy = (y - 30) / 18;
        const r2 = dx * dx + dy * dy;
        if (r2 >= 1) continue;
        const a = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8);
        const ring = r2 < 0.12 ? 2 : r2 > 0.8 ? 3 : a % 2;
        const lead = Math.abs(r2 - 0.12) < 0.04 || Math.abs(r2 - 0.8) < 0.05;
        p.px(x, y, lead ? '#1a1018' : ['#a02a3a', '#2a4a9a', '#c8a040', '#6a2a8a'][ring]);
      }
      glows.pts.push([120, 30, 34, '#c84050']);
      p.vGradient(0, 108, p.w, 27, ['#241e2c', '#100c14']);
      p.poly([[106, 108], [134, 108], [170, 135], [70, 135]], '#7a1a24');
      // 왕좌
      p.rect(108, 60, 24, 48, '#3a2a1a');
      p.poly([[106, 62], [120, 46], [134, 62]], '#c8a040');
      p.rect(104, 86, 32, 6, '#c8a040');
      p.rect(112, 66, 16, 20, '#8a1a24');
      torch(p, 60, 60, glows);
      torch(p, 180, 60, glows);
      groundY = 126;
      break;
    }
    case 'graveyard':
    case 'grave': {
      p.vGradient(0, 0, p.w, 100, ['#0a0a14', '#16162a', '#26283e', '#36384e']);
      fx.push({ kind: 'twinkle', pts: stars(p, rnd, 50, 50) });
      moon(p, 190, 28, 12, '#e0dcd0');
      ridge(p, rnd, 88, 6, '#1a1c2a', 0.5);
      groundFill(p, 100, '#22261e', '#0e100c');
      deadTree(p, 34, 104, 56, '#100e12');
      for (let i = 0; i < 7; i++) {
        const gx = 70 + i * 24 + rnd() * 8, gy = 104 + (i % 3) * 7;
        const gh = 10 + rnd() * 6;
        p.rect(gx - 4, gy - gh, 9, gh, '#4a4a52');
        p.ellipse(gx, gy - gh, 4.5, 3, '#4a4a52');
        p.rect(gx + 3, gy - gh, 2, gh, '#34343c');
        if (rnd() < 0.5) { p.rect(gx - 1, gy - gh + 3, 3, 1, '#2a2a30'); p.rect(gx, gy - gh + 2, 1, 4, '#2a2a30'); }
      }
      if (kind === 'grave') {
        // 주인공의 묘비
        const gx = 120, gy = 118;
        p.ellipse(gx, gy + 2, 30, 4, '#161a12');
        p.rect(gx - 16, gy - 42, 32, 42, '#6a6a74');
        p.ellipse(gx, gy - 42, 16, 12, '#6a6a74');
        p.rect(gx + 10, gy - 44, 6, 44, '#4e4e58');
        p.ellipseWhere(gx, gy - 42, 16, 12, '#8a8a94', (x, y) => x < gx - 6 && y < gy - 42);
        p.rect(gx - 16, gy - 36, 3, 36, '#8a8a94');
        p.rect(gx - 2, gy - 46, 4, 18, '#3a3a42');
        p.rect(gx - 8, gy - 40, 16, 4, '#3a3a42');
        for (let i = 0; i < 3; i++) p.rect(gx - 9, gy - 22 + i * 5, 18, 1, '#52525c');
        p.rect(gx - 20, gy - 2, 40, 3, '#4a4a52');
        // 꽃
        p.px(gx - 12, gy + 1, '#e0e0f0'); p.px(gx - 10, gy, '#e04a5a'); p.px(gx + 13, gy + 1, '#f0d060');
      }
      fx.push({ kind: 'fog', y: 96, h: 30, color: '#5a5e74' });
      if (kind === 'graveyard') fx.push({ kind: 'particles', type: 'fireflies', count: 6, area: [0, 90, 240, 40] });
      groundY = 128;
      break;
    }
    case 'burning': {
      p.vGradient(0, 0, p.w, 110, ['#1a0606', '#3e0e0a', '#7a2210', '#c84a14']);
      // 용 실루엣
      const dx = 160, dy = 30;
      p.poly([[dx - 30, dy - 4], [dx - 6, dy + 2], [dx - 18, dy - 22]], '#120406');
      p.poly([[dx + 30, dy - 4], [dx + 6, dy + 2], [dx + 22, dy - 24]], '#120406');
      p.ellipse(dx, dy + 2, 10, 4, '#120406');
      p.poly([[dx + 8, dy], [dx + 20, dy - 4], [dx + 22, dy - 1], [dx + 10, dy + 4]], '#120406');
      p.poly([[dx - 8, dy + 2], [dx - 30, dy + 10], [dx - 8, dy + 5]], '#120406');
      // 불타는 도시
      for (let i = 0; i < 12; i++) {
        const bx = i * 21 + rnd() * 6, bh = 20 + rnd() * 30;
        p.rect(bx, 110 - bh, 16, bh, '#140808');
        p.poly([[bx - 1, 110 - bh], [bx + 8, 110 - bh - 8], [bx + 17, 110 - bh]], '#140808');
        if (rnd() < 0.7) {
          p.ellipse(bx + 8, 110 - bh, 6, 8, '#e05a1a');
          p.ellipse(bx + 8, 110 - bh + 2, 3, 5, '#f8c040');
          glows.pts.push([bx + 8, 108 - bh, 18, '#f06020']);
        }
      }
      groundFill(p, 110, '#2a0e08', '#0e0404');
      fx.push({ kind: 'particles', type: 'embers', count: 60, area: [0, 40, 240, 95] });
      groundY = 126;
      break;
    }
  }
  return { p, fx, groundY };
}

export const ALL_SCENES: SceneKind[] = [
  'title', 'village', 'snow', 'room', 'port', 'castle', 'demon_castle', 'forest', 'temple',
  'academy', 'library', 'dungeon', 'road', 'battlefield', 'tavern', 'throne', 'graveyard', 'grave', 'burning',
];
