/**
 * Rouge toast context — app-wide API for transient confirmations (add-to-bag, wishlist, copy link).
 * One toast per action. Provided by ToastProvider, consumed via useToast. Rouge's own.
 */
import { createContext, type ReactNode } from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastOptions {
  title?: string;
  message: ReactNode;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms (default 4000). */
  duration?: number;
}

export interface ToastApi {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
