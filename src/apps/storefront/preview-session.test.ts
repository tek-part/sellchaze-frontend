import { afterEach, describe, expect, it, vi } from 'vitest';
import { preservePreviewNavigation, publicStorefrontUrl, readSignedPreviewToken, withPreviewLink, withPreviewRead } from './preview-session';
import { apiFetch, apiRootFetch, setApiLocale } from './api/client';

const token = `Y2F0YWxvZzoxOjI6OTk5OTk5OTk5OQ.${'a'.repeat(64)}`;
const query = `?__preview=${token}`;
afterEach(() => { vi.unstubAllGlobals(); setApiLocale(null); });
describe('signed storefront preview capability', () => {
  it('accepts only bounded capability shapes and leaves verification to the server', () => {
    expect(readSignedPreviewToken(query)).toBe(token); expect(readSignedPreviewToken('')).toBeNull();
    for (const value of ['javascript:alert(1)', 'unbounded', `${'x'.repeat(257)}.${'a'.repeat(64)}`, `${token}&other=1`.replace('.', '%00')]) expect(readSignedPreviewToken(`?__preview=${encodeURIComponent(value)}`)).toBeNull();
  });
  it('forwards the token only to theme, layout and page reads, preserving existing filters', () => {
    for (const path of ['/', '/context', '/layout?template=home', '/pages/about', '/funnels/campaign']) {
      const result = new URL(withPreviewRead(path, 'GET', query), 'https://shop.example');
      expect(result.searchParams.get('__preview')).toBe(token);
    }
    expect(new URL(withPreviewRead('/layout?template=product&lang=ar', 'GET', query), 'https://shop.example').searchParams.get('lang')).toBe('ar');
    for (const path of ['/checkout', '/orders', '/auth/login', '/products/1/reviews', '/products/1/personalization-image', '/payments']) {
      expect(withPreviewRead(path, 'GET', query)).toBe(path); expect(withPreviewRead(path, 'POST', query)).toBe(path);
    }
    expect(withPreviewRead('/', 'POST', query)).toBe('/'); expect(withPreviewRead('//external.example/', 'GET', query)).toBe('//external.example/');
    expect(withPreviewRead('/layout?__preview=caller-owned', 'GET', query)).toBe('/layout?__preview=caller-owned');
  });
  it('keeps internal navigation queries and fragments without changing outside or separately signed links', () => {
    const current = `https://shop.example/${query}`;
    expect(withPreviewLink('/products/chair?variant=2#details', current, token)).toBe(`/products/chair?variant=2&__preview=${token}#details`);
    for (const href of ['https://outside.example/shop', 'javascript:alert(1)', 'mailto:store@example.com', '/api/v1/orders', '/storage/photo.png', '#faq', '/checkout?signature=private', '/receipt?receipt_token=private', '/?__preview=different']) expect(withPreviewLink(href, current, token)).toBeNull();
  });
  it('never shares the owner capability through the product share URL', () => {
    expect(publicStorefrontUrl(`https://shop.example/products/chair?variant=2&__preview=${token}#details`)).toBe('https://shop.example/products/chair?variant=2#details');
  });
  it('keeps full-document search navigation in the preview without altering external destinations', () => {
    vi.stubGlobal('window', { location: { search: query, href: `https://shop.example/${query}` } });
    expect(preservePreviewNavigation('/search?q=chair')).toBe(`/search?q=chair&__preview=${token}`);
    expect(preservePreviewNavigation('https://outside.example')).toBe('https://outside.example');
  });
  it('carries the locale and capability to bootstrap/layout reads but leaves order and auth transport unchanged', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetch); vi.stubGlobal('window', { location: { search: query } }); setApiLocale('ar');
    await apiFetch('/'); await apiFetch('/layout?template=home');
    await apiFetch('/checkout', { method: 'POST', body: JSON.stringify({ phone: 'fixture-only' }) }); await apiRootFetch('/auth/login', { method: 'POST' });
    expect(fetch.mock.calls[0]?.[0]).toBe(`/api/v1/storefront/?__preview=${token}&lang=ar`);
    expect(fetch.mock.calls[1]?.[0]).toBe(`/api/v1/storefront/layout?template=home&__preview=${token}&lang=ar`);
    expect(fetch.mock.calls[2]?.[0]).toBe('/api/v1/storefront/checkout?lang=ar'); expect(fetch.mock.calls[2]?.[1].body).toBe('{"phone":"fixture-only"}');
    expect(fetch.mock.calls[3]?.[0]).toBe('/api/v1/auth/login');
  });
});
