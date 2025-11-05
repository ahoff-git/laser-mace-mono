# laser-mace-testing

Sweet testing space for all things laser mace.

This repository contains a minimal Next.js project that imports the [laser-mace-engine](https://github.com/ahoff-git/laser-mace-engine) and [laser-mace](https://github.com/ahoff-git/laser-mace) repositories.

## Setup

Because this environment lacks internet access, dependencies cannot be installed here. To use this project locally:

1. Ensure Node.js 18+ and pnpm are installed.
2. Run `pnpm install` in the repository root to fetch dependencies, including the two GitHub repositories listed above.
3. Start the development server with `pnpm dev`.

The example page imports from both libraries and logs the modules to the browser console.

## Engine Integration Ideas

Helper utilities such as `createCubeEntity` now live directly in the `laser-mace-engine` package so other projects can spawn basic objects without duplicating code. The physics wrappers for `BodyType`, `Collider`, `Immovable`, `RapierSystem`, and the simple `WrapSystem` have also been consolidated there—import them from the engine instead of this testing app.

### Migrating from `Immovable` to `BodyType`

`BodyType` replaces the old `Immovable` flag when configuring Rapier rigid bodies. The component exposes the accepted body types and a normalization helper so systems can rely on shared defaults. Existing code that previously called `createCubeEntity({ immovable: true })` should instead prefer `createCubeEntity({ bodyType: 'fixed' })`. The legacy `immovable` option still tags entities for UI purposes, but Rapier now depends solely on the `BodyType` component when building rigid bodies.
