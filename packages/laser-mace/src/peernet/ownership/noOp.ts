import type { EntityId, Ownership, PeerId } from '../types';

export function createNoOpOwnership(): Ownership {
  async function claim(): Promise<'granted'> {
    return 'granted';
  }

  async function release() {
    /* no-op */
  }

  function ownerOf(): PeerId | null {
    return null;
  }

  function onChange(_entity: EntityId, _h: (owner: PeerId | null) => void) {
    return () => {};
  }

  return { claim, release, ownerOf, onChange };
}
