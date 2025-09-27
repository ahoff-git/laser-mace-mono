import { System } from 'ecsy';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Collider } from '../components/Collider';
import { BodyType, BodyTypeValue, DEFAULT_BODY_TYPE, normalizeBodyType } from '../components/BodyType';
import type * as RAPIERType from '@dimforge/rapier3d-compat';
import { Bounds } from '../types';
import { nowMs, massFromSize } from '../utils/common';

export interface RapierSystemConfig {
  gravity?: { x: number; y: number; z: number };
  /** Callback fired when two colliders start or stop colliding */
  onCollision?: (entityA: any, entityB: any, started: boolean) => void;
  /** Optional bounds to create static wall colliders */
  bounds?: Bounds;
  /** Fixed physics timestep in seconds (default 1/60) */
  fixedDelta?: number;
  /** Maximum substeps per execute to avoid spiral-of-death (default 5) */
  maxSubSteps?: number;
}

// Cache the Rapier module across HMR/StrictMode to avoid multiple WASM instances
const RAP_GLOBAL_KEY = '__LM_RAPIER_MODULE__';
async function loadRapierModule(): Promise<any> {
  const g: any = (globalThis as any);
  if (g[RAP_GLOBAL_KEY]) return g[RAP_GLOBAL_KEY];
  const modNs: any = await import('@dimforge/rapier3d-compat');
  const mod: any = modNs?.default ?? modNs;
  // Use the object-form to satisfy newer Rapier init API
  await mod.init({});
  g[RAP_GLOBAL_KEY] = mod;
  return mod;
}

export class RapierSystem extends System<RapierSystemConfig> {
  rapier: typeof import('@dimforge/rapier3d-compat') | null = null;
  world: RAPIERType.World | null = null;
  private bodyMap = new Map<number, RAPIERType.RigidBody>();
  private colliderMap = new Map<number, any>();
  private entityColliderMap = new Map<number, number>();
  private eventQueue: RAPIERType.EventQueue | null = null;
  private onCollision?: (entityA: any, entityB: any, started: boolean) => void;
  private pendingBounds?: Bounds;
  private pendingAdds: any[] = [];
  private pendingRemoves: any[] = [];
  private accumulator = 0;
  private fixedDelta = 1 / 60;
  private maxSubSteps = 5;

  /** Current number of physics bodies tracked by the system. */
  bodyCount(): number {
    return this.bodyMap.size;
  }

  init(attrs?: RapierSystemConfig): void {
    const gravity = attrs?.gravity ?? { x: 0, y: 0, z: 0 };
    this.onCollision = attrs?.onCollision;
    this.pendingBounds = attrs?.bounds;
    if (attrs?.fixedDelta) this.fixedDelta = attrs.fixedDelta;
    if (attrs?.maxSubSteps) this.maxSubSteps = attrs.maxSubSteps;
    loadRapierModule().then((mod) => {
      this.rapier = mod;
      this.world = new mod.World(gravity);
      // Temporarily disable EventQueue to avoid WASM panics observed in dev
      this.eventQueue = null as any;
      if (this.pendingBounds) {
        this.createBoundaryColliders(this.pendingBounds);
        this.pendingBounds = undefined;
      }
    });
  }

  execute(delta: number): void {
    if (!this.world) return;

    const added = (this.queries.movers.added as any[]) ?? [];
    const removed = (this.queries.movers.removed as any[]) ?? [];

    // Defer mutations to the physics world to a controlled phase
    for (const e of added) this.pendingAdds.push(e);
    for (const e of this.queries.movers.results) {
      if (!this.bodyMap.has(e.id)) this.pendingAdds.push(e);
    }
    for (const e of removed) this.pendingRemoves.push(e);

    // Proactively detect any stale entities and queue their removal before stepping
    if (this.colliderMap.size) {
      for (const [_handle, e] of this.colliderMap) {
        if (!e || (typeof e.alive === 'boolean' && e.alive === false)) {
          this.pendingRemoves.push(e);
        }
      }
    }

    // Apply pending removals first, then additions (before stepping)
    if (this.pendingRemoves.length) {
      const todo = this.pendingRemoves.splice(0);
      for (const e of todo) {
        try { this.removeBody(e); } catch (_) { /* retry next frame */ }
      }
    }

    if (this.pendingAdds.length) {
      const todo = this.pendingAdds.splice(0);
      for (const e of todo) {
        try { this.addBody(e); } catch (_) { /* retry next frame */ this.pendingAdds.push(e); }
      }
    }

    // step physics using a fixed timestep accumulator
    this.accumulator += delta;
    let steps = 0;
    while (this.accumulator >= this.fixedDelta && steps < this.maxSubSteps) {
      try {
        (this.world as any).timestep = this.fixedDelta;
        (this.world as any).step(this.eventQueue ?? undefined);
      } catch (_e) {
        break; // if WASM not ready or invalid state, bail this frame
      }
      this.accumulator -= this.fixedDelta;
      steps++;
    }

    // Collision events disabled while stabilizing WASM usage in dev.

    // sync components from bodies (read-only; no Rapier mutations)
    for (const entity of this.queries.movers.results) {
      const body = this.bodyMap.get(entity.id);
      if (!body) continue;
      const pos = entity.getMutableComponent(Position)! as any;
      const vel = entity.getMutableComponent(Velocity)! as any;
      try {
        if (typeof body.translation !== 'function' || typeof body.linvel !== 'function') {
          continue;
        }
        const t = body.translation();
        const v = body.linvel();
        // Only flag timestamp when values actually change
        if (pos.x !== t.x || pos.y !== t.y || pos.z !== t.z) {
          pos.x = t.x;
          pos.y = t.y;
          pos.z = t.z;
          pos.updatedAt = nowMs();
        }
        vel.x = v.x;
        vel.y = v.y;
        vel.z = v.z;
        vel.updatedAt = nowMs();
      } catch (_err) {
        // If the body became invalid for any reason, schedule a rebuild next tick
        this.pendingRemoves.push(entity);
        this.pendingAdds.push(entity);
      }
    }
  }

  private addBody(entity: any): void {
    if (!this.world || !this.rapier) return;

    const pos = entity.getComponent(Position)!;
    const vel = entity.getComponent(Velocity)!;
    const collider = entity.getComponent(Collider);
    const R = this.rapier as any;

    const bodyType = this.consumeBodyType(entity);
    const desc = this.createBodyDescriptor(R, bodyType)
      .setTranslation(pos.x, pos.y, pos.z);
    if (bodyType === 'dynamic') {
      desc.setLinvel(vel.x, vel.y, vel.z);
    }
    const size = collider ? ((collider as any).size ?? 1) : 1;
    if (bodyType === 'dynamic') {
      // Prevent extreme masses that could destabilize the simulation
      const mass = massFromSize(size);
      if (typeof desc.setAdditionalMass === 'function') {
        desc.setAdditionalMass(mass);
      }
    }
    const body = (this.world as any).createRigidBody(desc);

    const friction = collider ? ((collider as any).friction ?? 0) : 0; // default 0 to avoid drag
    const half = size / 2;
    const colDesc = R.ColliderDesc.cuboid(half, half, half)
      .setRestitution(0)
      .setFriction(friction);
    const col = (this.world as any).createCollider(colDesc, body);
    col.setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
    this.bodyMap.set(entity.id, body);
    this.colliderMap.set(col.handle, entity);
    this.entityColliderMap.set(entity.id, col.handle);
  }

  private consumeBodyType(entity: any): BodyTypeValue {
    const explicit = entity.getComponent(BodyType);
    if (!explicit) return DEFAULT_BODY_TYPE;
    const value = normalizeBodyType(explicit.value);
    entity.removeComponent(BodyType, true);
    return value;
  }

  private createBodyDescriptor(R: any, bodyType: BodyTypeValue): any {
    switch (bodyType) {
      case 'fixed':
        return R.RigidBodyDesc.fixed();
      case 'kinematic':
        return R.RigidBodyDesc.kinematicPositionBased();
      case 'dynamic':
      default:
        return R.RigidBodyDesc.dynamic();
    }
  }

  private createBoundaryColliders(bounds: Bounds): void {
    if (!this.world || !this.rapier) return;
    const R = this.rapier as any;
    const hx = (bounds.max.x - bounds.min.x) / 2;
    const hy = (bounds.max.y - bounds.min.y) / 2;
    const hz = (bounds.max.z - bounds.min.z) / 2;
    const midX = (bounds.min.x + bounds.max.x) / 2;
    const midY = (bounds.min.y + bounds.max.y) / 2;
    const midZ = (bounds.min.z + bounds.max.z) / 2;
    const thickness = 0.1;
    const makeWall = (
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number
    ) => {
      const body = (this.world as any).createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
      const colDesc = R.ColliderDesc.cuboid(sx, sy, sz)
        .setRestitution(0)
        .setFriction(1);
      const col = (this.world as any).createCollider(colDesc, body);
      col.setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
    };
    // left/right
    makeWall(bounds.min.x - thickness, midY, midZ, thickness, hy, hz);
    makeWall(bounds.max.x + thickness, midY, midZ, thickness, hy, hz);
    // bottom/top
    makeWall(midX, bounds.min.y - thickness, midZ, hx, thickness, hz);
    makeWall(midX, bounds.max.y + thickness, midZ, hx, thickness, hz);
    // back/front
    makeWall(midX, midY, bounds.min.z - thickness, hx, hy, thickness);
    makeWall(midX, midY, bounds.max.z + thickness, hx, hy, thickness);
  }

  /** Remove the Rapier rigid body and collider for the given entity. */
  removeBody(entity: any): void {
    if (!this.world || !entity || typeof entity.id !== 'number') return;

    const body = this.bodyMap.get(entity.id);
    const handle = this.entityColliderMap.get(entity.id);

    if (handle !== undefined) {
      try {
        const collider = (this.world as any).getCollider?.(handle);
        if (collider && (this.world as any).removeCollider) {
          (this.world as any).removeCollider(collider, true);
        }
      } catch { /* ignore WASM traps; cleanup maps below */ }
      this.colliderMap.delete(handle);
      this.entityColliderMap.delete(entity.id);
    }

    if (body) {
      try {
        (this.world as any).removeRigidBody?.(body);
      } catch { /* ignore */ }
      this.bodyMap.delete(entity.id);
    }
  }

  dispose(): void {
    this.eventQueue?.free();
    this.eventQueue = null;
    this.world?.free();
    this.world = null;
    this.bodyMap.clear();
    this.colliderMap.clear();
    this.entityColliderMap.clear();
    this.pendingAdds = [];
    this.pendingRemoves = [];
  }
}

RapierSystem.queries = {
  movers: {
    components: [Position, Velocity, Collider],
    listen: {
      added: true,
      removed: true,
    },
  },
};
