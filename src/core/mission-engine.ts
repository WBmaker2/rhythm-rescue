import type { Direction } from './types';

export type MissionPhase = 'preview' | 'input' | 'recovery' | 'complete';

export interface MissionState {
  phase: MissionPhase;
  readonly pattern: readonly Direction[];
  cursor: number;
  mistakes: number;
  recoveriesLeft: number;
  combo: number;
  completedPoints: number;
  rewardTier: 1 | 2 | 3;
}

export function createMissionState(pattern: Direction[]): MissionState {
  return {
    phase: 'preview',
    pattern: Object.freeze([...pattern]),
    cursor: 0,
    mistakes: 0,
    recoveriesLeft: 2,
    combo: 0,
    completedPoints: 0,
    rewardTier: 1,
  };
}

function rewardTierFor(state: MissionState): 1 | 2 | 3 {
  if (state.mistakes === 0) return 3;
  if (state.mistakes <= 1) return 2;
  return 1;
}

export function submitDirection(state: MissionState, direction: Direction): MissionState {
  if (state.phase !== 'input' || state.cursor >= state.pattern.length) {
    return { ...state };
  }

  if (state.pattern[state.cursor] !== direction) {
    return {
      ...state,
      phase: state.recoveriesLeft > 0 ? 'recovery' : 'input',
      cursor: 0,
      mistakes: state.mistakes + 1,
      combo: 0,
    };
  }

  const nextCursor = state.cursor + 1;
  const nextCombo = state.combo + 1;
  if (nextCursor < state.pattern.length) {
    return { ...state, cursor: nextCursor, combo: nextCombo };
  }

  const completeState = {
    ...state,
    phase: 'complete' as const,
    cursor: nextCursor,
    combo: nextCombo,
    completedPoints: 1,
  };

  return { ...completeState, rewardTier: rewardTierFor(completeState) };
}

export function useRecovery(state: MissionState): MissionState {
  if (state.phase !== 'recovery' || state.recoveriesLeft <= 0) {
    return { ...state };
  }

  return {
    ...state,
    phase: 'input',
    cursor: 0,
    recoveriesLeft: state.recoveriesLeft - 1,
  };
}
