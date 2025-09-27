import { System } from "ecsy";
import { Position } from "../components/Position";
import { Velocity } from "../components/Velocity";
import { nowMs } from "../utils/common";

export class MoveSystem extends System {
  execute(delta: number): void {
    this.queries.movers.results.forEach((entity: any) => {
      const pos = entity.getMutableComponent(Position)!;
      const vel = entity.getComponent(Velocity)!;
      pos.x += vel.x * delta;
      pos.y += vel.y * delta;
      pos.z += vel.z * delta;
      // mark position as changed for downstream consumers
      (pos as any).updatedAt = nowMs();
    });
  }
}

MoveSystem.queries = {
  movers: { components: [Position, Velocity] },
};
