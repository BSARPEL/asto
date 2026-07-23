import { stripUndefinedDeep } from '@asto/shared';

/** Prepare any Firestore document payload (no nested `undefined`). */
export function forFirestore<T>(data: T): T {
  return stripUndefinedDeep(data);
}
