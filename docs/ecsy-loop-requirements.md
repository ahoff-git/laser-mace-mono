# ECSY Loop Requirements

These requirements are sourced from the latest specification provided by the project owner.

## Loop Overview
- The ECSY game loop must run in three phases: **Input**, **Simulation**, and **Rendering**.
- Systems execute in the following order each tick: **Input -> Movement -> Physics -> Networking -> Rendering**.
- All subsystems must exchange data solely through ECS components that include `updatedAt` timestamps so that Rapier, Three.js, and PeerNet remain stateless and ECS stays the single source of truth.

## Phase Details
### Input Phase
- Input systems gather raw input from devices or UI.
- They push the resulting intents/commands into a queue for later consumption.

### Simulation Phase
- **Movement System** consumes the queued commands and applies them to entities.
  - It updates ECS transform components directly.
- **Physics System** owns the Rapier world.
  - Each tick it consumes ECS transforms and the `BodyType` component.
  - It creates or updates Rapier rigid bodies and colliders as needed.
  - It steps the Rapier simulation when required.
  - It writes the simulation results back into ECS components.
  - Entities marked `fixed` or `kinematic` remain stationary unless moved by game logic.
  - Entities marked `dynamic` follow Rapier physics.
- **Networking System (PeerNet)** runs after movement and physics.
  - It performs diff-based sync of authoritative state to peers.
  - It applies incoming state updates.
  - It buffers and interpolates data to provide smooth playback.

### Rendering Phase
- Rendering systems consume ECS transforms to update Three.js meshes.
- The camera should be orthographic to achieve the 2.5D look.
- Sprites are rendered as billboards.

## Constraints
- No shim modules are permitted; systems must use the actual runtime libraries.
- Rapier, Three.js, and PeerNet integrations rely entirely on ECS data (stateless subsystems).

