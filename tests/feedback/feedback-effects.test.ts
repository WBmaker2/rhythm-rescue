import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFeedbackBus, type FeedbackEvent } from '../../src/core/feedback';
import {
  createBrowserFeedbackRuntime,
  createFeedbackEffects,
  type FeedbackRuntime,
} from '../../src/feedback/feedback-effects';

const vibrationPatterns: Record<FeedbackEvent, readonly number[]> = {
  'input-correct': [18],
  'input-wrong': [40, 25, 40],
  'recovery-used': [15, 20, 15],
  'point-complete': [25, 15, 35],
  'mission-complete': [30, 20, 30, 20, 45],
};

const soundFrequencies: Record<FeedbackEvent, number> = {
  'input-correct': 523.25,
  'input-wrong': 220,
  'recovery-used': 392,
  'point-complete': 659.25,
  'mission-complete': 783.99,
};

describe('feedback effects', () => {
  it('plays sound and vibration for events when both settings are enabled', () => {
    const bus = createFeedbackBus();
    const sounds: FeedbackEvent[] = [];
    const vibrations: number[][] = [];
    const runtime: FeedbackRuntime = {
      playSound: (event) => sounds.push(event),
      vibrate: (pattern) => vibrations.push([...pattern]),
      dispose: () => undefined,
    };

    const effects = createFeedbackEffects(
      bus,
      { sound: true, vibration: true, reducedMotion: false, relaxedTiming: false },
      runtime,
    );

    bus.emit('point-complete');

    expect(sounds).toEqual(['point-complete']);
    expect(vibrations).toEqual([[25, 15, 35]]);

    effects.dispose();
  });

  it('filters disabled effects and releases the subscription', () => {
    const bus = createFeedbackBus();
    const runtimeCalls = { sound: 0, vibration: 0, dispose: 0 };
    const runtime: FeedbackRuntime = {
      playSound: () => {
        runtimeCalls.sound += 1;
      },
      vibrate: () => {
        runtimeCalls.vibration += 1;
      },
      dispose: () => {
        runtimeCalls.dispose += 1;
      },
    };

    const effects = createFeedbackEffects(
      bus,
      { sound: false, vibration: false, reducedMotion: false, relaxedTiming: false },
      runtime,
    );

    bus.emit('input-correct');
    effects.dispose();
    effects.dispose();
    bus.emit('mission-complete');

    expect(runtimeCalls).toEqual({ sound: 0, vibration: 0, dispose: 1 });
  });

  it('uses a deterministic vibration pattern for each feedback event', () => {
    const bus = createFeedbackBus();
    const seenPatterns = new Map<FeedbackEvent, number[]>();
    const runtime: FeedbackRuntime = {
      playSound: () => undefined,
      vibrate: (pattern) => {
        const event = events[seenPatterns.size];
        seenPatterns.set(event, [...pattern]);
      },
      dispose: () => undefined,
    };

    const effects = createFeedbackEffects(
      bus,
      { sound: false, vibration: true, reducedMotion: false, relaxedTiming: false },
      runtime,
    );

    const events: FeedbackEvent[] = [
      'input-correct',
      'input-wrong',
      'recovery-used',
      'point-complete',
      'mission-complete',
    ];

    for (const event of events) {
      bus.emit(event);
    }

    expect(Object.fromEntries(seenPatterns)).toEqual(vibrationPatterns);

    effects.dispose();
  });
});

describe('browser feedback runtime', () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window }).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }

    if (originalNavigator === undefined) {
      delete (globalThis as { navigator?: Navigator }).navigator;
    } else {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: originalNavigator,
      });
    }
  });

  it('creates audio lazily and uses the fixed tone for each event', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const connectOscillator = vi.fn();
    const connectGain = vi.fn();
    const setFrequency = vi.fn();
    const setGain = vi.fn();
    const linearRamp = vi.fn();
    const close = vi.fn();
    const createOscillator = vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: setFrequency },
      connect: connectOscillator,
      start,
      stop,
    }));
    const createGain = vi.fn(() => ({
      gain: {
        setValueAtTime: setGain,
        linearRampToValueAtTime: linearRamp,
      },
      connect: connectGain,
    }));
    const AudioContextStub = vi.fn(() => ({
      currentTime: 10,
      destination: { label: 'output' },
      createOscillator,
      createGain,
      close,
    }));

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { AudioContext: AudioContextStub },
    });

    const runtime = createBrowserFeedbackRuntime();

    expect(AudioContextStub).not.toHaveBeenCalled();

    runtime.playSound('mission-complete');

    expect(AudioContextStub).toHaveBeenCalledTimes(1);
    expect(createOscillator).toHaveBeenCalledTimes(1);
    expect(createGain).toHaveBeenCalledTimes(1);
    expect(setFrequency).toHaveBeenCalledWith(783.99, 10);
    expect(setGain).toHaveBeenCalledWith(0.0001, 10);
    expect(linearRamp).toHaveBeenNthCalledWith(1, 0.18, 10.01);
    expect(linearRamp).toHaveBeenNthCalledWith(2, 0.0001, 10.12);
    expect(connectOscillator).toHaveBeenCalled();
    expect(connectGain).toHaveBeenCalled();
    expect(start).toHaveBeenCalledWith(10);
    expect(stop).toHaveBeenCalledWith(10.12);

    runtime.dispose();
    runtime.dispose();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('swallows missing or throwing browser audio and vibration APIs', () => {
    const AudioContextStub = vi.fn(() => {
      throw new Error('audio unavailable');
    });
    const vibrate = vi.fn(() => {
      throw new Error('vibration unavailable');
    });

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { webkitAudioContext: AudioContextStub },
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { vibrate },
    });

    const runtime = createBrowserFeedbackRuntime();

    expect(() => runtime.playSound('input-wrong')).not.toThrow();
    expect(() => runtime.vibrate(vibrationPatterns['input-wrong'])).not.toThrow();
    expect(() => runtime.dispose()).not.toThrow();
    expect(() => runtime.dispose()).not.toThrow();
    expect(vibrate).toHaveBeenCalledWith([40, 25, 40]);
  });

  it('ignores vibration requests when navigator.vibrate is unavailable', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });

    const runtime = createBrowserFeedbackRuntime();

    expect(() => runtime.vibrate(vibrationPatterns['input-correct'])).not.toThrow();
    expect(() => runtime.playSound('input-correct')).not.toThrow();
  });
});

describe('test constants', () => {
  it('define expected event mappings explicitly', () => {
    expect(Object.keys(vibrationPatterns)).toEqual([
      'input-correct',
      'input-wrong',
      'recovery-used',
      'point-complete',
      'mission-complete',
    ]);
    expect(soundFrequencies['input-correct']).toBe(523.25);
  });
});
