import type { LifeState, MetaSave } from './types';
import { DEFAULT_UNLOCKED, SHOP, itemCost } from './data/shop';
import { computeStones, sumStones, type StoneLine } from './engine/score';
import { jobTitle } from './data/jobs';

const META_KEY = 'igpw-meta-v1';
const RUN_KEY = 'igpw-run-v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 불가 환경(시크릿 모드 등)에서는 조용히 무시
  }
}

export function freshMeta(): MetaSave {
  return { version: 1, soulStones: 0, unlocked: [...DEFAULT_UNLOCKED], upgrades: {}, codex: {}, lives: [], totalLives: 0 };
}

export function loadMeta(): MetaSave {
  const m = read<MetaSave>(META_KEY);
  if (!m || m.version !== 1) return freshMeta();
  for (const id of DEFAULT_UNLOCKED) if (!m.unlocked.includes(id)) m.unlocked.push(id);
  return m;
}

export const saveMeta = (m: MetaSave) => write(META_KEY, m);
export const loadRun = () => read<LifeState>(RUN_KEY);
export const saveRun = (s: LifeState | null) => write(RUN_KEY, s);

export const isUnlocked = (m: MetaSave, id: string) => m.unlocked.includes(id);

export function buy(m: MetaSave, itemId: string): boolean {
  const item = SHOP.find((i) => i.id === itemId);
  if (!item) return false;
  if (item.kind === 'upgrade') {
    const lv = m.upgrades[item.id] ?? 0;
    if (lv >= (item.maxLevel ?? 1)) return false;
    const cost = itemCost(item, lv);
    if (m.soulStones < cost) return false;
    m.soulStones -= cost;
    m.upgrades[item.id] = lv + 1;
  } else {
    if (isUnlocked(m, item.id)) return false;
    const cost = itemCost(item, 0);
    if (m.soulStones < cost) return false;
    m.soulStones -= cost;
    m.unlocked.push(item.id);
  }
  saveMeta(m);
  return true;
}

/** 죽은 삶을 정산하고 기록한다 */
export function settleLife(m: MetaSave, s: LifeState): { lines: StoneLine[]; total: number; firstDeath: boolean } {
  const causeId = s.death!.causeId;
  const lines = computeStones(s, m);
  const total = sumStones(lines);
  const firstDeath = !m.codex[causeId];
  m.codex[causeId] = (m.codex[causeId] ?? 0) + 1;
  m.soulStones += total;
  m.totalLives++;
  m.lives.unshift({
    name: s.name,
    age: s.age,
    houseId: s.houseId,
    title: s.jobId ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '어린 영혼' : '무직',
    causeId,
    stones: total,
  });
  m.lives = m.lives.slice(0, 30);
  saveMeta(m);
  saveRun(null);
  return { lines, total, firstDeath };
}
