import type { Envelope, Security } from '../types';

export function createAllowAllSecurity(): Security {
  function authorize(_env: Envelope): boolean {
    return true;
  }
  return { authorize };
}
