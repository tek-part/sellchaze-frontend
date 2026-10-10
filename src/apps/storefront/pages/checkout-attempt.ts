import { ApiError } from '../api/client';

/** One unresolved submission per tab and store origin. Contains delivery details, never card data. */
export interface CheckoutAttempt {
  key: string;
  body: Record<string, unknown>;
  orderNumber?: string;
}

const memory = new Map<string, CheckoutAttempt>();
const prefix = 'sf:checkout-attempt:v1:';

export function readCheckoutAttempt(scope: string): CheckoutAttempt | undefined {
  try {
    const raw = sessionStorage.getItem(prefix + scope);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (value && typeof value === 'object' && 'key' in value && typeof value.key === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value.key) && 'body' in value && value.body && typeof value.body === 'object' && !Array.isArray(value.body)) {
        return value as CheckoutAttempt;
      }
    }
  } catch { /* Storage can be unavailable in private browsing; keep the in-memory attempt. */ }
  return memory.get(scope);
}

export function saveCheckoutAttempt(scope: string, attempt: CheckoutAttempt): void {
  memory.set(scope, attempt);
  try { sessionStorage.setItem(prefix + scope, JSON.stringify(attempt)); } catch { /* In-memory retry remains safe. */ }
}

export function clearCheckoutAttempt(scope: string): void {
  memory.delete(scope);
  try { sessionStorage.removeItem(prefix + scope); } catch { /* Storage unavailable. */ }
}

/** A missing or expired claim can only be resubmitted with its ORIGINAL key and body. */
export async function resumeCheckoutAttempt<T>(attempt: CheckoutAttempt, recover: (key: string) => Promise<T>, submit: (body: Record<string, unknown>, key: string) => Promise<T>): Promise<T> {
  try { return await recover(attempt.key); }
  catch (requestError) {
    const body = requestError instanceof ApiError ? requestError.payload as { checkout_retry?: boolean } | undefined : undefined;
    if (requestError instanceof ApiError && (requestError.status === 404 || (requestError.status === 409 && body?.checkout_retry === true))) {
      return await submit(attempt.body, attempt.key);
    }
    throw requestError;
  }
}
