/** Voltage toast context — a tiny queue API. Consumed via useToast(); hosted by ToastProvider. */
import { createContext, useContext } from 'react';

export type ToastTone = 'default' | 'success' | 'danger';

export interface ToastApi {
  /** Enqueue a transient message; returns nothing. */
  notify: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // No-op fallback so sections work even if rendered outside the provider (e.g. isolated tests).
  return ctx ?? { notify: () => {} };
}
