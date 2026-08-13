import { createMissionState, submitDirection, useRecovery, type MissionState } from './mission-engine';
import { generatePattern } from './pattern-generator';
import type { Direction, MissionConfig } from './types';

export type MissionRunPhase = 'active' | 'complete';

export interface MissionRunState {
  phase: MissionRunPhase;
  missionId: string;
  config: MissionConfig;
  repairPoints: number;
  completedPoints: number;
  currentPoint: MissionState;
  totalMistakes: number;
  totalRecoveriesUsed: number;
  combo: number;
  bestCombo: number;
  rewardTier: 1 | 2 | 3;
}

export interface MissionRunOptions {
  random: () => number;
  tutorialPatterns?: readonly Direction[][];
}

const MAX_RECOVERIES_PER_MISSION = 2;

function patternLength(config: MissionConfig, random: () => number): number {
  const span = config.patternMax - config.patternMin + 1;
  const value = random();
  const offset = Number.isFinite(value) ? Math.floor(value * span) : 0;
  return config.patternMin + Math.max(0, Math.min(span - 1, offset));
}

function patternFor(
  config: MissionConfig,
  completedPoints: number,
  options: MissionRunOptions,
): Direction[] {
  const tutorialPattern = options.tutorialPatterns?.[completedPoints];
  if (tutorialPattern) return [...tutorialPattern];
  return generatePattern(patternLength(config, options.random), options.random);
}

function createPoint(
  config: MissionConfig,
  completedPoints: number,
  options: MissionRunOptions,
  recoveriesLeft: number,
): MissionState {
  return {
    ...createMissionState(patternFor(config, completedPoints, options)),
    phase: 'input',
    recoveriesLeft,
  };
}

function rewardTierFor(totalMistakes: number, totalRecoveriesUsed: number): 1 | 2 | 3 {
  if (totalMistakes === 0 && totalRecoveriesUsed === 0) return 3;
  if (totalMistakes <= 1 && totalRecoveriesUsed <= 1) return 2;
  return 1;
}

export function createMissionRun(
  config: MissionConfig,
  options: MissionRunOptions,
): MissionRunState {
  if (!Number.isSafeInteger(config.repairPoints) || config.repairPoints <= 0) {
    throw new RangeError('Mission must have at least one repair point');
  }

  return {
    phase: 'active',
    missionId: config.id,
    config: { ...config },
    repairPoints: config.repairPoints,
    completedPoints: 0,
    currentPoint: createPoint(config, 0, options, MAX_RECOVERIES_PER_MISSION),
    totalMistakes: 0,
    totalRecoveriesUsed: 0,
    combo: 0,
    bestCombo: 0,
    rewardTier: 1,
  };
}

export function submitRunDirection(
  state: MissionRunState,
  direction: Direction,
  options: MissionRunOptions,
): MissionRunState {
  if (state.phase !== 'active') return { ...state };

  const nextPoint = submitDirection(state.currentPoint, direction);
  const mistakeDelta = Math.max(0, nextPoint.mistakes - state.currentPoint.mistakes);
  const correctDelta = Math.max(0, nextPoint.combo - state.currentPoint.combo);
  const nextTotalMistakes = state.totalMistakes + mistakeDelta;
  const nextCombo = mistakeDelta > 0 ? 0 : state.combo + correctDelta;
  const nextBestCombo = Math.max(state.bestCombo, nextCombo);

  if (nextPoint.phase !== 'complete') {
    return {
      ...state,
      currentPoint: nextPoint,
      totalMistakes: nextTotalMistakes,
      combo: nextCombo,
      bestCombo: nextBestCombo,
    };
  }

  const nextCompletedPoints = state.completedPoints + 1;
  if (nextCompletedPoints >= state.repairPoints) {
    return {
      ...state,
      phase: 'complete',
      completedPoints: nextCompletedPoints,
      currentPoint: nextPoint,
      totalMistakes: nextTotalMistakes,
      combo: nextCombo,
      bestCombo: nextBestCombo,
      rewardTier: rewardTierFor(nextTotalMistakes, state.totalRecoveriesUsed),
    };
  }

  return {
    ...state,
    completedPoints: nextCompletedPoints,
    currentPoint: createPoint(
      state.config,
      nextCompletedPoints,
      options,
      Math.max(0, MAX_RECOVERIES_PER_MISSION - state.totalRecoveriesUsed),
    ),
    totalMistakes: nextTotalMistakes,
    combo: nextCombo,
    bestCombo: nextBestCombo,
  };
}

export function useRunRecovery(state: MissionRunState): MissionRunState {
  if (state.phase !== 'active') return { ...state };
  if (state.totalRecoveriesUsed >= MAX_RECOVERIES_PER_MISSION) {
    return {
      ...state,
      currentPoint: {
        ...state.currentPoint,
        phase: 'input',
        recoveriesLeft: 0,
      },
    };
  }
  const nextPoint = useRecovery(state.currentPoint);
  const recoveryDelta = state.currentPoint.recoveriesLeft - nextPoint.recoveriesLeft;
  return {
    ...state,
    currentPoint: nextPoint,
    totalRecoveriesUsed: state.totalRecoveriesUsed + Math.max(0, recoveryDelta),
    combo: 0,
  };
}
