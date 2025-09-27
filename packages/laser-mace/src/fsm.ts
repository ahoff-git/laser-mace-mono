export type Predicate<T extends object> = (ctx: T, version?: any) => boolean;

/**
 * Wraps a predicate in per-context memoization.
 * Results are cached by context object and optional version value.
 */
export function memo<T extends object>(predicate: (ctx: T) => boolean): Predicate<T> {
  const cache = new WeakMap<T, { version: any; result: boolean }>();
  return (ctx: T, version?: any): boolean => {
    const cached = cache.get(ctx);
    if (cached && cached.version === version) {
      return cached.result;
    }
    const result = predicate(ctx);
    cache.set(ctx, { version, result });
    return result;
  };
}

/**
 * Logical AND combinator for predicates.
 * All predicates must evaluate to true for the result to be true.
 * The combined result is memoized per context and version.
 */
export function and<T extends object>(
  ...predicates: Array<Predicate<T>>
): Predicate<T> {
  const cache = new WeakMap<T, { version: any; result: boolean }>();
  return (ctx: T, version?: any): boolean => {
    const cached = cache.get(ctx);
    if (cached && cached.version === version) {
      return cached.result;
    }
    for (const pred of predicates) {
      if (!pred(ctx, version)) {
        cache.set(ctx, { version, result: false });
        return false;
      }
    }
    cache.set(ctx, { version, result: true });
    return true;
  };
}

/**
 * Logical OR combinator for predicates.
 * Returns true if any predicate is true.
 * The combined result is memoized per context and version.
 */
export function or<T extends object>(
  ...predicates: Array<Predicate<T>>
): Predicate<T> {
  const cache = new WeakMap<T, { version: any; result: boolean }>();
  return (ctx: T, version?: any): boolean => {
    const cached = cache.get(ctx);
    if (cached && cached.version === version) {
      return cached.result;
    }
    for (const pred of predicates) {
      if (pred(ctx, version)) {
        cache.set(ctx, { version, result: true });
        return true;
      }
    }
    cache.set(ctx, { version, result: false });
    return false;
  };
}

/**
 * Logical NOT combinator for predicates.
 * The result is memoized per context and version.
 */
export function not<T extends object>(predicate: Predicate<T>): Predicate<T> {
  const cache = new WeakMap<T, { version: any; result: boolean }>();
  return (ctx: T, version?: any): boolean => {
    const cached = cache.get(ctx);
    if (cached && cached.version === version) {
      return cached.result;
    }
    const result = !predicate(ctx, version);
    cache.set(ctx, { version, result });
    return result;
  };
}

export function createFSM<T extends object>(config: {
  statuses: Record<string, Predicate<T>>;
}) {
  return {
    evaluate(ctx: T, version?: any): string[] {
      const matched: string[] = [];
      for (const [name, pred] of Object.entries(config.statuses)) {
        if (pred(ctx, version)) {
          matched.push(name);
        }
      }
      return matched;
    },
  };
}
