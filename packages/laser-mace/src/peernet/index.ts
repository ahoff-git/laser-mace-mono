import { randomUUID } from 'crypto';
import { createJsonCodec } from './codec/json';
import { createPeerJsTransport } from './transport/peerjs';
import { createSwimLite } from './membership/swimLite';
import { createAdaptiveRouter } from './routing/adaptiveRouter';
import { createTopics } from './pubsub/topics';
import { createNoOpOwnership } from './ownership/noOp';
import { createAllowAllSecurity } from './security/allowAll';
import type {
  Envelope,
  PeerId,
  PeerNetOptions,
  QoS,
  Router,
} from './types';

export async function init(opts: PeerNetOptions = {}) {
  const codec = opts.codec || createJsonCodec();
  const transport = opts.transport || createPeerJsTransport();
  await transport.start();
  const membership = opts.membership || createSwimLite(transport);
  membership.start();
  const router: Router =
    opts.router || createAdaptiveRouter(transport, membership, codec);
  router.start();
  const pubsub = opts.pubsub || createTopics(router);
  const ownership =
    opts.ownership || createNoOpOwnership();
  const security = opts.security || createAllowAllSecurity();

  const msgHandlers = new Map<PeerId, (msg: unknown, meta: Envelope) => void>();
  // Fallback handler when no peer-specific handler exists
  let defaultHandler: ((msg: unknown, meta: Envelope) => void) | undefined;

  router.onReceive((env) => {
    if (!security.authorize(env)) return;
    if (env.dst === membership.self()) {
      const handler = msgHandlers.get(env.src) || defaultHandler;
      handler?.(env.payload, env);
    }
  });

  function id() {
    return membership.self();
  }

  function onPeerJoin(h: (p: PeerId) => void) {
    membership.onJoin(h);
  }

  function onPeerLeave(h: (p: PeerId) => void) {
    membership.onLeave((p) => h(p));
  }

  function onMessageFrom(peer: PeerId, h: (msg: unknown, meta: Envelope) => void) {
    msgHandlers.set(peer, h);
  }

  function onMessage(h: (msg: unknown, meta: Envelope) => void) {
    defaultHandler = h;
  }

  function sendToPeer(peer: PeerId, payload: unknown, qos: QoS = 'ff') {
    const env: Envelope = {
      id: randomUUID(),
      v: 1,
      src: membership.self(),
      dst: peer,
      type: 'msg',
      qos,
      ttl: 5,
      hop: 0,
      ts: Date.now(),
      payload,
    };
    router.send(env).catch(() => {});
  }

  function routeToPeer(peer: PeerId, payload: unknown, qos: QoS = 'ff') {
    sendToPeer(peer, payload, qos);
  }

  function subscribe(topic: string, handler: (msg: unknown, meta: Envelope) => void) {
    return pubsub.subscribe(topic, handler);
  }

  function publish(topic: string, msg: unknown, opts?: { qos?: QoS }) {
    pubsub.publish(topic, msg, opts);
  }

  async function claim(entity: string) {
    return ownership.claim(entity);
  }

  async function release(entity: string) {
    return ownership.release(entity);
  }

  function onOwnershipChange(entity: string, h: (owner: PeerId | null) => void) {
    return ownership.onChange(entity, h);
  }

  function join(topic: string) {
    pubsub.join(topic);
  }

  function leave(topic: string) {
    pubsub.leave(topic);
  }

  async function shutdown() {
    router.stop();
    membership.stop();
    await transport.stop();
  }

  return {
    id: id(),
    onPeerJoin,
    onPeerLeave,
    onMessageFrom,
    onMessage,
    sendToPeer,
    routeToPeer,
    subscribe,
    publish,
    claim,
    release,
    onOwnershipChange,
    join,
    leave,
    shutdown,
  };
}

export * from './types';
export { createPeerJsTransport } from './transport/peerjs';
export { createSwimLite } from './membership/swimLite';
export { createAdaptiveRouter } from './routing/adaptiveRouter';
export { createTopics } from './pubsub/topics';
export { createNoOpOwnership } from './ownership/noOp';
export { createClaimFirst } from './ownership/claimFirst';
export { createJsonCodec } from './codec/json';
export { createAllowAllSecurity } from './security/allowAll';
