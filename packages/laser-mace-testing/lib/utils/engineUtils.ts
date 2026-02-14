import { createCubeEntity, queueAdd, MeshComponent } from 'laser-mace-engine';

type Vec3 = { x: number; y: number; z: number };

interface EngineUtilsOptions {
  world: any;
  entities: any[];
  onEvent?: (msg: string) => void;
}

const spawnLandmark = (
  world: any,
  entities: any[],
  onEvent: ((msg: string) => void) | undefined,
  position: Vec3,
) => {
  queueAdd(world, (w) => {
    const lm = createCubeEntity({
      world: w,
      position,
      color: 0xff0000,
      bodyType: 'fixed',
      immovable: true,
      friction: 0,
      size: 2,
      stationary: true,
    });
    entities.push(lm);
    onEvent?.(`Spawned landmark ${lm.id}`);
  });
};

const spawnLineLandmark = (
  world: any,
  entities: any[],
  onEvent: ((msg: string) => void) | undefined,
  position: Vec3,
  axis: 'x' | 'y' | 'z',
  length: number,
  thickness = 2,
) => {
  queueAdd(world, (w) => {
    const line = createCubeEntity({
      world: w,
      position,
      color: 0xff0000,
      bodyType: 'fixed',
      immovable: true,
      friction: 0,
      size: thickness,
      stationary: true,
    });
    const mesh = line.getComponent(MeshComponent)?.mesh;
    if (mesh) {
      const stretch = length / thickness;
      if (axis === 'x') {
        mesh.scale.set(stretch, 1, 1);
      } else if (axis === 'y') {
        mesh.scale.set(1, stretch, 1);
      } else {
        mesh.scale.set(1, 1, stretch);
      }
    }
    entities.push(line);
    onEvent?.(`Spawned boundary line ${line.id}`);
  });
};

export const createEngineUtils = ({ world, entities, onEvent }: EngineUtilsOptions) => {
  const spawnBoundaryLandmarks = (
    boundary: number,
    spacing: number,
    style: 'dots' | 'lines' = 'dots',
  ) => {
    const max = boundary;
    const step = spacing;
    if (step <= 0 || max < 0) {
      return;
    }
    if (max === 0) {
      spawnLandmark(world, entities, onEvent, { x: 0, y: 0, z: 0 });
      return;
    }
    if (style === 'lines') {
      const half = max / 2;
      const corners = [0, max];
      for (const y of corners) {
        for (const z of corners) {
          spawnLineLandmark(world, entities, onEvent, { x: half, y, z }, 'x', max);
        }
      }
      for (const x of corners) {
        for (const z of corners) {
          spawnLineLandmark(world, entities, onEvent, { x, y: half, z }, 'y', max);
        }
      }
      for (const x of corners) {
        for (const y of corners) {
          spawnLineLandmark(world, entities, onEvent, { x, y, z: half }, 'z', max);
        }
      }
      return;
    }

    for (let y = 0; y <= max; y += step) {
      for (let z = 0; z <= max; z += step) {
        spawnLandmark(world, entities, onEvent, { x: 0, y, z });
        spawnLandmark(world, entities, onEvent, { x: max, y, z });
      }
    }

    for (let x = step; x < max; x += step) {
      for (let z = 0; z <= max; z += step) {
        spawnLandmark(world, entities, onEvent, { x, y: 0, z });
        spawnLandmark(world, entities, onEvent, { x, y: max, z });
      }
    }

    for (let x = step; x < max; x += step) {
      for (let y = step; y < max; y += step) {
        spawnLandmark(world, entities, onEvent, { x, y, z: 0 });
        spawnLandmark(world, entities, onEvent, { x, y, z: max });
      }
    }
  };

  return {
    spawnBoundaryLandmarks,
  };
};
