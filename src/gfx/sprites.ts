import { Painter, darken, hexToRgb, lighten } from './painter';
import { figureOf, lookOf, type PortraitSpec, type Ramp } from './portrait';
import { drawProfileHead, profileChin, type BackHair, type Bangs, type Figure } from './dotportrait';

/** 전투 스프라이트. 모두 오른쪽을 바라보도록 그린다 (적은 좌우 반전해서 쓴다). */

const OUTLINE = '#2a1838';

export type Weapon = 'sword' | 'holysword' | 'staff' | 'axe' | 'spear' | 'knife' | 'fist' | 'pitchfork';

export interface HumanoidOpts {
  skin: Ramp;
  hair: Ramp;
  eye: string;
  body: string;
  bodyShadow: string;
  trim: string;
  legs: string;
  weapon: Weapon;
  /** 1 = 성인, 0.75 = 아이, 1.3 = 거구 */
  size?: number;
  horns?: boolean;
  helmet?: string;
  hood?: string;
  cape?: string;
  crown?: boolean;
  /** 초상화와 같은 도트 지도 머리 (있으면 작은 머리 대신 이것을 얹는다) */
  head?: (pose: Pose) => HeadArt;
}

/** 32×32 도트 지도에서 머리만 그린 것. chin = 턱 끝 줄 */
export interface HeadArt {
  p: Painter;
  chin: number;
}

/** 포즈마다 표정을 바꿔 옆얼굴 머리를 그린다 (초상화와 같은 설정, 오른쪽을 바라본다) */
export function figureHead(base: Figure, extra?: (p: Painter) => void): (pose: Pose) => HeadArt {
  const cache: Partial<Record<Pose, HeadArt>> = {};
  const mood: Record<Pose, Figure['mood']> = { idle: base.mood, breathe: base.mood, attack: 'angry', hurt: 'afraid' };
  return (pose) =>
    (cache[pose] ??= (() => {
      const p = drawProfileHead({ ...base, mood: mood[pose], blink: false, sway: pose === 'breathe' ? 1 : 0 });
      extra?.(p);
      return { p, chin: profileChin(base) };
    })());
}

/** 진한 외곽선 픽셀은 건드리지 않는다 */
const isInk = (c: string) => {
  const [r, g, b] = hexToRgb(c);
  return r * 0.3 + g * 0.59 + b * 0.11 < 60;
};

/** 옆얼굴 머리에 투구를 씌운다 (눈썹 위까지) */
function helmetOver(p: Painter, c: string) {
  for (let y = 0; y <= 10; y++) for (let x = 0; x < 32; x++) {
    const v = p.get(x, y);
    if (v && !isInk(v)) p.px(x, y, y <= 5 ? lighten(c, 0.3) : x <= 8 ? darken(c, 0.2) : c);
  }
  for (let x = 5; x <= 24; x++) if (p.get(x, 10)) p.px(x, 10, lighten(c, 0.35));
}

/** 옆얼굴 머리를 두건으로 감싼다 (얼굴 앞쪽만 드러난다) */
function hoodOver(p: Painter, c: string) {
  for (let y = 0; y < 28; y++) for (let x = 0; x < 32; x++) {
    const v = p.get(x, y);
    if (!v || isInk(v)) continue;
    if (y <= 9 || x <= 13) p.px(x, y, x <= 8 ? darken(c, 0.2) : c);
  }
}

export type Pose = 'idle' | 'breathe' | 'attack' | 'hurt';

/** 한 캐릭터의 포즈 묶음 */
export interface SpriteSet {
  idle: Painter;
  breathe: Painter;
  attack: Painter;
  hurt: Painter;
}

export function humanoidSet(o: HumanoidOpts): SpriteSet {
  return {
    idle: drawHumanoid(o, 'idle'),
    breathe: drawHumanoid(o, 'breathe'),
    attack: drawHumanoid(o, 'attack'),
    hurt: drawHumanoid(o, 'hurt'),
  };
}

/** 몬스터처럼 포즈가 하나뿐인 것: 숨쉬기만 1px 내린다 */
function singleSet(p: Painter): SpriteSet {
  const breathe = new Painter(p.w, p.h);
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      // 아래 1/4(다리)은 고정, 위쪽은 1px 아래로
      const c = y > p.h * 0.75 ? p.get(x, y) : p.get(x, y - 1);
      breathe.px(x, y, c);
    }
  }
  return { idle: p, breathe, attack: p, hurt: p };
}

const POSE = {
  idle: { lean: 0, drop: 0, hand: [9, 8], angle: -0.8, step: 0, squint: false },
  breathe: { lean: 0, drop: 1, hand: [9, 9], angle: -0.75, step: 0, squint: false },
  attack: { lean: 3, drop: 1, hand: [14, 7], angle: 0.15, step: 3, squint: false },
  hurt: { lean: -3, drop: 1, hand: [6, 11], angle: 1.2, step: -1, squint: true },
} as const;

export function drawHumanoid(o: HumanoidOpts, pose: Pose = 'idle'): Painter {
  const k = o.size ?? 1;
  const art = o.head?.(pose);
  // 큰 도트 지도 머리가 들어갈 자리: 위·옆으로 여백을 둔다 (좌우 같게 → 발 중심은 그대로)
  const ox = art ? 6 : 0;
  const oy = art ? Math.max(0, art.chin - Math.round(17 * k)) + 1 : 0;
  const W = Math.round(44 * k) + ox * 2, H = Math.round(50 * k) + oy;
  const p = new Painter(W, H);
  const S = (v: number) => Math.round(v * k);
  const P = POSE[pose];
  const bx = S(17) + ox; // 하체 중심
  const cx = bx + S(P.lean); // 상체 중심
  const ground = H - 1;
  const hipY = ground - S(14);
  const neckY = oy + S(17) + P.drop;
  const headY = S(10) + P.drop + (pose === 'hurt' ? 1 : 0);
  const legDark = darken(o.legs, 0.3);
  const bodyLight = lighten(o.body, 0.18);

  // 망토 (뒤, 바람에 날림)
  if (o.cape) {
    const sway = pose === 'attack' ? -3 : pose === 'hurt' ? 2 : 0;
    p.poly([[cx - S(3), neckY], [cx + S(3), neckY], [cx - S(1), hipY + S(10)], [cx - S(12) + sway, hipY + S(12)], [cx - S(9) + sway, hipY]], o.cape);
    p.line(cx - S(4), neckY + S(4), cx - S(9) + sway, hipY + S(10), darken(o.cape, 0.35));
    p.line(cx - S(1), neckY + S(6), cx - S(4) + sway, hipY + S(11), darken(o.cape, 0.25));
  }

  // 다리 (뒷다리는 어둡게, 공격 시 앞으로 내딛음)
  const backX = bx - S(5) - S(Math.max(0, P.step)), frontX = bx + S(1) + S(P.step);
  p.rect(backX, hipY, S(4), ground - hipY, legDark);
  p.rect(frontX, hipY, S(4), ground - hipY, o.legs);
  p.rect(frontX, hipY + S(5), S(1), S(2), lighten(o.legs, 0.2)); // 무릎 하이라이트
  // 부츠
  p.rect(backX - S(1), ground - S(4), S(6), S(4), '#2a1e18');
  p.rect(frontX, ground - S(4), S(7), S(4), '#3e2c20');
  p.rect(frontX + S(1), ground - S(4), S(4), S(1), '#6a4e3a');

  // 뒷팔
  p.rect(cx - S(7), neckY + S(2), S(3), S(10), o.bodyShadow);
  p.rect(cx - S(7), neckY + S(11), S(3), S(2), darken(o.skin[1], 0.25));

  // 몸통 + 명암
  p.poly([[cx - S(6), neckY + S(1)], [cx + S(6), neckY + S(1)], [bx + S(5), hipY + S(1)], [bx - S(5), hipY + S(1)]], o.body);
  p.rect(cx - S(6), neckY + S(1), S(3), hipY - neckY, o.bodyShadow);
  p.rect(cx + S(4), neckY + S(2), S(1), S(7), bodyLight);
  // 옷깃 V
  p.line(cx - S(2), neckY + S(1), cx, neckY + S(4), o.trim);
  p.line(cx + S(2), neckY + S(1), cx, neckY + S(4), o.trim);
  // 벨트와 버클
  p.rect(bx - S(5), hipY - S(2), S(10), S(2), darken(o.trim, 0.35));
  p.rect(bx, hipY - S(2), S(2), S(2), '#e0c060');

  if (art) {
    // 머리 전체(뒷머리 포함) → 몸 → 턱 위의 얼굴·앞머리 → 앞팔·무기
    // 긴 뒷머리는 몸 뒤로 가고, 외곽선은 두 겹이 되지 않는다
    // 옆얼굴은 뒤통수가 왼쪽: 목덜미(그리드 x15 근처)가 목 위에 오게 놓는다
    const hx = cx - 15, hy = neckY - art.chin;
    const top = new Painter(32, art.chin + 1);
    for (let y = 0; y <= art.chin; y++) for (let x = 0; x < 32; x++) top.px(x, y, art.p.get(x, y));
    p.outlineTinted(0.6);
    const out = new Painter(W, H);
    out.blit(art.p, hx, hy);
    out.blit(p, 0, 0);
    out.blit(top, hx, hy);
    const arm = new Painter(W, H);
    drawArm(arm, o, cx, neckY, k, P);
    arm.outlineTinted(0.6);
    out.blit(arm, 0, 0);
    return out;
  }

  // 머리
  if (o.hood) p.ellipse(cx, headY, S(7.5), S(7.5), o.hood);
  p.ellipse(cx + S(1), headY + S(1), S(5.5), S(6), o.skin[1]);
  p.ellipseWhere(cx + S(1), headY + S(1), S(5.5), S(6), o.skin[2], (x, y) => x < cx - S(2) || y > headY + S(5));
  p.px(cx + S(4), headY + S(4), o.skin[2]); // 턱선
  p.px(cx - S(1), headY + S(2), o.skin[2]); // 귀
  // 머리카락
  if (!o.hood && !o.helmet) {
    p.ellipseWhere(cx, headY - S(1), S(6.5), S(6), o.hair[1], (x, y) => y < headY - S(1) || x < cx - S(1));
    p.rect(cx + S(2), headY - S(2), S(3), S(2), o.hair[1]); // 앞머리
    p.px(cx + S(5), headY - S(1), o.hair[1]);
    p.line(cx - S(3), headY - S(5), cx + S(2), headY - S(6), o.hair[0]); // 광택
    p.ellipseWhere(cx, headY - S(1), S(6.5), S(6), o.hair[2], (x, y) => p.get(x, y) === o.hair[1] && x < cx - S(3));
  }
  if (o.hood) {
    p.ellipseWhere(cx, headY, S(7.5), S(7.5), o.hood, (x, y) => y < headY - S(2) || x < cx - S(2));
    p.line(cx - S(5), headY - S(4), cx + S(3), headY - S(6), lighten(o.hood, 0.2));
  }
  if (o.helmet) {
    p.ellipseWhere(cx, headY, S(7), S(7), o.helmet, (_x, y) => y < headY + S(1));
    p.rect(cx - S(6), headY + S(1), S(4), S(5), o.helmet);
    p.rect(cx - S(6), headY - S(1), S(13), S(1), lighten(o.helmet, 0.3));
    p.line(cx - S(3), headY - S(5), cx + S(1), headY - S(6), lighten(o.helmet, 0.4));
  }
  // 눈 / 눈썹 / 입
  if (P.squint) {
    p.rect(cx + S(2), headY + S(1), S(2), 1, OUTLINE);
  } else {
    p.px(cx + S(3), headY, OUTLINE);
    p.px(cx + S(3), headY + 1, o.eye);
    p.rect(cx + S(2), headY - 2, S(3), 1, darken(o.hair[2], 0.2));
  }
  p.px(cx + S(4), headY + S(3), pose === 'attack' || pose === 'hurt' ? OUTLINE : darken(o.skin[2], 0.2));
  if (o.horns) {
    p.poly([[cx - S(3), headY - S(4)], [cx - S(6), headY - S(11)], [cx - S(1), headY - S(5)]], '#3a3044');
    p.poly([[cx + S(1), headY - S(5)], [cx + S(4), headY - S(12)], [cx + S(4), headY - S(4)]], '#4a3e56');
    p.line(cx + S(2), headY - S(6), cx + S(3), headY - S(10), '#7a6a8a');
  }
  if (o.crown) {
    p.rect(cx - S(4), headY - S(7), S(9), S(2), '#e0b850');
    for (let i = 0; i < 3; i++) p.px(cx - S(3) + i * S(3), headY - S(8), '#e0b850');
    p.px(cx, headY - S(7), '#ff3040');
  }

  drawArm(p, o, cx, neckY, k, P);
  p.outlineTinted(0.6);
  return p;
}

/** 앞팔 + 무기 */
function drawArm(p: Painter, o: HumanoidOpts, cx: number, neckY: number, k: number, P: (typeof POSE)[Pose]) {
  const S = (v: number) => Math.round(v * k);
  const sx = cx + S(2), sy = neckY + S(3);
  const handX = cx + S(P.hand[0]), handY = neckY + S(P.hand[1]);
  p.line(sx, sy, handX, handY, o.body);
  p.line(sx + 1, sy, handX, handY + 1, o.body);
  p.line(sx, sy + 1, (sx + handX) / 2, (sy + handY) / 2 + 1, o.bodyShadow);
  p.rect(handX - 1, handY - 1, S(3), S(3), o.skin[1]);
  drawWeapon(p, o.weapon, handX, handY, k, P.angle);
}

/** angle: 손에서 뻗는 방향 (라디안, 0 = 정면, 음수 = 위) */
function drawWeapon(p: Painter, w: Weapon, x: number, y: number, k: number, angle: number) {
  const S = (v: number) => v * k;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const at = (d: number, side = 0): [number, number] => [x + dx * S(d) - dy * S(side), y + dy * S(d) + dx * S(side)];
  const seg = (a: number, b: number, c: string, side = 0) => {
    const [x0, y0] = at(a, side), [x1, y1] = at(b, side);
    p.line(x0, y0, x1, y1, c);
  };
  switch (w) {
    case 'sword':
    case 'holysword': {
      const blade = w === 'holysword' ? '#eaf6ff' : '#c8d0dc';
      seg(-3, -1, '#5a3a22'); // 손잡이
      p.px(...at(-4), '#e0b850'); // 폼멜
      seg(1, 1, '#e0b850', -2);
      seg(1, 1, '#e0b850', 2);
      seg(0, 0, '#e0b850', 1);
      seg(0, 0, '#e0b850', -1);
      seg(2, 16, blade);
      seg(2, 15, darken(blade, 0.25), 1);
      seg(3, 12, '#ffffff', -1);
      if (w === 'holysword') p.px(...at(0), '#7ad0ff');
      break;
    }
    case 'staff': {
      const sa = angle - 0.55;
      const sdx = Math.cos(sa), sdy = Math.sin(sa);
      p.line(x - sdx * S(10), y - sdy * S(10), x + sdx * S(14), y + sdy * S(14), '#6a4a2a');
      p.line(x - sdx * S(9) + 1, y - sdy * S(9), x + sdx * S(13) + 1, y + sdy * S(13), '#8a6a3e');
      const gx = x + sdx * S(16), gy = y + sdy * S(16);
      p.ellipse(gx, gy, S(2.5), S(2.5), '#7ad0ff');
      p.px(gx - 1, gy - 1, '#ffffff');
      break;
    }
    case 'axe': {
      seg(-6, 12, '#5a3a22');
      const [hx, hy] = at(12);
      p.poly([[hx - dy * S(1), hy], [hx - dy * S(1) + dx * S(3) + dy * S(-7) * -1, hy + dy * S(3) - dx * S(7) * -1], [hx + dx * S(4) + dy * S(5), hy + dy * S(4) - dx * S(5)], [hx + dx * S(-2), hy + dy * S(-2)]], '#9aa0aa');
      p.ellipse(hx + dy * S(3), hy - dx * S(3), S(3), S(3), '#9aa0aa');
      p.px(hx + dy * S(4), hy - dx * S(4), '#d8dce4');
      break;
    }
    case 'spear':
    case 'pitchfork': {
      const fa = angle * 0.4 + 0.1;
      const fdx = Math.cos(fa), fdy = Math.sin(fa);
      p.line(x - fdx * S(10), y - fdy * S(10), x + fdx * S(18), y + fdy * S(18), '#6a4a2a');
      const tx = x + fdx * S(18), ty = y + fdy * S(18);
      if (w === 'spear') {
        p.poly([[tx, ty - S(2)], [tx + fdx * S(6), ty + fdy * S(6)], [tx, ty + S(2)]], '#c8d0dc');
        p.px(tx + 1, ty - 1, '#ffffff');
      } else for (let i = -1; i <= 1; i++) p.line(tx, ty + i * S(2), tx + fdx * S(5), ty + fdy * S(5) + i * S(2), '#9aa0aa');
      break;
    }
    case 'knife':
      seg(-2, 0, '#3a2a20');
      seg(1, 6, '#d0d8e0');
      seg(2, 5, '#ffffff', -1);
      break;
    case 'fist':
      break;
  }
}

// ───────────────────────── 플레이어 ─────────────────────────

export function playerSprite(spec: PortraitSpec, magic: boolean): SpriteSet {
  const look = lookOf(spec);
  const o = look.outfit;
  const job = look.job;
  const weapon: Weapon = magic
    ? 'staff'
    : job === 'hero' ? 'holysword'
      : job === 'farmer' ? 'pitchfork'
        : job === 'adventurer' ? 'sword'
          : spec.stage === 'child' ? 'fist' : 'sword';
  return humanoidSet({
    skin: look.skin,
    hair: look.hair,
    eye: look.eye,
    body: o.base,
    bodyShadow: o.shadow,
    trim: o.trim,
    legs: darken(o.base, 0.45),
    weapon,
    size: spec.stage === 'child' ? 0.75 : spec.stage === 'baby' ? 0.6 : 1,
    horns: spec.houseId === 'demon',
    hood: job === 'adventurer' ? o.shadow : job === 'priest' ? '#ece6d6' : undefined,
    cape: job === 'hero' ? '#2e5aa8' : job === 'demon_officer' ? '#6a1420' : job === 'knight' ? '#7a2a30' : undefined,
    crown: job === 'demon_officer' && spec.jobRank >= 5,
    // 초상화와 같은 머리 (머리 모양·앞머리·눈·출신 표식이 그대로)
    head: figureHead(figureOf({ ...spec, dead: false })),
  });
}

/** 적 인물의 도트 지도 머리 */
function npcHead(o: {
  gender: 'm' | 'f'; hair: Ramp; skin: Ramp; eye: string; trim: string; bangs: Bangs; back: BackHair;
  house?: string; beard?: boolean; mood?: Figure['mood']; helmet?: string; hood?: string; crown?: boolean; stage?: Figure['stage'];
}) {
  return figureHead({
    gender: o.gender, stage: o.stage ?? 'adult', houseId: o.house ?? 'farm', job: null, jobRank: 0, mood: o.mood ?? 'angry',
    blink: false, dead: false, injured: false, sway: 0, hair: o.hair, skin: o.skin, eye: o.eye,
    outfit: { base: o.trim, light: o.trim, shadow: o.trim, trim: o.trim }, bangs: o.bangs, back: o.back, beard: !!o.beard,
  }, (p) => {
    if (o.helmet) helmetOver(p, o.helmet);
    if (o.hood) hoodOver(p, o.hood);
    if (o.crown) {
      for (let x = 10; x <= 17; x++) p.px(x, 3, '#e0b850');
      for (const x of [10, 13, 16]) p.px(x, 2, '#e0b850');
      p.px(14, 3, '#ff3040');
    }
  });
}

// ───────────────────────── 적 ─────────────────────────

export type EnemyKind =
  | 'bandit' | 'soldier' | 'rival' | 'bully' | 'stalker' | 'hero' | 'demon_lord' | 'traitor'
  | 'wolf' | 'shadow' | 'dragon' | 'wyvern';

const SKIN_MID: Ramp = ['#f0c49c', '#d89a72', '#a86c54'];
const HAIR_DARK: Ramp = ['#56506a', '#302a3e', '#1a1624'];

export function enemySprite(kind: EnemyKind): SpriteSet {
  switch (kind) {
    case 'bandit':
      return humanoidSet({ skin: SKIN_MID, hair: HAIR_DARK, eye: '#2a1a1a', body: '#c8884a', bodyShadow: '#9a6038', trim: '#6a3a22', legs: '#7a5a4a', weapon: 'axe',
        head: npcHead({ gender: 'm', hair: HAIR_DARK, skin: SKIN_MID, eye: '#2a1a1a', trim: '#6a3a22', bangs: 'messy', back: 'short', beard: true, hood: '#a86a3a' }) });
    case 'soldier':
      return humanoidSet({ skin: SKIN_MID, hair: HAIR_DARK, eye: '#2a1a1a', body: '#e85a5a', bodyShadow: '#b03a4a', trim: '#e0e8f8', legs: '#5a6a9a', weapon: 'spear',
        head: npcHead({ gender: 'm', hair: HAIR_DARK, skin: SKIN_MID, eye: '#2a1a1a', trim: '#e0e8f8', bangs: 'crop', back: 'short', helmet: '#c8d4ec' }) });
    case 'rival':
      return humanoidSet({ skin: SKIN_MID, hair: ['#e0e0f0', '#9a9ab8', '#5e5e7a'], eye: '#6a3aa0', body: '#4a4ab8', bodyShadow: '#30308a', trim: '#ff5a7a', legs: '#2a2a6a', weapon: 'sword', cape: '#8a3ab8',
        head: npcHead({ gender: 'm', hair: ['#e0e0f0', '#9a9ab8', '#5e5e7a'], skin: SKIN_MID, eye: '#6a3aa0', trim: '#ff5a7a', bangs: 'side', back: 'short' }) });
    case 'bully':
      return humanoidSet({ skin: SKIN_MID, hair: ['#e0b860', '#b08a3a', '#7a5a22'], eye: '#3a3a6a', body: '#ff8a3a', bodyShadow: '#d0602a', trim: '#ffe070', legs: '#5a6ab8', weapon: 'fist', size: 0.8,
        head: npcHead({ gender: 'm', stage: 'child', hair: ['#e0b860', '#b08a3a', '#7a5a22'], skin: SKIN_MID, eye: '#3a3a6a', trim: '#ffe070', bangs: 'spiky', back: 'short' }) });
    case 'stalker':
      return humanoidSet({ skin: ['#f4dcd0', '#dcbcb0', '#a88a84'], hair: ['#4a3a5a', '#2a1e36', '#140e1e'], eye: '#c8304a', body: '#ff8ab8', bodyShadow: '#d05a90', trim: '#ffffff', legs: '#7a4a8a', weapon: 'knife',
        head: npcHead({ gender: 'f', hair: ['#4a3a5a', '#2a1e36', '#140e1e'], skin: ['#f4dcd0', '#dcbcb0', '#a88a84'], eye: '#c8304a', trim: '#ff8ab8', bangs: 'straight', back: 'twin', mood: 'happy' }) });
    case 'hero':
      return humanoidSet({ skin: SKIN_MID, hair: ['#f4d878', '#c8a040', '#8a6626'], eye: '#3e8ae0', body: '#e4ecff', bodyShadow: '#a4b4e0', trim: '#ffc83a', legs: '#4a6ad0', weapon: 'holysword', cape: '#3a8aff',
        head: npcHead({ gender: 'm', hair: ['#f4d878', '#c8a040', '#8a6626'], skin: SKIN_MID, eye: '#3e8ae0', trim: '#ffc83a', bangs: 'spiky', back: 'short' }) });
    case 'demon_lord':
      return humanoidSet({ skin: ['#e0d4e4', '#b8a6c4', '#7e6a90'], hair: HAIR_DARK, eye: '#ff3040', body: '#5a2a98', bodyShadow: '#3a1a6a', trim: '#ff3a7a', legs: '#2a1a4a', weapon: 'sword', horns: true, crown: true, cape: '#c82a5a', size: 1.3,
        head: npcHead({ gender: 'm', house: 'demon', hair: HAIR_DARK, skin: ['#e0d4e4', '#b8a6c4', '#7e6a90'], eye: '#ff3040', trim: '#ff3a7a', bangs: 'center', back: 'ponytail', crown: true }) });
    case 'traitor':
      return humanoidSet({ skin: SKIN_MID, hair: ['#b07c44', '#7a4e2a', '#4a2e1a'], eye: '#3a3a2a', body: '#5ab878', bodyShadow: '#3a8858', trim: '#d08a50', legs: '#6a5a4a', weapon: 'knife',
        head: npcHead({ gender: 'm', hair: ['#b07c44', '#7a4e2a', '#4a2e1a'], skin: SKIN_MID, eye: '#3a3a2a', trim: '#d08a50', bangs: 'messy', back: 'short', hood: '#4a9a68' }) });
    case 'wolf':
      return singleSet(drawWolf());
    case 'shadow':
      return singleSet(drawShadow());
    case 'dragon':
      return singleSet(drawDragon('#e84a4a', '#ff8a6a', '#ffd070', 1));
    case 'wyvern':
      return singleSet(drawDragon('#3ab878', '#7ae0a0', '#fff070', 0.6));
  }
}

function drawWolf(): Painter {
  const p = new Painter(48, 32);
  const fur = '#a8b0d8', dark = '#7a82b0', light = '#e0e8ff';
  p.poly([[2, 14], [10, 10], [12, 13], [6, 17]], fur); // 꼬리
  p.ellipse(22, 18, 13, 7, fur);
  p.ellipseWhere(22, 18, 13, 7, dark, (_x, y) => y > 21);
  p.ellipseWhere(22, 18, 13, 7, light, (_x, y) => y < 13);
  for (const lx of [12, 17, 28, 33]) p.rect(lx, 22, 3, 9, lx % 2 ? fur : dark);
  p.ellipse(37, 13, 6, 5, fur);
  p.poly([[40, 12], [47, 14], [46, 17], [40, 17]], fur); // 주둥이
  p.poly([[33, 9], [35, 3], [37, 9]], dark);
  p.poly([[37, 9], [40, 3], [41, 10]], fur);
  p.px(40, 12, '#ff4030');
  p.line(42, 17, 46, 17, '#f0f0f0');
  p.outlineTinted(0.6);
  return p;
}

function drawShadow(): Painter {
  const p = new Painter(44, 44);
  p.ellipse(22, 22, 16, 18, '#6a4ab8');
  for (let i = 0; i < 6; i++) p.poly([[8 + i * 6, 34], [10 + i * 6, 43], [13 + i * 6, 34]], '#6a4ab8');
  p.ellipse(22, 18, 10, 10, '#8a6ad8');
  p.ellipse(26, 18, 3, 2, '#ff3040');
  p.ellipse(16, 18, 3, 2, '#ff3040');
  p.px(26, 17, '#ffd0d0');
  p.px(16, 17, '#ffd0d0');
  p.rect(14, 27, 14, 2, '#0a0610');
  for (let i = 0; i < 5; i++) p.px(15 + i * 3, 26, '#e0e0e0');
  p.outlineTinted(0.5);
  return p;
}

function drawDragon(body: string, light: string, belly: string, k: number): Painter {
  const W = Math.round(110 * k), H = Math.round(80 * k);
  const p = new Painter(W, H);
  const S = (v: number) => v * k;
  const shadow = darken(body, 0.35);
  // 뒷날개
  p.poly([[S(40), S(30)], [S(20), S(2)], [S(30), S(12)], [S(8), S(8)], [S(26), S(24)], [S(4), S(26)], [S(36), S(40)]], shadow);
  // 꼬리
  p.poly([[S(30), S(56)], [S(2), S(64)], [S(0), S(58)], [S(26), S(48)]], body);
  p.poly([[S(0), S(58)], [S(-4), S(56)], [S(4), S(52)]], light);
  // 몸통
  p.ellipse(S(48), S(52), S(22), S(14), body);
  p.ellipseWhere(S(48), S(52), S(22), S(14), belly, (_x, y) => y > S(58));
  p.ellipseWhere(S(48), S(52), S(22), S(14), light, (_x, y) => y < S(43));
  // 다리
  p.rect(S(34), S(60), S(7), S(18), shadow);
  p.rect(S(56), S(60), S(8), S(19), body);
  p.rect(S(56), S(76), S(11), S(3), shadow);
  // 목과 머리
  p.poly([[S(60), S(46)], [S(80), S(20)], [S(88), S(24)], [S(70), S(52)]], body);
  p.ellipse(S(88), S(20), S(10), S(7), body);
  p.poly([[S(92), S(16)], [S(108), S(22)], [S(106), S(27)], [S(90), S(26)]], body);
  p.poly([[S(84), S(14)], [S(76), S(2)], [S(88), S(13)]], '#d8d0b8');
  p.ellipse(S(92), S(18), S(1.6), S(1.2), '#ffe040');
  p.line(S(94), S(26), S(106), S(25), belly);
  // 앞날개
  p.poly([[S(50), S(40)], [S(58), S(4)], [S(66), S(14)], [S(76), S(6)], [S(72), S(26)], [S(84), S(28)], [S(58), S(46)]], light);
  p.line(S(52), S(40), S(58), S(4), shadow);
  p.line(S(56), S(40), S(76), S(6), shadow);
  p.line(S(58), S(44), S(84), S(28), shadow);
  p.outlineTinted(0.6);
  return p;
}

/** 베기 효과 (호 모양) */
export function slashSprite(color = '#fff4dc'): Painter {
  const p = new Painter(28, 28);
  for (let a = -1.2; a <= 1.2; a += 0.04) {
    const r = 12;
    const x = 14 + Math.cos(a) * r, y = 14 + Math.sin(a) * r;
    p.px(x, y, color);
    if (Math.abs(a) < 0.8) p.px(x - 1, y, lighten(color, 0.3));
  }
  return p;
}

/** 마법 탄 */
export function boltSprite(core = '#ffffff', glow = '#7ad0ff'): Painter {
  const p = new Painter(9, 9);
  p.ellipse(4, 4, 4, 4, glow);
  p.ellipse(4, 4, 2, 2, core);
  return p;
}
