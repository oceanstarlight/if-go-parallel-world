import type { LifeState, MetaSave } from '../types';
import { ALL_GOALS_BONUS, goalById } from '../data/goals';

export interface StoneLine {
  label: string;
  value: number;
}

export function computeStones(s: LifeState, meta: MetaSave): StoneLine[] {
  const lines: StoneLine[] = [
    { label: `세월 (${s.age}년)`, value: Math.floor(s.age / 4) },
    { label: `명성 (${s.stats.fame})`, value: Math.floor(s.stats.fame / 11) },
  ];
  if (s.jobId) {
    lines.push({ label: `직위 (${s.jobRank}단계)`, value: s.jobRank * 6 + (s.jobRank >= 5 ? 10 : 0) });
  }
  const causeId = s.death?.causeId ?? 'old_age';
  const first = !meta.codex[causeId];
  lines.push({ label: first ? '처음 겪은 죽음' : '이미 겪은 죽음', value: first ? 15 : 3 });
  if (Math.abs(s.karma) >= 60) lines.push({ label: s.karma > 0 ? '성인의 업보' : '악인의 업보', value: 5 });
  const goals = (s.goals ?? []).map(goalById).filter((g) => !!g);
  let doneN = 0;
  for (const g of goals) {
    if (!g.done(s)) continue;
    doneN++;
    lines.push({ label: `목표 달성: ${g.name}`, value: g.reward });
  }
  if (goals.length > 0 && doneN === goals.length) lines.push({ label: '이번 생의 목표 올클리어!', value: ALL_GOALS_BONUS });
  if (s.fated) {
    const base = lines.reduce((a, l) => a + l.value, 0);
    lines.push({ label: '운명에 맡긴 보너스 (+20%)', value: Math.ceil(base * 0.2) });
  }
  return lines;
}

export const sumStones = (lines: StoneLine[]) => lines.reduce((a, l) => a + l.value, 0);

export function goalsDone(s: LifeState): number {
  return (s.goals ?? []).map(goalById).filter((g) => g && g.done(s)).length;
}
