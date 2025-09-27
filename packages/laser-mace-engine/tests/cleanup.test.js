import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from 'ecsy';
import { RenderSystem } from '../dist/engine/systems/RenderSystem.js';
import { RapierSystem } from '../dist/engine/systems/RapierSystem.js';
import { Position } from '../dist/engine/components/Position.js';
import { MeshComponent } from '../dist/engine/components/Mesh.js';
import { Mesh } from 'three';
import { Velocity } from '../dist/engine/components/Velocity.js';
import { Collider } from '../dist/engine/components/Collider.js';

test('RenderSystem removes meshes when entities are deleted', () => {
  const world = new World();
  world
    .registerComponent(Position)
    .registerComponent(MeshComponent)
    .registerSystem(RenderSystem);

  const mesh = new Mesh();
  const entity = world
    .createEntity()
    .addComponent(Position, { x: 1, y: 2, z: 3, updatedAt: 0 })
    .addComponent(MeshComponent, { mesh });

  const renderSystem = world.getSystem(RenderSystem);

  world.execute(0);
  assert.equal(renderSystem.objectCount(), 1);

  entity.remove();
  world.execute(0);
  assert.equal(renderSystem.objectCount(), 0);

  renderSystem.dispose();
  assert.equal(renderSystem.objectCount(), 0);
});

test('RapierSystem removes bodies when entities are deleted', async () => {
  const world = new World();
  world
    .registerComponent(Position)
    .registerComponent(Velocity)
    .registerComponent(Collider)
    .registerSystem(RapierSystem);

  const rapierSystem = world.getSystem(RapierSystem);

  while (!rapierSystem.world) {
    await new Promise(r => setTimeout(r, 0));
  }

  const entity = world
    .createEntity()
    .addComponent(Position)
    .addComponent(Velocity)
    .addComponent(Collider, { size: 1 });

  world.execute(0);
  assert.equal(rapierSystem.bodyCount(), 1);

  entity.remove();
  world.execute(0);
  world.execute(0);
  assert.equal(rapierSystem.bodyCount(), 0);

  rapierSystem.dispose();
  assert.equal(rapierSystem.bodyCount(), 0);
});
