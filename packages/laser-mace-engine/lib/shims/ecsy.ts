export class Component<T = any> {
  static schema: any;
}

export class TagComponent {}

export const Types = {
  Number: 'number' as any,
  Ref: 'ref' as any,
};

export class System<T = any> {
  world: any;
  static queries: any;
  queries: any;
  init?(attributes?: T): void | Promise<void>;
  execute(_delta: number): void {}
  stop?(): void;
}

export class World {
  registerComponent(_c: any): this { return this; }
  registerSystem(_s: any, _attrs?: any): this { return this; }
}

export type Entity = any;
