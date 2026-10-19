/**
 * WebAudio 칩튠 재생기. compose() 가 만든 악보를 미리보기 스케줄링으로 연주한다.
 * 브라우저 정책상 첫 터치/클릭 뒤에야 소리가 난다.
 */
import { STEPS_PER_BAR, TRACKS, compose, type Mood, type Step, type Wave } from './compose';

const PREF_KEY = 'igpw-audio-v1';
const LOOKAHEAD = 0.2;
const FADE = 1.2;

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

interface Playing {
  mood: Mood;
  score: Step[];
  step: number;
  next: number;
  stepDur: number;
  bus: GainNode;
  wave: Wave;
}

export class Music {
  private ctx: BaseAudioContext | null = null;
  private master: GainNode | null = null;
  private softWave: PeriodicWave | null = null;
  private noise: AudioBuffer | null = null;
  private playing: Playing | null = null;
  private timer = 0;
  private wanted: Mood = 'title';
  private scores = new Map<Mood, Step[]>();
  on: boolean;

  constructor() {
    let on = true;
    try {
      on = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{"on":true}').on !== false;
    } catch { /* 저장소를 못 쓰면 기본값 */ }
    this.on = on;
    const unlock = () => {
      if (this.on) this.start();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      const live = this.ctx as AudioContext;
      if (document.hidden) void live.suspend();
      else if (this.on) void live.resume();
    });
  }

  /** 화면이 바뀔 때마다 부른다. 같은 분위기면 아무 일도 없다 */
  setMood(m: Mood) {
    this.wanted = m;
    if (this.ctx && this.on && this.playing?.mood !== m) this.play(m);
  }

  toggle(): boolean {
    this.on = !this.on;
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ on: this.on }));
    } catch { /* 무시 */ }
    if (this.on) this.start();
    else this.stop();
    return this.on;
  }

  private start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.setup(this.ctx);
    }
    void (this.ctx as AudioContext).resume();
    if (!this.timer) this.timer = window.setInterval(() => this.tick(), 50);
    if (this.playing?.mood !== this.wanted) this.play(this.wanted);
  }

  private stop() {
    if (!this.ctx || !this.playing) return;
    this.fadeOut(this.playing.bus);
    this.playing = null;
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  /** 미리 듣기·검증용: 곡 앞부분을 오프라인으로 렌더링한다 */
  static async render(mood: Mood, seconds: number, rate = 22050): Promise<AudioBuffer> {
    const m = new Music();
    const ctx = new OfflineAudioContext(1, Math.ceil(rate * seconds), rate);
    m.ctx = ctx;
    m.setup(ctx);
    m.play(mood);
    const p = m.playing!;
    while (p.next < seconds) {
      m.playStep(p, p.score[p.step], p.next);
      p.step = (p.step + 1) % p.score.length;
      p.next += p.stepDur;
    }
    return ctx.startRendering();
  }

  private setup(ctx: BaseAudioContext) {
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    // 살짝 울리는 공간감 (피드백 딜레이)
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.33;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    this.master.connect(ctx.destination);
    this.master.connect(delay);
    delay.connect(tone).connect(fb).connect(delay);
    tone.connect(wet).connect(ctx.destination);
    // 부드러운 사각파: 홀수 배음을 줄여 귀가 덜 아프게
    const real = new Float32Array(8), imag = new Float32Array(8);
    imag[1] = 1; imag[3] = 0.28; imag[5] = 0.1; imag[7] = 0.04;
    this.softWave = ctx.createPeriodicWave(real, imag);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  private play(mood: Mood) {
    const ctx = this.ctx!;
    if (this.playing) this.fadeOut(this.playing.bus);
    const t = TRACKS[mood];
    let score = this.scores.get(mood);
    if (!score) this.scores.set(mood, (score = compose(t)));
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
    bus.connect(this.master!);
    this.playing = { mood, score, step: 0, next: ctx.currentTime + 0.1, stepDur: 60 / t.bpm / 2, bus, wave: t.lead };
  }

  private fadeOut(bus: GainNode) {
    const now = this.ctx!.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + FADE);
    window.setTimeout(() => bus.disconnect(), (FADE + LOOKAHEAD + 4) * 1000);
  }

  private tick() {
    const p = this.playing, ctx = this.ctx;
    if (!p || !ctx) return;
    while (p.next < ctx.currentTime + LOOKAHEAD) {
      this.playStep(p, p.score[p.step], p.next);
      p.step = (p.step + 1) % p.score.length;
      p.next += p.stepDur;
    }
  }

  private playStep(p: Playing, st: Step, t: number) {
    const d = p.stepDur;
    // 마디 첫 박을 아주 조금 세게
    const accent = p.step % STEPS_PER_BAR === 0 ? 1.15 : 1;
    if (st.lead) this.tone(p.bus, p.wave, st.lead[0], t, st.lead[1] * d * 0.92, 0.075 * accent, 2600);
    if (st.bass) this.tone(p.bus, 'triangle', st.bass[0], t, st.bass[1] * d * 0.9, 0.11, 900);
    if (st.arp) for (const [m, len] of st.arp) this.tone(p.bus, len >= 4 ? 'sine' : 'triangle', m, t, len * d * 0.85, len >= 4 ? 0.028 : 0.032, 1800);
    for (const k of st.drum ?? []) this.drum(p.bus, k, t);
  }

  private tone(dest: AudioNode, wave: Wave, midi: number, t: number, dur: number, vol: number, cutoff: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    if (wave === 'soft') o.setPeriodicWave(this.softWave!);
    else o.type = wave === 'bell' ? 'sine' : wave;
    o.frequency.value = freq(midi);
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const atk = wave === 'bell' ? 0.005 : 0.015;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    if (wave === 'bell') g.gain.setTargetAtTime(0, t + atk, 0.35);
    else {
      g.gain.setTargetAtTime(vol * 0.7, t + atk, dur * 0.4);
      g.gain.setTargetAtTime(0, t + dur, 0.05);
    }
    o.connect(f).connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + (wave === 'bell' ? 1.5 : 0.4));
    if (wave === 'bell') {
      // 종소리: 2배 배음을 살짝 얹는다
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq(midi) * 2.01;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(vol * 0.3, t);
      g2.gain.setTargetAtTime(0, t, 0.15);
      o2.connect(g2).connect(dest);
      o2.start(t);
      o2.stop(t + 1);
    }
  }

  private drum(dest: AudioNode, k: 'k' | 's' | 'h', t: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.connect(dest);
    if (k === 'k') {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.2);
      return;
    }
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = k === 'h' ? 'highpass' : 'bandpass';
    f.frequency.value = k === 'h' ? 7000 : 1800;
    const len = k === 'h' ? 0.03 : 0.09;
    g.gain.setValueAtTime(k === 'h' ? 0.025 : 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.connect(f).connect(g);
    n.start(t);
    n.stop(t + len + 0.02);
  }
}
