import { describe, expect, it } from 'vitest';
import { generatePattern } from '../../src/core/pattern-generator';

describe('pattern generator', () => {
  it('creates a deterministic sequence of four directions', () => {
    const pattern = generatePattern(6, () => 0.51);

    expect(pattern).toHaveLength(6);
    expect(pattern).toEqual(['down', 'down', 'down', 'down', 'down', 'down']);
  });

  it('never emits a value outside the four repair directions', () => {
    const pattern = generatePattern(40, () => 0.99);

    expect(pattern.every((direction) => ['up', 'right', 'down', 'left'].includes(direction))).toBe(true);
  });

  it('falls back to a valid direction when random returns NaN', () => {
    const pattern = generatePattern(4, () => Number.NaN);

    expect(pattern).toHaveLength(4);
    expect(pattern.every((direction) => ['up', 'right', 'down', 'left'].includes(direction))).toBe(true);
  });
});
