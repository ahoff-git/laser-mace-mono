import Peer, { DataConnection, PeerJSOption } from 'peerjs';
import type { PeerId, Transport } from '../types';

export type PeerJsOptions = PeerJSOption;

export function createPeerJsTransport(opts?: PeerJsOptions): Transport {
  const connections = new Map<PeerId, DataConnection>();
  let peer: Peer | null = null;
  let dataHandler: ((peer: PeerId, bytes: Uint8Array) => void) | null = null;

  async function start() {
    peer = opts ? new Peer(opts) : new Peer();
    peer.on('connection', handleConnection);
    await new Promise<void>((resolve, reject) => {
      peer?.once('open', () => resolve());
      peer?.once('error', (err: unknown) => reject(err));
    });
  }

  async function stop() {
    connections.forEach((c) => c.close());
    connections.clear();
    peer?.removeAllListeners();
    peer?.destroy();
    peer = null;
  }

  function localId(): PeerId {
    return peer?.id || '';
  }

  async function connectTo(target: PeerId) {
    if (!peer) throw new Error('transport not started');
    if (connections.has(target)) return;
    const conn = peer.connect(target);
    conn.on('open', () => {
      connections.set(target, conn);
      conn.on('data', (data: unknown) => {
        if (data instanceof ArrayBuffer) {
          dataHandler?.(target, new Uint8Array(data));
        }
      });
      conn.on('close', () => connections.delete(target));
    });
  }

  async function send(target: PeerId, bytes: Uint8Array) {
    const conn = connections.get(target);
    if (!conn) return;
    await conn.send(bytes);
  }

  function onData(handler: (peer: PeerId, bytes: Uint8Array) => void) {
    dataHandler = handler;
  }

  function neighbors() {
    return new Set(connections.keys());
  }

  function handleConnection(conn: DataConnection) {
    const id = conn.peer;
    connections.set(id, conn);
    conn.on('data', (data: unknown) => {
      if (data instanceof ArrayBuffer) {
        dataHandler?.(id, new Uint8Array(data));
      }
    });
    conn.on('close', () => {
      connections.delete(id);
    });
  }

  return { start, stop, localId, connectTo, send, onData, neighbors };
}
