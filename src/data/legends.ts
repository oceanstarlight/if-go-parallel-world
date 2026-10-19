import type { Legend, LifeState } from '../types';
import { jobTitle } from './jobs';

/**
 * 한 생이 전설로 남을 만한가 (Wildermyth 의 레거시 영웅).
 * 남는다면 다음 생들에서 동상, 노래, 위인전, 유령으로 다시 만난다.
 */
export function legendOf(s: LifeState): Legend | null {
  const has = (f: string) => s.flags.includes(f);
  const base = { name: s.name, houseId: s.houseId, age: s.age, lifeNo: s.lifeNo ?? 1 };
  if (has('slew_demon_lord') || has('peace')) return { ...base, kind: 'hero', deed: '마왕을 쓰러뜨린' };
  if (has('dragonslayer')) return { ...base, kind: 'hero', deed: '드래곤을 쓰러뜨린' };
  if (s.death?.causeId === 'sacrifice') return { ...base, kind: 'hero', deed: '소중한 이를 지키고 떠난' };
  if (s.karma <= -60) return { ...base, kind: 'villain', deed: '악명을 떨친' };
  if (s.jobId && s.jobRank >= 5) return { ...base, kind: 'hero', deed: `${jobTitle(s.jobId, s.jobRank)}에 오른` };
  if (s.stats.int >= 80 || has('top_student')) return { ...base, kind: 'sage', deed: '대현자라 불린' };
  if (s.karma >= 60) return { ...base, kind: 'sage', deed: '성자로 불린' };
  if (s.stats.fame >= 60) return { ...base, kind: 'hero', deed: '이름을 떨친' };
  if (s.age <= 12) return { ...base, kind: 'ghost', deed: '어린 나이에 떠난' };
  return null;
}
