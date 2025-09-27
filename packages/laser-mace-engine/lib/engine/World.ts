import { World as ECSYWorld } from "ecsy";
import { CommandQueueManager, CommandQueueOptions } from "./utils/CommandQueueManager";
import type { EngineCommand } from "./utils/commands";

export interface WorldConfig {
  components?: any[];
  systems?: any[];
  commandQueueOptions?: CommandQueueOptions;
}

export class EngineWorld extends ECSYWorld {
  commandQueue: CommandQueueManager<EngineCommand>;

  constructor(commandQueueOptions: CommandQueueOptions) {
    super();
    this.commandQueue = new CommandQueueManager<EngineCommand>(commandQueueOptions);
  }
}

export function createWorld(worldConfig: WorldConfig = {}) {
  const { components = [], systems = [], commandQueueOptions = {} } = worldConfig;

  const world = new EngineWorld(commandQueueOptions);

  components.forEach((c) => world.registerComponent(c));
  systems.forEach((s) => world.registerSystem(s));

  return world;
}
