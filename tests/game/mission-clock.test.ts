import { describe, expect, it } from 'vitest';
import {
  createMissionClock,
  isMissionClockExpired,
  tickMissionClock,
} from '../../src/game/simulation/mission-clock';

describe('mission clock', () => {
  it('starts with the configured limit', () => {
    expect(createMissionClock(16_000)).toEqual({
      limitMs: 16_000,
      remainingMs: 16_000,
      phase: 'running',
    });
  });

  it('subtracts elapsed time without going below zero', () => {
    const next = tickMissionClock(createMissionClock(1_000), 1_250);

    expect(next).toEqual({
      limitMs: 1_000,
      remainingMs: 0,
      phase: 'expired',
    });
    expect(isMissionClockExpired(next)).toBe(true);
  });
});
