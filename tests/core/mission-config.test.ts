import { describe, expect, it } from 'vitest';
import { getMissionConfig } from '../../src/core/mission-config';

describe('mission configuration', () => {
  it('defines the three approved mission lengths', () => {
    expect(getMissionConfig('short-01')).toMatchObject({
      length: 'short',
      repairPoints: 3,
      patternMin: 3,
      patternMax: 6,
      obstacle: 'none',
    });
    expect(getMissionConfig('medium-01')).toMatchObject({
      length: 'medium',
      repairPoints: 5,
      patternMin: 5,
      patternMax: 9,
      obstacle: 'drone',
    });
    expect(getMissionConfig('long-01')).toMatchObject({
      length: 'long',
      obstacle: 'mixed',
    });
  });
});
