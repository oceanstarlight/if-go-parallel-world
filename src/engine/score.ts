import type { LifeState, MetaSave } from '../types';

export interface StoneLine {
  label: string;
  value: number;
}

export function computeStones(s: LifeState, meta: MetaSave): StoneLine[] {
  const lines: StoneLine[] = [
    { label: `세월 (${s.age}년)`, value: Math.floor(s.age / 4) },
    { label: `명성 (${s.stats.fame})`, value: Math.floor(s.stats.fame / 4) },
  ];
  if (s.jobId) {
    lines.push({ label: `직위 (${s.jobRank}단계)`, value: s.jobRank * 6 + (s.jobRank >= 5 ? 10 : 0) });
  }
  const causeId = s.death?.causeId ?? 'old_age';
  const first = !meta.codex[causeId];
  lines.push({ label: first ? '처음 겪은 죽음' : '이미 겪은 죽음', value: first ? 15 : 3 });
  if (Math.abs(s.karma) >= 60) lines.push({ label: s.karma > 0 ? '성인의 업보' : '악인의 업보', value: 5 });
  return lines;
}

export const sumStones = (lines: StoneLine[]) => lines.reduce((a, l) => a + l.value, 0);
