import {
  createWorld,
  Position,
  Velocity,
  MeshComponent,
  RenderSystem,
  Collider,
  RapierSystem,
  Immovable,
  Destroy,
  SpawnSystem,
  queueAdd,
  queueRemove,
  createCubeEntity,
  createCameraController,
  BodyType
} from 'laser-mace-engine';
import { createEngineUtils } from './utils/engineUtils';

type Vec3 = { x: number; y: number; z: number };

interface EngineOptions {
  canvas: HTMLCanvasElement;
  boundary: number;
  onEvent?: (msg: string) => void;
  onUpdate?: (data: any[]) => void;
}

export function createLaserMaceEngine({
  canvas,
  boundary,
  onEvent,
  onUpdate,
}: EngineOptions) {
  // Initialize world with common components.
  const world = createWorld({
    components: [
      Position,
      Velocity,
      MeshComponent,
      Collider,
      BodyType,
      Immovable,
      Destroy,
    ],
  });

  world.registerSystem(SpawnSystem);
  world.registerSystem(RapierSystem, {
    onCollision: (a: any, b: any, started: boolean) => {
      const msg = `${started ? 'Started' : 'Stopped'} collision ${a.id} <-> ${b.id}`;
      onEvent?.(msg);
    },
    bounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: boundary, y: boundary, z: boundary},
    },
  });

  world.registerSystem(RenderSystem, { canvas });

  const renderSystem = world.getSystem(RenderSystem);
  const entities: any[] = [];
  const {
    adjustZoom,
    zoomIn,
    zoomOut,
    orbitCamera,
    stopOrbit,
  } = createCameraController(renderSystem);

  const utils = createEngineUtils({ world, entities, onEvent });

  const extractData = (e: any) => ({
    id: e.id,
    position: e.getComponent(Position),
    velocity: e.getComponent(Velocity),
    stationary: !!e.stationary,
  });

  let frame: number | null = null;
  let last = 0;

  const tick = () => {
    const now = performance.now();
    const delta = (now - last) / 1000;
    last = now;
    world.execute(delta);
    onUpdate?.(entities.filter((e) => !e.stationary).map(extractData));
    frame = requestAnimationFrame(tick);
  };

  function start() {
    last = performance.now();
    tick();
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  }

  function spawn({ from, velocity, size }: { from: Vec3; velocity: Vec3; size: number }) {
    queueAdd(world, (w) => {
      const entity = createCubeEntity({
        world: w,
        position: from,
        velocity,
        color: Math.random() * 0xffffff,
        friction: 0,
        size,
      });
      entities.push(entity);
      onEvent?.(`Spawned entity ${entity.id}`);
    });
  }

  return {
    world,
    renderSystem,
    entities,
    start,
    stop,
    spawn,
    adjustZoom,
    zoomIn,
    zoomOut,
    orbitCamera,
    stopOrbit,
    utils,
  };
}

export type Engine = ReturnType<typeof createLaserMaceEngine>;
export type SpawnArgs = Parameters<Engine['spawn']>[0];

