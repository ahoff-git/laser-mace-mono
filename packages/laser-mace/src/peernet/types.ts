export type PeerId = string;
export type Topic = string;
export type EntityId = string;

export type QoS = 'ff' | 'alo';
export type Addr = { peer?: PeerId; topic?: Topic };

export type Envelope<T = unknown> = {
  id: string;
  v: 1;
  src: PeerId;
  dst?: PeerId;
  topic?: Topic;
  entity?: EntityId;
  owner?: PeerId | null;
  type: string;
  qos: QoS;
  ttl: number;
  hop: number;
  ts: number;
  payload: T;
  trace?: PeerId[];
  sig?: string;
};

export interface Transport {
  start(): Promise<void>;
  stop(): Promise<void>;
  localId(): PeerId;
  connectTo(peer: PeerId): Promise<void>;
  send(peer: PeerId, bytes: Uint8Array): Promise<void>;
  onData(handler: (peer: PeerId, bytes: Uint8Array) => void): void;
  neighbors(): Set<PeerId>;
}

export interface Membership {
  start(): void;
  stop(): void;
  self(): PeerId;
  peers(): Set<PeerId>;
  onJoin(h: (p: PeerId) => void): void;
  onLeave(h: (p: PeerId, reason: 'timeout' | 'graceful') => void): void;
  onPeersChanged(h: () => void): void;
}

export interface Router {
  start(): void;
  stop(): void;
  send<T>(env: Envelope<T>): Promise<void>;
  onReceive<T>(h: (env: Envelope<T>) => void): void;
}

export interface PubSub {
  publish<T>(topic: Topic, msg: T, opts?: { qos?: QoS }): void;
  subscribe<T>(topic: Topic, handler: (msg: T, meta: Envelope<T>) => void): () => void;
  join(topic: Topic): void;
  leave(topic: Topic): void;
}

export interface Ownership {
  claim(entity: EntityId, opts?: { ttlMs?: number }): Promise<'granted' | 'contended' | 'denied'>;
  release(entity: EntityId): Promise<void>;
  ownerOf(entity: EntityId): PeerId | null;
  onChange(entity: EntityId, h: (owner: PeerId | null) => void): () => void;
}

export interface Codec {
  encode<T>(env: Envelope<T>): Uint8Array;
  decode(bytes: Uint8Array): Envelope;
}

export interface Security {
  authorize(env: Envelope): boolean;
}

export type PeerNetOptions = {
  transport?: Transport;
  membership?: Membership;
  router?: Router;
  pubsub?: PubSub;
  ownership?: Ownership;
  codec?: Codec;
  security?: Security;
  qosDefaults?: { direct?: QoS; topic?: QoS };
  limits?: { maxTtl?: number; maxMsgBytes?: number; inflight?: number };
};
