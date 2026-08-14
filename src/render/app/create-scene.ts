import * as THREE from 'three';
import { RESCUE_PALETTE, createGlowMaterial, createStandardMaterial } from '../materials/material-factory';

export interface GameScene {
  scene: THREE.Scene;
  world: THREE.Group;
}

export function createGameScene(): GameScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(RESCUE_PALETTE.space);
  scene.fog = new THREE.Fog(RESCUE_PALETTE.space, 18, 76);

  const world = new THREE.Group();
  world.name = 'rescue-world';
  scene.add(world);

  scene.add(new THREE.HemisphereLight(0x8feaff, 0x061426, 1.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(6, 10, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const beacon = new THREE.PointLight(RESCUE_PALETTE.cyan, 7, 18, 2);
  beacon.position.set(0, 3.5, 0);
  world.add(beacon);

  const stars = new THREE.Group();
  const starGeometry = new THREE.SphereGeometry(0.025, 5, 4);
  const starMaterial = createGlowMaterial(RESCUE_PALETTE.white, 1.6);
  for (let index = 0; index < 90; index += 1) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    const angle = index * 2.399963;
    const radius = 16 + (index % 9) * 3.2;
    star.position.set(Math.cos(angle) * radius, 5 + (index % 7) * 1.8, Math.sin(angle) * radius - 10);
    stars.add(star);
  }
  world.add(stars);

  const horizon = new THREE.Mesh(
    new THREE.CircleGeometry(42, 64),
    createStandardMaterial(0x0b1e36, { roughness: 0.92, metalness: 0.04 }),
  );
  horizon.rotation.x = -Math.PI / 2;
  horizon.position.y = -0.35;
  horizon.receiveShadow = true;
  world.add(horizon);

  return { scene, world };
}
