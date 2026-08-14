import * as THREE from 'three';
import type { ObstacleType } from '../../core/types';
import { RESCUE_PALETTE, createGlowMaterial, createStandardMaterial } from '../materials/material-factory';

export interface ObstaclesView {
  root: THREE.Group;
  update(elapsedMs: number): void;
}

export function createObstacles(type: ObstacleType): ObstaclesView {
  const root = new THREE.Group();
  root.name = 'mission-obstacles';
  if (type === 'none') return { root, update: () => undefined };

  const drone = new THREE.Group();
  const droneBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 12, 8),
    createStandardMaterial(RESCUE_PALETTE.pink, { metalness: 0.48, roughness: 0.28 }),
  );
  drone.add(droneBody);
  const droneRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.05, 8, 20),
    createGlowMaterial(RESCUE_PALETTE.orange, 2.3),
  );
  droneRing.rotation.x = Math.PI / 2;
  drone.add(droneRing);
  drone.position.set(-3.6, 1.65, -1.2);
  drone.castShadow = true;
  root.add(drone);

  if (type === 'mixed') {
    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.08, 0.28),
      createGlowMaterial(RESCUE_PALETTE.pink, 1.4),
    );
    shield.position.set(0, 1.1, 1.7);
    shield.rotation.y = 0.2;
    root.add(shield);
  }

  return {
    root,
    update(elapsedMs) {
      drone.position.x = Math.sin(elapsedMs * 0.0012) * 4.2;
      drone.position.z = -1.2 + Math.cos(elapsedMs * 0.001) * 1.8;
      drone.rotation.y += 0.02;
      droneRing.rotation.z += 0.035;
    },
  };
}
