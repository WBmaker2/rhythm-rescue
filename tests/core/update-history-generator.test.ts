import { describe, expect, it } from 'vitest';
import { formatGeneratedHistory } from '../../scripts/generate-update-history.mjs';

describe('update history generator', () => {
  it('formats committed change areas newest-first with deterministic fallback dates', () => {
    const result = formatGeneratedHistory([
      { date: '2026-08-13', subject: 'feat: add base customization' },
      { date: '2026-08-12', subject: 'feat: add rescue feedback effects' },
      { date: '2026-08-11', subject: 'feat: start rhythm rescue mission' },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ date: '2026-08-14', title: '3D 구조대 출동' }),
      expect.objectContaining({ date: '2026-08-13', title: '기지 성장과 본부 꾸미기' }),
      expect.objectContaining({ date: '2026-08-12', title: '구조 피드백과 접근성' }),
      expect.objectContaining({ date: '2026-08-11', title: '본부 시스템의 스킨' }),
      expect.objectContaining({ date: '2026-08-10', title: '리듬 구조 시작' }),
    ]);
  });
});
