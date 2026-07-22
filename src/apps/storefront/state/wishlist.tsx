/**
 * Wishlist state — the set of saved product ids. Members sync with the storefront wishlist API
 * (optimistic add/remove with revert on failure); guests persist to localStorage. Loaded on sign-in.
 * Exposes has()/toggle() for the wishlist button on the PDP (and anywhere else).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { addWishlist, getWishlist, removeWishlist } from '../api/storefront';
import { useAuth } from './auth-context';

const STORAGE_KEY = 'sf-wishlist-v1';

interface WishlistApi {
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistApi | null>(null);

function loadLocal(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

export function WishlistProvider(props: { children: ReactNode }): ReactElement {
  const { customer } = useAuth();
  const [ids, setIds] = useState<Set<string>>(loadLocal);

  // Members: load the server wishlist. Guests: persist locally.
  useEffect(() => {
    if (!customer) return;
    let active = true;
    getWishlist()
      .then((res) => {
        if (active) setIds(new Set(res.data.map((p) => String(p.id))));
      })
      .catch(() => {
        /* keep whatever we have */
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  useEffect(() => {
    if (customer || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      /* ignore */
    }
  }, [ids, customer]);

  const toggle = useCallback(
    (productId: string) => {
      const had = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (had) next.delete(productId);
        else next.add(productId);
        return next;
      });
      if (customer) {
        const request = had ? removeWishlist(Number(productId)) : addWishlist(Number(productId));
        request.catch(() => {
          // revert on failure
          setIds((prev) => {
            const next = new Set(prev);
            if (had) next.add(productId);
            else next.delete(productId);
            return next;
          });
        });
      }
    },
    [customer, ids],
  );

  const has = useCallback((productId: string) => ids.has(productId), [ids]);
  const value = useMemo<WishlistApi>(() => ({ has, toggle, count: ids.size }), [has, toggle, ids.size]);

  return <WishlistContext.Provider value={value}>{props.children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistApi {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a <WishlistProvider>.');
  return context;
}
