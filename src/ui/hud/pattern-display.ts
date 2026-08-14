import type { Direction } from '../../core/types';

const SYMBOLS: Readonly<Record<Direction, string>> = {
  up: '▲',
  right: '▶',
  down: '▼',
  left: '◀',
};

export function createPatternDisplay(
  pattern: readonly Direction[],
  cursor: number,
  previewVisible: boolean,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'pattern-display';
  wrapper.setAttribute('aria-label', previewVisible ? '기억할 수리 패턴' : '입력 중인 수리 패턴');

  for (const [index, direction] of pattern.entries()) {
    const token = document.createElement('span');
    token.className = 'pattern-token';
    const revealed = previewVisible || index < cursor;
    token.textContent = revealed ? SYMBOLS[direction] : '•';
    token.classList.toggle('pattern-token-complete', index < cursor);
    token.classList.toggle('pattern-token-current', index === cursor && !previewVisible);
    token.setAttribute('aria-hidden', 'true');
    wrapper.append(token);
  }

  const text = document.createElement('span');
  text.className = 'visually-hidden';
  text.textContent = previewVisible
    ? pattern.map((direction) => directionLabel(direction)).join(', ')
    : `${cursor}개 입력 완료, 전체 ${pattern.length}개`;
  wrapper.append(text);
  return wrapper;
}

function directionLabel(direction: Direction): string {
  return { up: '위', right: '오른쪽', down: '아래', left: '왼쪽' }[direction];
}
