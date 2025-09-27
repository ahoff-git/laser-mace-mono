import { Component, Types } from "ecsy";
import { Mesh } from "three";

export class MeshComponent extends Component<MeshComponent> {
  mesh!: Mesh;

  static schema = {
    mesh: { type: Types.Ref },
  };
}
