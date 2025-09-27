import { vecLength } from './utils';

/**
 * Factory for camera utilities to keep engine free of view logic.
 */
export function createCameraController(renderSystem: any) {
  const camera = renderSystem?.camera;
  let orbitFrame: number | null = null;
  let orbitAngle = 0;
  let orbitRadius = 0;

  const adjustZoom = (delta: number) => {
    if (!camera) return undefined as number | undefined;
    const dist = vecLength(camera.position) || 1;
    const newDist = Math.max(10, dist + delta);
    const scale = newDist / dist;
    camera.position.multiplyScalar(scale);
    return newDist;
  };

  const zoomIn = () => adjustZoom(-10);
  const zoomOut = () => adjustZoom(10);

  function orbitCamera() {
    if (!camera) return;
    orbitRadius = vecLength(camera.position);
    const animate = () => {
      orbitAngle += 0.01;
      camera.position.x = orbitRadius * Math.cos(orbitAngle);
      camera.position.z = orbitRadius * Math.sin(orbitAngle);
      camera.lookAt(0, 0, 0);
      orbitFrame = requestAnimationFrame(animate);
    };
    if (orbitFrame) cancelAnimationFrame(orbitFrame);
    animate();
  }

  function stopOrbit() {
    if (orbitFrame) {
      cancelAnimationFrame(orbitFrame);
      orbitFrame = null;
    }
  }

  return { adjustZoom, zoomIn, zoomOut, orbitCamera, stopOrbit };
}
