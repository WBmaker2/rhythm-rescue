import {
  defaultProgress,
  baseLevelFor,
  type BaseDecorationId,
  type CosmeticId,
  type Progress,
  type SkinId,
} from '../core/progression';

const STORAGE_KEY = 'rhythm-rescue-progress-v1';

function normalizeProgress(value: unknown): Progress | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<Progress>;
  const settings = candidate.settings as Partial<Progress['settings']> | undefined;
  const validCount = (count: unknown): count is number =>
    typeof count === 'number' && Number.isSafeInteger(count) && count >= 0;
  const validBaseLevel =
    typeof candidate.baseLevel === 'number' &&
    Number.isInteger(candidate.baseLevel) &&
    candidate.baseLevel >= 1 &&
    candidate.baseLevel <= 5;
  const validBaseRecord = (
    validCount(candidate.stars) &&
    validCount(candidate.parts) &&
    validBaseLevel &&
    Array.isArray(candidate.unlockedMissionIds) &&
    candidate.unlockedMissionIds.every((missionId) => typeof missionId === 'string') &&
    !!settings &&
    typeof settings.sound === 'boolean' &&
    typeof settings.vibration === 'boolean' &&
    typeof settings.reducedMotion === 'boolean' &&
    typeof settings.relaxedTiming === 'boolean'
  );
  if (!validBaseRecord) return undefined;

  const stars = candidate.stars as number;
  const parts = candidate.parts as number;
  const baseLevel = candidate.baseLevel as Progress['baseLevel'];
  const unlockedMissionIds = candidate.unlockedMissionIds as string[];
  const progressSettings = settings as Progress['settings'];

  if (baseLevel !== baseLevelFor(parts)) return undefined;

  const hasCosmetics =
    candidate.selectedSkinId !== undefined ||
    candidate.selectedBaseDecorationId !== undefined ||
    candidate.unlockedCosmeticIds !== undefined;
  if (!hasCosmetics) {
    const defaults = defaultProgress();
    return {
      ...defaults,
      stars,
      parts,
      baseLevel,
      unlockedMissionIds: [...unlockedMissionIds],
      settings: { ...progressSettings },
    };
  }

  const skinIds: readonly SkinId[] = ['default-suit', 'rescue-helmet'];
  const decorationIds: readonly BaseDecorationId[] = ['default-hangar', 'signal-hq'];
  const cosmeticIds: readonly CosmeticId[] = [
    'default-suit',
    'default-hangar',
    'rescue-helmet',
    'signal-hq',
  ];
  const minimumBaseLevels: Readonly<Partial<Record<CosmeticId, number>>> = {
    'rescue-helmet': 3,
    'signal-hq': 5,
  };
  const validCosmeticArray =
    Array.isArray(candidate.unlockedCosmeticIds) &&
    candidate.unlockedCosmeticIds.length > 0 &&
    candidate.unlockedCosmeticIds.every(
      (id) => typeof id === 'string' && cosmeticIds.includes(id as CosmeticId),
    ) &&
    new Set(candidate.unlockedCosmeticIds).size === candidate.unlockedCosmeticIds.length;
  const unlockedCosmeticIds = candidate.unlockedCosmeticIds as CosmeticId[] | undefined;
  const hasDefaultCosmetics =
    unlockedCosmeticIds?.includes('default-suit') === true &&
    unlockedCosmeticIds.includes('default-hangar');
  const cosmeticsMeetLevelRequirements =
    unlockedCosmeticIds?.every((id) => (minimumBaseLevels[id] ?? 1) <= baseLevel) === true;
  const validSelections =
    typeof candidate.selectedSkinId === 'string' &&
    skinIds.includes(candidate.selectedSkinId as SkinId) &&
    typeof candidate.selectedBaseDecorationId === 'string' &&
    decorationIds.includes(candidate.selectedBaseDecorationId as BaseDecorationId);
  const selectionsAreUnlocked =
    unlockedCosmeticIds !== undefined &&
    unlockedCosmeticIds.includes(candidate.selectedSkinId as CosmeticId) &&
    unlockedCosmeticIds.includes(candidate.selectedBaseDecorationId as CosmeticId);
  if (
    !validCosmeticArray ||
    !hasDefaultCosmetics ||
    !cosmeticsMeetLevelRequirements ||
    !validSelections ||
    !selectionsAreUnlocked
  ) {
    return undefined;
  }

  return {
    stars,
    parts,
    baseLevel,
    unlockedMissionIds: [...unlockedMissionIds],
    settings: { ...progressSettings },
    selectedSkinId: candidate.selectedSkinId as SkinId,
    selectedBaseDecorationId: candidate.selectedBaseDecorationId as BaseDecorationId,
    unlockedCosmeticIds: [...unlockedCosmeticIds],
  };
}

export function createProgressStore(storage: Storage): {
  load(): Progress;
  save(progress: Progress): boolean;
} {
  return {
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return defaultProgress();
        const parsed: unknown = JSON.parse(raw);
        return normalizeProgress(parsed) ?? defaultProgress();
      } catch {
        return defaultProgress();
      }
    },
    save(progress) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(progress));
        return true;
      } catch {
        return false;
      }
    },
  };
}
