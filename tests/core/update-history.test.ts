import { describe, expect, it } from 'vitest';
import { getUpdateHistory } from '../../src/core/update-history';

describe('update history', () => {
  it('returns newest-first dated entries for implemented milestones', () => {
    const history = getUpdateHistory();

    expect(history.length).toBeGreaterThan(1);
    expect(history[0]).toMatchObject({ date: '2026-08-13' });
    expect(history[0]).toMatchObject({
      title: '기지 성장과 본부 꾸미기',
      summary: '기지에서 꾸미기 아이템 해금과 업데이트 내역 패널을 사용할 수 있습니다.',
    });
    expect(history[1]).toMatchObject({
      title: '본부 시스템의 스킨',
      summary: '임무 보상과 기지 성장 마일스톤을 추가했습니다.',
    });
    expect(history[2]).toMatchObject({
      title: '리듬 구조 시작',
      summary: '첫 번째 리듬 구조 임무 플레이 루프를 추가했습니다.',
    });
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
