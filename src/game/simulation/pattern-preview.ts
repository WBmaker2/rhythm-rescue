const FINAL_HOLD_MS = 420;

export function getPreviewDurationMs(patternLength: number, beatMs: number): number {
  if (!Number.isSafeInteger(patternLength) || patternLength <= 0) {
    throw new RangeError('Pattern preview length must be positive');
  }
  if (!Number.isFinite(beatMs) || beatMs <= 0) {
    throw new RangeError('Pattern preview beat must be positive');
  }
  return patternLength * beatMs + FINAL_HOLD_MS;
}

export function getPreviewIndex(elapsedMs: number, patternLength: number, beatMs: number): number {
  if (!Number.isSafeInteger(patternLength) || patternLength <= 0) {
    throw new RangeError('Pattern preview length must be positive');
  }
  if (!Number.isFinite(beatMs) || beatMs <= 0) {
    throw new RangeError('Pattern preview beat must be positive');
  }
  const elapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  return Math.min(patternLength - 1, Math.floor(elapsed / beatMs));
}
