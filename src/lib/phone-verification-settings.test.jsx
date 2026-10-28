// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PhoneVerificationPage from '../pages/store/settings/StorePhoneVerificationPage';
import api from '../api/client';
const scope = vi.hoisted(() => ({ context: {} }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('../hooks/useStoreContext', () => ({ default: () => scope.context }));
vi.mock('../components/PageHeader', () => ({ default: ({ title }) => <h1>{title}</h1> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
const settings = (extra = {}) => ({ enabled: false, version: 1, connection_verified: false, credentials_configured: false, phone_country: 'EG', ...extra });
let root, host;
beforeEach(() => {
    vi.resetAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    scope.context = { apiBase: '/my-store', uiBase: '/store', me: { id: 1 }, store: { id: 11 }, access: { canStoreSettings: true, canStoreOrders: true } };
    api.get.mockResolvedValue({ data: { data: settings() } }); api.post.mockResolvedValue({ data: { data: settings({ version: 2 }) } });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const render = async () => { await act(async () => root.render(<MemoryRouter><PhoneVerificationPage /></MemoryRouter>)); };
const button = text => [...host.querySelectorAll('button')].find(node => node.textContent === text);
const submit = async () => { await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); };
async function fill(input, value) { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }
it('saves through POST and verifies the connection only on explicit action', async () => {
    await render(); await submit();
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/my-store/phone-verification', { enabled: false, version: 1, clear_credentials: false, verify_connection: false }); expect(api.put).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Phone verification settings saved.');
    await fill(host.querySelector('input[type="password"]'), 'SYNTHETIC_PHONE_TOKEN'); await fill([...host.querySelectorAll('input')].find(input => input.maxLength === 255), 'SYNTHETIC_INSTANCE');
    await act(async () => button('Verify connection and save').click());
    expect(api.post).toHaveBeenLastCalledWith('/my-store/phone-verification', { enabled: false, version: 2, clear_credentials: false, verify_connection: true, credentials: { instance_id: 'SYNTHETIC_INSTANCE', access_token: 'SYNTHETIC_PHONE_TOKEN' } });
    expect(host.querySelector('input[type="password"]').value).toBe('');
});
it('does not retry a forbidden save and reloads only on explicit retry', async () => {
    await render(); api.post.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden.' } } }); await submit();
    expect(api.post).toHaveBeenCalledTimes(1); expect(api.put).not.toHaveBeenCalled(); expect(host.querySelector('[role="alert"]').textContent).toContain('Forbidden.');
    await act(async () => button('Reload settings').click()); expect(api.get).toHaveBeenCalledTimes(2); expect(host.querySelector('[role="alert"]')).toBeNull(); expect(api.post).toHaveBeenCalledTimes(1);
});
it('clears credential drafts and fences old saves across accounts at the same endpoint', async () => {
    await render(); await fill(host.querySelector('input[type="password"]'), 'PREVIOUS_ACCOUNT_SECRET'); let oldSave, nextLoad;
    api.post.mockImplementation(() => new Promise(resolve => { oldSave = resolve; })); await submit();
    scope.context = { ...scope.context, me: { id: 2 }, store: { id: 11 } }; api.get.mockImplementation(() => new Promise(resolve => { nextLoad = resolve; })); await render(); expect(host.querySelector('form')).toBeNull();
    await act(async () => oldSave({ data: { data: settings({ version: 99, phone_country: 'OLD_COUNTRY' }) } })); expect(host.querySelector('form')).toBeNull();
    await act(async () => nextLoad({ data: { data: settings({ phone_country: 'NEW_COUNTRY' }) } }));
    expect(host.querySelector('input[type="password"]').value).toBe(''); expect(host.textContent).toContain('NEW_COUNTRY'); expect(host.textContent).not.toContain('OLD_COUNTRY'); expect(host.textContent).not.toContain('Phone verification settings saved.');
});
it('ignores old loads and late save failures across stores on the same account', async () => {
    let oldLoad; api.get.mockImplementationOnce(() => new Promise(resolve => { oldLoad = resolve; })); await render();
    scope.context = { ...scope.context, store: { id: 22 } }; await render(); await act(async () => oldLoad({ data: { data: settings({ phone_country: 'OLD_COUNTRY' }) } })); expect(host.textContent).not.toContain('OLD_COUNTRY');
    let failOld; api.post.mockImplementationOnce(() => new Promise((resolve, reject) => { failOld = reject; })); await submit();
    scope.context = { ...scope.context, store: { id: 33 } }; await render(); await act(async () => failOld(new Error('PREVIOUS_STORE_FAILURE')));
    expect(host.querySelector('[role="alert"]')).toBeNull(); expect(host.textContent).not.toContain('PREVIOUS_STORE_FAILURE'); expect(button('Save OTP settings').disabled).toBe(false);
});
