import * as THREE from 'three';
import type { Direction } from '../../core/types';
import { RESCUE_PALETTE, createGlowMaterial } from '../materials/material-factory';

export interface EnergyRailsView {
  root: THREE.Group;
  pulse(direction: Direction): void;
}

export function createEnergyRails(): EnergyRailsView {
  const root = new THREE.Group();
  root.name = 'energy-rails';
  const railMaterial = createGlowMaterial(RESCUE_PALETTE.cyan, 1.8);
  const railGeometry = new THREE.BoxGeometry(0.11, 0.05, 4.4);

  for (const [direction, x, z, rotation] of [
    ['up', 0, -3.2, 0],
    ['right', 3.2, 0, Math.PI / 2],
    ['down', 0, 3.2, 0],
    ['left', -3.2, 0, Math.PI / 2],
  ] as const) {
    const rail = new THREE.Mesh(railGeometry, railMaterial.clone());
    rail.name = `energy-rail-${direction}`;
    rail.position.set(x, 0.12, z);
    rail.rotation.y = rotation;
    root.add(rail);
  }

  return {
    root,
    pulse(direction) {
      const rail = root.getObjectByName(`energy-rail-${direction}`);
      if (!rail) return;
      rail.scale.y = 1.45;
      window.setTimeout(() => {
        rail.scale.y = 1;
      }, 180);
    },
  };
}
