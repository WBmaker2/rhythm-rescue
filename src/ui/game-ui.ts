import type { Direction } from '../core/types';
import { createBaseMenu, type BaseMenuOptions } from './menus/base-menu';
import { createPauseMenu } from './menus/pause-menu';
import { createResultMenu, type ResultMenuOptions } from './menus/result-menu';
import { renderMissionHud, type MissionHudView } from './hud/game-hud';

export interface GameUi {
  showBase(options: BaseMenuOptions): void;
  showMission(options: MissionHudView): void;
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
    showResult(options) {
      clear();
      root.append(createResultMenu(options));
      root.dataset.screen = 'result';
    },
    showPause(onResume) {
      root.querySelector('[data-screen="mission"]')?.append(createPauseMenu(onResume));
    },
    clear,
    getRoot() {
      return root;
    },
  };
}

export type { Direction, MissionHudView };
