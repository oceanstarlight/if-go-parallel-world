import type { LifeState, MetaSave } from './types';
import { DEFAULT_UNLOCKED, SHOP, itemCost } from './data/shop';
import { computeStones, goalsDone, sumStones, type StoneLine } from './engine/score';
import { contemporaries } from './engine/sim';
import { hashStr } from './gfx/painter';
import { jobTitle } from './data/jobs';
import { legendOf } from './data/legends';
import { goddessLines } from './data/goddess';

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

let onSave: (() => void) | null = null;
/** 저장될 때마다 알려 준다 (클라우드 동기화용) */
export const setSaveListener = (fn: () => void) => { onSave = fn; };

function writeRaw(key: string, raw: string | null) {
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
  } catch {
    // 저장 불가 환경(시크릿 모드 등)에서는 조용히 무시
  }
}

function write(key: string, value: unknown) {
  writeRaw(key, value === null ? null : JSON.stringify(value));
  onSave?.();
}

/** 클라우드와 주고받는 원본 저장 (JSON 문자열 그대로) */
export interface RawSave { meta: string | null; run: string | null }

export function exportSave(): RawSave {
  try {
    return { meta: localStorage.getItem(META_KEY), run: localStorage.getItem(RUN_KEY) };
  } catch {
    return { meta: null, run: null };
  }
}

/** 클라우드에서 받은 저장으로 덮어쓴다 (저장 알림은 내지 않는다) */
export function importSave(save: RawSave) {
  writeRaw(META_KEY, save.meta);
  writeRaw(RUN_KEY, save.run);
}

/** 아직 아무것도 하지 않은 저장인가 */
export function isBlankSave(save: RawSave): boolean {
  if (save.run) return false;
  if (!save.meta) return true;
  try {
    const m = JSON.parse(save.meta) as MetaSave;
    return m.totalLives === 0 && m.soulStones === 0 && Object.keys(m.upgrades ?? {}).length === 0;
  } catch {
    return true;
  }
}

/** 저장을 한 줄로 요약 (충돌 선택창에 보여 준다) */
export function describeSave(save: RawSave): string {
  if (isBlankSave(save)) return '기록 없음';
  const parts: string[] = [];
  try {
    const m = save.meta ? (JSON.parse(save.meta) as MetaSave) : null;
    if (m) parts.push(`${m.totalLives}번 환생`, `환생석 ${m.soulStones}`);
    const r = save.run ? (JSON.parse(save.run) as LifeState) : null;
    if (r) parts.push(`${r.name} ${r.age}세 진행 중`);
  } catch {
    // 깨진 저장은 그냥 요약만 줄인다
  }
  return parts.join(' · ') || '기록 있음';
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
export function loadRun(): LifeState | null {
  const s = read<LifeState>(RUN_KEY);
  // v1.4 전 저장: 능력치 100 기준 → 200 기준으로 옮긴다
  if (s && !s.statScale) {
    for (const k of Object.keys(s.stats) as (keyof LifeState['stats'])[]) s.stats[k] = Math.min(200, s.stats[k] * 2);
    for (const it of [...(s.bag ?? []), ...(s.equip?.trinkets ?? [])]) {
      if (it.stats) for (const k of Object.keys(it.stats) as (keyof LifeState['stats'])[]) it.stats[k] = (it.stats[k] ?? 0) * 2;
    }
    s.statScale = 2;
  }
  return s;
}
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
export interface SettleResult {
  lines: StoneLine[];
  total: number;
  firstDeath: boolean;
  peers: LifeState[];
  /** 환생의 여신의 한마디 */
  goddess: string[];
  /** 이번 생이 전설로 남았다면 그 업적 */
  deed?: string;
}

export function settleLife(m: MetaSave, s: LifeState): SettleResult {
  const causeId = s.death!.causeId;
  const prevCause = m.lives[0]?.causeId;
  const lines = computeStones(s, m);
  const total = sumStones(lines);
  const firstDeath = !m.codex[causeId];
  m.codex[causeId] = (m.codex[causeId] ?? 0) + 1;
  m.npcMet = m.npcMet ?? {};
  for (const id of s.npcMet ?? []) m.npcMet[id] = (m.npcMet[id] ?? 0) + 1;
  m.soulStones += total;
  m.totalLives++;
  const legend = legendOf(s);
  m.lives.unshift({
    name: s.name,
    age: s.age,
    houseId: s.houseId,
    title: s.jobId ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '어린 영혼' : '자유로운 영혼',
    causeId,
    stones: total,
    goalsDone: goalsDone(s),
    deed: legend?.deed,
  });
  if (legend) m.legends = [legend, ...(m.legends ?? [])].slice(0, 10);
  m.lives = m.lives.slice(0, 30);
  saveMeta(m);
  saveRun(null);
  // 같은 해에 환생한 네 사람 (이름과 나이로 시드를 고정해 새로고침해도 같다)
  const peers = contemporaries(hashStr(`${s.name}|${s.houseId}|${s.age}|${m.totalLives}`), s.name);
  const goddess = goddessLines(s, { lifeNo: s.lifeNo ?? m.totalLives, prevCause, causeCount: m.codex[causeId] });
  return { lines, total, firstDeath, peers, goddess, deed: legend?.deed };
}
