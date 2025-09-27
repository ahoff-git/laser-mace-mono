import { Component, Types } from "ecsy";

export class Collider extends Component<Collider> {
  /** Radius of the collider used for simple sphere collisions */
  radius!: number;
  /** Side length of a cube collider used by RapierSystem */
  size!: number;
  /** Friction coefficient for Rapier colliders (0 = no drag) */
  friction!: number;

  static schema = {
    radius: { type: Types.Number, default: 1 },
    size: { type: Types.Number, default: 0 },
    friction: { type: Types.Number, default: 0 },
  };
}
