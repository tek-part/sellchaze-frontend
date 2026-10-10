import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, setApiLocale, setAuthToken } from './client';

afterEach(() => { vi.unstubAllGlobals(); setApiLocale(null); setAuthToken(null); });
describe('storefront image upload transport', () => {
  it('lets the browser generate multipart boundaries and carries current auth and locale', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ data: { token: 'private-token' } }) });
    vi.stubGlobal('fetch', fetch); setApiLocale('ar'); setAuthToken('customer-auth');
    const body = new FormData(); body.append('field_key', 'photo'); body.append('file', new Blob(['image'], { type: 'image/png' }), 'image.png');
    await apiFetch('/products/1/personalization-image', { method: 'POST', body });
    const [url, options] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/v1/storefront/products/1/personalization-image?lang=ar');
    expect(options.body).toBe(body);
    expect(options.headers).toMatchObject({ Accept: 'application/json', Authorization: 'Bearer customer-auth', 'Accept-Language': 'ar' });
    expect(options.headers).not.toHaveProperty('Content-Type');
  });
});
