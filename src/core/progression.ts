export interface ProgressSettings {
  sound: boolean;
  vibration: boolean;
  reducedMotion: boolean;
  relaxedTiming: boolean;
}

export interface Progress {
  stars: number;
  parts: number;
  baseLevel: 1 | 2 | 3 | 4 | 5;
  unlockedMissionIds: string[];
  settings: ProgressSettings;
}

export function defaultProgress(): Progress {
  return {
    stars: 0,
    parts: 0,
    baseLevel: 1,
    unlockedMissionIds: ['tutorial'],
    settings: {
      sound: true,
      vibration: true,
      reducedMotion: false,
      relaxedTiming: false,
    },
  };
}

function baseLevelFor(parts: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, 1 + Math.floor(parts / 3)) as 1 | 2 | 3 | 4 | 5;
}

export function applyMissionReward(progress: Progress, tier: 1 | 2 | 3): Progress {
  const nextStars = progress.stars + tier;
  const nextParts = progress.parts + tier;
  return {
    ...progress,
    stars: nextStars,
    parts: nextParts,
    baseLevel: baseLevelFor(nextParts),
    unlockedMissionIds: [...progress.unlockedMissionIds],
    settings: { ...progress.settings },
  };
}
