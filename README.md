# Laser Mace Monorepo

This repository centralizes the Laser Mace ecosystem into a single npm workspace.

## Structure

- `packages/laser-mace` – the published Laser Mace package.
- `packages/laser-mace-engine` – the engine that powers the experience.
- `packages/laser-mace-testing` – placeholder for the private testing utilities.
- `scripts/` – utilities for keeping the packages in sync with their source repositories.

## Getting Started

Install dependencies for an individual package and run its scripts using npm workspaces:

```bash
npm install --workspace packages/laser-mace
npm run build --workspace packages/laser-mace
npm run lint --workspace packages/laser-mace
```

Repeat for `laser-mace-engine`. The `laser-mace-testing` package is private; populate it with:

```bash
npm run fetch:laser-mace-testing
```

Set the `GITHUB_TOKEN` environment variable with a token that has read access to the private repository before running the fetch command. The same fetch scripts exist for the public packages to make future syncs easy.

## Updating Packages

Use the provided helper script to sync a package from GitHub:

```bash
npm run fetch:laser-mace
npm run fetch:laser-mace-engine
npm run fetch:laser-mace-testing
```

These commands clone the respective repository and copy their contents into the `packages` directory (excluding their Git metadata).
