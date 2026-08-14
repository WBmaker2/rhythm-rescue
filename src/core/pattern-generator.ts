import type { Direction } from './types';

export const DIRECTIONS: readonly Direction[] = ['up', 'right', 'down', 'left'];

export function generatePattern(length: number, random: () => number): Direction[] {
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError('Pattern length must be a non-negative integer');
  }

  let previousIndex = -1;
  return Array.from({ length }, () => {
    const raw = random();
    const sample = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
    const sampledIndex = Math.floor(sample * DIRECTIONS.length);
    const nextIndex = sampledIndex === previousIndex
      ? (sampledIndex + 1) % DIRECTIONS.length
      : sampledIndex;
    previousIndex = nextIndex;
    return DIRECTIONS[nextIndex];
  });
}
