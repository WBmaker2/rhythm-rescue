import * as THREE from 'three';
import { RESCUE_PALETTE, createGlowMaterial, createStandardMaterial } from '../materials/material-factory';

export interface RepairTargetView {
  root: THREE.Group;
  setRepairPower(power: number): void;
  update(deltaMs: number): void;
}

export function createRepairTarget(): RepairTargetView {
  const root = new THREE.Group();
  root.name = 'repair-target';
  root.position.set(0, 0.65, -0.2);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 1.12, 1.3),
    createStandardMaterial(RESCUE_PALETTE.white, { metalness: 0.56, roughness: 0.3 }),
  );
  body.castShadow = true;
  root.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.68, 1.05),
    createStandardMaterial(RESCUE_PALETTE.cyan, { metalness: 0.42, roughness: 0.35 }),
  );
  head.position.y = 0.95;
  head.castShadow = true;
  root.add(head);

  const eye = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.15, 0.08),
    createGlowMaterial(RESCUE_PALETTE.pink, 2.3),
  );
  eye.position.set(0, 0.96, -0.54);
  root.add(eye);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.36, 0.055, 10, 48),
    createGlowMaterial(RESCUE_PALETTE.cyan, 1.8),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.54;
  root.add(ring);

  let power = 0.25;
  root.userData.repairPower = power;
  return {
    root,
    setRepairPower(value) {
      power = Math.max(0.25, Math.min(1, value));
      root.userData.repairPower = power;
      ring.scale.setScalar(0.88 + power * 0.16);
    },
    update(deltaMs) {
      ring.rotation.z += deltaMs * 0.0008;
      head.rotation.y = Math.sin(performance.now() * 0.0012) * 0.08 * power;
    },
  };
}
