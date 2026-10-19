import type { LifeState } from '../types';
import { houseById } from '../data/houses';
import { cheatById } from '../data/cheats';
import { jobTitle } from '../data/jobs';
import { deathById } from '../data/deaths';
import { goalById } from '../data/goals';
import { drawPortrait, specFromLife } from '../gfx/portrait';

const W = 720, H = 1080;
const FONT = "'Gowun Dodum', 'Noto Sans KR', sans-serif";

export function lifeTitle(s: LifeState): string {
  return s.jobId ? jobTitle(s.jobId, s.jobRank) : s.age < 18 ? '어린 영혼' : '자유로운 영혼';
}

/** 글자를 폭에 맞춰 줄바꿈해 그린다. 다음 줄의 y 를 돌려준다 */
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = ch;
      y += lh;
    } else line += ch;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

/** 한 생의 결과를 공유용 이미지(PNG)로 만든다 */
export async function makeShareCard(s: LifeState, total: number, peers: LifeState[]): Promise<HTMLCanvasElement> {
  try {
    await document.fonts.load(`32px ${FONT}`);
  } catch {
    // 폰트를 못 불러와도 기본 글꼴로 그린다
  }
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#cfe6ff');
  bg.addColorStop(0.55, '#f4f0ff');
  bg.addColorStop(1, '#fff1e4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 카드
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(40, 40, W - 80, H - 80, 32);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a52e8';
  ctx.font = `28px ${FONT}`;
  ctx.fillText('환생록 · 이세계 인생 연대기', W / 2, 100);

  // 초상화 (도트 그대로 4배)
  // 공유 카드는 살아 있을 때의 모습(컬러)으로 그린다
  const portrait = drawPortrait({ ...specFromLife(s), dead: false }).toCanvas();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(portrait, W / 2 - 128, 130, 256, 256);

  ctx.fillStyle = '#2c2c50';
  ctx.font = `bold 52px ${FONT}`;
  ctx.fillText(s.name, W / 2, 450);
  ctx.font = `26px ${FONT}`;
  ctx.fillStyle = '#7c82a6';
  ctx.fillText(`${houseById(s.houseId).name} · ${cheatById(s.cheatId).name}`, W / 2, 492);
  ctx.fillText(`${lifeTitle(s)} · 향년 ${s.age}세`, W / 2, 528);

  ctx.fillStyle = '#e8365a';
  ctx.font = `bold 34px ${FONT}`;
  const d = deathById(s.death?.causeId ?? 'old_age');
  ctx.fillText(d.name, W / 2, 592);
  ctx.fillStyle = '#5a6088';
  ctx.font = `24px ${FONT}`;
  let y = wrap(ctx, d.epitaph, W / 2, 634, W - 180, 34);

  // 목표
  const goals = (s.goals ?? []).map(goalById).filter((g) => !!g);
  if (goals.length) {
    y += 8;
    ctx.textAlign = 'left';
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillStyle = '#4a62f0';
    ctx.fillText('이번 생의 목표', 100, y);
    y += 36;
    ctx.font = `22px ${FONT}`;
    for (const g of goals) {
      const ok = g.done(s);
      ctx.fillStyle = ok ? '#1ea46a' : '#a0a6c4';
      ctx.fillText(`${ok ? '✔' : '○'}  ${g.name}`, 110, y);
      y += 32;
    }
  }

  // 동시대 환생자
  if (peers.length) {
    y += 10;
    ctx.textAlign = 'left';
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillStyle = '#4a62f0';
    ctx.fillText('같은 해 환생한 이들', 100, y);
    y += 34;
    ctx.font = `20px ${FONT}`;
    ctx.fillStyle = '#5a6088';
    for (const p of peers) {
      ctx.fillText(`· ${p.name} — ${houseById(p.houseId).name}, ${p.age}세, ${deathById(p.death?.causeId ?? 'old_age').name}`, 110, y);
      y += 30;
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffad1f';
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText(`◆ 환생석 ${total}  ·  ${s.lifeNo ?? 1}번째 삶`, W / 2, H - 80);
  return cv;
}

/** 저장 또는 (가능하면) 시스템 공유 */
export async function shareOrDownload(cv: HTMLCanvasElement, name: string, share: boolean): Promise<string> {
  const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/png'));
  if (!blob) return '이미지를 만들지 못했다.';
  const file = new File([blob], `환생록-${name}.png`, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (share && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '환생록', text: `${name}의 이세계 인생 결과!` });
      return '공유했다!';
    } catch {
      return '공유를 취소했다.';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return '결과 카드를 저장했다!';
}
