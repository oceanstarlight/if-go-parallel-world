import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── 가짜 환경: localStorage · 브라우저 · Firestore ──
const store = new Map<string, string>();
const docs = new Map<string, Record<string, unknown>>();
let authCb: ((u: unknown) => void) | null = null;
const reload = vi.fn();

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  onAuthStateChanged: (_a: unknown, cb: (u: unknown) => void) => { authCb = cb; },
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, c: string, id: string) => `${c}/${id}`,
  serverTimestamp: () => 0,
  getDoc: async (ref: string) => ({ exists: () => docs.has(ref), data: () => docs.get(ref) }),
  runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      get: async (ref: string) => ({ exists: () => docs.has(ref), data: () => docs.get(ref) }),
      set: (ref: string, data: Record<string, unknown>) => docs.set(ref, data),
    }),
}));

const meta = (lives: number, stones = lives * 10) => JSON.stringify({ version: 1, soulStones: stones, unlocked: [], upgrades: {}, codex: {}, lives: [], totalLives: lives });
const run = JSON.stringify({ name: '아르', age: 20 });

async function boot() {
  vi.resetModules();
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'k');
  vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'd');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'p');
  vi.stubEnv('VITE_FIREBASE_APP_ID', 'a');
  const cloud = await import('../src/cloud');
  const metaMod = await import('../src/meta');
  const hooks = { onUser: vi.fn(), onSync: vi.fn(), onConflict: vi.fn(async () => 'local' as 'local' | 'cloud') };
  cloud.startCloud(hooks);
  cloud.connectAuth();
  await vi.waitFor(() => expect(authCb).toBeTruthy());
  const login = async () => {
    authCb!({ uid: 'u1', displayName: '용사' });
    await vi.waitFor(() => {
      const settled = hooks.onSync.mock.calls.some(([st]) => st === 'saved' || st === 'error');
      expect(settled || reload.mock.calls.length > 0).toBe(true);
    });
  };
  return { hooks, login, metaMod };
}

beforeEach(() => {
  store.clear();
  docs.clear();
  authCb = null;
  reload.mockClear();
  vi.useRealTimers();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', { addEventListener: () => {} });
  vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible' });
  vi.stubGlobal('location', { reload });
});

const cloudDoc = () => docs.get('users/u1') as { rev: number; meta: string; run: string | null };

describe('클라우드 동기화', () => {
  it('계정이 비어 있으면 이 기기 기록을 올린다', async () => {
    store.set('igpw-meta-v1', meta(3));
    const { login } = await boot();
    await login();
    expect(cloudDoc().rev).toBe(1);
    expect(cloudDoc().meta).toBe(meta(3));
    expect(JSON.parse(store.get('igpw-sync-v1')!)).toEqual({ uid: 'u1', rev: 1, dirty: false });
  });

  it('새 기기(빈 기록)에서 로그인하면 계정 기록을 내려받는다', async () => {
    docs.set('users/u1', { rev: 4, meta: meta(7), run });
    const { login, hooks } = await boot();
    await login();
    expect(store.get('igpw-meta-v1')).toBe(meta(7));
    expect(store.get('igpw-run-v1')).toBe(run);
    expect(reload).toHaveBeenCalled();
    expect(hooks.onConflict).not.toHaveBeenCalled();
  });

  it('양쪽 기록이 다르면 물어보고, 이 기기를 고르면 계정을 덮어쓴다', async () => {
    store.set('igpw-meta-v1', meta(2));
    docs.set('users/u1', { rev: 4, meta: meta(7), run: null });
    const { login, hooks } = await boot();
    await login();
    expect(hooks.onConflict).toHaveBeenCalledOnce();
    expect(cloudDoc().rev).toBe(5);
    expect(cloudDoc().meta).toBe(meta(2));
    expect(reload).not.toHaveBeenCalled();
  });

  it('계정 기록을 고르면 이 기기를 덮어쓴다', async () => {
    store.set('igpw-meta-v1', meta(2));
    docs.set('users/u1', { rev: 4, meta: meta(7), run: null });
    const { login, hooks } = await boot();
    hooks.onConflict.mockResolvedValue('cloud');
    await login();
    expect(store.get('igpw-meta-v1')).toBe(meta(7));
    expect(cloudDoc().rev).toBe(4);
    expect(reload).toHaveBeenCalled();
  });

  it('두 쪽이 같으면 묻지 않는다', async () => {
    store.set('igpw-meta-v1', meta(2));
    docs.set('users/u1', { rev: 2, meta: meta(2), run: null });
    const { login, hooks } = await boot();
    await login();
    expect(hooks.onConflict).not.toHaveBeenCalled();
    expect(JSON.parse(store.get('igpw-sync-v1')!).rev).toBe(2);
  });

  it('저장하면 잠시 뒤 올라가고 rev 가 오른다', async () => {
    store.set('igpw-meta-v1', meta(1));
    const { login, metaMod } = await boot();
    await login();
    vi.useFakeTimers();
    metaMod.saveMeta({ ...JSON.parse(meta(1)), totalLives: 2, soulStones: 20 });
    expect(JSON.parse(store.get('igpw-sync-v1')!).dirty).toBe(true);
    await vi.advanceTimersByTimeAsync(3100);
    expect(cloudDoc().rev).toBe(2);
    expect(JSON.parse(cloudDoc().meta).totalLives).toBe(2);
    expect(JSON.parse(store.get('igpw-sync-v1')!)).toEqual({ uid: 'u1', rev: 2, dirty: false });
  });

  it('다른 기기가 더 진행했고 이 기기는 그대로면 내려받는다', async () => {
    store.set('igpw-meta-v1', meta(1));
    store.set('igpw-sync-v1', JSON.stringify({ uid: 'u1', rev: 1, dirty: false }));
    docs.set('users/u1', { rev: 3, meta: meta(5), run: null });
    const { login, hooks } = await boot();
    await login();
    expect(hooks.onConflict).not.toHaveBeenCalled();
    expect(store.get('igpw-meta-v1')).toBe(meta(5));
    expect(reload).toHaveBeenCalled();
  });

  it('다른 기기가 올렸는데 이 기기도 바뀌었으면 물어본다', async () => {
    store.set('igpw-meta-v1', meta(2));
    store.set('igpw-sync-v1', JSON.stringify({ uid: 'u1', rev: 1, dirty: true }));
    docs.set('users/u1', { rev: 3, meta: meta(5), run: null });
    const { login, hooks } = await boot();
    await login();
    expect(hooks.onConflict).toHaveBeenCalledOnce();
  });

  it('로그아웃 중 게스트로 한 기록도 같은 계정에 다시 로그인하면 올라간다', async () => {
    store.set('igpw-meta-v1', meta(1));
    store.set('igpw-sync-v1', JSON.stringify({ uid: 'u1', rev: 1, dirty: false }));
    docs.set('users/u1', { rev: 1, meta: meta(1), run: null });
    const { login, metaMod } = await boot();
    metaMod.saveMeta({ ...JSON.parse(meta(1)), totalLives: 4, soulStones: 40 }); // 로그인 전(게스트) 저장
    await login();
    expect(cloudDoc().rev).toBe(2);
    expect(JSON.parse(cloudDoc().meta).totalLives).toBe(4);
  });
});
