export const randomCoord = (range: number) =>
  Math.round((Math.random() * 2 - 1) * (range - 1));

// Returns a size between 1 and the provided maximum.
// Defaults to 15 to match the original behavior.
export const randomSize = (max = 15) => Math.floor(Math.random() * max) + 1;
export const randomSpeed = () => Math.round(Math.random() * 100);
export const randomCount = () => Math.floor(Math.random() * 5) + 1;

export const vecLength = (v: { x: number; y: number; z: number }) =>
  Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

export const generateBoundaryLandmarks = (range: number, spacing: number) => {
  const positions: { x: number; y: number; z: number }[] = [];
  const extremes = [-range, range];
  const ax: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
  const seen = new Set<string>();
  ax.forEach((axis, i) => {
    const others = ax.filter((_, idx) => idx !== i);
    extremes.forEach((a) => {
      extremes.forEach((b) => {
        for (let t = -range; t <= range; t += spacing) {
          const pos: any = { [axis]: t, [others[0]]: a, [others[1]]: b };
          const key = `${pos.x},${pos.y},${pos.z}`;
          if (!seen.has(key)) {
            seen.add(key);
            positions.push(pos);
          }
        }
      });
    });
  });
  return positions;
};
