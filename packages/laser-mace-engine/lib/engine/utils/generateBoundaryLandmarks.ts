export const generateBoundaryLandmarks = (range: number, spacing: number) => {
  const positions: { x: number; y: number; z: number }[] = [];
  const max = range;
  const step = spacing;
  if (step <= 0 || max < 0) {
    return positions;
  }

  for (let y = 0; y <= max; y += step) {
    for (let z = 0; z <= max; z += step) {
      positions.push({ x: 0, y, z });
      if (max !== 0) {
        positions.push({ x: max, y, z });
      }
    }
  }

  for (let x = step; x < max; x += step) {
    for (let z = 0; z <= max; z += step) {
      positions.push({ x, y: 0, z });
      if (max !== 0) {
        positions.push({ x, y: max, z });
      }
    }
  }

  for (let x = step; x < max; x += step) {
    for (let y = step; y < max; y += step) {
      positions.push({ x, y, z: 0 });
      if (max !== 0) {
        positions.push({ x, y, z: max });
      }
    }
  }

  return positions;
};

