import { describe, expect, it } from 'vitest';
import { applyMissionReward, defaultProgress } from '../../src/core/progression';

describe('progression', () => {
  it('starts with safe defaults and no unlocked mission beyond the tutorial', () => {
    expect(defaultProgress()).toEqual({
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
    });
  });

  it('awards fixed stars and parts and expands the base at explicit thresholds', () => {
    const reward = applyMissionReward(defaultProgress(), 3);

    expect(reward).toMatchObject({ stars: 3, parts: 3, baseLevel: 2 });
    expect(applyMissionReward(reward, 2)).toMatchObject({ stars: 5, parts: 5, baseLevel: 2 });
    expect(applyMissionReward({ ...reward, parts: 12 }, 3).baseLevel).toBe(5);
  });

  it('includes default cosmetics in a new progress record', () => {
    expect(defaultProgress()).toMatchObject({
      selectedSkinId: 'default-suit',
      selectedBaseDecorationId: 'default-hangar',
      unlockedCosmeticIds: ['default-suit', 'default-hangar'],
    });
  });

  it('unlocks the helmet at base level 3 and the HQ decoration at base level 5', () => {
    const levelThree = applyMissionReward({ ...defaultProgress(), parts: 5 }, 1);
    expect(levelThree).toMatchObject({
      baseLevel: 3,
      unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet'],
    });

    const levelFive = applyMissionReward({ ...defaultProgress(), parts: 11 }, 1);
    expect(levelFive).toMatchObject({
      baseLevel: 5,
      unlockedCosmeticIds: ['default-suit', 'default-hangar', 'rescue-helmet', 'signal-hq'],
    });
  });

  it('does not duplicate cosmetic unlocks when rewards cross the same level twice', () => {
    const once = applyMissionReward({ ...defaultProgress(), parts: 5 }, 1);
    const twice = applyMissionReward(once, 1);

    expect(twice.unlockedCosmeticIds.filter((id) => id === 'rescue-helmet')).toHaveLength(1);
  });
});
