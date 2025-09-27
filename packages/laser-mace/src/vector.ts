import { Point } from "./commonTypes";

export interface Vector extends Point{
    angle: number;
    speed: number;
    mass: number;
} 

export interface Box extends Point{
    width: number;
    height: number;
}

function getBaseVect(x: number = 0, y: number = 0, angle: number = 0, speed: number = 0, mass: number = 0): Vector {
    return { x, y, angle, speed, mass };
}

function vectSum(obj1: Vector, obj2: Vector): { angle: number, mag: number, speed: number } {
    const r1 = obj1.speed * obj1.mass;
    const r2 = obj2.speed * obj2.mass;
    const ar = obj1.angle * Math.PI / 180;
    const br = obj2.angle * Math.PI / 180;

    const r1x = r1 * Math.cos(ar);
    const r1y = r1 * Math.sin(ar);
    const r2x = r2 * Math.cos(br);
    const r2y = r2 * Math.sin(br);
    const rrx = r1x + r2x;
    const rry = r1y + r2y;
    const r = Math.sqrt(rrx * rrx + rry * rry);
    const angr = atan7(rrx, rry);

    return { angle: angr, mag: r, speed: r / obj1.mass };
}

function vectSumAndSet(obj1: Vector, obj2: Vector): Vector {
    const temp = vectSum(obj1, obj2);
    obj1.angle = temp.angle;
    obj1.speed = temp.mag / obj1.mass;
    return obj1;
}

function atan7(x: number, y: number): number {
    const xck = Math.abs(x);
    const yck = Math.abs(y);
    const sck = Math.pow(10, -6);
    if (xck < sck) {
        if (yck < sck) return 0;
        return y >= 0 ? 90 : 270;
    }
    if (x > 0) {
        if (y >= 0) return 180 * Math.atan(y / x) / Math.PI;
        return 180 * Math.atan(y / x) / Math.PI + 360;
    }
    if (x < 0) {
        if (y >= 0) return 180 - 180 * Math.atan(-y / x) / Math.PI;
        return -180 + 180 * Math.atan(y / x) / Math.PI + 360;
    }
    return 0;  // Default case to handle edge conditions
}

export function setupVector() {
    let vectorObj = {
        sum: vectSum,
        sumAndSet: vectSumAndSet,
        getAngle: (obj1: Point, obj2: Point) => atan7(obj2.x - obj1.x, -(obj2.y - obj1.y)),
        getBaseVect: getBaseVect,
        keepInBox: (vect: Vector, box: Box) => {
            let changed = false;
            if (vect.x < 0) { vect.x = 0; changed = true; }
            if (vect.y < 0) { vect.y = 0; changed = true; }
            if (vect.x + vect.speed > box.x + box.width) { vect.x = box.x + box.width - vect.speed; changed = true; }
            if (vect.y + vect.speed > box.y + box.height) { vect.y = box.y + box.height - vect.speed; changed = true; }
            return changed;
        },
        wrapAngle: (angle: number) => {
            angle = angle % 360;
            if (angle < 0) angle += 360;
            return angle;
        },
        moveObj: (obj: Vector) => {
            obj.x += obj.speed * Math.sin(toRadians(obj.angle));
            obj.y += obj.speed * Math.cos(toRadians(obj.angle));
        },
        moveObjBack: (obj: Vector) => {
            obj.x -= obj.speed * Math.sin(toRadians(obj.angle));
            obj.y -= obj.speed * Math.cos(toRadians(obj.angle));
        },

        standards: setupVectStandards()
    };
    return vectorObj;
}

function toDegrees(angle: number): number {
    return (angle - Math.PI / 2) * (180 / Math.PI);
}

function toRadians(angle: number): number {
    return (angle * (Math.PI / 180)) + (Math.PI / 2);
}

function setupVectStandards(): { [key: string]: Vector } {
    return {
        up: getBaseVect(0, 0, 90, 0.5, 1.25),
        down: getBaseVect(0, 0, 270, 0.5, 1.25),
        left: getBaseVect(0, 0, 180, 0.5, 1.25),
        right: getBaseVect(0, 0, 0, 0.5, 1.25),
        breaks: getBaseVect(0, 0, 0, 0.5, 1.25)
    };
}
