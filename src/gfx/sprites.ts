import { Painter, darken, lighten } from './painter';
import { lookOf, type PortraitSpec, type Ramp } from './portrait';

/** 전투 스프라이트. 모두 오른쪽을 바라보도록 그린다 (적은 좌우 반전해서 쓴다). */

const OUTLINE = '#120c10';

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
}

export function drawHumanoid(o: HumanoidOpts): Painter {
  const k = o.size ?? 1;
  const W = Math.round(40 * k), H = Math.round(50 * k);
  const p = new Painter(W, H);
  const S = (v: number) => Math.round(v * k);
  const cx = S(16); // 몸 중심
  const ground = H - 1;
  const hipY = ground - S(14);
  const neckY = S(17);
  const headY = S(10);

  // 망토 (뒤)
  if (o.cape) p.poly([[cx - S(3), neckY], [cx + S(3), neckY], [cx - S(2), hipY + S(10)], [cx - S(11), hipY + S(11)]], o.cape);

  // 다리
  p.rect(cx - S(5), hipY, S(4), ground - hipY, darken(o.legs, 0.25));
  p.rect(cx + S(1), hipY, S(4), ground - hipY, o.legs);
  p.rect(cx - S(6), ground - S(3), S(6), S(3), '#2a1e18');
  p.rect(cx + S(1), ground - S(3), S(7), S(3), '#3a2a20');

  // 뒷팔
  p.rect(cx - S(7), neckY + S(2), S(3), S(11), o.bodyShadow);

  // 몸통
  p.poly([[cx - S(6), neckY + S(1)], [cx + S(6), neckY + S(1)], [cx + S(5), hipY + S(1)], [cx - S(5), hipY + S(1)]], o.body);
  p.rect(cx - S(6), neckY + S(1), S(3), hipY - neckY, o.bodyShadow);
  p.rect(cx - S(5), hipY - S(2), S(10), S(2), o.trim);

  // 머리
  if (o.hood) p.ellipse(cx, headY, S(7.5), S(7.5), o.hood);
  p.ellipse(cx + S(1), headY + S(1), S(5.5), S(6), o.skin[1]);
  p.rect(cx + S(4), headY + S(2), S(2), S(3), o.skin[2]);
  // 머리카락 (뒤통수/윗머리)
  if (!o.hood && !o.helmet) {
    p.ellipseWhere(cx, headY - S(1), S(6.5), S(6), o.hair[1], (x, y) => y < headY - S(1) || x < cx - S(1));
    p.rect(cx - S(2), headY - S(5), S(4), S(1), o.hair[0]);
  }
  if (o.hood) p.ellipseWhere(cx, headY, S(7.5), S(7.5), o.hood, (x, y) => y < headY - S(2) || x < cx - S(2));
  if (o.helmet) {
    p.ellipseWhere(cx, headY, S(7), S(7), o.helmet, (_x, y) => y < headY + S(1));
    p.rect(cx - S(6), headY + S(1), S(4), S(5), o.helmet);
    p.rect(cx - S(6), headY - S(1), S(13), S(1), lighten(o.helmet, 0.3));
  }
  // 눈
  p.px(cx + S(3), headY + S(1), o.eye);
  p.px(cx + S(3), headY, OUTLINE);
  if (o.horns) {
    p.poly([[cx - S(3), headY - S(4)], [cx - S(6), headY - S(11)], [cx - S(1), headY - S(5)]], '#3a3044');
    p.poly([[cx + S(1), headY - S(5)], [cx + S(4), headY - S(12)], [cx + S(4), headY - S(4)]], '#4a3e56');
  }
  if (o.crown) {
    p.rect(cx - S(4), headY - S(7), S(9), S(2), '#e0b850');
    for (let i = 0; i < 3; i++) p.px(cx - S(3) + i * S(3), headY - S(8), '#e0b850');
  }

  // 앞팔 + 무기 (앞으로 뻗음)
  const handX = cx + S(9), handY = neckY + S(8);
  p.line(cx + S(2), neckY + S(3), handX, handY, o.body);
  p.line(cx + S(3), neckY + S(3), handX, handY + 1, o.body);
  p.rect(handX - 1, handY - 1, S(3), S(3), o.skin[1]);
  drawWeapon(p, o.weapon, handX, handY, k);

  p.outline(OUTLINE);
  return p;
}

function drawWeapon(p: Painter, w: Weapon, x: number, y: number, k: number) {
  const S = (v: number) => Math.round(v * k);
  switch (w) {
    case 'sword':
    case 'holysword': {
      const blade = w === 'holysword' ? '#eaf6ff' : '#c8d0dc';
      p.rect(x - S(1), y - S(1), S(1), S(4), '#e0b850');
      p.line(x + S(1), y, x + S(13), y - S(12), blade);
      p.line(x + S(1), y + 1, x + S(13), y - S(11), darken(blade, 0.2));
      if (w === 'holysword') p.px(x + S(1), y, '#7ad0ff');
      break;
    }
    case 'staff':
      p.line(x - S(2), y + S(10), x + S(3), y - S(14), '#6a4a2a');
      p.ellipse(x + S(3), y - S(16), S(2.5), S(2.5), '#7ad0ff');
      p.px(x + S(2), y - S(17), '#ffffff');
      break;
    case 'axe':
      p.line(x - S(1), y + S(6), x + S(4), y - S(10), '#5a3a22');
      p.poly([[x + S(3), y - S(10)], [x + S(10), y - S(13)], [x + S(10), y - S(4)], [x + S(4), y - S(6)]], '#9aa0aa');
      break;
    case 'spear':
    case 'pitchfork':
      p.line(x - S(8), y + S(4), x + S(16), y - S(4), '#6a4a2a');
      if (w === 'spear') p.poly([[x + S(15), y - S(6)], [x + S(21), y - S(6)], [x + S(16), y - S(2)]], '#c8d0dc');
      else for (let i = -1; i <= 1; i++) p.line(x + S(16), y - S(4) + i * S(2), x + S(21), y - S(5) + i * S(2), '#9aa0aa');
      break;
    case 'knife':
      p.line(x + S(1), y, x + S(6), y - S(3), '#d0d8e0');
      break;
    case 'fist':
      break;
  }
}

// ───────────────────────── 플레이어 ─────────────────────────

export function playerSprite(spec: PortraitSpec, magic: boolean): Painter {
  const look = lookOf(spec);
  const o = look.outfit;
  const job = look.job;
  const weapon: Weapon = magic
    ? 'staff'
    : job === 'hero' ? 'holysword'
      : job === 'farmer' ? 'pitchfork'
        : job === 'adventurer' ? 'sword'
          : spec.stage === 'child' ? 'fist' : 'sword';
  return drawHumanoid({
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
  });
}

// ───────────────────────── 적 ─────────────────────────

export type EnemyKind =
  | 'bandit' | 'soldier' | 'rival' | 'bully' | 'stalker' | 'hero' | 'demon_lord' | 'traitor'
  | 'wolf' | 'shadow' | 'dragon' | 'wyvern';

const SKIN_MID: Ramp = ['#f0c49c', '#d89a72', '#a86c54'];
const HAIR_DARK: Ramp = ['#56506a', '#302a3e', '#1a1624'];

export function enemySprite(kind: EnemyKind): Painter {
  switch (kind) {
    case 'bandit':
      return drawHumanoid({ skin: SKIN_MID, hair: HAIR_DARK, eye: '#2a1a1a', body: '#5a4430', bodyShadow: '#3a2a1e', trim: '#2a1e14', legs: '#3a3028', weapon: 'axe', hood: '#4a3a2a' });
    case 'soldier':
      return drawHumanoid({ skin: SKIN_MID, hair: HAIR_DARK, eye: '#2a1a1a', body: '#6a2a2a', bodyShadow: '#4a1a1a', trim: '#9aa0aa', legs: '#3a3a44', weapon: 'spear', helmet: '#8a929e' });
    case 'rival':
      return drawHumanoid({ skin: SKIN_MID, hair: ['#e0e0f0', '#9a9ab8', '#5e5e7a'], eye: '#6a3aa0', body: '#2a2a3e', bodyShadow: '#1a1a28', trim: '#a8303a', legs: '#1e1e2a', weapon: 'sword', cape: '#3a1a2a' });
    case 'bully':
      return drawHumanoid({ skin: SKIN_MID, hair: ['#e0b860', '#b08a3a', '#7a5a22'], eye: '#3a3a6a', body: '#3a5a9a', bodyShadow: '#2a3e6a', trim: '#e0c060', legs: '#4a3a2a', weapon: 'fist', size: 0.8 });
    case 'stalker':
      return drawHumanoid({ skin: ['#f4dcd0', '#dcbcb0', '#a88a84'], hair: ['#4a3a5a', '#2a1e36', '#140e1e'], eye: '#c8304a', body: '#2a1e2e', bodyShadow: '#18101c', trim: '#6a2a3a', legs: '#1e1622', weapon: 'knife' });
    case 'hero':
      return drawHumanoid({ skin: SKIN_MID, hair: ['#f4d878', '#c8a040', '#8a6626'], eye: '#3e8ae0', body: '#b8c4d4', bodyShadow: '#76829a', trim: '#e0b850', legs: '#4a5a7a', weapon: 'holysword', cape: '#2e5aa8' });
    case 'demon_lord':
      return drawHumanoid({ skin: ['#e0d4e4', '#b8a6c4', '#7e6a90'], hair: HAIR_DARK, eye: '#ff3040', body: '#1e1a26', bodyShadow: '#100c16', trim: '#b8283a', legs: '#140e1a', weapon: 'sword', horns: true, crown: true, cape: '#6a0c18', size: 1.3 });
    case 'traitor':
      return drawHumanoid({ skin: SKIN_MID, hair: ['#b07c44', '#7a4e2a', '#4a2e1a'], eye: '#3a3a2a', body: '#4e5a3a', bodyShadow: '#323a24', trim: '#7a5232', legs: '#3a3428', weapon: 'knife', hood: '#3e4a2e' });
    case 'wolf':
      return drawWolf();
    case 'shadow':
      return drawShadow();
    case 'dragon':
      return drawDragon('#5a1a1e', '#8a2a24', '#e0602a', 1);
    case 'wyvern':
      return drawDragon('#2a4a2e', '#4a6a3a', '#c8d040', 0.6);
  }
}

function drawWolf(): Painter {
  const p = new Painter(48, 32);
  const fur = '#5a5a66', dark = '#3a3a44', light = '#8a8a96';
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
  p.outline(OUTLINE);
  return p;
}

function drawShadow(): Painter {
  const p = new Painter(44, 44);
  p.ellipse(22, 22, 16, 18, '#1a1426');
  for (let i = 0; i < 6; i++) p.poly([[8 + i * 6, 34], [10 + i * 6, 43], [13 + i * 6, 34]], '#1a1426');
  p.ellipse(22, 18, 10, 10, '#2a2038');
  p.ellipse(26, 18, 3, 2, '#ff3040');
  p.ellipse(16, 18, 3, 2, '#ff3040');
  p.px(26, 17, '#ffd0d0');
  p.px(16, 17, '#ffd0d0');
  p.rect(14, 27, 14, 2, '#0a0610');
  for (let i = 0; i < 5; i++) p.px(15 + i * 3, 26, '#e0e0e0');
  p.outline('#4a2a6a');
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
  p.outline(OUTLINE);
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
