import { describe, expect, it } from 'vitest';
import { defaultProgress } from '../../src/core/progression';
import { createProgressStore } from '../../src/storage/progress-store';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

describe('progress store', () => {
  it('round-trips progress through the provided storage', () => {
    const storage = memoryStorage();
    const store = createProgressStore(storage);
    const progress = { ...defaultProgress(), stars: 4, parts: 6 };

    expect(store.save(progress)).toBe(true);
    expect(store.load()).toEqual(progress);
  });

  it('returns defaults and false when storage is blocked or corrupt', () => {
    const blocked = {
      getItem: () => '{not-json',
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as unknown as Storage;
    const store = createProgressStore(blocked);

    expect(store.load()).toEqual(defaultProgress());
    expect(store.save(defaultProgress())).toBe(false);
  });

  it('rejects structurally invalid persisted progress', () => {
    const invalid = {
      getItem: () => JSON.stringify({
        stars: -1,
        parts: 2,
        baseLevel: 99,
        unlockedMissionIds: [123],
        settings: { sound: true, vibration: true, reducedMotion: false, relaxedTiming: false },
      }),
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 1,
    } as unknown as Storage;

    expect(createProgressStore(invalid).load()).toEqual(defaultProgress());
  });

  it('returns defaults when reading storage is blocked', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as unknown as Storage;

    expect(createProgressStore(blocked).load()).toEqual(defaultProgress());
  });
});
