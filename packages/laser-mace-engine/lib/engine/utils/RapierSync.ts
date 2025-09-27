import { Entity } from "ecsy";
import { Position } from "../components/Position";
import { Velocity } from "../components/Velocity";
import { nowMs } from "./common";

/**
 * Interface for synchronizing ECSY component data with a Rapier body.
 */
export interface RapierSync {
  /** Copy component data from ECSY to the Rapier body. */
  toRapier(entity: Entity, body: any): void;
  /** Copy physics results from the Rapier body back into ECSY components. */
  fromRapier(entity: Entity, body: any): void;
}

/**
 * Default synchronisation behaviour which reads Position and Velocity
 * components to drive the Rapier body and writes back the resulting
 * translation after the physics step.
 */
export class DefaultRapierSync implements RapierSync {
  private lastPosToRapierAt = new Map<number, number>();
  private lastVelToRapierAt = new Map<number, number>();

  toRapier(entity: Entity, body: any): void {
    const eid = (entity as any).id as number;
    const pos = entity.getComponent(Position) as any;
    if (pos && body.setTranslation) {
      const last = this.lastPosToRapierAt.get(eid) ?? -1;
      if (last < (pos.updatedAt ?? 0)) {
        body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, false);
        this.lastPosToRapierAt.set(eid, pos.updatedAt ?? 0);
      }
    }
    const vel = entity.getComponent(Velocity) as any;
    if (vel && body.setLinvel) {
      const last = this.lastVelToRapierAt.get(eid) ?? -1;
      if (last < (vel.updatedAt ?? 0)) {
        body.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
        this.lastVelToRapierAt.set(eid, vel.updatedAt ?? 0);
      }
    }
  }

  fromRapier(entity: Entity, body: any): void {
    if (body.translation) {
      const t = body.translation();
      const pos = entity.getMutableComponent(Position) as any;
      if (pos && (pos.x !== t.x || pos.y !== t.y || pos.z !== t.z)) {
        pos.x = t.x;
        pos.y = t.y;
        pos.z = t.z;
        pos.updatedAt = nowMs();
      }
    }
  }
}
