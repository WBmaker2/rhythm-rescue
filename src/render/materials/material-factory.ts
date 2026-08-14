import * as THREE from 'three';

export const RESCUE_PALETTE = {
  space: '#061426',
  platform: '#122b48',
  cyan: '#42e8ff',
  lime: '#9cff57',
  orange: '#ff9f43',
  pink: '#ff6ea8',
  gold: '#ffd166',
  white: '#edfaff',
} as const;

export function createStandardMaterial(
  color: THREE.ColorRepresentation,
  options: Partial<Pick<THREE.MeshStandardMaterialParameters, 'roughness' | 'metalness'>> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.58,
    metalness: options.metalness ?? 0.18,
  });
}

export function createGlowMaterial(
  color: THREE.ColorRepresentation,
  intensity = 2.2,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0.25,
  });
}

export function disposeGroup(group: THREE.Group): void {
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }
  });
}
