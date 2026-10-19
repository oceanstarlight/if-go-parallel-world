import { describe, expect, it } from 'vitest';
import { hasIcon, icon } from '../src/ui/icons';

describe('픽셀 아이콘', () => {
  it('쓰는 아이콘이 모두 번들에 있다', () => {
    for (const n of ['sword', 'shield', 'potion', 'coins', 'store', 'skull', 'smile', 'frown', 'angry', 'annoyed', 'leaf', 'fire', 'zap', 'sparkles', 'heart', 'bed', 'arrow-down', 'home'] as const) {
      expect(hasIcon(n), n).toBe(true);
      expect(icon(n)).toContain('<svg');
    }
  });
});
