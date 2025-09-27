import { randomUUID } from 'crypto';
import type { Envelope, PubSub, QoS, Router, Topic } from '../types';

export function createTopics(router: Router): PubSub {
  const subs = new Map<Topic, Set<(msg: unknown, meta: Envelope) => void>>();

  router.onReceive((env) => {
    if (!env.topic) return;
    const handlers = subs.get(env.topic);
    if (!handlers) return;
    handlers.forEach((h) => h(env.payload, env));
  });

  function publish<T>(topic: Topic, msg: T, opts?: { qos?: QoS }) {
    const env: Envelope<T> = {
      id: randomUUID(),
      v: 1,
      src: '',
      topic,
      type: 'pub',
      qos: opts?.qos || 'ff',
      ttl: 3,
      hop: 0,
      ts: Date.now(),
      payload: msg,
    };
    router.send(env).catch(() => {});
  }

  function subscribe<T>(topic: Topic, handler: (msg: T, meta: Envelope<T>) => void) {
    const set = subs.get(topic) || new Set();
    set.add(handler as (msg: unknown, meta: Envelope) => void);
    subs.set(topic, set);
    return () => {
      set.delete(handler as (msg: unknown, meta: Envelope) => void);
    };
  }

  function join(_topic: Topic) {
    /* presence only */
  }

  function leave(_topic: Topic) {
    /* presence only */
  }

  return { publish, subscribe, join, leave };
}
