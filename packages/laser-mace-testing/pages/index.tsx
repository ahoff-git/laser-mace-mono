import { useCallback, useEffect, useRef, useState } from 'react';
import { createLaserMaceEngine, type Engine, type SpawnArgs } from '../lib/laserMaceEngine';
import styles from './index.module.css';

const BOUNDARY = 300;
const LANDMARK_SPACING = 25;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const startedRef = useRef(false);
  const [spawnCount, setSpawnCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return undefined;
    startedRef.current = true;

    const engine = createLaserMaceEngine({
      canvas,
      boundary: BOUNDARY,
    });
    engineRef.current = engine;
    engine.utils.spawnBoundaryLandmarks(BOUNDARY, LANDMARK_SPACING, "lines");

    const { renderSystem } = engine;
    const renderer = renderSystem?.renderer;
    const camera = renderSystem?.camera;

//todo make the camera directly above 
    renderer?.setClearColor?.(0x111111, 1);
    if (camera) {
      camera.position.x = BOUNDARY * 0.5;
      camera.position.y = BOUNDARY;
      camera.position.z = BOUNDARY * 0.5;
      camera.lookAt(BOUNDARY * 0.5, 0, BOUNDARY * 0.5);
    }

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      renderer?.setPixelRatio?.(dpr);
      renderer?.setSize?.(width, height);
      if (camera) {
        camera.aspect = height === 0 ? 1 : width / height;
        camera.updateProjectionMatrix?.();
      }
    };

    resize();
    window.addEventListener('resize', resize);
    engine.start();

    return () => {
      window.removeEventListener('resize', resize);
      engine.stop();
      renderSystem?.dispose?.();
      engineRef.current = null;
      startedRef.current = false;
    };
  }, []);

  const handleSpawn = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const randomWithin = (range: number) => Math.random() * range;
    const size = 4 + Math.random() * 6;

    const spawnArgs: SpawnArgs = {
      from: {
        x: randomWithin(BOUNDARY),
        y: 0,
        z: randomWithin(BOUNDARY),
      },
      velocity: {
        x: randomWithin(20),
        y: -30 - Math.random() * 20,
        z: randomWithin(20),
      },
      size,
    };

    engine.spawn(spawnArgs);

    setSpawnCount((count) => count + 1);
  }, []);

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.stage} />
      <div className={styles.hud}>
        <h1 className={styles.heading}>Laser Mace Sandbox</h1>
        <div className={styles.controls}>
          <button type="button" className={styles.button} onClick={handleSpawn}>
            Spawn
          </button>
          <span className={styles.count}>Spawned: {spawnCount}</span>
        </div>
      </div>
    </div>
  );
}
