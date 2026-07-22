/**
 * mergeRefs — fan a single node out to several React refs (callback or object). Used when a
 * component needs its own internal ref (e.g. to set `indeterminate`) while still forwarding the
 * caller's ref. Returns a stable callback only when memoised by the caller.
 */
import type { Ref } from 'react';

export function mergeRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): (node: T | null) => void {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
