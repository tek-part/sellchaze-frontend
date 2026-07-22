/**
 * Newsletter sign-up — shared behaviour for every theme.
 *
 * There is no subscribe endpoint in the storefront API, and inventing one is not an option. Three
 * themes previously handled this by flipping a `done` flag and telling the visitor they were
 * subscribed — a claim the system cannot honour, since nothing was recorded anywhere.
 *
 * Instead the address is persisted locally and reported honestly: the visitor is told their address
 * is saved on this device and not yet submitted, with a route to a channel that does work. When a
 * subscribe endpoint lands, pass it as `submit` and the same UI becomes a real subscription with no
 * markup change — `pending` entries can then be flushed.
 */
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sf:newsletter:pending';

export type NewsletterStatus = 'idle' | 'invalid' | 'saved' | 'subscribed' | 'error';

export interface NewsletterState {
  status: NewsletterStatus;
  message: string;
  submitting: boolean;
}

/** Deliberately permissive — matches what a server would accept, rejects obvious typos. */
export function isValidEmail(value: string): boolean {
  const v = value.trim();
  return v.length >= 5 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** Read the addresses captured on this device (used to flush once an endpoint exists). */
export function pendingSubscribers(): ReadonlyArray<string> {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    // A corrupt or unavailable store must never break the form.
    return [];
  }
}

function persist(email: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const next = Array.from(new Set([...pendingSubscribers(), email.trim().toLowerCase()]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    // Private browsing or a full quota — report the failure rather than claiming success.
    return false;
  }
}

export interface UseNewsletterOptions {
  /** Real subscribe call, when one exists. Without it the address is stored locally. */
  submit?: (email: string) => Promise<void>;
}

export interface UseNewsletterResult extends NewsletterState {
  subscribe: (email: string) => Promise<void>;
  reset: () => void;
}

export function useNewsletter(options: UseNewsletterOptions = {}): UseNewsletterResult {
  const { submit } = options;
  const [state, setState] = useState<NewsletterState>({ status: 'idle', message: '', submitting: false });

  const subscribe = useCallback(
    async (email: string): Promise<void> => {
      if (!isValidEmail(email)) {
        setState({ status: 'invalid', message: 'Enter a valid email address.', submitting: false });
        return;
      }

      if (submit) {
        setState({ status: 'idle', message: '', submitting: true });
        try {
          await submit(email);
          setState({ status: 'subscribed', message: 'You’re subscribed — thanks for joining.', submitting: false });
        } catch {
          setState({
            status: 'error',
            message: 'We couldn’t sign you up just now. Please try again shortly.',
            submitting: false,
          });
        }
        return;
      }

      const stored = persist(email);
      setState(
        stored
          ? {
              status: 'saved',
              message: 'Saved on this device. Sign-up isn’t connected yet — contact us to be added to the list.',
              submitting: false,
            }
          : {
              status: 'error',
              message: 'We couldn’t save your address on this device. Please contact us instead.',
              submitting: false,
            },
      );
    },
    [submit],
  );

  const reset = useCallback((): void => {
    setState({ status: 'idle', message: '', submitting: false });
  }, []);

  return { ...state, subscribe, reset };
}
