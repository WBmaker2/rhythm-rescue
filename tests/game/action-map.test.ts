import { describe, expect, it } from 'vitest';
import { mapKeyboardKey } from '../../src/game/input/action-map';

describe('action map', () => {
  it('maps WASD and arrow keys to the same directions', () => {
    expect(mapKeyboardKey('ArrowUp')).toBe('up');
    expect(mapKeyboardKey('w')).toBe('up');
    expect(mapKeyboardKey('D')).toBe('right');
  });
});
