import { EventEmitter } from 'events';
import type { Membership, PeerId, Transport } from '../types';

export function createSwimLite(transport: Transport, intervalMs = 1000): Membership {
  const emitter = new EventEmitter();
  let timer: NodeJS.Timeout | null = null;
  let known = new Set<PeerId>();

  function start() {
    timer = setInterval(poll, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function self(): PeerId {
    return transport.localId();
  }

  function peers() {
    return new Set(known);
  }

  function onJoin(h: (p: PeerId) => void) {
    emitter.on('join', h);
  }

  function onLeave(h: (p: PeerId, reason: 'timeout' | 'graceful') => void) {
    emitter.on('leave', h);
  }

  function onPeersChanged(h: () => void) {
    emitter.on('changed', h);
  }

  function poll() {
    const current = transport.neighbors();
    for (const p of current) {
      if (!known.has(p)) {
        known.add(p);
        emitter.emit('join', p);
        emitter.emit('changed');
      }
    }
    for (const p of [...known]) {
      if (!current.has(p)) {
        known.delete(p);
        emitter.emit('leave', p, 'timeout');
        emitter.emit('changed');
      }
    }
  }

  return { start, stop, self, peers, onJoin, onLeave, onPeersChanged };
}
