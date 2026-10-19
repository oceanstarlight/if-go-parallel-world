import { Application, Container, Graphics, Sprite, Texture, TextureStyle, TilingSprite } from 'pixi.js';
import { Painter, bayer, hashStr } from './painter';
import { drawPortrait, specKey, type PortraitSpec } from './portrait';
import { SCENE_H, SCENE_W, drawScene, type Fx, type SceneKind } from './scenes';
import { BattleDirector, type BattleOptions } from './battle';
import { GodrayFilter } from 'pixi-filters/godray';
import gsap from 'gsap';

export type { BattleOptions };

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
    const first = this.bgSprite.texture === Texture.EMPTY;
    const old = this.bgSprite.texture;
    this.bgSprite.texture = texOf(scene.p);
    if (!first) this.ditherOut(old);
    this.applyGodray(kind);
    for (const c of this.fxLayer.removeChildren()) c.destroy({ children: true });
    this.particles = [];
    this.updaters = [];
    const fx = [...scene.fx];
    if (extraWeather) fx.push({ kind: 'particles', type: extraWeather, count: extraWeather === 'rain' ? 70 : 40, area: [0, -10, SCENE_W, SCENE_H + 10] });
    for (const f of fx) this.buildFx(f, hashStr(key));
  }

  groundY = 120;

  // ───────────────── 장면 전환 / 빛줄기 ─────────────────

  private ditherMasks: Texture[] = [];
  private transition: { sprite: Sprite; mask: Sprite; tween: gsap.core.Tween } | null = null;

  /** 베이어 디더 패턴으로 이전 장면을 조금씩 지운다 */
  private ditherOut(old: Texture) {
    if (this.transition) {
      this.transition.tween.progress(1);
    }
    if (!this.ditherMasks.length) {
      for (let lv = 0; lv < 16; lv++) {
        const p = new Painter(SCENE_W, SCENE_H);
        for (let y = 0; y < SCENE_H; y++) for (let x = 0; x < SCENE_W; x++) if (bayer(x, y) >= lv / 16) p.px(x, y, '#ffffff');
        this.ditherMasks.push(texOf(p));
      }
    }
    const sprite = new Sprite(old);
    const mask = new Sprite(this.ditherMasks[0]);
    sprite.mask = mask;
    this.sceneRoot.addChildAt(sprite, this.sceneRoot.getChildIndex(this.fxLayer));
    this.sceneRoot.addChild(mask);
    const state = { lv: 0 };
    const tween = gsap.to(state, {
      lv: 15,
      duration: 0.45,
      ease: 'none',
      onUpdate: () => { mask.texture = this.ditherMasks[Math.round(state.lv)]; },
      onComplete: () => {
        sprite.destroy();
        mask.destroy();
        old.destroy(true);
        this.transition = null;
      },
    });
    this.transition = { sprite, mask, tween };
  }

  private godray: GodrayFilter | null = null;

  /** 신전·숲·묘지 등에 은은한 빛줄기 */
  private applyGodray(kind: SceneKind) {
    const cfg: Partial<Record<SceneKind, { angle: number; gain: number; alpha: number }>> = {
      temple: { angle: 25, gain: 0.55, alpha: 0.6 },
      forest: { angle: 20, gain: 0.5, alpha: 0.35 },
      graveyard: { angle: -25, gain: 0.45, alpha: 0.3 },
      grave: { angle: -25, gain: 0.45, alpha: 0.3 },
      throne: { angle: 15, gain: 0.5, alpha: 0.35 },
      library: { angle: 30, gain: 0.45, alpha: 0.3 },
      title: { angle: -20, gain: 0.4, alpha: 0.25 },
    };
    const c = cfg[kind];
    if (!c) {
      this.bgSprite.filters = null;
      return;
    }
    if (!this.godray) this.godray = new GodrayFilter({ angle: c.angle, gain: c.gain, lacunarity: 2.5, parallel: true, alpha: c.alpha, time: 0 });
    Object.assign(this.godray, c);
    this.bgSprite.filters = [this.godray];
  }

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
    if (this.godray && this.bgSprite.filters) this.godray.time += dt * 0.0004;
    for (const u of this.updaters) u(dt, t);
    for (const p of this.particles) this.moveParticle(p, dt, t);
    this.battle?.update(dt);
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

  private battle: BattleDirector | null = null;

  get inBattle() {
    return this.battle !== null;
  }

  skipBattle() {
    this.battle?.skip();
  }

  playBattle(o: BattleOptions): Promise<void> {
    const director = new BattleDirector({
      layer: this.battleLayer,
      sceneRoot: this.sceneRoot,
      caption: this.caption,
      shake: (n) => { this.shake = Math.max(this.shake, n); },
      texOf,
    });
    this.battle = director;
    return director.play(o).then(() => { this.battle = null; });
  }
}
