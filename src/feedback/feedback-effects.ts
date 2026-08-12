import type { FeedbackBus, FeedbackEvent } from '../core/feedback';
import type { ProgressSettings } from '../core/progression';

export interface FeedbackRuntime {
  playSound(event: FeedbackEvent): void;
  vibrate(pattern: readonly number[]): void;
  dispose(): void;
}

export interface FeedbackEffects {
  dispose(): void;
}

const VIBRATION_PATTERNS: Record<FeedbackEvent, readonly number[]> = {
  'input-correct': [18],
  'input-wrong': [40, 25, 40],
  'recovery-used': [15, 20, 15],
  'point-complete': [25, 15, 35],
  'mission-complete': [30, 20, 30, 20, 45],
};

const SOUND_FREQUENCIES: Record<FeedbackEvent, number> = {
  'input-correct': 523.25,
  'input-wrong': 220,
  'recovery-used': 392,
  'point-complete': 659.25,
  'mission-complete': 783.99,
};

const ATTACK_SECONDS = 0.01;
const RELEASE_SECONDS = 0.12;
const PEAK_GAIN = 0.18;
const SILENT_GAIN = 0.0001;

type AudioContextLike = {
  readonly currentTime: number;
  readonly destination: AudioNode;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
  close(): Promise<void> | void;
};

type AudioContextConstructorLike = new () => AudioContextLike;

type WindowWithAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructorLike;
  };

export function createBrowserFeedbackRuntime(): FeedbackRuntime {
  let audioContext: AudioContextLike | null = null;
  let disposed = false;

  const getAudioContext = (): AudioContextLike | null => {
    if (disposed) {
      return null;
    }

    if (audioContext) {
      return audioContext;
    }

    try {
      const browserWindow = globalThis.window as WindowWithAudioContext | undefined;
      const AudioContextConstructor =
        browserWindow?.AudioContext ?? browserWindow?.webkitAudioContext;

      if (!AudioContextConstructor) {
        return null;
      }

      audioContext = new AudioContextConstructor();
      return audioContext;
    } catch {
      return null;
    }
  };

  return {
    playSound(event) {
      const context = getAudioContext();
      if (!context) {
        return;
      }

      try {
        const startTime = context.currentTime;
        const stopTime = startTime + RELEASE_SECONDS;
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(SOUND_FREQUENCIES[event], startTime);
        gain.gain.setValueAtTime(SILENT_GAIN, startTime);
        gain.gain.linearRampToValueAtTime(PEAK_GAIN, startTime + ATTACK_SECONDS);
        gain.gain.linearRampToValueAtTime(SILENT_GAIN, stopTime);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(startTime);
        oscillator.stop(stopTime);
      } catch {
        return;
      }
    },

    vibrate(pattern) {
      try {
        globalThis.navigator?.vibrate?.([...pattern]);
      } catch {
        return;
      }
    },

    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      const context = audioContext;
      audioContext = null;

      if (!context) {
        return;
      }

      try {
        void context.close();
      } catch {
        return;
      }
    },
  };
}

export function createFeedbackEffects(
  bus: FeedbackBus,
  settings: ProgressSettings,
  runtime: FeedbackRuntime = createBrowserFeedbackRuntime(),
): FeedbackEffects {
  let disposed = false;

  const unsubscribe = bus.subscribe((event) => {
    if (settings.sound) {
      try {
        runtime.playSound(event);
      } catch {
        // Feedback failures must not escape into gameplay.
      }
    }

    if (settings.vibration) {
      try {
        runtime.vibrate(VIBRATION_PATTERNS[event]);
      } catch {
        // Feedback failures must not escape into gameplay.
      }
    }
  });

  return {
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      unsubscribe();

      try {
        runtime.dispose();
      } catch {
        // Feedback failures must not escape into gameplay.
      }
    },
  };
}
