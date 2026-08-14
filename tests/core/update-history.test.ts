import { describe, expect, it } from 'vitest';
import { getUpdateHistory } from '../../src/core/update-history';

describe('update history', () => {
  it('returns newest-first dated entries for implemented milestones', () => {
    const history = getUpdateHistory();

    expect(history.length).toBeGreaterThan(1);
    expect(history[0]).toMatchObject({
      date: '2026-08-14',
      title: '기억하고 따라가는 구조 신호',
      summary: '중앙 플레이필드를 보호하는 HUD와 박자에 맞춘 순차 패턴 입력을 추가했습니다.',
    });
    expect(history.every(({ date }) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
    expect(history[0].date >= history[1].date).toBe(true);
    expect(new Set(history.map(({ date }) => date)).size).toBe(history.length);
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
