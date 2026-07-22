/**
 * Toast context — the app-wide API for raising transient confirmations. One toast per action; a
 * state change OR a toast, never both (§32.5). Provided by ToastProvider, consumed via useToast.
 */
import { createContext, type ReactNode } from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  message: ReactNode;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms (default 4000). */
  duration?: number;
  action?: ToastAction;
}

export interface ToastApi {
  /** Raise a toast; returns its id. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
