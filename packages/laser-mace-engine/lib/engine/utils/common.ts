/**
 * Returns a monotonic-ish timestamp in milliseconds.
 * Uses performance.now() when available to avoid clock jumps.
 */
export const nowMs = (): number =>
  (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();

/**
 * Returns an effective collider radius from a Collider component-like object.
 * Falls back from explicit `radius` to half of `size`, otherwise 0.
 */
export const colliderRadius = (col: any): number => {
  if (!col) return 0;
  const r = (col as any).radius;
  if (typeof r === 'number' && r > 0) return r;
  const size = (col as any).size;
  return typeof size === 'number' && size > 0 ? size / 2 : 0;
};

/**
 * Clamps a derived mass from a cube size to a sensible range.
 */
export const massFromSize = (size: number): number => {
  const raw = Math.max(0, size) ** 3;
  return Math.max(0.001, Math.min(1000, raw));
};

