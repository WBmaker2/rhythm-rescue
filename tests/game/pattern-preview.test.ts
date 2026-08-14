import { describe, expect, it } from 'vitest';
import { getPreviewDurationMs, getPreviewIndex } from '../../src/game/simulation/pattern-preview';

describe('pattern preview timing', () => {
  it('adds one beat for each pattern item and a final hold', () => {
    expect(getPreviewDurationMs(1, 320)).toBe(740);
    expect(getPreviewDurationMs(3, 320)).toBe(1_380);
  });

  it('reveals one cumulative item at a time', () => {
    expect(getPreviewIndex(0, 3, 320)).toBe(0);
    expect(getPreviewIndex(319, 3, 320)).toBe(0);
    expect(getPreviewIndex(320, 3, 320)).toBe(1);
    expect(getPreviewIndex(1_000, 3, 320)).toBe(2);
  });
});
