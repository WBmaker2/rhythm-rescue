import { describe, expect, it } from 'vitest';
import { createObstacles } from '../../src/render/objects/obstacles';

describe('obstacle telegraph', () => {
  it('records a direction signal so the obstacle layer can react visually', () => {
    const obstacles = createObstacles('mixed');
    obstacles.reactTo('right');
    expect(obstacles.root.userData.lastSignal).toBe('right');
  });
});
