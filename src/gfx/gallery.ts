// 개발용: 모든 도트 그림을 한 화면에 (npm run dev → /gallery.html)
import { drawPortrait, type Stage } from './portrait';
import { type BackHair, type Bangs, type Figure, drawFigure } from './dotportrait';
import { HOUSES } from '../data/houses';
import type { Painter } from './painter';
import { ALL_SCENES, drawScene } from './scenes';
import { enemySprite, playerSprite, type EnemyKind } from './sprites';

const root = document.getElementById('g')!;

function show(title: string, items: { label: string; p: Painter }[], scale: number) {
  const h = document.createElement('h2');
  h.textContent = title;
  const row = document.createElement('div');
  row.className = 'row';
  for (const it of items) {
    const f = document.createElement('figure');
    const cv = it.p.toCanvas();
    cv.style.width = `${it.p.w * scale}px`;
    f.append(cv, it.label);
    row.append(f);
  }
  root.append(h, row);
}

const stages: Stage[] = ['baby', 'child', 'teen', 'adult', 'elder'];
const houses = ['farm', 'merchant', 'noble', 'demon', 'hero'];
const jobs = ['farmer', 'knight', 'mage', 'merchant', 'adventurer', 'priest', 'demon_officer', 'hero'];

// ───── 도트 지도 초상화: 부위별 견본 ─────
const fig = (o: Partial<Figure>): Painter => drawFigure({
  gender: 'f', stage: 'adult', houseId: 'farm', job: null, jobRank: 0, mood: 'neutral', blink: false, dead: false, injured: false, sway: 0,
  hair: ['#f2a46a', '#c46a3a', '#8e4424'], skin: ['#fff1e6', '#ffe2cf', '#f2bfa6'], eye: '#3f9a5c',
  outfit: { base: '#4caf6e', light: '#7ad89a', shadow: '#2e8a50', trim: '#ffe08a' }, bangs: 'center', back: 'long', beard: false, ...o,
});
const BLUE: Partial<Figure> = { hair: ['#8a9ae0', '#3a4078', '#1e2048'], eye: '#3a88ff', outfit: { base: '#3a6ad0', light: '#6a9aff', shadow: '#2a4aa0', trim: '#ffd85a' } };
show('여성 앞머리 5종', (['straight', 'center', 'side', 'messy', 'swoop'] as Bangs[]).map((b) => ({ label: b, p: fig({ bangs: b }) })), 6);
show('여성 뒷머리 5종', (['long', 'bob', 'ponytail', 'twin', 'bun'] as BackHair[]).map((b) => ({ label: b, p: fig({ back: b, bangs: 'side' }) })), 6);
show('남성 앞머리 5종', (['spiky', 'crop', 'side', 'messy', 'center'] as Bangs[]).map((b) => ({ label: b, p: fig({ ...BLUE, gender: 'm', bangs: b, back: 'short' }) })), 6);
show('표정 (여 / 남)', (['neutral', 'happy', 'sad', 'angry', 'afraid'] as const).flatMap((m) => [
  { label: `${m} 여`, p: fig({ mood: m }) }, { label: `${m} 남`, p: fig({ ...BLUE, gender: 'm', bangs: 'spiky', back: 'short', mood: m }) },
]), 4);
const GREY: Figure['hair'] = ['#ffffff', '#dcdcec', '#9a9ab8'];
show('나이 (여 / 남)', stages.flatMap((st) => [
  { label: `${st} 여`, p: fig(st === 'elder' ? { stage: st, hair: GREY, back: 'bun' } : { stage: st }) },
  { label: `${st} 남`, p: fig({ ...BLUE, gender: 'm', bangs: 'side', back: 'short', stage: st, beard: st === 'elder', ...(st === 'elder' ? { hair: GREY } : {}) }) },
]), 4);
show('출신 13종 (게임 초상화)', HOUSES.map((h, i) => ({
  label: h.id, p: drawPortrait({ seed: 40 + i * 7, stage: 'adult', houseId: h.id, jobId: null, jobRank: 0, dead: false, gender: i % 2 ? 'm' : 'f' }),
})), 3);

for (const h of houses) {
  show(`초상화 · ${h}`, stages.map((st, i) => ({
    label: st, p: drawPortrait({ seed: 7 + i * 31 + h.length, stage: st, houseId: h, jobId: null, jobRank: 0, dead: false }),
  })), 3);
}
show('직업 (rank 2 / rank 5)', jobs.flatMap((j, i) => [2, 5].map((r) => ({
  label: `${j} ${r}`, p: drawPortrait({ seed: 100 + i, stage: 'adult', houseId: j === 'demon_officer' ? 'demon' : 'farm', jobId: j, jobRank: r, dead: false }),
}))), 3);
show('표정 (기본 / 기쁨 / 슬픔 / 부상)', (['neutral', 'happy', 'sad', 'injured'] as const).map((m) => ({
  label: m, p: drawPortrait({ seed: 11, stage: 'adult', houseId: 'merchant', jobId: 'adventurer', jobRank: 2, dead: false, mood: m === 'injured' ? 'sad' : m, injured: m === 'injured' }),
})), 3);
show('사망', [{ label: 'dead', p: drawPortrait({ seed: 5, stage: 'adult', houseId: 'noble', jobId: 'knight', jobRank: 3, dead: true }) }], 3);

show('장면 (기본 시간대)', ALL_SCENES.map((k) => ({ label: k, p: drawScene(k).p })), 2);
show('시간대 (마을: 낮/노을/밤)', (['day', 'dusk', 'night'] as const).map((t) => ({ label: t, p: drawScene('village', 1, t).p })), 2);

const enemies: EnemyKind[] = ['bandit', 'soldier', 'rival', 'bully', 'stalker', 'hero', 'demon_lord', 'traitor', 'wolf', 'shadow', 'wyvern', 'dragon'];
const poses = ['idle', 'breathe', 'attack', 'hurt'] as const;
show('전투 · 플레이어 (idle / breathe / attack / hurt)', jobs.slice(0, 4).flatMap((j, i) => {
  const set = playerSprite({ seed: 100 + i, stage: 'adult', houseId: 'farm', jobId: j, jobRank: 5, dead: false }, j === 'mage');
  return poses.map((ps) => ({ label: `${j} ${ps}`, p: set[ps] }));
}), 3);
show('전투 · 플레이어 2', jobs.slice(4).flatMap((j, i) => {
  const set = playerSprite({ seed: 200 + i, stage: 'adult', houseId: j === 'demon_officer' ? 'demon' : 'farm', jobId: j, jobRank: 5, dead: false }, false);
  return poses.map((ps) => ({ label: `${j} ${ps}`, p: set[ps] }));
}), 3);
show('전투 · 적', enemies.flatMap((k) => (['idle', 'attack', 'hurt'] as const).map((ps) => ({ label: `${k} ${ps}`, p: enemySprite(k)[ps] }))), 2);

(window as unknown as { galleryReady: boolean }).galleryReady = true;
