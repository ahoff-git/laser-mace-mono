# Laser Mace Engine

Laser Mace Engine is an Entity-Component-System (ECS) oriented runtime built on top of
[ecsy](https://ecsy.io/) for orchestration, [three.js](https://threejs.org/) for rendering, and
[Rapier](https://rapier.rs/) for deterministic physics.

## Installation

```bash
pnpm add laser-mace-engine three @dimforge/rapier3d-compat
```
## Systems overview

- `MovementSystem` integrates velocity into position for entities that are not controlled by Rapier.
  Entities with a `Collider` component are skipped so Rapier remains the source of truth for collision
  resolution.
- `RapierSystem` creates rigid bodies/colliders, advances the Rapier world, and keeps ECS components in
  sync. Use it when you need physics or collision events.
- `RenderSystem` keeps three.js meshes in sync with ECS positions and removes them when entities die.
- `BoundarySystem`, `WrapSystem`, `SpawnSystem`, and `CleanupSystem` target specific gameplay
  scenarios.

## Components

Core data types shipped with the engine:

- `Position`: 3D translation with `updatedAt` bookkeeping for change detection.
- `Velocity`: 3D linear velocity plus `updatedAt` timestamps.
- `Collider`: simple cube collider data with size/friction hints for Rapier bodies.
- `BodyType`: configure newly spawned Rapier bodies (`dynamic`, `kinematic`, or `fixed`).
- `MeshComponent`: wraps the three.js mesh instance bound to an entity.
- `Destroy` / `Immovable`: helper tags used by utility systems and UI layers.

## Utilities

- `createCubeEntity` spawns a textured cube with sensible defaults (mesh, collider, velocity).
- `RapierSync` provides hooks if you need to customize how Rapier data maps to ECS components.
- `cameraController` support basic arena setups.

## Building from source

```bash
pnpm install
pnpm build
pnpm lint
```