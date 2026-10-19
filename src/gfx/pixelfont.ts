import { Painter } from './painter';

/** 3×5 픽셀 숫자 폰트 (데미지 숫자용) */
const GLYPHS: Record<string, string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '-': ['...', '...', '###', '...', '...'],
};

/** 글자를 그리고 1px 외곽선을 두른 버퍼. scale 은 정수 배율 */
export function pixelText(text: string, color: string, scale = 1, outline = '#120c10'): Painter {
  const cw = 4 * scale;
  const p = new Painter(text.length * cw + 1, 5 * scale + 2);
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 3; x++) {
        if (g[y][x] === '#') p.rect(1 + i * cw + x * scale, 1 + y * scale, scale, scale, color);
      }
    }
  });
  p.outline(outline, true);
  return p;
}
