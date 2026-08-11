import { describe, expect, it } from 'vitest';
import {
  createMissionState,
  submitDirection,
  useRecovery,
} from '../../src/core/mission-engine';

describe('mission engine', () => {
  it('replays from the mistaken position while a recovery remains', () => {
    const state = { ...createMissionState(['up', 'right']), phase: 'input' as const };
    const afterMistake = submitDirection(state, 'left');

    expect(afterMistake).toMatchObject({
      phase: 'recovery',
      cursor: 0,
      mistakes: 1,
      combo: 0,
      recoveriesLeft: 2,
    });
    expect(useRecovery(afterMistake)).toMatchObject({
      phase: 'input',
      cursor: 0,
      recoveriesLeft: 1,
    });
  });

  it('completes a pattern and awards the top tier without mistakes', () => {
    let state = { ...createMissionState(['up', 'right']), phase: 'input' as const };
    state = submitDirection(state, 'up');
    state = submitDirection(state, 'right');

    expect(state).toMatchObject({
      phase: 'complete',
      cursor: 2,
      completedPoints: 1,
      combo: 2,
      rewardTier: 3,
    });
  });

  it('continues input after all recovery signals are spent', () => {
    const initial = { ...createMissionState(['up']), phase: 'input' as const };
    const first = submitDirection(initial, 'left');
    const second = submitDirection(useRecovery(first), 'left');
    const third = submitDirection(useRecovery(second), 'left');

    expect(third).toMatchObject({ phase: 'input', mistakes: 3, recoveriesLeft: 0, cursor: 0 });
  });
});
