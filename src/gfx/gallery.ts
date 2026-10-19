// 개발용: 모든 도트 그림을 한 화면에 (npm run dev → /gallery.html)
import { drawPortrait, type Stage } from './portrait';
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

show('장면', ALL_SCENES.map((k) => ({ label: k, p: drawScene(k).p })), 2);

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
