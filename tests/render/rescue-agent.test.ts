import { describe, expect, it } from 'vitest';
import { createRescueAgent } from '../../src/render/objects/rescue-agent';

describe('rescue agent movement', () => {
  it('moves between fixed direction anchors instead of accumulating offsets', () => {
    const agent = createRescueAgent();

    agent.moveTo('right');
    agent.update(500);
    agent.moveTo('left');
    for (let index = 0; index < 20; index += 1) agent.update(50);

    expect(agent.root.position.x).toBeLessThan(-0.5);
  });
});
