// 로그인(Google · GitHub)과 클라우드 저장 (Firebase Auth + Firestore).
// 설정이 없으면 cloudEnabled 가 false: 로그인 화면은 보이지만 로그인은 안내만 하고, 게임은 localStorage 로만 동작한다.
// firebase SDK 는 필요할 때 불러와서 첫 화면이 무거워지지 않게 한다.
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { describeSave, exportSave, importSave, isBlankSave, setSaveListener, type RawSave } from './meta';

export type Provider = 'google' | 'github';
export type SyncState = 'idle' | 'saving' | 'saved' | 'error';
export interface CloudUser { uid: string; name: string }

export interface CloudHooks {
  onUser(user: CloudUser | null): void;
  onSync(state: SyncState): void;
  /** 이 기기와 계정의 저장이 서로 다를 때, 어느 쪽을 쓸지 고르게 한다 */
  onConflict(local: string, cloud: string): Promise<'local' | 'cloud'>;
}

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
export const cloudEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

// ── 로그인 선택 기억: 첫 방문에만 로그인 화면을 보여 주기 위해 ──
const CHOICE_KEY = 'igpw-auth-v1';
export type Choice = 'guest' | 'user' | null;
export function getChoice(): Choice {
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    return v === 'guest' || v === 'user' ? v : null;
  } catch {
    return null;
  }
}
export function setChoice(c: Choice) {
  try {
    if (c) localStorage.setItem(CHOICE_KEY, c);
    else localStorage.removeItem(CHOICE_KEY);
  } catch {
    // 저장 불가 환경에서는 매번 물어본다
  }
}

// ── 동기화 기록: 마지막으로 맞춘 계정·리비전, 그 뒤로 이 기기에서 바뀐 게 있는지 ──
const SYNC_KEY = 'igpw-sync-v1';
interface SyncRec { uid: string; rev: number; dirty: boolean }
function readSync(): SyncRec | null {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    return raw ? (JSON.parse(raw) as SyncRec) : null;
  } catch {
    return null;
  }
}
function writeSync(rec: SyncRec) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(rec));
  } catch {
    // 무시
  }
}

// ── Firebase (지연 로딩) ──
let sdkPromise: Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> | null = null;
function sdk() {
  sdkPromise ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]);
    const app = initializeApp(config);
    return { app, auth: getAuth(app), db: getFirestore(app) };
  })();
  return sdkPromise;
}

let hooks: CloudHooks | null = null;
let user: User | null = null;
/** 로그인 직후 대조가 끝났나 (끝나기 전에는 올리지 않는다) */
let ready = false;
let busy = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const sameSave = (a: RawSave, b: RawSave) => a.meta === b.meta && a.run === b.run;

async function cloudDoc() {
  const { db } = await sdk();
  const { doc } = await import('firebase/firestore');
  return doc(db, 'users', user!.uid);
}

/** 클라우드에 올린다. 그 사이 다른 기기가 올렸다면(rev 가 다르면) null */
async function writeCloud(save: RawSave, baseRev: number): Promise<number | null> {
  const { db } = await sdk();
  const { runTransaction, serverTimestamp } = await import('firebase/firestore');
  const ref = await cloudDoc();
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() ? Number(snap.data().rev) : 0;
    if (cur !== baseRev) return null;
    tx.set(ref, { v: 1, rev: cur + 1, meta: save.meta, run: save.run, updatedAt: serverTimestamp() });
    return cur + 1;
  });
}

/** 클라우드 저장으로 이 기기를 덮어쓰고 새로 시작한다 */
function pull(remote: RawSave, rev: number) {
  importSave(remote);
  if (!sameSave(exportSave(), remote)) return; // 저장이 막힌 환경: 새로고침 반복을 피한다
  writeSync({ uid: user!.uid, rev, dirty: false });
  location.reload();
}

/** 이 기기의 저장과 계정의 저장을 맞춘다 (로그인·페이지 열기·복구 시) */
async function reconcile(retry = true): Promise<void> {
  if (!user || !hooks || busy) return;
  busy = true;
  const uid = user.uid;
  hooks.onSync('saving');
  try {
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(await cloudDoc());
    const local = exportSave();
    const rec = readSync();
    const same = rec?.uid === uid;
    const done = (rev: number) => {
      writeSync({ uid, rev, dirty: false });
      hooks!.onSync('saved');
    };
    // 클라우드에 아직 아무것도 없다
    if (!snap.exists()) {
      if (isBlankSave(local)) return done(0);
      const rev = await writeCloud(local, 0);
      if (rev === null && retry) {
        busy = false;
        return await reconcile(false);
      }
      return rev === null ? hooks.onSync('error') : done(rev);
    }
    const d = snap.data();
    const rrev = Number(d.rev);
    const remote: RawSave = { meta: d.meta ?? null, run: d.run ?? null };

    if (same && rec.rev === rrev) {
      // 클라우드는 그대로: 이 기기에서 바뀐 게 있으면 올린다
      if (!rec.dirty) return hooks.onSync('saved');
      const rev = await writeCloud(local, rrev);
      return rev === null ? hooks.onSync('error') : done(rev);
    }
    if (same && rec.rev < rrev && !rec.dirty) return pull(remote, rrev); // 다른 기기에서 더 진행했다
    // 같은 기록이면 그냥 이어 붙이고, 한쪽이 비어 있으면 물어보지 않고 채운다
    if (sameSave(local, remote)) return done(rrev);
    if (isBlankSave(local)) return pull(remote, rrev);
    if (isBlankSave(remote)) {
      const rev = await writeCloud(local, rrev);
      return rev === null ? hooks.onSync('error') : done(rev);
    }
    // 양쪽 모두 기록이 있고 서로 다르다: 사용자에게 고르게 한다
    const pick = await hooks.onConflict(describeSave(local), describeSave(remote));
    if (pick === 'cloud') return pull(remote, rrev);
    const rev = await writeCloud(exportSave(), rrev);
    return rev === null ? hooks.onSync('error') : done(rev);
  } catch {
    hooks.onSync('error');
    schedulePush(30000);
  } finally {
    busy = false;
    ready = true;
  }
}

/** 저장이 바뀌었다 */
function onLocalSave() {
  const rec = readSync();
  if (rec && !rec.dirty) writeSync({ ...rec, dirty: true });
  if (user && rec?.uid === user.uid) schedulePush();
}

function schedulePush(delay = 3000) {
  clearTimeout(timer);
  timer = setTimeout(flush, delay);
}

/** 바뀐 저장을 클라우드에 올린다 */
async function flush() {
  clearTimeout(timer);
  const rec = readSync();
  if (!user || !hooks || !ready || !rec || rec.uid !== user.uid || !rec.dirty) return;
  if (busy) return schedulePush();
  busy = true;
  hooks.onSync('saving');
  let delay = 0;
  try {
    const local = exportSave();
    const rev = await writeCloud(local, rec.rev);
    if (rev === null) {
      // 다른 기기가 먼저 올렸다: 처음부터 대조해서 고른다
      busy = false;
      return await reconcile();
    }
    const changed = !sameSave(exportSave(), local); // 올리는 동안 또 바뀌었다
    writeSync({ uid: user.uid, rev, dirty: changed });
    hooks.onSync('saved');
    if (changed) delay = 3000;
  } catch {
    hooks.onSync('error');
    delay = 30000;
  } finally {
    busy = false;
  }
  if (delay) schedulePush(delay);
}

/** 앱이 뜰 때 한 번. 저장 변화와 연결 상태를 지켜볼 준비만 한다 (firebase 는 아직 안 부른다) */
export function startCloud(h: CloudHooks) {
  setSaveListener(onLocalSave);
  if (!cloudEnabled || hooks) return;
  hooks = h;
  window.addEventListener('online', () => void reconcile());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('pagehide', () => void flush());
}

let connected = false;
/** firebase 를 불러와 로그인 상태를 지켜본다 (로그인 화면이 필요하거나 로그인된 사용자일 때만) */
export function connectAuth() {
  if (!cloudEnabled || !hooks || connected) return;
  connected = true;
  const h = hooks;
  void sdk().then(async ({ auth }) => {
    const { onAuthStateChanged } = await import('firebase/auth');
    onAuthStateChanged(auth, (u) => {
      user = u;
      ready = false;
      if (!u) return h.onUser(null);
      h.onUser({ uid: u.uid, name: u.displayName || u.email || '모험가' });
      void reconcile();
    });
  });
}

/** 로그인. 실패하면 보여 줄 문구를, 성공이거나 사용자가 닫았으면 null */
export async function signIn(p: Provider): Promise<string | null> {
  if (!cloudEnabled) return '로그인 기능을 준비 중이에요. 지금은 게스트로 즐겨 주세요.';
  try {
    const { auth } = await sdk();
    const { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } = await import('firebase/auth');
    await signInWithPopup(auth, p === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider());
    setChoice('user');
    return null;
  } catch (e) {
    switch ((e as { code?: string }).code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return null;
      case 'auth/popup-blocked':
        return '팝업이 막혔어요. 팝업을 허용하고 다시 눌러 주세요.';
      case 'auth/account-exists-with-different-credential':
        return '같은 이메일로 다른 방법의 로그인이 이미 있어요. 그 방법으로 로그인해 주세요.';
      case 'auth/unauthorized-domain':
        return '이 주소는 로그인이 허용되지 않았어요. (Firebase 승인된 도메인 확인)';
      default:
        return '로그인에 실패했어요. 잠시 뒤에 다시 시도해 주세요.';
    }
  }
}

export async function signOut() {
  await flush();
  const { auth } = await sdk();
  const { signOut: out } = await import('firebase/auth');
  await out(auth);
}
