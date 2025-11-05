import { useEffect, useState } from 'react';
import {
  randomCoord,
  randomSize,
  randomSpeed,
  vecLength,
} from './utils';

// Cap sprinkler blocks at a smaller size so they stay out of the way.
const SPRINKLER_MAX_SIZE = 8;

function towardTopCenter(
  from: { x: number; y: number; z: number },
  speed: number,
  boundary: number,
) {
  const target = { x: 0, y: boundary, z: 0 };
  const direction = {
    x: target.x - from.x,
    y: target.y - from.y,
    z: target.z - from.z,
  };
  const length = vecLength(direction) || 1;
  const scale = speed / length;
  return {
    x: direction.x * scale,
    y: direction.y * scale,
    z: direction.z * scale,
  };
}

export function useSprinkler(engineRef: any, boundary: number) {
  const [on, setOn] = useState(false);
  const [rate, setRate] = useState(500);

  useEffect(() => {
    if (!on) return;

    const sprinkle = () => {
      const engine = engineRef.current;
      if (!engine) return;

      const side = Math.random() < 0.5 ? -boundary : boundary;
      const from = { x: side, y: 0, z: randomCoord(boundary) };

      const speed = randomSpeed();
      const velocity = towardTopCenter(from, speed, boundary);

      const size = randomSize(SPRINKLER_MAX_SIZE);
      engine.spawn({ from, velocity, size });
    };

    const id = setInterval(sprinkle, rate);
    return () => clearInterval(id);
  }, [on, rate, engineRef, boundary]);

  const toggle = () => setOn((v) => !v);
  const changeRate = (ms: number) => setRate(ms);

  return { on, toggle, rate, changeRate };
}
