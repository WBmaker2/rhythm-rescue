import type { Direction } from '../core/types';
import { createBaseMenu, type BaseMenuOptions } from './menus/base-menu';
import { createPauseMenu } from './menus/pause-menu';
import { createResultMenu, type ResultMenuOptions } from './menus/result-menu';
import { renderMissionHud, type MissionHudView } from './hud/game-hud';
import { createPatternDisplay } from './hud/pattern-display';

export interface GameUi {
  showBase(options: BaseMenuOptions): void;
  showMission(options: MissionHudView): void;
  updateMissionTimer(timeRemainingMs: number, timeLimitMs: number): void;
  updateMissionPattern(pattern: readonly Direction[], cursor: number, previewVisible: boolean, previewIndex: number): void;
  showResult(options: ResultMenuOptions): void;
  showPause(onResume: () => void): void;
  clear(): void;
  getRoot(): HTMLElement;
}

export function createGameUi(root: HTMLElement): GameUi {
  root.classList.add('game-ui-root');

  const clear = (): void => {
    root.replaceChildren();
    root.removeAttribute('data-screen');
  };

  return {
    showBase(options) {
      clear();
      root.append(createBaseMenu(options));
      root.dataset.screen = 'base';
    },
    showMission(options) {
      clear();
      renderMissionHud(root, options);
    },
    updateMissionTimer(timeRemainingMs, timeLimitMs) {
      const timerFill = root.querySelector<HTMLElement>('.timer-fill');
      if (timerFill) timerFill.style.width = `${Math.max(0, Math.min(100, (timeRemainingMs / timeLimitMs) * 100))}%`;
    },
    updateMissionPattern(pattern, cursor, previewVisible, previewIndex) {
      const phase = root.querySelector<HTMLElement>('.pattern-phase');
      if (phase) phase.textContent = previewVisible ? '신호 스캔' : '입력하세요';
      root.querySelector<HTMLElement>('.pattern-slot')?.replaceChildren(createPatternDisplay(pattern, cursor, previewVisible, previewIndex));
      root.querySelectorAll<HTMLButtonElement>('.direction-button').forEach((button) => {
        button.disabled = previewVisible;
        button.classList.toggle('gi-pulse', !previewVisible && cursor === 0);
      });
    },
    showResult(options) {
      clear();
      root.append(createResultMenu(options));
      root.dataset.screen = 'result';
    },
    showPause(onResume) {
      root.querySelector('.mission-screen')?.append(createPauseMenu(onResume));
    },
    clear,
    getRoot() {
      return root;
    },
  };
}

export type { Direction, MissionHudView };
