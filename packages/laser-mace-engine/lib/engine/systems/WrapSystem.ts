import { System } from 'ecsy';
import { Position } from '../components/Position';

export interface WrapSystemConfig {
  width: number;
  height: number;
  depth?: number;
}

export class WrapSystem extends System {
  private width = 0;
  private height = 0;
  private depth = 0;

  init(attrs?: WrapSystemConfig): void {
    this.width = attrs?.width ?? 0;
    this.height = attrs?.height ?? 0;
    this.depth = attrs?.depth ?? 0;
  }

  execute(): void {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const halfD = this.depth / 2;
    this.queries.items.results.forEach((entity: any) => {
      const pos = entity.getMutableComponent(Position)!;
      if (this.width > 0) {
        if (pos.x < -halfW) pos.x += this.width;
        else if (pos.x > halfW) pos.x -= this.width;
      }
      if (this.height > 0) {
        if (pos.y < -halfH) pos.y += this.height;
        else if (pos.y > halfH) pos.y -= this.height;
      }
      if (this.depth > 0) {
        if (pos.z < -halfD) pos.z += this.depth;
        else if (pos.z > halfD) pos.z -= this.depth;
      }
    });
  }
}

WrapSystem.queries = {
  items: { components: [Position] },
};

