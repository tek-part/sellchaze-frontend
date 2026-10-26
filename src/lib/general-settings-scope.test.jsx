// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MerchantGeneralSettingsPage from '../pages/store/settings/MerchantGeneralSettingsPage';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => fallback ?? key }) }));

const settings = { revision: 'a'.repeat(64), site_title: 'Tea house', header_text: '', primary_color: '#198754', default_locale: 'en', currency: 'USD', phone_country: 'EG', timezone: 'Africa/Cairo', shipping_flat_rate: 0, max_product_quantity: 0, max_orders_per_phone_24h: 0, disable_auto_select_shipping: false, disable_auto_select_variants: false, disable_bot_protection: true, bot_credentials_configured: true };
const choices = { currencies: ['USD'], countries: ['EG'], timezones: ['Africa/Cairo'] };
let root, host;

beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockResolvedValue({ data: { data: settings, choices } });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

async function renderAt(path, context) {
    await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Routes>
        <Route element={<Outlet context={{ access: { canStoreSettings: true }, setStore: vi.fn(), ...context }} />}>
            <Route path="/store/settings/general" element={<MerchantGeneralSettingsPage />} />
            <Route path="/stores/:id/settings/general" element={<MerchantGeneralSettingsPage />} />
        </Route>
    </Routes></MemoryRouter>));
}

describe('general settings page', () => {
    it('serves the owner workspace', async () => {
        await renderAt('/store/settings/general', { apiBase: '/my-store', uiBase: '/store', isAdminScope: false });
        expect(api.get).toHaveBeenCalledWith('/my-store/general-settings');
        expect(host.querySelector('.ws-general-settings form')).not.toBeNull();
        expect(host.querySelector('a[href="/store/settings/localization"]')).not.toBeNull();
    });

    it('serves admins editing a store under /stores/:id', async () => {
        await renderAt('/stores/7/settings/general', { apiBase: '/stores/7', uiBase: '/stores/7', isAdminScope: true });
        expect(api.get).toHaveBeenCalledWith('/stores/7/general-settings');
        expect(host.querySelector('input[aria-label="Main site title"]').value).toBe('Tea house');
        expect(host.querySelector('a[href="/stores/7/settings/localization"]')).not.toBeNull();
    });
});
