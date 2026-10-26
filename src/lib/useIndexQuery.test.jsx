// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useIndexQuery from '../components/data-table/useIndexQuery';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));

let root, host, latest;
function Probe(props) { latest = useIndexQuery(props); return null; }
const render = (props) => act(async () => root.render(<Probe {...props} />));
const deferred = () => { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; };
const page = (ids, extra = {}) => ({ data: { data: ids.map((id) => ({ id })), meta: { total: ids.length }, ...extra } });

beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

describe('useIndexQuery', () => {
    it('loads the list with the given params and exposes rows and meta', async () => {
        api.get.mockResolvedValue(page([1, 2]));
        await render({ url: '/s/products', params: { page: 1, search: 'tea' } });
        expect(api.get).toHaveBeenCalledTimes(1);
        expect(api.get.mock.calls[0][0]).toBe('/s/products');
        expect(api.get.mock.calls[0][1].params).toEqual({ page: 1, search: 'tea' });
        expect(latest.data.map((row) => row.id)).toEqual([1, 2]);
        expect(latest.meta).toEqual({ total: 2 });
        expect(latest.loading).toBe(false);
        expect(latest.error).toBe('');
    });

    it('does not refetch for an equal params object, and does for a changed one', async () => {
        api.get.mockResolvedValue(page([1]));
        await render({ url: '/s/products', params: { page: 1 } });
        await render({ url: '/s/products', params: { page: 1 } });
        expect(api.get).toHaveBeenCalledTimes(1);
        await render({ url: '/s/products', params: { page: 2 } });
        expect(api.get).toHaveBeenCalledTimes(2);
    });

    it('keeps the previous rows while the next page loads and drops stale responses', async () => {
        api.get.mockResolvedValueOnce(page([1]));
        await render({ url: '/s/products', params: { page: 1 } });
        const slow = deferred(); const fast = deferred();
        api.get.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
        await render({ url: '/s/products', params: { page: 2 } });
        expect(latest.loading).toBe(true);
        expect(latest.data.map((row) => row.id)).toEqual([1]);
        expect(api.get.mock.calls[1][1].signal.aborted).toBe(false);
        await render({ url: '/s/products', params: { page: 3 } });
        expect(api.get.mock.calls[1][1].signal.aborted).toBe(true);
        await act(async () => fast.resolve(page([3])));
        await act(async () => slow.resolve(page([2])));
        expect(latest.data.map((row) => row.id)).toEqual([3]);
        expect(latest.loading).toBe(false);
    });

    it('clears the rows when the url (or resetKey) changes', async () => {
        api.get.mockResolvedValueOnce(page([1]));
        await render({ url: '/a/products', params: {} });
        api.get.mockReturnValueOnce(new Promise(() => {}));
        await render({ url: '/b/products', params: {} });
        expect(latest.result).toBeNull();
        expect(latest.data).toEqual([]);
        expect(latest.loading).toBe(true);
    });

    it('reports errors through formatError and onError', async () => {
        const onError = vi.fn();
        api.get.mockRejectedValueOnce({ response: { data: { message: 'Nope' } } });
        await render({ url: '/s/products', params: {}, onError });
        expect(latest.error).toBe('Nope');
        expect(onError).toHaveBeenCalledTimes(1);
        api.get.mockRejectedValueOnce(new Error('boom'));
        await act(async () => latest.reload());
        expect(latest.error).toBe('boom');
        api.get.mockRejectedValueOnce(new Error('boom'));
        await render({ url: '/s/products', params: { page: 2 }, formatError: (e) => `x:${e.message}` });
        expect(latest.error).toBe('x:boom');
    });

    it('refreshes quietly: no loading state, and a failure keeps the current rows', async () => {
        api.get.mockResolvedValueOnce(page([1]));
        await render({ url: '/s/products', params: {} });
        const refresh = deferred();
        api.get.mockReturnValueOnce(refresh.promise);
        await act(async () => latest.reload({ quiet: true }));
        expect(api.get).toHaveBeenCalledTimes(2);
        expect(latest.loading).toBe(false);
        await act(async () => refresh.reject(new Error('offline')));
        expect(latest.error).toBe('');
        expect(latest.data.map((row) => row.id)).toEqual([1]);
        api.get.mockResolvedValueOnce(page([1, 2]));
        await act(async () => latest.reload({ quiet: true }));
        expect(latest.data.map((row) => row.id)).toEqual([1, 2]);
    });

    it('sends nothing while disabled, and maps or discards responses', async () => {
        await render({ url: '/s/products', params: {}, enabled: false });
        expect(api.get).not.toHaveBeenCalled();
        expect(latest.loading).toBe(true);

        api.get.mockResolvedValueOnce(page([1, 2]));
        await render({ url: '/s/products', params: {}, map: (body) => ({ ...body, data: body.data.filter((row) => row.id > 1) }) });
        expect(latest.data.map((row) => row.id)).toEqual([2]);

        api.get.mockResolvedValueOnce(page([]));
        await render({ url: '/s/products', params: { page: 9 }, accept: (body) => body.data.length > 0 });
        expect(latest.data.map((row) => row.id)).toEqual([2]);
        expect(latest.loading).toBe(false);
    });
});
