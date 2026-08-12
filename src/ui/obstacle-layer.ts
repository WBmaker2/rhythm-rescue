import type { ObstacleType } from '../core/types';

export function createObstacleLayer(type: ObstacleType): HTMLDivElement | null {
  if (type === 'none') return null;

  const layer = document.createElement('div');
  layer.className = `obstacle-layer obstacle-${type}`;
  layer.setAttribute('aria-hidden', 'true');

  if (type === 'drone' || type === 'mixed') {
    const drone = document.createElement('span');
    drone.className = 'obstacle-drone';
    drone.textContent = 'DRONE SCAN';
    layer.append(drone);
  }
  if (type === 'occluder' || type === 'mixed') {
    const occluder = document.createElement('span');
    occluder.className = 'obstacle-occluder';
    occluder.textContent = 'SIGNAL SHIELD';
    layer.append(occluder);
  }

  return layer;
}
