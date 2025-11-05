import { System } from "ecsy";
import { Position } from "../components/Position";
import { Velocity } from "../components/Velocity";
import { Collider } from "../components/Collider";
import { nowMs } from "../utils/common";

/**
 * Integrates entity velocity into position for non-physics bodies.
 * Entities that participate in Rapier collisions (i.e. have a Collider)
 * are excluded so Rapier remains the source of truth for their movement.
 */
export class MovementSystem extends System {
  execute(delta: number): void {
    if (!delta) return;
    const tick = nowMs();
    this.queries.movers.results.forEach((entity: any) => {
      if (entity.hasComponent?.(Collider)) return;
      const pos = entity.getMutableComponent(Position);
      const vel = entity.getComponent(Velocity);
      if (!pos || !vel) return;
      if (vel.x === 0 && vel.y === 0 && vel.z === 0) return;
      pos.x += vel.x * delta;
      pos.y += vel.y * delta;
      pos.z += vel.z * delta;
      (pos as any).updatedAt = tick;
    });
  }
}

MovementSystem.queries = {
  movers: { components: [Position, Velocity] },
};