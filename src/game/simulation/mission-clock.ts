export interface MissionClockState {
  limitMs: number;
  remainingMs: number;
  phase: 'running' | 'expired';
}

export function createMissionClock(limitMs: number): MissionClockState {
  if (!Number.isFinite(limitMs) || limitMs <= 0) {
    throw new RangeError('Mission clock limit must be positive');
  }

  return {
    limitMs,
    remainingMs: limitMs,
    phase: 'running',
  };
}

export function tickMissionClock(
  state: MissionClockState,
  deltaMs: number,
): MissionClockState {
  const remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));

  return {
    ...state,
    remainingMs,
    phase: remainingMs === 0 ? 'expired' : state.phase,
  };
}

export function isMissionClockExpired(state: MissionClockState): boolean {
  return state.phase === 'expired';
}
