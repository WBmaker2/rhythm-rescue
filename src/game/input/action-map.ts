import type { Direction } from '../../core/types';
import { directionFromKeyboard } from '../../input/input-adapter';

export type GameAction = Direction | 'confirm' | 'pause';

export function mapKeyboardKey(key: string): GameAction | undefined {
  const direction = directionFromKeyboard(key);
  if (direction) return direction;
  if (key === 'Enter' || key === ' ') return 'confirm';
  if (key === 'Escape') return 'pause';
  return undefined;
}
