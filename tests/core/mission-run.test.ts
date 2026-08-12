import { describe, expect, it } from 'vitest';
import { getMissionConfig } from '../../src/core/mission-config';
import {
  createMissionRun,
  submitRunDirection,
  useRunRecovery,
} from '../../src/core/mission-run';

describe('mission run', () => {
  it('starts a short mission at point one with three total points', () => {
    const state = createMissionRun(getMissionConfig('short-01'), {
      random: () => 0.5,
      tutorialPatterns: [['up'], ['right'], ['down']],
    });

    expect(state).toMatchObject({ phase: 'active', repairPoints: 3, completedPoints: 0 });
    expect(state.currentPoint.pattern).toEqual(['up']);
  });

  it('advances to the next point and completes only after the final point', () => {
    const options = { random: () => 0.5, tutorialPatterns: [['up'], ['right']] };
    let state = createMissionRun({ ...getMissionConfig('short-01'), repairPoints: 2 }, options);

    state = submitRunDirection(state, 'up', options);
    expect(state).toMatchObject({ phase: 'active', completedPoints: 1 });
    expect(state.currentPoint.pattern).toEqual(['right']);

    state = submitRunDirection(state, 'right', options);
    expect(state).toMatchObject({ phase: 'complete', completedPoints: 2, rewardTier: 3 });
  });

  it('limits recovery per point and aggregates recovery usage', () => {
    const options = { random: () => 0.5, tutorialPatterns: [['up'], ['right']] };
    let state = createMissionRun({ ...getMissionConfig('short-01'), repairPoints: 2 }, options);

    state = submitRunDirection(state, 'right', options);
    expect(state.currentPoint.phase).toBe('recovery');
    state = useRunRecovery(state);
    expect(state.currentPoint.recoveriesLeft).toBe(1);
    state = submitRunDirection(state, 'up', options);

    expect(state).toMatchObject({ completedPoints: 1, totalMistakes: 1, totalRecoveriesUsed: 1 });
  });

  it('generates medium patterns within configured bounds', () => {
    const state = createMissionRun(getMissionConfig('medium-01'), { random: () => 0 });

    expect(state.currentPoint.pattern).toHaveLength(5);
  });
});
