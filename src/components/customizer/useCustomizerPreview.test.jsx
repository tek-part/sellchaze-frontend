// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useCustomizerPreview from './useCustomizerPreview';
import PreviewFrame from './PreviewFrame';
import { previewUrlFor } from './customizerUtils';
import api from '../../api/client';

vi.mock('../../api/client', () => ({ default: { post: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, fallback) => fallback }) }));
let root, host;
function Preview({ scope = '/stores/14', storeId = 14, theme = 10, locale = 'ar', localBase = '' }) {
    const preview = useCustomizerPreview(scope, theme, localBase, storeId);
    return <PreviewFrame src={previewUrlFor(preview.url, locale, 'naseem')} loading={preview.loading} error={preview.error} onReload={preview.reload} width={390} />;
}
async function render(props = {}) { await act(async () => root.render(<Preview {...props} />)); }
const response = (token = 'private-capability', expires = 1800) => ({ data: { preview_url: `https://preview.store.example/?__preview=${token}`, expires_in: expires } });
beforeEach(() => {
    vi.clearAllMocks(); vi.useFakeTimers(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });

describe('private customizer preview', () => {
    it('waits for the scoped capability, retains it across locale changes, and never persists it', async () => {
        let resolve; api.post.mockReturnValue(new Promise(done => { resolve = done; }));
        const storage = vi.spyOn(Storage.prototype, 'setItem');
        await render();
        expect(host.querySelector('iframe')).toBeNull();
        expect(host.textContent).toContain('Preparing your private preview');
        expect(api.post).toHaveBeenCalledWith('/stores/14/themes/preview', { theme_id: 10 });
        await act(async () => resolve(response()));
        let url = new URL(host.querySelector('iframe').src);
        expect(Object.fromEntries(url.searchParams)).toEqual({ __preview: 'private-capability', customize: '1', lang: 'ar', theme: 'naseem' });
        expect(url.origin).toBe('https://preview.store.example');
        expect(host.querySelector('iframe').getAttribute('referrerpolicy')).toBe('no-referrer');
        await render({ locale: 'en' });
        expect(new URL(host.querySelector('iframe').src).searchParams.get('__preview')).toBe('private-capability');
        expect(new URL(host.querySelector('iframe').src).searchParams.get('lang')).toBe('en');
        expect(api.post).toHaveBeenCalledTimes(1); expect(storage).not.toHaveBeenCalled(); storage.mockRestore();
    });

    it('drops the old frame and ignores a late response after switching stores or themes', async () => {
        let oldResolve, newResolve;
        api.post.mockReturnValueOnce(new Promise(done => { oldResolve = done; })).mockReturnValueOnce(new Promise(done => { newResolve = done; }));
        await render(); await render({ scope: '/stores/15', theme: 11 });
        await act(async () => oldResolve(response('old-store')));
        expect(host.querySelector('iframe')).toBeNull();
        await act(async () => newResolve(response('new-store')));
        expect(new URL(host.querySelector('iframe').src).searchParams.get('__preview')).toBe('new-store');
        api.post.mockReturnValue(new Promise(() => {}));
        await render({ scope: '/stores/15', theme: 12 });
        expect(host.querySelector('iframe')).toBeNull();
    });

    it('shows a safe retry on failure without rendering raw server errors or an unsigned frame', async () => {
        api.post.mockRejectedValueOnce(new Error('https://store.example/?__preview=secret-error'));
        await render();
        expect(host.querySelector('iframe')).toBeNull(); expect(host.textContent).toContain('private preview could not be loaded');
        expect(host.innerHTML).not.toContain('secret-error');
        api.post.mockResolvedValueOnce(response('retry-token'));
        await act(async () => host.querySelector('button').click());
        expect(new URL(host.querySelector('iframe').src).searchParams.get('__preview')).toBe('retry-token');
    });

    it('invalidates the capability when a different merchant resolves through the same my-store alias', async () => {
        api.post.mockResolvedValueOnce(response('first-merchant'));
        await render({ scope: '/my-store', storeId: 14 });
        api.post.mockReturnValue(new Promise(() => {}));
        await render({ scope: '/my-store', storeId: 15 });
        expect(host.querySelector('iframe')).toBeNull();
        expect(api.post).toHaveBeenCalledTimes(2);
    });

    it.each(['https://store.example/?preview=1', 'javascript:alert(1)', 'https://user:pass@store.example/?__preview=token'])('rejects invalid capabilities: %s', async (preview_url) => {
        api.post.mockResolvedValue({ data: { preview_url } }); await render();
        expect(host.querySelector('iframe')).toBeNull(); expect(host.textContent).toContain('private preview could not be loaded');
    });

    it('renews before expiry and cancels refresh when the editor closes', async () => {
        api.post.mockResolvedValueOnce(response('first', 60)).mockResolvedValueOnce(response('renewed', 60));
        await render(); await act(async () => vi.advanceTimersByTimeAsync(30000));
        expect(api.post).toHaveBeenCalledTimes(2);
        expect(new URL(host.querySelector('iframe').src).searchParams.get('__preview')).toBe('renewed');
        await act(async () => root.render(null)); await act(async () => vi.advanceTimersByTimeAsync(60000));
        expect(api.post).toHaveBeenCalledTimes(2);
    });

    it('retains the development preview without requesting a production capability', async () => {
        await render({ localBase: 'http://localhost:5173/' });
        expect(new URL(host.querySelector('iframe').src).origin).toBe('http://localhost:5173');
        const frame = host.querySelector('iframe');
        await act(async () => vi.advanceTimersByTimeAsync(6000));
        await act(async () => host.querySelector('button').click());
        expect(host.querySelector('iframe')).not.toBe(frame);
        expect(api.post).not.toHaveBeenCalled();
    });
});
