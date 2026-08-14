import { describe, expect, it } from 'vitest';
import { createRepairTarget } from '../../src/render/objects/repair-target';

describe('repair target power', () => {
  it('stores the current repair power for the scene feedback layer', () => {
    const target = createRepairTarget();

    target.setRepairPower(0.82);

    expect(target.root.userData.repairPower).toBe(0.82);
  });
});
