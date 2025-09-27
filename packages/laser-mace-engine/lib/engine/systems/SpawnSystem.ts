import { System } from "ecsy";
import type { EngineWorld } from "../World";
import { Destroy } from "../components/Destroy";
import type { EngineCommand } from "../utils/commands";

/** Processes queued add/remove commands at the start of the frame */
export class SpawnSystem extends System {
  execute(): void {
    const world = this.world as EngineWorld;
    const commands = world.commandQueue.flush() as EngineCommand[];
    for (const cmd of commands) {
      if (cmd.type === "add") {
        cmd.create(world);
      } else if (cmd.type === "remove") {
        cmd.entity.addComponent(Destroy);
      }
    }
  }
}
