export class Scene {
  children: any[] = [];
  add(obj: any): void {
    if (!this.children.includes(obj)) {
      this.children.push(obj);
    }
  }
  remove(obj: any): void {
    const i = this.children.indexOf(obj);
    if (i >= 0) this.children.splice(i, 1);
  }
  clear(): void {
    this.children = [];
  }
}

export class PerspectiveCamera {
  position = {
    x: 0,
    y: 0,
    z: 0,
    multiplyScalar: (s: number) => {
      this.position.x *= s;
      this.position.y *= s;
      this.position.z *= s;
    },
  };
  constructor(public fov: number, public aspect: number, public near: number, public far: number) {}
}

export class WebGLRenderer {
  constructor(public options: any = {}) {}
  setSize(_w: number, _h: number): void {}
  render(_scene: any, _camera: any): void {}
  dispose(): void {}
}

export class Mesh {
  constructor(_geometry?: any, _material?: any) {}
  position = {
    x: 0,
    y: 0,
    z: 0,
    set: (x: number, y: number, z: number) => {
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
    },
  };
}

export class BoxGeometry {
  constructor(public x: number, public y: number, public z: number) {}
}

export class MeshBasicMaterial {
  constructor(public options: any) {}
}
