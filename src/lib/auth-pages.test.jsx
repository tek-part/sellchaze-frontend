// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage, { storeSlugPreview } from '../pages/RegisterPage';
import { passwordScore } from '../components/auth/AuthFields';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() }, setTokens: vi.fn(), clearTokens: vi.fn() }));
vi.mock('../hooks/useGoogleOAuthClientId', () => ({ useGoogleOAuthClientId: () => ({ clientId: '', resolved: true }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ i18n: { language: 'en' }, t: (key) => key }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

let root, host;
beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

const type = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('merchant-only sign-up', () => {
    it('registers a Merchant with the store name and a matching password confirmation', async () => {
        api.post.mockResolvedValue({ data: { access_token: 'a', refresh_token: 'r', onboarding: { next: '/dashboard' } } });
        await act(async () => root.render(<MemoryRouter><RegisterPage /></MemoryRouter>));
        expect(host.textContent).not.toMatch(/auth_role_supplier/);
        await act(async () => {
            type(host.querySelector('#reg-store'), 'Nile Wigs');
            type(host.querySelector('#reg-name'), 'Mona');
            type(host.querySelector('#reg-email'), 'mona@example.test');
            type(host.querySelector('#reg-password'), 'Secret#2026');
        });
        expect(host.textContent).toContain('nile-wigs.sellchaze.com');
        await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
            registration_role: 'Merchant',
            store_name: 'Nile Wigs',
            company_name: 'Nile Wigs',
            password: 'Secret#2026',
            password_confirmation: 'Secret#2026',
        }));
    });
});

describe('auth helpers', () => {
    it('previews a clean subdomain and falls back for names without Latin letters', () => {
        expect(storeSlugPreview('  Nile Wigs & Co. ')).toBe('nile-wigs-co');
        expect(storeSlugPreview('متجر النيل')).toBe('yourstore');
        expect(storeSlugPreview('')).toBe('yourstore');
    });

    it('scores passwords from too short to strong', () => {
        expect(passwordScore('')).toBe(0);
        expect(passwordScore('short')).toBe(0);
        expect(passwordScore('longenough')).toBe(1);
        expect(passwordScore('Longenough12')).toBe(3);
        expect(passwordScore('Longenough12!')).toBe(4);
    });
});
