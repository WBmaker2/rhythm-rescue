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
});
