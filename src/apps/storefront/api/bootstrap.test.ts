import { afterEach, describe, expect, it, vi } from 'vitest';

const getStore = vi.fn();
vi.mock('./storefront', () => ({ getStore: (): unknown => getStore() }));

const { loadStorefrontBootstrap, resetStorefrontBootstrapCache } = await import('./bootstrap');

describe('loadStorefrontBootstrap', () => {
  afterEach(() => {
    resetStorefrontBootstrapCache();
    getStore.mockReset();
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
});
