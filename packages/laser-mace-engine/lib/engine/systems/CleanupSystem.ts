import { System } from "ecsy";
import { Destroy } from "../components/Destroy";
import { MeshComponent } from "../components/Mesh";

/** Removes entities marked with the Destroy component */
export class CleanupSystem extends System {
  execute(): void {
    for (const entity of this.queries.toRemove.results) {
      const mesh = entity.getComponent(MeshComponent)?.mesh;
      if (mesh?.parent) mesh.parent.remove(mesh);
      entity.remove();
    }
  }
}

CleanupSystem.queries = {
  toRemove: { components: [Destroy] },
};
