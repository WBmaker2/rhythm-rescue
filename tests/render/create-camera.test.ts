import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createFollowCamera } from '../../src/render/app/create-camera';

describe('follow camera', () => {
  it('keeps a positive distance behind the target after an update', () => {
    const target = new THREE.Object3D();
    target.position.set(2, 0, -3);
    const follow = createFollowCamera();

    follow.update(target, 16);

    expect(follow.camera.position.distanceTo(target.position)).toBeGreaterThan(1);
  });
});
