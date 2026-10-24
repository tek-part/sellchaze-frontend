import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, setApiLocale, storefrontRequestUrl } from './client';

const fetchMock = vi.fn();

function early(url: string, read: Promise<{ status: number; body: unknown }>): void {
  window.__sfEarly = { ...window.__sfEarly, [url]: read };
}

describe('early reads started by the inline boot script', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { search: '' } });
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ fresh: true }) });
    setApiLocale('en');
  });
  afterEach(() => {
    fetchMock.mockReset();
    setApiLocale(null);
    vi.unstubAllGlobals();
  });

  it('requests the root without a trailing slash (no redirect round trip)', () => {
    setApiLocale('ar');
    expect(storefrontRequestUrl('/')).toBe('/api/v1/storefront?lang=ar');
    expect(storefrontRequestUrl('/layout?template=home')).toBe('/api/v1/storefront/layout?template=home&lang=ar');
  });

  it('adopts a read for exactly the same URL once, then fetches normally', async () => {
    early('/api/v1/storefront?lang=en', Promise.resolve({ status: 200, body: { store: { id: 9 } } }));
    await expect(apiFetch('/')).resolves.toEqual({ store: { id: 9 } });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(apiFetch('/')).resolves.toEqual({ fresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ignores a read for a different URL (e.g. another language)', async () => {
    setApiLocale('ar');
    early('/api/v1/storefront/home?lang=en', Promise.resolve({ status: 200, body: { stale: true } }));
    await expect(apiFetch('/home')).resolves.toEqual({ fresh: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/storefront/home?lang=ar', expect.anything());
  });

  it('reports an HTTP error as ApiError without a duplicate request', async () => {
    early('/api/v1/storefront?lang=en', Promise.resolve({ status: 404, body: { message: 'No store' } }));
    const error = await apiFetch('/').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: 'No store' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to a normal request when the early read failed on the network', async () => {
    early('/api/v1/storefront/home?lang=en', Promise.reject(new TypeError('offline')));
    await expect(apiFetch('/home')).resolves.toEqual({ fresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never answers writes from an early read', async () => {
    early('/api/v1/storefront/cart?lang=en', Promise.resolve({ status: 200, body: { stale: true } }));
    await expect(apiFetch('/cart', { method: 'POST', body: '{}' })).resolves.toEqual({ fresh: true });
  });
});
