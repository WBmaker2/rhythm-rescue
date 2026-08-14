import * as THREE from 'three';

export interface FollowCamera {
  camera: THREE.PerspectiveCamera;
  update(target: THREE.Object3D, deltaMs: number): void;
}

export function createFollowCamera(): FollowCamera {
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0, 4.2, 7.2);

  return {
    camera,
    update(target, deltaMs) {
      const desired = target.position.clone().add(new THREE.Vector3(0, 3.2, 6.4));
      const alpha = 1 - Math.pow(0.001, Math.min(deltaMs, 50) / 1000);
      camera.position.lerp(desired, alpha);
      camera.lookAt(target.position.x, target.position.y + 0.9, target.position.z);
    },
  };
}
