/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { createGameUi } from '../../src/ui/game-ui';

describe('game UI', () => {
  it('marks the base launch button with gi-pulse until it is clicked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ui = createGameUi(document.getElementById('app')!);

    ui.showBase({ parts: 0, baseLevel: 1, onStart: () => undefined });

    const button = document.querySelector<HTMLButtonElement>('[data-action="start-mission"]');
    expect(button?.classList.contains('gi-pulse')).toBe(true);
    button?.click();
    expect(button?.classList.contains('gi-pulse')).toBe(false);
  });

  it('keeps scan feedback inside the compact pattern card and locks direction input', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ui = createGameUi(document.getElementById('app')!);

    ui.showMission({
      objective: '수리 목표',
      repairPoint: 1,
      repairPoints: 3,
      pattern: ['up', 'right'],
      cursor: 0,
      previewVisible: true,
      previewIndex: 0,
      combo: 0,
      bestCombo: 0,
      parts: 0,
      timeRemainingMs: 10_000,
      timeLimitMs: 10_000,
      status: '신호를 스캔하는 중입니다.',
      onDirection: () => undefined,
      onPause: () => undefined,
    });

    expect(document.querySelector('.pattern-panel .mission-status')).not.toBeNull();
    expect(document.querySelector<HTMLButtonElement>('[data-direction="up"]')?.disabled).toBe(true);
    expect(document.querySelectorAll('.pattern-token')[0]?.textContent).toBe('▲');
    expect(document.querySelectorAll('.pattern-token')[1]?.textContent).toBe('•');

    ui.updateMissionPattern(['up', 'right'], 0, false, -1);
    expect(document.querySelector<HTMLButtonElement>('[data-direction="up"]')?.disabled).toBe(false);
  });
});
