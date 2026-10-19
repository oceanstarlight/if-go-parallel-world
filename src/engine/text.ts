import type { LifeState, Relation, RelKey, Text } from '../types';
import { houseById } from '../data/houses';
import { jobTitle } from '../data/jobs';

/** [받침 있을 때, 없을 때] */
const JOSA: Record<string, [string, string]> = {
  이: ['이', '가'], 가: ['이', '가'],
  은: ['은', '는'], 는: ['은', '는'],
  을: ['을', '를'], 를: ['을', '를'],
  과: ['과', '와'], 와: ['과', '와'],
  아: ['아', '야'], 야: ['아', '야'],
  으로: ['으로', '로'], 로: ['으로', '로'],
  의: ['의', '의'],
  이었다: ['이었다', '였다'], 였다: ['이었다', '였다'],
};

function batchim(word: string): number | null {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28;
}

export function josa(word: string, form: string): string {
  const pair = JOSA[form];
  if (!pair) return word + form;
  const b = batchim(word);
  const has = form === '으로' || form === '로' ? b !== null && b !== 0 && b !== 8 : !!b;
  return word + (has ? pair[0] : pair[1]);
}

/**
 * {name}, {friend:이} 처럼 치환한다. 조사는 받침에 맞게 바뀐다.
 * extraRels: 효과로 사라진 인연의 이름도 쓸 수 있도록 이전 상태를 넘긴다.
 */
export function fill(text: Text, s: LifeState, extraRels?: LifeState['rels']): string {
  const raw = typeof text === 'function' ? text(s) : text;
  const rels: Partial<Record<RelKey, Relation>> = { ...extraRels, ...s.rels };
  return raw.replace(/\{(\w+)(?::([가-힣]+))?\}/g, (m, key: string, form?: string) => {
    let word: string | undefined;
    if (key === 'name') word = s.name;
    else if (key === 'house') word = houseById(s.houseId).name;
    else if (key === 'title') word = jobTitle(s.jobId, s.jobRank);
    else word = rels[key as RelKey]?.name;
    if (word === undefined) return m;
    return form ? josa(word, form) : word;
  });
}
