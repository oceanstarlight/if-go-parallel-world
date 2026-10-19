/**
 * 배경 음악 작곡기. 소리를 내지 않는 순수 함수라 테스트할 수 있다.
 * 한 곡 = 8마디 프레이즈 3개 (선율 → 변주 → 반주만 쉬어 가는 간주), 4/4 박자, 8분음표 단위.
 */
import { seeded } from '../gfx/painter';

export type Mood = 'title' | 'life' | 'town' | 'dungeon' | 'altar' | 'requiem';
export type Wave = 'soft' | 'triangle' | 'sine' | 'bell';

export interface Track {
  bpm: number;
  /** 으뜸음 MIDI 번호 (선율은 한 옥타브 위에서 논다) */
  root: number;
  scale: number[];
  /** 마디별 화음 (음계 도수, 0부터) */
  prog: number[];
  lead: Wave;
  /** 선율 리듬 밀도 0~1 */
  density: number;
  bass: 'root' | 'walk' | 'bounce' | 'drone';
  arp: 'up' | 'broken' | 'pad' | 'stab';
  drums: 0 | 1 | 2;
  seed: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];

export const TRACKS: Record<Mood, Track> = {
  title: { bpm: 84, root: 60, scale: MAJOR, prog: [0, 5, 3, 4, 0, 5, 3, 4], lead: 'soft', density: 0.5, bass: 'root', arp: 'broken', drums: 0, seed: 11 },
  life: { bpm: 100, root: 62, scale: MAJOR, prog: [0, 3, 4, 0, 5, 3, 4, 4], lead: 'soft', density: 0.65, bass: 'walk', arp: 'up', drums: 1, seed: 23 },
  town: { bpm: 116, root: 65, scale: MAJOR, prog: [0, 3, 0, 4, 0, 3, 4, 0], lead: 'triangle', density: 0.75, bass: 'bounce', arp: 'stab', drums: 2, seed: 37 },
  dungeon: { bpm: 72, root: 57, scale: MINOR, prog: [0, 0, 5, 6, 0, 0, 3, 4], lead: 'triangle', density: 0.3, bass: 'drone', arp: 'broken', drums: 0, seed: 41 },
  altar: { bpm: 70, root: 60, scale: LYDIAN, prog: [0, 1, 0, 1, 3, 4, 0, 0], lead: 'bell', density: 0.35, bass: 'drone', arp: 'pad', drums: 0, seed: 53 },
  requiem: { bpm: 64, root: 62, scale: MINOR, prog: [0, 5, 3, 4, 0, 5, 6, 0], lead: 'sine', density: 0.35, bass: 'root', arp: 'pad', drums: 0, seed: 67 },
};

/** 음 하나: MIDI 번호와 길이(8분음표 칸 수) */
export type Note = [midi: number, len: number];

export interface Step {
  lead?: Note;
  bass?: Note;
  arp?: Note[];
  drum?: ('k' | 's' | 'h')[];
}

export const STEPS_PER_BAR = 8;

/** 음계 도수 → MIDI (도수는 음수·7 이상도 된다) */
export function degToMidi(t: Track, deg: number): number {
  const oct = Math.floor(deg / 7);
  return t.root + oct * 12 + t.scale[((deg % 7) + 7) % 7];
}

/** 한 마디 리듬 (1 = 음 시작). 앞쪽일수록 듬성듬성하다 */
const RHYTHMS = [
  [1, 0, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 0, 1, 0],
  [1, 1, 1, 0, 1, 0, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0],
];

function melody(t: Track, rnd: () => number, variant: boolean): (Note | undefined)[] {
  const pickRhythm = () => {
    const span = Math.max(2, Math.round(RHYTHMS.length * t.density));
    const lo = Math.max(0, Math.round((RHYTHMS.length - span) * t.density));
    return RHYTHMS[lo + Math.floor(rnd() * span)];
  };
  const a1 = pickRhythm(), a2 = pickRhythm(), b1 = pickRhythm(), b2 = pickRhythm();
  const bars = [a1, a2, a1, a2, b1, b2, a1, [1, 0, 0, 0, 0, 0, 0, 0]];
  // 반복되는 마디는 같은 '움직임'을 쓴다 → 동기가 들린다
  const moves: number[][] = [];
  const move = (bar: number, i: number) => {
    const key = bar === 2 || bar === 6 ? 0 : bar === 3 ? 1 : bar;
    moves[key] ??= [];
    moves[key][i] ??= [1, -1, 1, -1, 2, -2, 0, 1][Math.floor(rnd() * 8)];
    return moves[key][i];
  };
  const out: (Note | undefined)[] = new Array(8 * STEPS_PER_BAR).fill(undefined);
  let deg = 9 + (variant ? 2 : 0);
  bars.forEach((rh, bar) => {
    const chord = t.prog[bar];
    let k = 0;
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      if (!rh[s]) continue;
      if (bar === 7) {
        // 마침: 가까운 으뜸음으로 길게
        deg = Math.round(deg / 7) * 7;
      } else if (s % 4 === 0) {
        // 센박: 화음 구성음 중 가장 가까운 음
        const tones = [-7, 0, 7, 14].flatMap((o) => [chord, chord + 2, chord + 4].map((d) => d + o));
        tones.sort((x, y) => Math.abs(x - deg) - Math.abs(y - deg));
        deg = tones[rnd() < 0.7 ? 0 : 1];
      } else {
        deg += move(bar, k++);
      }
      deg = Math.max(5, Math.min(14, deg));
      let len = 1;
      while (s + len < STEPS_PER_BAR && !rh[s + len] && len < 4) len++;
      if (bar === 7) len = STEPS_PER_BAR;
      out[bar * STEPS_PER_BAR + s] = [degToMidi(t, deg), len];
    }
  });
  return out;
}

function accompaniment(t: Track, bar: number, interlude: boolean): Step[] {
  const c = t.prog[bar % t.prog.length];
  const steps: Step[] = Array.from({ length: STEPS_PER_BAR }, () => ({}));
  const low = (d: number) => degToMidi(t, d) - 24;
  const mid = (d: number) => degToMidi(t, d) - 12;
  // 베이스
  if (t.bass === 'drone') steps[0].bass = [low(c), 8];
  else if (t.bass === 'root') { steps[0].bass = [low(c), 4]; steps[4].bass = [low(c), 4]; }
  else if (t.bass === 'walk') [c, c + 4, c + 7, c + 4].forEach((d, i) => (steps[i * 2].bass = [low(d), 2]));
  else [c, c + 4, c, c + 4].forEach((d, i) => (steps[i * 2].bass = [low(d), 1]));
  // 화음
  const triad = [c, c + 2, c + 4];
  if (t.arp === 'pad') steps[0].arp = triad.map((d) => [mid(d), 8] as Note);
  else if (t.arp === 'stab') [1, 3, 5, 7].forEach((s) => (steps[s].arp = triad.map((d) => [mid(d), 1] as Note)));
  else {
    const order = t.arp === 'up' ? [0, 1, 2, 3, 2, 1, 0, 1] : [0, 2, 1, 2, 0, 2, 1, 2];
    const tones = [...triad, c + 7];
    order.forEach((i, s) => (steps[s].arp = [[mid(tones[i]) + (interlude ? 12 : 0), 1]]));
  }
  // 타악기
  if (t.drums === 1) {
    steps[0].drum = ['k'];
    steps[2].drum = ['h'];
    steps[6].drum = ['h'];
  } else if (t.drums === 2) {
    for (let s = 0; s < STEPS_PER_BAR; s++) steps[s].drum = s % 2 ? ['h'] : [];
    steps[0].drum!.push('k');
    steps[3].drum!.push('k');
    steps[4].drum!.push('s');
  }
  return steps;
}

/** 곡 전체 (반복 재생용): 24마디 = 192칸 */
export function compose(t: Track): Step[] {
  const rnd = seeded(t.seed * 7919);
  const m1 = melody(t, rnd, false);
  const m2 = melody(t, rnd, true);
  const out: Step[] = [];
  for (let phrase = 0; phrase < 3; phrase++) {
    for (let bar = 0; bar < 8; bar++) {
      const acc = accompaniment(t, bar, phrase === 2);
      acc.forEach((st, s) => {
        const i = bar * STEPS_PER_BAR + s;
        if (phrase === 0) st.lead = m1[i];
        else if (phrase === 1) st.lead = m2[i];
        out.push(st);
      });
    }
  }
  return out;
}

/** 화면 → 음악 분위기 */
export function moodFor(screen: string): Mood {
  switch (screen) {
    case 'life': return 'life';
    case 'town': return 'town';
    case 'dungeon': return 'dungeon';
    case 'death': return 'requiem';
    case 'oracle': case 'altar': case 'codex': case 'lives': return 'altar';
    default: return 'title';
  }
}
