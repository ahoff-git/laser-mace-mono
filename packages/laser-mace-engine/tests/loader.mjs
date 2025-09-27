export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'three') {
    return { url: new URL('../dist/shims/three.js', import.meta.url).href, shortCircuit: true };
  }
  if (specifier === '@dimforge/rapier3d-compat') {
    return { url: new URL('../dist/shims/rapier3d-compat.js', import.meta.url).href, shortCircuit: true };
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !specifier.endsWith('.js')) {
    return {
      url: new URL(specifier + '.js', context.parentURL).href,
      shortCircuit: true,
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
