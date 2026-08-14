import * as THREE from 'three';
import type { Direction } from '../../core/types';
import { RESCUE_PALETTE, createGlowMaterial, createStandardMaterial } from '../materials/material-factory';

export interface RescueAgentView {
  root: THREE.Group;
  moveTo(direction: Direction): void;
  update(deltaMs: number): void;
}

const DIRECTIONS: Record<Direction, THREE.Vector3> = {
  up: new THREE.Vector3(0, 0, -2.1),
  right: new THREE.Vector3(2.1, 0, 0),
  down: new THREE.Vector3(0, 0, 2.1),
  left: new THREE.Vector3(-2.1, 0, 0),
};

export function createRescueAgent(): RescueAgentView {
  const root = new THREE.Group();
  root.name = 'rescue-agent';
  root.position.set(0, 0.55, 3.8);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.46, 0.74, 5, 12),
    createStandardMaterial(RESCUE_PALETTE.cyan, { metalness: 0.36, roughness: 0.32 }),
  );
  body.castShadow = true;
  root.add(body);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.43, 16, 10),
    createGlowMaterial(RESCUE_PALETTE.white, 0.5),
  );
  helmet.position.y = 0.78;
  helmet.scale.set(1, 0.82, 0.95);
  helmet.castShadow = true;
  root.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.18, 0.1),
    createGlowMaterial(RESCUE_PALETTE.lime, 2.5),
  );
  visor.position.set(0, 0.78, -0.38);
  root.add(visor);

  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.75, 0.24),
    createStandardMaterial(RESCUE_PALETTE.orange, { metalness: 0.3, roughness: 0.4 }),
  );
  pack.position.set(0, 0.32, 0.43);
  pack.castShadow = true;
  root.add(pack);

  const target = root.position.clone();
  let bob = 0;
  let facing = 0;

  return {
    root,
    moveTo(direction) {
      target.copy(root.position).add(DIRECTIONS[direction]);
      facing = Math.atan2(DIRECTIONS[direction].x, -DIRECTIONS[direction].z);
    },
    update(deltaMs) {
      const alpha = 1 - Math.pow(0.001, Math.min(deltaMs, 50) / 1000);
      root.position.lerp(target, alpha);
      root.rotation.y += (facing - root.rotation.y) * alpha;
      bob += deltaMs * 0.006;
      body.position.y = Math.sin(bob) * 0.04;
    },
  };
}
