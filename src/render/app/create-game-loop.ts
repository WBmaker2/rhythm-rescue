import * as THREE from 'three';

export interface GameLoop {
  start(): void;
  stop(): void;
}

export function createGameLoop(
  renderer: THREE.WebGLRenderer,
  render: (deltaMs: number) => void,
): GameLoop {
  let previousTime = performance.now();
  let running = false;

  const frame = (time: number): void => {
    if (!running) return;
    const deltaMs = Math.min(50, Math.max(0, time - previousTime));
    previousTime = time;
    render(deltaMs);
  };

  return {
    start() {
      if (running) return;
      running = true;
      previousTime = performance.now();
      renderer.setAnimationLoop(frame);
    },
    stop() {
      running = false;
      renderer.setAnimationLoop(null);
    },
  };
}
