import { Application, Container, Graphics, Sprite, Texture, TextureStyle, TilingSprite } from 'pixi.js';
import { Painter, bayer, hashStr } from './painter';
import { drawPortrait, specKey, type PortraitSpec } from './portrait';
import { SCENE_H, SCENE_W, drawScene, type Fx, type SceneKind } from './scenes';
import { boltSprite, slashSprite } from './sprites';

TextureStyle.defaultOptions.scaleMode = 'nearest';

const hex = (c: string) => parseInt(c.slice(1), 16);

function texOf(p: Painter): Texture {
  return Texture.from(p.toCanvas());
}

let whiteTex: Texture | null = null;
function white(): Texture {
  if (!whiteTex) {
    const p = new Painter(1, 1);
    p.px(0, 0, '#ffffff');
    whiteTex = texOf(p);
  }
  return whiteTex;
}

/** 스프라이트 텍스처 교체 (기본 EMPTY 는 파괴하지 않는다) */
function swap(s: Sprite, t: Texture) {
  if (s.texture !== Texture.EMPTY) s.texture.destroy(true);
  s.texture = t;
}

type ParticleType = Extract<Fx, { kind: 'particles' }>['type'];

interface Particle {
  s: Sprite;
  vx: number;
  vy: number;
  phase: number;
  area: [number, number, number, number];
  type: ParticleType;
}

const PARTICLE_COLOR: Record<ParticleType, number[]> = {
  embers: [0xf8a040, 0xf06020, 0xffd060],
  snow: [0xffffff, 0xdce4f0],
  rain: [0x8aa0c8, 0x6a80a8],
  fireflies: [0xe0f070, 0xb0f0a0],
  dust: [0xf0e0b0, 0xfff0d0],
  ash: [0x8a8480, 0x5e5a58],
};

export interface BattleOptions {
  player: Painter;
  enemy: Painter;
  magic: boolean;
  win: boolean;
  died: boolean;
  groundY: number;
}

/** 캔버스를 정수 배율로 키워 도트를 선명하게 유지한다 */
function fitCanvas(canvas: HTMLCanvasElement, host: HTMLElement, w: number, h: number, maxK = 8) {
  const avail = host.clientWidth || w;
  const availH = host.dataset.maxh ? Number(host.dataset.maxh) : Infinity;
  const k = Math.max(1, Math.min(maxK, Math.floor(avail / w), Math.floor(availH / h)));
  canvas.style.width = `${w * k}px`;
  canvas.style.height = `${h * k}px`;
}

export class GfxStage {
  private constructor(
    private readonly portraitApp: Application,
    private readonly sceneApp: Application,
  ) {}

  static async create(): Promise<GfxStage | null> {
    try {
      const make = async (w: number, h: number) => {
        const app = new Application();
        await app.init({ width: w, height: h, antialias: false, resolution: 1, backgroundAlpha: 0, preference: 'webgl' });
        app.canvas.classList.add('pixel-canvas');
        return app;
      };
      const stage = new GfxStage(await make(64, 64), await make(SCENE_W, SCENE_H));
      stage.init();
      return stage;
    } catch (e) {
      console.warn('도트 그래픽을 사용할 수 없다 (WebGL 미지원?)', e);
      return null;
    }
  }

  // ───────────────── 초상화 ─────────────────

  private portraitKey = '';
  private portraitSprite = new Sprite();
  private blinkSprite = new Sprite();
  private blinkTimer = 2500;

  // ───────────────── 장면 ─────────────────

  private sceneKey = '';
  private sceneRoot = new Container();
  private bgSprite = new Sprite();
  private fxLayer = new Container();
  private battleLayer = new Container();
  private particles: Particle[] = [];
  private updaters: ((dt: number, t: number) => void)[] = [];
  private time = 0;
  private caption = document.createElement('div');
  private shake = 0;
  private battle: { skip: () => void } | null = null;
  private resizeObs = new ResizeObserver((entries) => {
    for (const e of entries) {
      const host = e.target as HTMLElement;
      if (host.contains(this.sceneApp.canvas)) fitCanvas(this.sceneApp.canvas, host, SCENE_W, SCENE_H);
      if (host.contains(this.portraitApp.canvas)) fitCanvas(this.portraitApp.canvas, host, 64, 64, 4);
    }
  });

  private init() {
    this.portraitApp.stage.addChild(this.portraitSprite, this.blinkSprite);
    this.blinkSprite.visible = false;
    this.portraitApp.ticker.add((tk) => {
      this.blinkTimer -= tk.deltaMS;
      this.blinkSprite.visible = this.blinkTimer < 0 && this.blinkTimer > -130;
      if (this.blinkTimer < -130) this.blinkTimer = 2500 + Math.random() * 3500;
    });

    this.sceneRoot.addChild(this.bgSprite, this.fxLayer, this.battleLayer);
    this.sceneApp.stage.addChild(this.sceneRoot);
    this.caption.className = 'battle-caption';
    this.sceneApp.ticker.add((tk) => this.tick(tk.deltaMS));
  }

  /** placeholder 요소에 캔버스를 붙인다 (DOM 이 다시 그려질 때마다 호출) */
  mountPortrait(host: HTMLElement | null) {
    if (!host) return;
    host.appendChild(this.portraitApp.canvas);
    fitCanvas(this.portraitApp.canvas, host, 64, 64, 4);
    this.resizeObs.observe(host);
  }

  mountScene(host: HTMLElement | null) {
    if (!host) return;
    host.append(this.sceneApp.canvas, this.caption);
    fitCanvas(this.sceneApp.canvas, host, SCENE_W, SCENE_H);
    this.resizeObs.observe(host);
  }

  setPortrait(spec: PortraitSpec) {
    const key = specKey(spec);
    if (key === this.portraitKey) return;
    this.portraitKey = key;
    swap(this.portraitSprite, texOf(drawPortrait(spec)));
    swap(this.blinkSprite, spec.dead ? Texture.EMPTY : texOf(drawPortrait(spec, true)));
  }

  /** extraWeather: 묘지 등에서 덧붙일 날씨 */
  setScene(kind: SceneKind, seed = 1, extraWeather?: ParticleType) {
    const key = `${kind}|${seed}|${extraWeather ?? ''}`;
    if (key === this.sceneKey) return;
    this.sceneKey = key;
    const scene = drawScene(kind, seed);
    this.groundY = scene.groundY;
    swap(this.bgSprite, texOf(scene.p));
    for (const c of this.fxLayer.removeChildren()) c.destroy({ children: true });
    this.particles = [];
    this.updaters = [];
    const fx = [...scene.fx];
    if (extraWeather) fx.push({ kind: 'particles', type: extraWeather, count: extraWeather === 'rain' ? 70 : 40, area: [0, -10, SCENE_W, SCENE_H + 10] });
    for (const f of fx) this.buildFx(f, hashStr(key));
  }

  groundY = 120;

  private buildFx(f: Fx, seed: number) {
    let r = seed;
    const rnd = () => ((r = (r * 1664525 + 1013904223) >>> 0) / 4294967296);
    if (f.kind === 'twinkle') {
      for (const [x, y] of f.pts) {
        const s = new Sprite(white());
        s.position.set(x, y);
        const ph = rnd() * 10, sp = 0.8 + rnd() * 2;
        this.fxLayer.addChild(s);
        this.updaters.push((_dt, t) => { s.alpha = 0.25 + 0.75 * Math.abs(Math.sin(t / 1000 * sp + ph)); });
      }
    } else if (f.kind === 'glow') {
      for (const [x, y, rad, color] of f.pts) {
        const g = new Graphics();
        const c = hex(color);
        g.circle(x, y, rad).fill({ color: c, alpha: 0.07 });
        g.circle(x, y, rad * 0.6).fill({ color: c, alpha: 0.08 });
        g.circle(x, y, rad * 0.3).fill({ color: c, alpha: 0.1 });
        g.blendMode = 'add';
        const ph = rnd() * 100;
        this.fxLayer.addChild(g);
        this.updaters.push((_dt, t) => {
          const n = Math.sin(t / 90 + ph) * 0.5 + Math.sin(t / 37 + ph * 2) * 0.3;
          g.alpha = 0.75 + n * 0.25;
        });
      }
    } else if (f.kind === 'fog') {
      const p = new Painter(SCENE_W, f.h);
      for (let y = 0; y < f.h; y++) {
        const fy = 1 - Math.abs(y / f.h - 0.5) * 2;
        for (let x = 0; x < SCENE_W; x++) {
          const n = (Math.sin(x / 13 + y / 5) + Math.sin(x / 31 - y / 3)) * 0.25 + 0.5;
          if (bayer(x, y) < n * fy * 0.55) p.px(x, y, f.color);
        }
      }
      const ts = new TilingSprite({ texture: texOf(p), width: SCENE_W, height: f.h });
      ts.position.set(0, f.y);
      ts.alpha = 0.45;
      this.fxLayer.addChild(ts);
      this.updaters.push((dt) => { ts.tilePosition.x += dt * 0.004; });
    } else {
      const colors = PARTICLE_COLOR[f.type];
      for (let i = 0; i < f.count; i++) {
        const s = new Sprite(white());
        s.tint = colors[i % colors.length];
        if (f.type === 'rain') s.height = 3;
        const [ax, ay, aw, ah] = f.area;
        s.position.set(ax + rnd() * aw, ay + rnd() * ah);
        this.fxLayer.addChild(s);
        this.particles.push({ s, vx: 0, vy: 0, phase: rnd() * 100, area: f.area, type: f.type });
      }
    }
  }

  private tick(dt: number) {
    this.time += dt;
    const t = this.time;
    for (const u of this.updaters) u(dt, t);
    for (const p of this.particles) this.moveParticle(p, dt, t);
    if (this.shake > 0) {
      this.sceneRoot.position.set(Math.round((Math.random() - 0.5) * this.shake * 2), Math.round((Math.random() - 0.5) * this.shake * 2));
      this.shake = Math.max(0, this.shake - dt * 0.012);
    } else this.sceneRoot.position.set(0, 0);
  }

  private moveParticle(p: Particle, dt: number, t: number) {
    const [ax, ay, aw, ah] = p.area;
    const s = p.s;
    const k = dt / 16;
    switch (p.type) {
      case 'embers':
        s.y -= 0.35 * k;
        s.x += Math.sin(t / 400 + p.phase) * 0.2 * k;
        s.alpha = 0.5 + 0.5 * Math.sin(t / 150 + p.phase);
        break;
      case 'snow':
        s.y += 0.25 * k;
        s.x += Math.sin(t / 700 + p.phase) * 0.15 * k;
        break;
      case 'rain':
        s.y += 2.6 * k;
        s.x -= 0.6 * k;
        break;
      case 'ash':
        s.y += 0.12 * k;
        s.x += 0.1 * k + Math.sin(t / 900 + p.phase) * 0.1 * k;
        break;
      case 'fireflies':
      case 'dust':
        s.x += Math.sin(t / 1300 + p.phase) * 0.12 * k;
        s.y += Math.cos(t / 1100 + p.phase * 1.3) * 0.08 * k;
        s.alpha = p.type === 'fireflies' ? Math.max(0, Math.sin(t / 600 + p.phase)) : 0.35 + 0.25 * Math.sin(t / 800 + p.phase);
        break;
    }
    if (s.y < ay) s.y = ay + ah;
    if (s.y > ay + ah) s.y = ay;
    if (s.x < ax) s.x = ax + aw;
    if (s.x > ax + aw) s.x = ax;
  }

  // ───────────────── 전투 연출 ─────────────────

  get inBattle() {
    return this.battle !== null;
  }

  skipBattle() {
    this.battle?.skip();
  }

  playBattle(o: BattleOptions): Promise<void> {
    return new Promise((resolve) => {
      const layer = this.battleLayer;
      const dim = new Graphics().rect(0, 0, SCENE_W, SCENE_H).fill({ color: 0x000000, alpha: 0.35 });
      const shadowG = new Graphics();
      const hp = new Graphics();
      const pTex = texOf(o.player), eTex = texOf(o.enemy);
      const ps = new Sprite(pTex), es = new Sprite(eTex);
      ps.anchor.set(0.5, 1);
      es.anchor.set(0.5, 1);
      es.scale.x = -1;
      const gy = Math.min(o.groundY + 4, SCENE_H - 4);
      const big = o.enemy.w > 60;
      const pHome = 64, eHome = big ? 178 : 172;
      ps.position.set(-30, gy);
      es.position.set(SCENE_W + 60, gy);
      const fxTex = o.magic ? texOf(boltSprite()) : texOf(slashSprite());
      const fxSprite = new Sprite(fxTex);
      fxSprite.anchor.set(0.5);
      fxSprite.visible = false;
      const eFx = new Sprite(texOf(slashSprite('#ffb0a0')));
      eFx.anchor.set(0.5);
      eFx.scale.x = -1;
      eFx.visible = false;
      layer.addChild(dim, shadowG, es, ps, fxSprite, eFx, hp);

      let t = 0;
      let pHp = 1, eHp = 1, pShown = 1, eShown = 1;
      const hits = new Set<string>();
      const once = (id: string, at: number, fn: () => void) => { if (t >= at && !hits.has(id)) { hits.add(id); fn(); } };
      const END = 2800;
      this.caption.textContent = '';
      this.caption.className = 'battle-caption';

      const enemyMid = () => es.y - o.enemy.h * 0.55;
      const playerMid = () => ps.y - o.player.h * 0.55;

      const step = (dt: number) => {
        t += dt;
        const seg = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
        const ease = (x: number) => 1 - (1 - x) * (1 - x);
        const lunge = (a: number, b: number, d: number) => Math.sin(Math.PI * seg(a, b)) * d;

        // 등장
        const intro = ease(seg(0, 380));
        let px = -30 + (pHome + 30) * intro;
        let ex = SCENE_W + 60 - (SCENE_W + 60 - eHome) * intro;
        // 1합: 플레이어 → 적
        px += lunge(380, 720, o.magic ? 4 : 18);
        once('p1', 540, () => { eHp = 0.62; this.shake = 2; es.tint = 0xff7070; });
        // 2합: 적 → 플레이어
        ex -= lunge(820, 1160, big ? 10 : 18);
        once('e1', 990, () => { pHp = o.win ? 0.7 : 0.5; this.shake = 2; ps.tint = 0xff7070; });
        // 결정타
        if (o.win) {
          px += lunge(1240, 1640, o.magic ? 6 : 26);
          once('p2', 1440, () => { eHp = 0; this.shake = 4; es.tint = 0xff5050; });
        } else {
          ex -= lunge(1240, 1640, big ? 14 : 24);
          once('e2', 1440, () => { pHp = o.died ? 0 : 0.15; this.shake = 4; ps.tint = 0xff5050; });
        }
        if (t > 620 && t < 900) es.tint = 0xffffff;
        if (t > 1080 && t < 1300) ps.tint = 0xffffff;
        ps.position.set(Math.round(px), gy);
        es.position.set(Math.round(ex), gy);

        // 쓰러짐
        const fall = seg(1520, 1900);
        if (o.win) {
          es.alpha = 1 - fall * 0.85;
          es.y = gy + Math.round(fall * 6);
          if (fall > 0) es.tint = 0x806060;
        } else if (o.died) {
          ps.rotation = -fall * Math.PI / 2;
          ps.alpha = 1 - fall * 0.4;
          if (fall > 0) ps.tint = 0x808090;
        } else {
          ps.y = gy + Math.round(fall * 3);
        }

        // 공격 효과
        const fxActive = (a: number, b: number) => t >= a && t < b;
        if (o.magic) {
          const shot = (a: number, b: number) => {
            if (!fxActive(a, b)) return false;
            const u = seg(a, b);
            fxSprite.position.set(Math.round(ps.x + 14 + (es.x - ps.x - 14) * u), Math.round(playerMid() - 6 + (enemyMid() - playerMid()) * u));
            return true;
          };
          fxSprite.visible = shot(400, 540) || (o.win && shot(1300, 1440));
        } else {
          fxSprite.visible = fxActive(520, 660) || (o.win && fxActive(1420, 1580));
          fxSprite.position.set(Math.round(es.x - 4), Math.round(enemyMid()));
          fxSprite.alpha = 1 - ((t % 140) / 140) * 0.6;
        }
        eFx.visible = fxActive(970, 1110) || (!o.win && fxActive(1420, 1580));
        eFx.position.set(Math.round(ps.x + 4), Math.round(playerMid()));

        // 그림자 + HP
        shadowG.clear();
        shadowG.ellipse(ps.x, gy, 10, 2).fill({ color: 0x000000, alpha: 0.35 });
        shadowG.ellipse(es.x, gy, big ? 30 : 10, 2).fill({ color: 0x000000, alpha: 0.35 * es.alpha });
        pShown += (pHp - pShown) * Math.min(1, dt / 120);
        eShown += (eHp - eShown) * Math.min(1, dt / 120);
        const bar = (x: number, v: number, right: boolean) => {
          const w = 70;
          hp.rect(x - 1, 7, w + 2, 6).fill(0x120c10);
          hp.rect(x, 8, w, 4).fill(0x3a2a2a);
          const fw = Math.round(w * v);
          const col = v > 0.5 ? 0x7ac05a : v > 0.25 ? 0xe0b040 : 0xd04030;
          hp.rect(right ? x + w - fw : x, 8, fw, 4).fill(col);
          hp.rect(right ? x + w - fw : x, 8, fw, 1).fill(0xffffff);
        };
        hp.clear();
        bar(8, pShown, false);
        bar(SCENE_W - 78, eShown, true);

        if (t >= 1750 && !this.caption.textContent) {
          this.caption.textContent = o.win ? '승리' : o.died ? '쓰러졌다' : '패배';
          this.caption.className = `battle-caption show ${o.win ? 'win' : 'lose'}`;
        }
        if (t >= END) finish();
      };

      const finish = () => {
        this.sceneApp.ticker.remove(tickFn);
        for (const c of layer.removeChildren()) c.destroy();
        pTex.destroy(true);
        eTex.destroy(true);
        fxTex.destroy(true);
        this.caption.textContent = '';
        this.caption.className = 'battle-caption';
        this.battle = null;
        resolve();
      };
      const tickFn = (tk: { deltaMS: number }) => step(tk.deltaMS);
      this.battle = { skip: () => { t = Math.max(t, END - 1); } };
      this.sceneApp.ticker.add(tickFn);
    });
  }
}
