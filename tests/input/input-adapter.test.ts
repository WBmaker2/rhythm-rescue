import { describe, expect, it } from 'vitest';
import { createInputGate, directionFromKeyboard } from '../../src/input/input-adapter';

describe('input adapter', () => {
  it('maps arrows and WASD to the same directions', () => {
    expect(directionFromKeyboard('ArrowUp')).toBe('up');
    expect(directionFromKeyboard('w')).toBe('up');
    expect(directionFromKeyboard('D')).toBe('right');
    expect(directionFromKeyboard('ArrowDown')).toBe('down');
    expect(directionFromKeyboard('a')).toBe('left');
    expect(directionFromKeyboard('Enter')).toBeNull();
  });

  it('rejects duplicate signals inside the minimum interval', () => {
    const gate = createInputGate(80);

    expect(gate.accept('up', 100)).toBe('up');
    expect(gate.accept('up', 120)).toBeNull();
    expect(gate.accept('up', 181)).toBe('up');
  });
});
