import type { LifeState } from '../types';

/**
 * 인생 트리. 모든 생이 공유하는 공통 줄기(인생)에서 직업과 선택에 따라 가지가 뻗고,
 * 가지 안에서 다시 세부 가지가 갈라진다. 사건은 자기 가지(branch)에 있을 때만 일어난다.
 */
export interface BranchNode {
  id: string;
  name: string;
  parent: string | null;
  test: (s: LifeState) => boolean;
}

const job = (...ids: string[]) => (s: LifeState) => ids.includes(s.jobId ?? '');

export const BRANCHES: BranchNode[] = [
  { id: 'life', name: '인생', parent: null, test: () => true },

  { id: 'adventurer', name: '모험가', parent: 'life', test: job('adventurer') },
  { id: 'delver', name: '던전 공략자', parent: 'adventurer', test: (s) => (s.dgBest ?? 0) >= 30 },

  { id: 'farmer', name: '농부', parent: 'life', test: job('farmer') },
  { id: 'landlord', name: '지주', parent: 'farmer', test: (s) => (s.owned ?? []).includes('land') },

  { id: 'merchant', name: '상인', parent: 'life', test: job('merchant') },
  { id: 'trade_house', name: '대상회', parent: 'merchant', test: (s) => s.jobRank >= 3 },
  { id: 'bankrupt', name: '파산 직전', parent: 'merchant', test: (s) => (s.gold ?? 0) < -300 },

  { id: 'court', name: '궁정', parent: 'life', test: job('knight', 'mage', 'court') },
  { id: 'peerage', name: '작위 귀족', parent: 'court', test: (s) => s.flags.includes('noble_title') || (s.jobId === 'court' && s.jobRank >= 4) },

  { id: 'thief', name: '도둑', parent: 'life', test: job('thief') },
  { id: 'thieves_guild', name: '도적 길드', parent: 'thief', test: (s) => s.jobRank >= 3 },
  { id: 'phantom', name: '전설의 괴도', parent: 'thieves_guild', test: (s) => s.jobRank >= 5 },
  { id: 'prisoner', name: '수감자', parent: 'thief', test: (s) => s.flags.includes('jailed') },

  { id: 'faith', name: '신앙', parent: 'life', test: job('priest') },
  { id: 'demon', name: '마왕군', parent: 'life', test: job('demon_officer') },
  { id: 'hero', name: '용사', parent: 'life', test: job('hero') },

  // 직업과 무관한 가지
  { id: 'debtor', name: '빚쟁이', parent: 'life', test: (s) => (s.gold ?? 0) < -500 },
  { id: 'rich', name: '부호', parent: 'life', test: (s) => (s.gold ?? 0) >= 20000 },
];

const BY_ID = new Map(BRANCHES.map((b) => [b.id, b]));
export const branchById = (id: string) => BY_ID.get(id);

/** 이 가지에 있는가 (조상 가지도 모두 만족해야 한다) */
export function inBranch(s: LifeState, id: string): boolean {
  for (let b = branchById(id); b; b = b.parent ? branchById(b.parent) : undefined) {
    if (!b.test(s)) return false;
  }
  return true;
}

/** 지금 서 있는 가지들 (가장 깊은 가지까지의 경로들) — 예: 인생 › 상인 › 대상회 */
export function branchPaths(s: LifeState): string[][] {
  const active = BRANCHES.filter((b) => b.id !== 'life' && inBranch(s, b.id));
  // 자식이 활성화된 가지는 경로의 중간이므로 끝점에서 뺀다
  const leaves = active.filter((b) => !active.some((c) => c.parent === b.id));
  return leaves.map((leaf) => {
    const path: string[] = [];
    for (let b: BranchNode | undefined = leaf; b && b.id !== 'life'; b = b.parent ? branchById(b.parent) : undefined) path.unshift(b.name);
    return path;
  });
}
