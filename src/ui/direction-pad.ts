import type { Direction } from '../core/types';

const BUTTONS: ReadonlyArray<{ direction: Direction; label: string; symbol: string }> = [
  { direction: 'up', label: '위 수리 신호', symbol: '↑' },
  { direction: 'right', label: '오른쪽 수리 신호', symbol: '→' },
  { direction: 'down', label: '아래 수리 신호', symbol: '↓' },
  { direction: 'left', label: '왼쪽 수리 신호', symbol: '←' },
];

export function createDirectionPad(onDirection: (direction: Direction) => void): HTMLDivElement {
  const pad = document.createElement('div');
  pad.className = 'direction-pad';
  pad.setAttribute('role', 'group');
  pad.setAttribute('aria-label', '수리 신호 입력');

  for (const { direction, label, symbol } of BUTTONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `direction-button direction-${direction}`;
    button.setAttribute('aria-label', label);
    button.textContent = symbol;
    button.addEventListener('click', () => onDirection(direction));
    pad.append(button);
  }

  return pad;
}

export function getGameUi(): HTMLElement {
  const ui = document.getElementById('game-ui');
  if (!ui) throw new Error('Game UI root is missing');
  return ui;
}

export function resetGameUi(): HTMLElement {
  const ui = getGameUi();
  ui.replaceChildren();
  return ui;
}

export function createUiButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary-button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}
