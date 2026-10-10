import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { clearCheckoutAttempt, readCheckoutAttempt, resumeCheckoutAttempt, saveCheckoutAttempt } from './checkout-attempt';

const attempt = { key: '680eefca-6b13-4b56-903a-66dc1655194d', body: { customer_name: 'Buyer', items: [{ product_id: 1, quantity: 2 }] } };
afterEach(() => { clearCheckoutAttempt('store-a/checkout'); clearCheckoutAttempt('store-b/checkout'); vi.unstubAllGlobals(); });

describe('durable checkout recovery', () => {
  it('restores the exact attempt from tab storage and isolates stores', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
    saveCheckoutAttempt('store-a/checkout', attempt);
    expect(readCheckoutAttempt('store-a/checkout')).toEqual(attempt);
    expect(readCheckoutAttempt('store-b/checkout')).toBeUndefined();
    clearCheckoutAttempt('store-a/checkout');
    expect(readCheckoutAttempt('store-a/checkout')).toBeUndefined();
    expect(storage.size).toBe(0);
  });
  it('rejects corrupt stored data without inventing a replacement key', () => {
    vi.stubGlobal('sessionStorage', { getItem: () => '{broken', removeItem: vi.fn() });
    expect(readCheckoutAttempt('store-a/checkout')).toBeUndefined();
  });
  it('retains the same key in memory when storage is disabled', () => {
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('disabled'); }, setItem: () => { throw new Error('disabled'); }, removeItem: () => { throw new Error('disabled'); } });
    saveCheckoutAttempt('store-a/checkout', attempt);
    expect(readCheckoutAttempt('store-a/checkout')).toEqual(attempt);
    clearCheckoutAttempt('store-a/checkout');
    expect(readCheckoutAttempt('store-a/checkout')).toBeUndefined();
  });
  it.each([new ApiError(404, 'Missing'), new ApiError(409, 'Expired claim', { checkout_retry: true })])('resubmits only the original operation after a safely recoverable result: %s', async (failure) => {
    const recover = vi.fn().mockRejectedValue(failure);
    const submit = vi.fn().mockResolvedValue({ data: { number: 'ORD-1' } });
    await expect(resumeCheckoutAttempt(attempt, recover, submit)).resolves.toEqual({ data: { number: 'ORD-1' } });
    expect(recover).toHaveBeenCalledWith(attempt.key);
    expect(submit).toHaveBeenCalledExactlyOnceWith(attempt.body, attempt.key);
  });
  it.each([new ApiError(409, 'Pending', { checkout_pending: true }), new ApiError(409, 'Wrong owner'), new ApiError(500, 'Unknown'), new TypeError('Network lost'), new ApiError(422, 'Saved order', { payment_retry: { token: 'resume' } })])('does not submit again when recovery is uncertain or the order exists: %s', async (failure) => {
    const submit = vi.fn();
    await expect(resumeCheckoutAttempt(attempt, vi.fn().mockRejectedValue(failure), submit)).rejects.toBe(failure);
    expect(submit).not.toHaveBeenCalled();
  });
  it('returns the recovered result without a new submission', async () => {
    const submit = vi.fn();
    await expect(resumeCheckoutAttempt(attempt, vi.fn().mockResolvedValue({ data: { number: 'ORD-1' } }), submit)).resolves.toEqual({ data: { number: 'ORD-1' } });
    expect(submit).not.toHaveBeenCalled();
  });
});
