// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import StoreSettingsNavigation from '../components/store/StoreSettingsNavigation';
import { buildStoreNav } from '../components/store/storeNav';
import { storeAccess } from './storeAccess';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (_key, fallback) => fallback }) }));
let host, root;
const t = (_key, fallback) => fallback;
const settings = access => buildStoreNav(t, access).find(group => group.key === 'settings')?.items ?? [];
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function render(items, query = '', rel = '/settings/general') {
    await act(async () => root.render(<MemoryRouter><StoreSettingsNavigation items={items} query={query} rel={rel} uiBase="/store" label="Store settings" /></MemoryRouter>));
}
it('retains every permission-allowed settings destination once, including formerly hidden settings', async () => {
    const items = settings(storeAccess(['Merchant'], [])); await render(items);
    const actual = [...host.querySelectorAll('a')].map(link => link.getAttribute('href'));
    expect(new Set(actual).size).toBe(items.length);
    expect(actual.sort()).toEqual(items.map(item => `/store/${item.to}`).sort());
    for (const key of ['bot-protection', 'shopping-preferences', 'localization', 'order-limits', 'publish']) expect(actual).toContain(`/store/settings/${key}`);
    expect(host.querySelector('a[aria-current="page"]').getAttribute('href')).toBe('/store/settings/general');
});
it('search reveals an otherwise collapsed API child and removing the search restores all links', async () => {
    const items = settings(storeAccess(['Merchant'], [])); await render(items);
    expect(host.querySelector('.ws-settings-api-trigger').getAttribute('aria-expanded')).toBe('false');
    await render(items, 'Webhooks');
    expect([...host.querySelectorAll('a')].map(link => link.textContent)).toEqual(['Webhooks']);
    expect(host.querySelector('.ws-settings-api-trigger').getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('.ws-settings-api-panel').hasAttribute('inert')).toBe(false);
    await render(items); expect(host.querySelectorAll('a')).toHaveLength(items.length);
});
it('does not invent links absent from a staff member’s permission-filtered settings', async () => {
    const items = settings(storeAccess(['Employee'], ['store.view', 'store.settings.manage'])); await render(items);
    expect(host.querySelector('a[href="/store/settings/managers"]')).toBeNull();
    expect(host.querySelector('a[href="/store/settings/login-sessions"]')).toBeNull();
    expect(host.querySelector('a[href="/store/settings/head-code"]')).toBeNull();
    expect(host.querySelectorAll('a')).toHaveLength(items.length);
});
it('keeps the active deep API route expanded and reports an empty search without stale links', async () => {
    const items = settings(storeAccess(['Merchant'], [])); await render(items, '', '/settings/public-api/mcp');
    expect(host.querySelector('.ws-settings-api-trigger').getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('a[aria-current="page"]').getAttribute('href')).toBe('/store/settings/public-api');
    await render(items, 'no-such-setting');
    expect(host.querySelectorAll('a')).toHaveLength(0);
    expect(host.querySelector('[role="status"]').textContent).toBe('No matching settings.');
});
