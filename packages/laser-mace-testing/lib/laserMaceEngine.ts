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
  WrapSystem,
  SpawnSystem,
  CleanupSystem,
  queueAdd,
  queueRemove,
  createCubeEntity,
  generateBoundaryLandmarks,
  createCameraController,
  BodyType
} from 'laser-mace-engine';

type Vec3 = { x: number; y: number; z: number };

interface EngineOptions {
  canvas: HTMLCanvasElement;
  boundary: number;
  landmarkSpacing: number;
  onEvent?: (msg: string) => void;
  onUpdate?: (data: any[]) => void;
}

export function createLaserMaceEngine({
  canvas,
  boundary,
  landmarkSpacing,
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
      min: { x: -boundary, y: -boundary, z: -boundary },
      max: { x: boundary, y: boundary, z: boundary },
    },
  });

  world.registerSystem(RenderSystem, { canvas });
  world.registerSystem(WrapSystem, {
    width: boundary * 2,
    height: boundary * 2,
    depth: boundary * 2,
  });
  world.registerSystem(CleanupSystem);

  const renderSystem = world.getSystem(RenderSystem);
  const entities: any[] = [];
  const {
    adjustZoom,
    zoomIn,
    zoomOut,
    orbitCamera,
    stopOrbit,
  } = createCameraController(renderSystem);

  // Populate world with boundary landmarks so users can orient themselves.
  generateBoundaryLandmarks(boundary, landmarkSpacing).forEach((pos) => {
    queueAdd(world, (w) => {
      const lm = createCubeEntity({
        world: w,
        position: pos,
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
  });

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

  function clearMoving() {
    const moving = entities.filter((e) => !e.stationary);
    moving.forEach((e) => {
      queueRemove(world, e);
    });
    for (let i = entities.length - 1; i >= 0; i -= 1) {
      if (!entities[i].stationary) entities.splice(i, 1);
    }
    onUpdate?.([]);
    onEvent?.('Cleared moving entities');
  }

  return {
    world,
    renderSystem,
    entities,
    start,
    stop,
    spawn,
    clearMoving,
    adjustZoom,
    zoomIn,
    zoomOut,
    orbitCamera,
    stopOrbit,
  };
}

