import type { Direction } from '../../core/types';

const BUTTONS: ReadonlyArray<{ direction: Direction; label: string; symbol: string }> = [
  { direction: 'up', label: '위쪽 수리 신호', symbol: '▲' },
  { direction: 'right', label: '오른쪽 수리 신호', symbol: '▶' },
  { direction: 'down', label: '아래쪽 수리 신호', symbol: '▼' },
  { direction: 'left', label: '왼쪽 수리 신호', symbol: '◀' },
];

export function createDirectionControls(
  onDirection: (direction: Direction) => void,
  options: { pulse?: boolean } = {},
): HTMLDivElement {
  const pad = document.createElement('div');
  pad.className = 'direction-pad';
  pad.setAttribute('role', 'group');
  pad.setAttribute('aria-label', '수리 방향 입력');

  for (const { direction, label, symbol } of BUTTONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `direction-button direction-${direction}`;
    if (options.pulse) button.classList.add('gi-pulse');
    button.dataset.direction = direction;
    button.setAttribute('aria-label', label);
    button.textContent = symbol;
    button.addEventListener('click', () => {
      button.classList.remove('gi-pulse');
      onDirection(direction);
    });
    pad.append(button);
  }

  return pad;
}
