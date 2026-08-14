import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createGltfLoader(): GLTFLoader {
  return new GLTFLoader();
}

export function loadGltf(loader: GLTFLoader, url: string): Promise<GLTF> {
  return loader.loadAsync(url);
}
