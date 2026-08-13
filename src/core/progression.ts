export interface ProgressSettings {
  sound: boolean;
  vibration: boolean;
  reducedMotion: boolean;
  relaxedTiming: boolean;
}

export type CosmeticId = 'default-suit' | 'default-hangar' | 'rescue-helmet' | 'signal-hq';
export type SkinId = 'default-suit' | 'rescue-helmet';
export type BaseDecorationId = 'default-hangar' | 'signal-hq';

export interface Progress {
  stars: number;
  parts: number;
  baseLevel: 1 | 2 | 3 | 4 | 5;
  unlockedMissionIds: string[];
  settings: ProgressSettings;
  selectedSkinId: SkinId;
  selectedBaseDecorationId: BaseDecorationId;
  unlockedCosmeticIds: CosmeticId[];
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
    selectedSkinId: 'default-suit',
    selectedBaseDecorationId: 'default-hangar',
    unlockedCosmeticIds: ['default-suit', 'default-hangar'],
  };
}

function baseLevelFor(parts: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, 1 + Math.floor(parts / 3)) as 1 | 2 | 3 | 4 | 5;
}

export function applyMissionReward(progress: Progress, tier: 1 | 2 | 3): Progress {
  const nextStars = progress.stars + tier;
  const nextParts = progress.parts + tier;
  const nextBaseLevel = baseLevelFor(nextParts);
  const unlockedCosmeticIds = [...progress.unlockedCosmeticIds];
  const unlocks: Array<[number, CosmeticId]> = [
    [3, 'rescue-helmet'],
    [5, 'signal-hq'],
  ];

  for (const [level, cosmeticId] of unlocks) {
    if (nextBaseLevel >= level && !unlockedCosmeticIds.includes(cosmeticId)) {
      unlockedCosmeticIds.push(cosmeticId);
    }
  }

  return {
    ...progress,
    stars: nextStars,
    parts: nextParts,
    baseLevel: nextBaseLevel,
    unlockedMissionIds: [...progress.unlockedMissionIds],
    settings: { ...progress.settings },
    selectedSkinId: progress.selectedSkinId,
    selectedBaseDecorationId: progress.selectedBaseDecorationId,
    unlockedCosmeticIds,
  };
}
