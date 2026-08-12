import type { Direction } from '../core/types';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  w: 'up',
  d: 'right',
  s: 'down',
  a: 'left',
};

export function directionFromKeyboard(key: string): Direction | null {
  if (key.startsWith('Arrow')) {
    return KEY_TO_DIRECTION[key] ?? null;
  }
  return KEY_TO_DIRECTION[key.toLowerCase()] ?? null;
}

export function createInputGate(minIntervalMs: number): {
  accept(direction: Direction, now: number): Direction | null;
} {
  if (!Number.isFinite(minIntervalMs) || minIntervalMs < 0) {
    throw new RangeError('Minimum input interval must be a non-negative number');
  }

  let lastAcceptedAt = Number.NEGATIVE_INFINITY;
  let lastAcceptedDirection: Direction | null = null;
  return {
    accept(direction, now) {
      if (direction === lastAcceptedDirection && now - lastAcceptedAt < minIntervalMs) {
        return null;
      }
      lastAcceptedAt = now;
      lastAcceptedDirection = direction;
      return direction;
    },
  };
}
