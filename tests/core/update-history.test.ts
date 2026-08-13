import { describe, expect, it } from 'vitest';
import { getUpdateHistory } from '../../src/core/update-history';

describe('update history', () => {
  it('returns newest-first dated entries for implemented milestones', () => {
    const history = getUpdateHistory();

    expect(history.length).toBeGreaterThan(1);
    expect(history[0]).toMatchObject({ date: '2026-08-13' });
    expect(history[0].title).toBe('湲곗? ?깆옣怨?蹂몃? 袁몃?湲?');
    expect(history[0].summary).toContain('cosmetic');
    expect(history[0].summary).toContain('update');
    expect(history.every(({ date }) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
    expect(history[0].date >= history[1].date).toBe(true);
  });

  it('returns an immutable snapshot', () => {
    const history = getUpdateHistory();
    const originalTitle = history[0].title;

    expect(() => {
      (history as UpdateEntry[])[0].title = 'changed';
    }).toThrow();
    expect(getUpdateHistory()[0].title).toBe(originalTitle);
  });
});

interface UpdateEntry {
  title: string;
}
