import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getStore = vi.fn();
vi.mock('./storefront', () => ({ getStore: (): unknown => getStore() }));

const { loadStorefrontBootstrap, resetStorefrontBootstrapCache } = await import('./bootstrap');
const { ApiError, setApiLocale, storefrontRequestUrl } = await import('./client');

function early(promise: Promise<{ status: number; body: unknown }>, url = storefrontRequestUrl('/')): void {
  window.__sfBoot = { url, promise };
}

describe('loadStorefrontBootstrap', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { search: '' } });
  });
  afterEach(() => {
    resetStorefrontBootstrapCache();
    getStore.mockReset();
    setApiLocale(null);
    vi.unstubAllGlobals();
  });

  it('shares one request between callers', async () => {
    getStore.mockResolvedValue({ store: { id: 1 } });
    const [a, b] = await Promise.all([loadStorefrontBootstrap(), loadStorefrontBootstrap()]);
    expect(a).toBe(b);
    expect(getStore).toHaveBeenCalledTimes(1);
  });

  it('does not memoise a failure, so the next caller retries', async () => {
    getStore.mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce({ store: { id: 1 } });
    await expect(loadStorefrontBootstrap()).rejects.toThrow('404');
    await expect(loadStorefrontBootstrap()).resolves.toEqual({ store: { id: 1 } });
    expect(getStore).toHaveBeenCalledTimes(2);
  });

  it('requests the root without a trailing slash (no redirect round trip)', () => {
    setApiLocale('ar');
    expect(storefrontRequestUrl('/')).toBe('/api/v1/storefront?lang=ar');
    expect(storefrontRequestUrl('/home')).toBe('/api/v1/storefront/home?lang=ar');
  });

  it('adopts the request the inline boot script already started', async () => {
    setApiLocale('en');
    early(Promise.resolve({ status: 200, body: { store: { id: 9 } } }));
    await expect(loadStorefrontBootstrap()).resolves.toEqual({ store: { id: 9 } });
    expect(getStore).not.toHaveBeenCalled();
    expect(window.__sfBoot).toBeUndefined();
  });

  it('ignores an early request for a different URL (e.g. another language)', async () => {
    setApiLocale('ar');
    getStore.mockResolvedValue({ store: { id: 2 } });
    early(Promise.resolve({ status: 200, body: { store: { id: 9 } } }), '/api/v1/storefront?lang=en');
    await expect(loadStorefrontBootstrap()).resolves.toEqual({ store: { id: 2 } });
    expect(getStore).toHaveBeenCalledTimes(1);
  });

  it('turns an early HTTP error into an ApiError without a duplicate request', async () => {
    early(Promise.resolve({ status: 404, body: { message: 'No store' } }));
    const error = await loadStorefrontBootstrap().catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: 'No store' });
    expect(getStore).not.toHaveBeenCalled();
  });

  it('falls back to a normal request when the early one failed on the network', async () => {
    getStore.mockResolvedValue({ store: { id: 3 } });
    early(Promise.reject(new TypeError('offline')));
    await expect(loadStorefrontBootstrap()).resolves.toEqual({ store: { id: 3 } });
    expect(getStore).toHaveBeenCalledTimes(1);
  });
});
