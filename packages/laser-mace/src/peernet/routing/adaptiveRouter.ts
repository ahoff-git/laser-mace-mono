import type { Codec, Envelope, Membership, PeerId, Router, Transport } from '../types';

export function createAdaptiveRouter(
  transport: Transport,
  membership: Membership,
  codec: Codec
): Router {
  const seen = new Map<string, number>();
  const receivers = new Set<(env: Envelope) => void>();

  function start() {
    transport.onData(handleData);
  }

  function stop() {
    transport.onData(() => {});
    seen.clear();
  }

  async function send<T>(env: Envelope<T>) {
    const bytes = codec.encode(env);
    if (env.dst && transport.neighbors().has(env.dst)) {
      await transport.connectTo(env.dst);
      await transport.send(env.dst, bytes);
      return;
    }
    for (const n of membership.peers()) {
      if (n !== env.src) {
        transport.send(n, bytes);
      }
    }
  }

  function onReceive<T>(h: (env: Envelope<T>) => void) {
    receivers.add(h as (env: Envelope) => void);
  }

  function handleData(peer: PeerId, bytes: Uint8Array) {
    const env = codec.decode(bytes);
    if (seen.has(env.id)) return;
    seen.set(env.id, Date.now());
    if (env.dst && env.dst !== membership.self()) {
      if (env.hop < env.ttl) {
        env.hop += 1;
        send(env).catch(() => {});
      }
      return;
    }
    for (const h of receivers) h(env);
  }

  return { start, stop, send, onReceive };
}
