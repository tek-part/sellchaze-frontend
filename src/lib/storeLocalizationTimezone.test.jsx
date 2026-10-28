// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreLocalizationSettingsPage from '../pages/store/settings/StoreLocalizationSettingsPage';
import api from '../api/client';

const save = vi.fn();
let store;
vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));
vi.mock('../hooks/useStoreContext', () => ({ default: () => ({ apiBase: '/my-store', store }) }));
vi.mock('../hooks/useStoreSettings', async (original) => ({
    ...await original(),
    default: () => ({ save, saving: false, errors: {}, clearErrors: vi.fn() }),
}));
vi.mock('../hooks/useStoreLocales', () => ({ clearStoreLocalesCache: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => fallback ?? key }) }));

let root, host;
const supportedValuesDescriptor = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf');
beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    store = { currency: 'KWD', default_locale: 'ar', supported_locales: ['ar', 'en'], supported_currencies: ['KWD'], timezone: 'UTC' };
    api.get.mockResolvedValue({ data: { data: ['KWD', 'USD'] } });
    save.mockResolvedValue(store);
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
    await act(async () => root.unmount()); host.remove();
    if (supportedValuesDescriptor) Object.defineProperty(Intl, 'supportedValuesOf', supportedValuesDescriptor);
    else delete Intl.supportedValuesOf;
});

describe('localization timezone selection', () => {
    it.each([
        ['UTC absent from browser list', 'UTC', () => ['Africa/Cairo', 'Asia/Riyadh']],
        ['stored alias absent from browser list', 'Asia/Kuwait', () => ['Africa/Cairo', 'Asia/Riyadh']],
        ['stored zone absent from fallback list', 'Pacific/Chatham', undefined],
        ['browser timezone enumeration fails', 'Pacific/Chatham', () => { throw new RangeError('Unsupported enumeration'); }],
    ])('keeps %s visible and unchanged when saving other settings', async (_, timezone, supportedValuesOf) => {
        store = { ...store, timezone };
        Object.defineProperty(Intl, 'supportedValuesOf', { configurable: true, writable: true, value: supportedValuesOf });
        await act(async () => root.render(<StoreLocalizationSettingsPage />));

        expect(host.querySelector('#store-timezone').textContent).toContain(timezone);
        const english = [...host.querySelectorAll('button')].find((button) => button.textContent === 'English');
        await act(async () => english.click());
        await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

        expect(save).toHaveBeenCalledWith({
            default_locale: 'ar', supported_locales: ['ar'], currency: 'KWD',
            supported_currencies: ['KWD'], auto_currency_by_country: false, timezone,
        });
    });
});
