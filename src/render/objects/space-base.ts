import * as THREE from 'three';
import { RESCUE_PALETTE, createGlowMaterial, createStandardMaterial } from '../materials/material-factory';

export function createSpaceBase(): THREE.Group {
  const base = new THREE.Group();
  base.name = 'space-base';

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(7.5, 8.1, 0.45, 48),
    createStandardMaterial(RESCUE_PALETTE.platform, { roughness: 0.42, metalness: 0.54 }),
  );
  platform.position.y = -0.1;
  platform.receiveShadow = true;
  base.add(platform);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(7.1, 0.08, 10, 64),
    createGlowMaterial(RESCUE_PALETTE.cyan, 1.7),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.16;
  base.add(rim);

  const antenna = new THREE.Group();
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.14, 3.3, 8),
    createStandardMaterial(RESCUE_PALETTE.white, { metalness: 0.7, roughness: 0.28 }),
  );
  mast.position.set(-4.4, 1.6, -2.6);
  antenna.add(mast);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 8),
    createGlowMaterial(RESCUE_PALETTE.orange, 3),
  );
  beacon.position.set(-4.4, 3.35, -2.6);
  antenna.add(beacon);
  base.add(antenna);

  for (const [x, z, color] of [
    [-3.6, 2.4, RESCUE_PALETTE.gold],
    [3.8, -2.4, RESCUE_PALETTE.lime],
  ] as const) {
    const module = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.72, 1.2),
      createStandardMaterial(color, { roughness: 0.35, metalness: 0.38 }),
    );
    module.position.set(x, 0.45, z);
    module.castShadow = true;
    base.add(module);
  }

  return base;
}
