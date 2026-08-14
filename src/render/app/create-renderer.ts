import * as THREE from 'three';

export interface RendererHandle {
  renderer: THREE.WebGLRenderer;
  resize(): void;
  dispose(): void;
}

export function createRenderer(container: HTMLElement): RendererHandle {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x061426, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const resize = (): void => {
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    renderer.setSize(width, height, false);
  };

  const onContextLost = (event: Event): void => {
    event.preventDefault();
  };

  window.addEventListener('resize', resize);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  resize();

  return {
    renderer,
    resize,
    dispose() {
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
