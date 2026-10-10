import { afterEach, describe, expect, it, vi } from 'vitest';
import { readOrderReceipt, saveOrderReceipt } from './order-receipt';

const token = `MToxOjIwMDAwMDAwMDA.${'a'.repeat(64)}`;
afterEach(() => vi.unstubAllGlobals());

describe('private guest receipt recovery', () => {
  it('keeps separate capabilities for each order and tenant origin', () => {
    const location = { origin: 'https://store-a.test', hash: '' };
    const storage = new Map<string, string>();
    vi.stubGlobal('window', { location });
    vi.stubGlobal('sessionStorage', { setItem: (key: string, value: string) => storage.set(key, value), getItem: (key: string) => storage.get(key) });
    saveOrderReceipt('ORDER-A', token);
    expect(readOrderReceipt('ORDER-A')).toBe(token);
    expect(readOrderReceipt('ORDER-B')).toBeUndefined();
    location.origin = 'https://store-b.test';
    expect(readOrderReceipt('ORDER-A')).toBeUndefined();
  });

  it('restores an emailed fragment and retains it when tab storage is unavailable', () => {
    const location = { origin: 'https://private-browser.test', hash: `#receipt=${encodeURIComponent(token)}` };
    vi.stubGlobal('window', { location });
    vi.stubGlobal('sessionStorage', { setItem: () => { throw new Error('Unavailable'); }, getItem: () => { throw new Error('Unavailable'); } });
    expect(readOrderReceipt('ORDER-EMAIL')).toBe(token);
    location.hash = '';
    expect(readOrderReceipt('ORDER-EMAIL')).toBe(token);
    expect(readOrderReceipt('OTHER-ORDER')).toBeUndefined();
  });

  it('does not retain malformed or oversized capabilities', () => {
    vi.stubGlobal('window', { location: { origin: 'https://invalid-receipt.test', hash: '#receipt=malformed' } });
    const write = vi.fn();
    vi.stubGlobal('sessionStorage', { setItem: write, getItem: () => 'malformed' });
    saveOrderReceipt('INVALID', 'x'.repeat(2000));
    expect(readOrderReceipt('INVALID')).toBeUndefined();
    expect(readOrderReceipt(null)).toBeUndefined();
    expect(write).not.toHaveBeenCalled();
  });
});
