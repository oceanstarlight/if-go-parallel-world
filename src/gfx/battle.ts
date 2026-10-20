import gsap from 'gsap';
import { Container, Graphics, Sprite, Texture, type Filter } from 'pixi.js';
import { GlowFilter } from 'pixi-filters/glow';
import { ShockwaveFilter } from 'pixi-filters/shockwave';
import { GlitchFilter } from 'pixi-filters/glitch';
import { RGBSplitFilter } from 'pixi-filters/rgb-split';
import { Painter } from './painter';
import { pixelText } from './pixelfont';
import { SCENE_H, SCENE_W } from './scenes';
import { boltSprite, slashSprite, type Pose, type SpriteSet } from './sprites';

/**
 * 연출형 전투. 결과(승패)는 엔진이 이미 정했고, 여기서는 그 결과를 보여주기만 한다.
 * 타격감: 예비동작 → 돌진 → 히트스톱 → 흰색 플래시/스쿼시/넉백/파티클/데미지 숫자 → 복귀
 */

export interface BattleOptions {
  player: SpriteSet;
  enemy: SpriteSet;
  magic: boolean;
  /** 성검·마법 등 무기에 빛을 두를 색 */
  glow?: number;
  /** 적 최대 HP (데미지 숫자 크기) */
  enemyHp?: number;
  win: boolean;
  died: boolean;
  groundY: number;
}

export interface BattleHost {
  layer: Container;
  sceneRoot: Container;
  caption: HTMLElement;
  shake(power: number): void;
  texOf(p: Painter): Texture;
}

const POSES: Pose[] = ['idle', 'breathe', 'attack', 'hurt'];

function whiteOf(p: Painter): Painter {
  const w = new Painter(p.w, p.h);
  for (let i = 0; i < p.data.length; i++) if (p.data[i]) w.data[i] = '#ffffff';
  return w;
}

/** 전투 중 한 인물. root 는 발밑 기준, flip 은 좌우 방향 */
class Actor {
  readonly root = new Container();
  private readonly flip = new Container();
  private readonly body = new Sprite();
  readonly flash = new Sprite();
  private readonly tex = {} as Record<Pose, Texture>;
  private readonly flashTex = {} as Record<Pose, Texture>;
  private t = 0;
  pose: Pose = 'idle';
  breathing = true;
  readonly w: number;
  readonly h: number;

  constructor(set: SpriteSet, readonly facing: 1 | -1, host: BattleHost) {
    for (const p of POSES) {
      this.tex[p] = host.texOf(set[p]);
      this.flashTex[p] = host.texOf(whiteOf(set[p]));
    }
    this.w = set.idle.w;
    this.h = set.idle.h;
    this.body.anchor.set(0.5, 1);
    this.flash.anchor.set(0.5, 1);
    this.flash.alpha = 0;
    this.flip.scale.x = facing;
    this.flip.addChild(this.body, this.flash);
    this.root.addChild(this.flip);
    this.setPose('idle');
  }

  setPose(p: Pose) {
    this.pose = p;
    this.body.texture = this.tex[p];
    this.flash.texture = this.flashTex[p];
  }

  /** 숨쉬기: 1px 상하 2프레임, 450ms 유지 */
  update(dt: number) {
    if (!this.breathing || (this.pose !== 'idle' && this.pose !== 'breathe')) return;
    this.t += dt;
    if (this.t > 450) {
      this.t = 0;
      this.setPose(this.pose === 'idle' ? 'breathe' : 'idle');
    }
  }

  get mid() {
    return { x: this.root.x, y: this.root.y - this.h * 0.55 };
  }

  destroy() {
    for (const p of POSES) {
      this.tex[p].destroy(true);
      this.flashTex[p].destroy(true);
    }
    this.root.destroy({ children: true });
  }
}

interface Spark {
  s: Sprite;
  vx: number;
  vy: number;
  g: number;
  life: number;
  max: number;
}

export class BattleDirector {
  private player!: Actor;
  private enemy!: Actor;
  private hp = { p: 1, e: 1 };
  private hpBar = new Graphics();
  private dim = new Graphics();
  private sparks: Spark[] = [];
  private spawned: (gsap.core.Tween | gsap.core.Timeline)[] = [];
  private textures: Texture[] = [];
  private tl: gsap.core.Timeline | null = null;
  private white: Texture;

  constructor(private readonly host: BattleHost) {
    const w = new Painter(1, 1);
    w.px(0, 0, '#ffffff');
    this.white = this.own(host.texOf(w));
    const st = new Painter(3, 3);
    st.px(1, 0, '#ffffff'); st.px(0, 1, '#ffffff'); st.px(1, 1, '#ffffff'); st.px(2, 1, '#ffffff'); st.px(1, 2, '#ffffff');
    this.star = this.own(host.texOf(st));
  }

  private star: Texture;

  /** 쓰러짐: 화면이 하얗게 번지며 부드럽게 (애니풍) */
  private soften() {
    const flash = new Graphics().rect(0, 0, SCENE_W, SCENE_H).fill({ color: 0xffffff });
    flash.alpha = 0;
    this.host.layer.addChild(flash);
    this.tw(gsap.timeline()
      .to(flash, { alpha: 0.75, duration: 0.18, ease: 'power2.out' })
      .to(flash, { alpha: 0, duration: 0.6, ease: 'power1.in' }));
    const { x, y } = this.player.mid;
    this.burst(x, y, 30, [0xffffff, 0xfff4a0, 0xa8f0ff, 0xffc8f0], 0.9, -0.03);
    this.glitch(0.12);
  }

  private own(t: Texture) {
    this.textures.push(t);
    return t;
  }

  private tw<T extends gsap.core.Tween | gsap.core.Timeline>(t: T): T {
    this.spawned.push(t);
    return t;
  }

  skip() {
    this.tl?.progress(1);
  }

  update(dt: number) {
    this.player?.update(dt);
    this.enemy?.update(dt);
    const k = dt / 16;
    for (const p of this.sparks) {
      p.life += dt;
      p.vy += p.g * k;
      p.s.x += p.vx * k;
      p.s.y += p.vy * k;
      p.s.alpha = Math.max(0, 1 - p.life / p.max);
    }
    const dead = this.sparks.filter((p) => p.life >= p.max);
    for (const p of dead) p.s.destroy();
    this.sparks = this.sparks.filter((p) => p.life < p.max);
    this.drawHp();
  }

  private drawHp() {
    const g = this.hpBar;
    g.clear();
    const bar = (x: number, v: number, right: boolean) => {
      const w = 70;
      g.rect(x - 1, 7, w + 2, 6).fill(0x120c10);
      g.rect(x, 8, w, 4).fill(0x3a2a2a);
      const fw = Math.round(w * Math.max(0, v));
      const col = v > 0.5 ? 0x7ac05a : v > 0.25 ? 0xe0b040 : 0xd04030;
      g.rect(right ? x + w - fw : x, 8, fw, 4).fill(col);
      g.rect(right ? x + w - fw : x, 8, fw, 1).fill(0xffffff);
    };
    bar(8, this.hp.p, false);
    bar(SCENE_W - 78, this.hp.e, true);
  }

  // ───────────────── 효과 ─────────────────

  private burst(x: number, y: number, n: number, colors: number[], speed = 1.6, gravity = 0.12) {
    for (let i = 0; i < n; i++) {
      const s = new Sprite(i % 3 === 0 ? this.star : this.white);
      s.tint = colors[i % colors.length];
      s.position.set(Math.round(x), Math.round(y));
      if (i % 5 === 1) s.scale.set(2);
      this.host.layer.addChild(s);
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random());
      this.sparks.push({ s, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, g: gravity, life: 0, max: 300 + Math.random() * 350 });
    }
  }

  private number(x: number, y: number, value: number, crit: boolean) {
    const tex = this.own(this.host.texOf(pixelText(String(value) + (crit ? '!' : ''), crit ? '#ffd860' : '#ffffff', crit ? 2 : 1)));
    const s = new Sprite(tex);
    s.anchor.set(0.5, 1);
    s.position.set(Math.round(x), Math.round(y - 8));
    this.host.layer.addChild(s);
    this.tw(gsap.timeline())
      .fromTo(s, { y: s.y + 4 }, { y: s.y - 6, duration: 0.25, ease: 'power2.out', snap: { y: 1 } })
      .to(s, { y: s.y - 12, alpha: 0, duration: 0.5, delay: 0.2, ease: 'power1.in', snap: { y: 1 } })
      .call(() => s.destroy());
  }

  private slash(x: number, y: number, flip: boolean, color: string) {
    const s = new Sprite(this.own(this.host.texOf(slashSprite(color))));
    s.anchor.set(0.5);
    s.scale.x = flip ? -1 : 1;
    s.position.set(Math.round(x), Math.round(y));
    this.host.layer.addChild(s);
    this.tw(gsap.to(s, { alpha: 0, duration: 0.18, ease: 'steps(3)', onComplete: () => s.destroy() }));
  }

  private shockwave(x: number, y: number) {
    const f = new ShockwaveFilter({ center: { x, y }, amplitude: 6, wavelength: 40, speed: 260, radius: 120, brightness: 1.15, time: 0 });
    this.addFilter(f);
    this.tw(gsap.to(f, { time: 0.55, duration: 0.55, ease: 'none', onComplete: () => this.removeFilter(f) }));
  }

  private glitch(duration: number) {
    const g = new GlitchFilter({ slices: 8, offset: 12, direction: 0, fillMode: 2, seed: Math.random() });
    const rgb = new RGBSplitFilter({ red: { x: -2, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 2, y: 0 } });
    this.addFilter(g);
    this.addFilter(rgb);
    this.tw(gsap.to({ t: 0 }, {
      t: 1,
      duration,
      ease: 'none',
      onUpdate: () => {
        g.seed = Math.random();
        g.refresh();
      },
      onComplete: () => {
        this.removeFilter(g);
        this.removeFilter(rgb);
      },
    }));
  }

  private addFilter(f: Filter) {
    const cur = (this.host.sceneRoot.filters as Filter[] | null) ?? [];
    this.host.sceneRoot.filters = [...cur, f];
  }

  private removeFilter(f: Filter) {
    const cur = (this.host.sceneRoot.filters as Filter[] | null) ?? [];
    const next = cur.filter((x) => x !== f);
    this.host.sceneRoot.filters = next.length ? next : null;
    f.destroy();
  }

  /** 맞는 순간 */
  private impact(target: Actor, from: Actor, dmg: number, crit: boolean, magic: boolean) {
    target.breathing = false;
    target.setPose('hurt');
    const { x, y } = target.mid;
    // 흰색 플래시
    this.tw(gsap.fromTo(target.flash, { alpha: 1 }, { alpha: 0, duration: 0.14, ease: 'steps(2)' }));
    // 스쿼시 (맞은 쪽은 납작하게 → 탄성 복귀)
    this.tw(gsap.fromTo(target.root.scale, { x: 1.16, y: 0.86 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1, 0.45)' }));
    // 넉백
    const back = -from.facing * (crit ? 6 : 3);
    this.tw(gsap.fromTo(target.root, { x: target.root.x + back }, { x: target.root.x, duration: 0.3, ease: 'power2.out', snap: { x: 1 } }));
    // 파티클, 베기, 숫자, 흔들림
    const colors = magic ? [0x9af0ff, 0xffffff, 0xc8a0ff, 0xffb0e8] : [0xffffff, 0xffe070, 0xff8aa8, 0x8ad8ff];
    this.burst(x, y, crit ? 22 : 12, colors, crit ? 2.4 : 1.6);
    if (!magic) this.slash(x, y, from.facing < 0, crit ? '#ffe680' : '#fff4dc');
    this.number(x, y - target.h * 0.35, dmg, crit);
    this.host.shake(crit ? 4 : 2);
    if (crit) this.shockwave(x, y);
  }

  /** 공격 한 번을 타임라인에 붙인다 */
  private attack(tl: gsap.core.Timeline, a: Actor, t: Actor, o: { home: number; targetHome: number; dmg: number; hpTo: number; crit: boolean; magic: boolean; glow?: number; miss?: boolean }) {
    const home = o.home;
    const dir = a.facing;
    const dist = o.magic ? 4 : Math.abs(o.targetHome - home) - (t.w + a.w) * 0.28;
    tl.call(() => { a.breathing = false; a.setPose('idle'); })
      // 예비동작: 뒤로 살짝 + 위로 늘어남
      .to(a.root.scale, { x: 0.9, y: 1.1, duration: 0.09, ease: 'power1.out' })
      .to(a.root, { x: home - dir * 3, duration: 0.09, ease: 'power1.out', snap: { x: 1 } }, '<')
      .call(() => a.setPose('attack'));
    if (o.magic) {
      // 마법탄
      const bolt = new Sprite(this.own(this.host.texOf(boltSprite('#ffffff', '#7ad0ff'))));
      bolt.anchor.set(0.5);
      bolt.visible = false;
      bolt.filters = [new GlowFilter({ distance: 6, outerStrength: 2, color: o.glow ?? 0x7ad0ff, quality: 0.2 })];
      this.host.layer.addChild(bolt);
      tl.to(a.root.scale, { x: 1.08, y: 0.93, duration: 0.08 })
        .call(() => {
          bolt.visible = true;
          bolt.position.set(a.root.x + dir * 12, a.mid.y - 4);
        })
        .to(bolt, { x: () => t.mid.x, y: () => t.mid.y, duration: 0.2, ease: 'power1.in', snap: { x: 1, y: 1 } })
        .call(() => { bolt.destroy({ children: true }); });
    } else {
      // 돌진 (앞으로 눌리며)
      tl.to(a.root, { x: home + dir * dist, duration: 0.11, ease: 'power3.in', snap: { x: 1 } })
        .to(a.root.scale, { x: 1.12, y: 0.9, duration: 0.11 }, '<');
    }
    tl.call(() => {
      if (o.miss) {
        // 회피: 맞을 쪽이 훌쩍 비켜선다
        const away = a.facing * 8;
        this.tw(gsap.fromTo(t.root, { x: t.root.x }, { x: t.root.x + away, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out', snap: { x: 1 } }));
        this.burst(t.mid.x, t.root.y - 2, 6, [0xd8d0c0, 0xffffff], 0.8);
        return;
      }
      this.impact(t, a, o.dmg, o.crit, o.magic);
      this.tw(gsap.to(this.hp, { [a === this.player ? 'e' : 'p']: o.hpTo, duration: 0.35, ease: 'power2.out' }));
    })
      // 히트스톱: 모든 움직임을 잠깐 멈춘다
      .to({}, { duration: o.crit ? 0.13 : 0.07 })
      .to(a.root, { x: home, duration: 0.26, ease: 'power2.out', snap: { x: 1 } })
      .to(a.root.scale, { x: 1, y: 1, duration: 0.2 }, '<')
      .call(() => {
        a.setPose('idle');
        a.breathing = true;
        if (t.pose === 'hurt') {
          t.setPose('idle');
          t.breathing = true;
        }
      });
  }

  play(o: BattleOptions): Promise<void> {
    const host = this.host;
    return new Promise((resolve) => {
      this.player = new Actor(o.player, 1, host);
      this.enemy = new Actor(o.enemy, -1, host);
      const gy = Math.min(o.groundY + 4, SCENE_H - 4);
      const big = o.enemy.idle.w > 60;
      const pHome = 64, eHome = big ? 176 : 170;
      const maxHp = o.enemyHp ?? 100;
      if (o.glow) this.player.root.filters = [new GlowFilter({ distance: 4, outerStrength: 0.9, color: o.glow, quality: 0.2 })];

      this.dim.rect(0, 0, SCENE_W, SCENE_H).fill({ color: 0x1a1a5a, alpha: 0.12 });
      const shadow = new Graphics();
      host.layer.addChild(this.dim, shadow, this.enemy.root, this.player.root, this.hpBar);
      this.player.root.position.set(-30, gy);
      this.enemy.root.position.set(SCENE_W + 60, gy);
      host.caption.textContent = '';
      host.caption.className = 'battle-caption';

      // 그림자는 매 프레임 발 위치를 따라간다
      const shadowTick = () => {
        shadow.clear();
        shadow.ellipse(this.player.root.x, gy, 10, 2).fill({ color: 0x000000, alpha: 0.35 * this.player.root.alpha });
        shadow.ellipse(this.enemy.root.x, gy, big ? 30 : 10, 2).fill({ color: 0x000000, alpha: 0.35 * this.enemy.root.alpha });
      };

      const dmg = (frac: number) => Math.max(1, Math.round(frac * maxHp * (0.9 + Math.random() * 0.2)));
      const tl = gsap.timeline({ onUpdate: shadowTick, onComplete: () => this.finish(resolve) });
      this.tl = tl;

      // 등장
      tl.to(this.player.root, { x: pHome, duration: 0.38, ease: 'power2.out', snap: { x: 1 } })
        .to(this.enemy.root, { x: eHome, duration: 0.38, ease: 'power2.out', snap: { x: 1 } }, '<')
        .to({}, { duration: 0.15 });

      // 1합, 2합
      this.attack(tl, this.player, this.enemy, { home: pHome, targetHome: eHome, dmg: dmg(0.38), hpTo: 0.62, crit: false, magic: o.magic, glow: o.glow });
      tl.to({}, { duration: 0.12 });
      this.attack(tl, this.enemy, this.player, { home: eHome, targetHome: pHome, dmg: dmg(o.win ? 0.3 : 0.5), hpTo: o.win ? 0.7 : 0.5, crit: false, magic: false });
      tl.to({}, { duration: 0.15 });

      // 결정타
      if (o.win) {
        this.attack(tl, this.player, this.enemy, { home: pHome, targetHome: eHome, dmg: dmg(0.62), hpTo: 0, crit: true, magic: o.magic, glow: o.glow });
        tl.call(() => {
          const e = this.enemy;
          e.breathing = false;
          e.setPose('hurt');
          const { x, y } = e.mid;
          this.burst(x, y, 26, [0xffffff, 0xfff4a0, 0xffc8f0, 0xa8f0ff], 1.1, -0.02);
          this.tw(gsap.to(e.root, { alpha: 0, y: gy + 6, duration: 0.55, ease: 'steps(6)' }));
        });
      } else {
        this.attack(tl, this.enemy, this.player, { home: eHome, targetHome: pHome, dmg: dmg(o.died ? 0.5 : 0.35), hpTo: o.died ? 0 : 0.15, crit: true, magic: false });
        tl.call(() => {
          const p = this.player;
          p.breathing = false;
          p.setPose('hurt');
          if (o.died) {
            this.tw(gsap.to(p.root, { rotation: -Math.PI / 2, alpha: 0.7, duration: 0.45, ease: 'bounce.out' }));
            this.soften();
          } else {
            this.tw(gsap.to(p.root, { y: gy + 3, duration: 0.2, ease: 'power2.out' }));
          }
        });
      }

      tl.to({}, { duration: 0.35 })
        .call(() => {
          host.caption.textContent = o.win ? '승리' : o.died ? '쓰러졌다' : '패배';
          host.caption.className = `battle-caption show ${o.win ? 'win' : 'lose'}`;
        })
        .to({}, { duration: 0.85 });
    });
  }

  // ───────────────── 턴제 전투 (한 합씩) ─────────────────

  private sess: { pHome: number; eHome: number; gy: number; shadowTick: () => void; glow?: number } | null = null;

  /** 등장까지만: 두 인물을 세워 둔다 */
  open(o: Omit<BattleOptions, 'win' | 'died'> & { hpP: number; hpE: number }): Promise<void> {
    const host = this.host;
    this.player = new Actor(o.player, 1, host);
    this.enemy = new Actor(o.enemy, -1, host);
    const gy = Math.min(o.groundY + 4, SCENE_H - 4);
    const big = o.enemy.idle.w > 60;
    const pHome = 64, eHome = big ? 176 : 170;
    this.hp = { p: o.hpP, e: o.hpE };
    if (o.glow) this.player.root.filters = [new GlowFilter({ distance: 4, outerStrength: 0.9, color: o.glow, quality: 0.2 })];
    this.dim.rect(0, 0, SCENE_W, SCENE_H).fill({ color: 0x1a1a5a, alpha: 0.12 });
    const shadow = new Graphics();
    host.layer.addChild(this.dim, shadow, this.enemy.root, this.player.root, this.hpBar);
    this.player.root.position.set(-30, gy);
    this.enemy.root.position.set(SCENE_W + 60, gy);
    host.caption.textContent = '';
    host.caption.className = 'battle-caption';
    const shadowTick = () => {
      shadow.clear();
      shadow.ellipse(this.player.root.x, gy, 10, 2).fill({ color: 0x000000, alpha: 0.35 * this.player.root.alpha });
      shadow.ellipse(this.enemy.root.x, gy, big ? 30 : 10, 2).fill({ color: 0x000000, alpha: 0.35 * this.enemy.root.alpha });
    };
    this.sess = { pHome, eHome, gy, shadowTick, glow: o.glow };
    return this.run((tl) => {
      tl.to(this.player.root, { x: pHome, duration: 0.38, ease: 'power2.out', snap: { x: 1 } })
        .to(this.enemy.root, { x: eHome, duration: 0.38, ease: 'power2.out', snap: { x: 1 } }, '<');
    });
  }

  /** 한 턴의 타격들을 차례로 보여 준다 */
  turn(blows: { from: 'p' | 'e'; dmg: number; crit: boolean; magic: boolean; miss: boolean; hpTo: number; guard?: boolean }[]): Promise<void> {
    const ss = this.sess;
    if (!ss) return Promise.resolve();
    return this.run((tl) => {
      for (const b of blows) {
        if (b.guard) {
          // 방어 태세: 푸른 빛이 감싼다
          tl.call(() => {
            this.burst(this.player.mid.x, this.player.mid.y, 14, [0x9ad0ff, 0xffffff, 0x7aa8ff], 0.9, -0.02);
            this.tw(gsap.fromTo(this.player.root.scale, { x: 0.92, y: 1.08 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' }));
          }).to({}, { duration: 0.3 });
          continue;
        }
        const mine = b.from === 'p';
        this.attack(tl, mine ? this.player : this.enemy, mine ? this.enemy : this.player, {
          home: mine ? ss.pHome : ss.eHome, targetHome: mine ? ss.eHome : ss.pHome,
          dmg: b.dmg, hpTo: b.hpTo, crit: b.crit, magic: b.magic, miss: b.miss, glow: mine ? ss.glow : undefined,
        });
        tl.to({}, { duration: 0.12 });
      }
    });
  }

  /** 끝: 승리·패배·도주 연출 후 정리 */
  close(result: 'win' | 'lose' | 'died' | 'fled'): Promise<void> {
    const ss = this.sess;
    if (!ss) return Promise.resolve();
    const host = this.host;
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onUpdate: ss.shadowTick, onComplete: () => this.finish(resolve) });
      this.tl = tl;
      tl.call(() => {
        if (result === 'win') {
          const e = this.enemy;
          e.breathing = false;
          e.setPose('hurt');
          this.burst(e.mid.x, e.mid.y, 26, [0xffffff, 0xfff4a0, 0xffc8f0, 0xa8f0ff], 1.1, -0.02);
          this.tw(gsap.to(e.root, { alpha: 0, y: ss.gy + 6, duration: 0.55, ease: 'steps(6)' }));
        } else if (result === 'fled') {
          this.player.setPose('idle');
          this.tw(gsap.to(this.player.root, { x: -40, duration: 0.45, ease: 'power2.in', snap: { x: 1 } }));
        } else {
          const p = this.player;
          p.breathing = false;
          p.setPose('hurt');
          if (result === 'died') {
            this.tw(gsap.to(p.root, { rotation: -Math.PI / 2, alpha: 0.7, duration: 0.45, ease: 'bounce.out' }));
            this.soften();
          } else this.tw(gsap.to(p.root, { y: ss.gy + 3, duration: 0.2, ease: 'power2.out' }));
        }
      })
        .to({}, { duration: 0.45 })
        .call(() => {
          host.caption.textContent = result === 'win' ? '승리' : result === 'fled' ? '도주' : result === 'died' ? '쓰러졌다' : '패배';
          host.caption.className = `battle-caption show ${result === 'win' ? 'win' : 'lose'}`;
        })
        .to({}, { duration: 0.8 });
      this.sess = null;
    });
  }

  private run(build: (tl: gsap.core.Timeline) => void): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onUpdate: this.sess?.shadowTick, onComplete: () => resolve() });
      this.tl = tl;
      build(tl);
    });
  }

  private finish(resolve: () => void) {
    for (const t of this.spawned) t.kill();
    this.spawned = [];
    for (const p of this.sparks) p.s.destroy();
    this.sparks = [];
    this.host.sceneRoot.filters = null;
    for (const c of this.host.layer.removeChildren()) {
      if (c !== this.player?.root && c !== this.enemy?.root) c.destroy({ children: true });
    }
    this.player.destroy();
    this.enemy.destroy();
    for (const t of this.textures) t.destroy(true);
    this.textures = [];
    this.host.caption.textContent = '';
    this.host.caption.className = 'battle-caption';
    this.tl = null;
    resolve();
  }
}
