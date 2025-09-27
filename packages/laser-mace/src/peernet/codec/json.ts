import { Codec, Envelope } from '../types';

export function createJsonCodec(): Codec {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function encode<T>(env: Envelope<T>): Uint8Array {
    const json = JSON.stringify(env);
    return encoder.encode(json);
  }

  function decode(bytes: Uint8Array): Envelope {
    const json = decoder.decode(bytes);
    return JSON.parse(json) as Envelope;
  }

  return { encode, decode };
}
