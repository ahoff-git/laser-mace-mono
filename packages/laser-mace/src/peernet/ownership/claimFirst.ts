import { EventEmitter } from 'events';
import type { EntityId, Membership, Ownership, PeerId } from '../types';

export function createClaimFirst(membership: Membership): Ownership {
  const owners = new Map<EntityId, PeerId>();
  const emitter = new EventEmitter();

  async function claim(entity: EntityId): Promise<'granted' | 'contended' | 'denied'> {
    const selfId = membership.self();
    const current = owners.get(entity);
    if (!current) {
      owners.set(entity, selfId);
      emitter.emit(entity, selfId);
      return 'granted';
    }
    if (current === selfId) return 'granted';
    if (selfId < current) {
      owners.set(entity, selfId);
      emitter.emit(entity, selfId);
      return 'contended';
    }
    return 'denied';
  }

  async function release(entity: EntityId) {
    const selfId = membership.self();
    const current = owners.get(entity);
    if (current === selfId) {
      owners.delete(entity);
      emitter.emit(entity, null);
    }
  }

  function ownerOf(entity: EntityId): PeerId | null {
    return owners.get(entity) ?? null;
  }

  function onChange(entity: EntityId, h: (owner: PeerId | null) => void) {
    emitter.on(entity, h);
    return () => emitter.off(entity, h);
  }

  return { claim, release, ownerOf, onChange };
}
