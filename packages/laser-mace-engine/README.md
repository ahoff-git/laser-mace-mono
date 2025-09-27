# Laser Mace Engine

Laser Mace Engine is an Entity‑Component‑System (ECS) based game engine built on [ecsy](https://ecsy.io/), [three.js](https://threejs.org/) for rendering, and [Rapier](https://rapier.rs/) for physics.

## Installation

```bash
npm install laser-mace-engine three @dimforge/rapier3d-compat
```

## Creating a world

The engine exposes a `createWorld` factory that registers components and systems with an ECSY world. Components describe data on entities, while systems implement behaviour.

```ts
import {
  createWorld,
  Position,
  Velocity,
  MoveSystem,
  RenderSystem,
  RapierSystem,
  createCubeEntity,
} from "laser-mace-engine";

// create the ECS world and register components
const world = createWorld({
  components: [Position, Velocity],
});

// systems can be registered after world creation, optionally with attributes
const canvas = document.getElementById("game") as HTMLCanvasElement;
world
  .registerSystem(MoveSystem)
  .registerSystem(RenderSystem, { canvas })
  .registerSystem(RapierSystem, {
    gravity: { x: 0, y: -9.81, z: 0 },
  });

// spawn a cube entity using the provided factory
createCubeEntity({
  world,
  velocity: { x: 1, y: 0, z: 0 },
  size: 2,
});

// basic game loop
let last = performance.now();
function loop(time: number) {
  const delta = (time - last) / 1000; // seconds since last frame
  world.execute(delta);
  last = time;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

## API overview

- **Components**: `Position`, `Velocity`, `MeshComponent`, `Collider`, `BodyType`, `Immovable`
- **Systems**: `MoveSystem`, `RenderSystem`, `RapierSystem`, `BoundarySystem`, `PhysicsSystem`, `WrapSystem`
- **Utilities**: `createCubeEntity`, `generateBoundaryLandmarks`, `cameraController`, `RapierSync`

See the [lib/engine](lib/engine) directory for full source and additional utilities.

### Updating from Immovable to BodyType

`RapierSystem` now requires the `BodyType` component to decide how a rigid body should be created.
To keep an entity fixed in place, add `BodyType` with `{ value: 'fixed' }` instead of relying on
`Immovable`. `Immovable` is still available for UI logic, but it no longer affects the physics
integration.

## Building from source

To build the TypeScript sources to JavaScript:

```bash
npm install
npm run build
```

Lint the source:

```bash
npm run lint
```
