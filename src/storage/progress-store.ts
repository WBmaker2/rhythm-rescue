import { defaultProgress, type Progress } from '../core/progression';

const STORAGE_KEY = 'rhythm-rescue-progress-v1';

function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Progress>;
  const settings = candidate.settings as Partial<Progress['settings']> | undefined;
  return (
    typeof candidate.stars === 'number' &&
    typeof candidate.parts === 'number' &&
    typeof candidate.baseLevel === 'number' &&
    Array.isArray(candidate.unlockedMissionIds) &&
    !!settings &&
    typeof settings.sound === 'boolean' &&
    typeof settings.vibration === 'boolean' &&
    typeof settings.reducedMotion === 'boolean' &&
    typeof settings.relaxedTiming === 'boolean'
  );
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
        return isProgress(parsed)
          ? {
              ...parsed,
              unlockedMissionIds: [...parsed.unlockedMissionIds],
              settings: { ...parsed.settings },
            }
          : defaultProgress();
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
