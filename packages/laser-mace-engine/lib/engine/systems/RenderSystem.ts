import { System } from "ecsy";
import { Scene, PerspectiveCamera, WebGLRenderer } from "three";
import { Position } from "../components/Position";
import { MeshComponent } from "../components/Mesh";

export interface RenderSystemConfig {
  canvas?: HTMLCanvasElement;
}

export class RenderSystem extends System {
  private scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer; 
  private lastPosAt: Map<number, number> = new Map();

  /** Current number of mesh objects in the scene. */
  objectCount(): number {
    return this.scene.children.length;
  }

  init(attributes?: RenderSystemConfig): void {
    const canvas = attributes?.canvas;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 5;
    this.renderer = new WebGLRenderer({ canvas });
    if (canvas) {
      this.renderer.setSize(canvas.width, canvas.height);
    }
  }

  private handleRemovals(entities: any[]): void {
    for (const e of entities) {
      const meshComp = e.getComponent(MeshComponent, true);
      if (meshComp) this.scene.remove(meshComp.mesh);
      this.lastPosAt.delete(e.id);
    }
  }

  execute(): void {
    this.handleRemovals((this.queries.renderables.removed as any[]) ?? []);

    this.queries.renderables.results.forEach((entity: any) => {
      const pos = entity.getComponent(Position)! as any;
      const meshComp = entity.getComponent(MeshComponent)!;
      const last = this.lastPosAt.get(entity.id) ?? -1;
      // Always set once (no last) or when position changed per timestamp
      if (last < (pos.updatedAt ?? 0)) {
        meshComp.mesh.position.set(pos.x, pos.y, pos.z);
        this.lastPosAt.set(entity.id, pos.updatedAt ?? 0);
      }
      if (!this.scene.children.includes(meshComp.mesh)) {
        this.scene.add(meshComp.mesh);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.scene.clear();
    this.renderer.dispose();
    this.lastPosAt.clear();
  }
}

RenderSystem.queries = {
  renderables: {
    components: [Position, MeshComponent],
    listen: { removed: true },
  },
};
