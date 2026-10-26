/**
 * G2 customer sign-in helpers: WhatsApp-code request tokens, the Google sign-in verifier kept in this
 * tab (only the browser that started a Google sign-in can finish it), the one-time code the API
 * returns in the URL fragment, and the order-status copy keys shared by /track and the account.
 */

import { ApiError } from '../api/client';

const GOOGLE_ATTEMPT_KEY = 'sf:google-login';
const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** 64 hex characters: the secret a WhatsApp-code request is bound to. */
export function newRequestToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** 64 random letters/digits kept in this tab for the Google sign-in. */
export function newVerifier(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(64)), (byte) => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface GoogleAttempt { verifier: string; next: string }

export function saveGoogleAttempt(attempt: GoogleAttempt, storage: Pick<Storage, 'setItem'> = sessionStorage): void {
  storage.setItem(GOOGLE_ATTEMPT_KEY, JSON.stringify(attempt));
}

/** Read once: the verifier is removed as it is taken, so a reload cannot replay it. */
export function takeGoogleAttempt(storage: Pick<Storage, 'getItem' | 'removeItem'> = sessionStorage): GoogleAttempt | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(GOOGLE_ATTEMPT_KEY);
    storage.removeItem(GOOGLE_ATTEMPT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<GoogleAttempt>;
    if (typeof value.verifier !== 'string' || !/^[A-Za-z0-9]{43,128}$/.test(value.verifier)) return null;
    return { verifier: value.verifier, next: typeof value.next === 'string' && value.next.startsWith('/') && !value.next.startsWith('//') ? value.next : '/account' };
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    /** Set by the inline script in storefront.html, which clears `#code=` before any other script runs. */
    __sfGoogleCode?: () => string | null;
  }
}

/** The Google return code: handed over once by the inline script, else (no script ran) read from the fragment. */
export function takeReturnedCode(win: Pick<Window, '__sfGoogleCode' | 'location'> = window): string | null {
  if (typeof win.__sfGoogleCode === 'function') {
    const code = win.__sfGoogleCode();
    return code && /^[A-Za-z0-9]{64}$/.test(code) ? code : null;
  }
  return codeFromHash(win.location.hash);
}

/** The one-time code from `#code=…` (fragments never reach servers or referrers). */
export function codeFromHash(hash: string): string | null {
  const code = new URLSearchParams(hash.replace(/^#/, '')).get('code');
  return code && /^[A-Za-z0-9]{64}$/.test(code) ? code : null;
}

/** Arabic-Indic and Persian digits typed on phone keyboards, as ASCII. */
export function asciiDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

const ORDER_STATUSES = ['placed', 'pending', 'confirmed', 'processing', 'waiting_for_pickup', 'shipped', 'delivered', 'cancelled',
  'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded'] as const;

/** Copy key for an order status; statuses added later fall back to a neutral "updated". */
export function orderStatusKey(status: string): string {
  return (ORDER_STATUSES as ReadonlyArray<string>).includes(status) ? `track.status_${status}` : 'track.status_other';
}

/** The API's validation or error message for a failed request, else the given copy. */
export function apiErrorText(error: unknown, fallback: string): string {
  const payload = error instanceof ApiError ? (error.payload as { errors?: Record<string, string[]>; message?: string } | undefined) : undefined;
  return Object.values(payload?.errors ?? {}).flat().join(' ') || payload?.message || fallback;
}
