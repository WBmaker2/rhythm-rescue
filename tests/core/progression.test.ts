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
    });
  });

  it('awards fixed stars and parts and expands the base at explicit thresholds', () => {
    const reward = applyMissionReward(defaultProgress(), 3);

    expect(reward).toMatchObject({ stars: 3, parts: 3, baseLevel: 2 });
    expect(applyMissionReward(reward, 2)).toMatchObject({ stars: 5, parts: 5, baseLevel: 2 });
    expect(applyMissionReward({ ...reward, parts: 12 }, 3).baseLevel).toBe(5);
  });
});
