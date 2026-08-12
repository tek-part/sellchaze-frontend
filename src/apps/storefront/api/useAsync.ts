/**
 * useAsync — minimal data-fetching hook with loading/data/error, cancellation on unmount, and a
 * `deps`-keyed refetch. Enough for the storefront's read paths without pulling in a data library.
 */
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useAsync<T>(fetcher: () => Promise<T>, deps: DependencyList, initialData?: T): AsyncState<T> {
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(initialData === undefined);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);
  const skipInitialFetch = useRef(initialData !== undefined);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}
