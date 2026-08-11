import type { Direction } from './types';

export const DIRECTIONS: readonly Direction[] = ['up', 'right', 'down', 'left'];

export function generatePattern(length: number, random: () => number): Direction[] {
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError('Pattern length must be a non-negative integer');
  }

  return Array.from({ length }, () => {
    const sample = Math.min(0.999999, Math.max(0, random()));
    return DIRECTIONS[Math.floor(sample * DIRECTIONS.length)];
  });
}
