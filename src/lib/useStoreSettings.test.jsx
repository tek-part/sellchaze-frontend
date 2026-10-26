// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useStoreSettings from '../hooks/useStoreSettings';
import api from '../api/client';
import { notify } from '../components/ui/notify';

const setStore = vi.fn();
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('../components/ui/notify', () => ({ notify: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../hooks/useStoreContext', () => ({ default: () => ({ apiBase: '/stores/7', setStore }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => fallback ?? key }) }));

let root, host, latest;
function Probe(props) { latest = useStoreSettings(props.options); return null; }
const render = (options) => act(async () => root.render(<Probe options={options} />));

beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

describe('useStoreSettings', () => {
    it('saves a partial store update as multipart PUT and updates the layout store', async () => {
        api.post.mockResolvedValue({ data: { data: { id: 7, name: 'Tea' } } });
        await render();
        expect(latest.loading).toBe(false);
        expect(api.get).not.toHaveBeenCalled();
        let next;
        await act(async () => { next = await latest.save({ name: 'Tea', tags: ['a', 'b'], open: true, note: null, skip: undefined }); });
        const [url, body] = api.post.mock.calls[0];
        expect(url).toBe('/stores/7');
        expect([...body.entries()]).toEqual([['_method', 'PUT'], ['name', 'Tea'], ['tags[]', 'a'], ['tags[]', 'b'], ['open', '1'], ['note', '']]);
        expect(next).toEqual({ id: 7, name: 'Tea' });
        expect(setStore).toHaveBeenCalledWith({ id: 7, name: 'Tea' });
        expect(notify.success).toHaveBeenCalledTimes(1);
    });

    it('keeps field errors and rethrows when a store update fails', async () => {
        const failure = { response: { data: { errors: { name: ['Too long'] } } } };
        api.post.mockRejectedValue(failure);
        await render();
        await act(async () => { await expect(latest.save({ name: 'x' })).rejects.toBe(failure); });
        expect(latest.errors).toEqual({ name: ['Too long'] });
        expect(notify.error).toHaveBeenCalledWith('Could not save changes', 'Too long');
    });

    it('loads and saves a settings resource under the store', async () => {
        api.get.mockResolvedValue({ data: { data: { enabled: false } } });
        await render({ endpoint: 'social-links' });
        expect(api.get).toHaveBeenCalledWith('/stores/7/social-links');
        expect(latest.initial).toEqual({ enabled: false });
        expect(latest.loading).toBe(false);

        await act(async () => latest.change({ enabled: true }));
        expect(latest.draft).toEqual({ enabled: true });

        api.put.mockResolvedValue({ data: { data: { enabled: true }, store: { id: 7 } } });
        let ok;
        await act(async () => { ok = await latest.save({ enabled: true }); });
        expect(ok).toBe(true);
        expect(api.put).toHaveBeenCalledWith('/stores/7/social-links', { enabled: true });
        expect(latest.initial).toEqual({ enabled: true });
        expect(latest.saved).toBe(true);
        expect(setStore).toHaveBeenCalledWith({ id: 7 });

        const form = new FormData();
        api.post.mockRejectedValue({ response: { data: { message: 'Stale revision' } } });
        await act(async () => { ok = await latest.save(form); });
        expect(ok).toBe(false);
        expect(api.post).toHaveBeenCalledWith('/stores/7/social-links', form);
        expect(latest.error).toBe('Stale revision');
        expect(notify.error).not.toHaveBeenCalled();
    });

    it('does not load a resource the member cannot manage', async () => {
        await render({ endpoint: 'head-code', enabled: false });
        expect(api.get).not.toHaveBeenCalled();
    });
});
