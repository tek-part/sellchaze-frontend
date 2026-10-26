import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/client';

const NO_ROWS = Object.freeze([]);
const defaultError = (error) => error?.response?.data?.message || error?.message || '';

/**
 * Loads one page of an index list and reloads it whenever the URL or the request params change.
 *
 * - `params` is compared by value, so passing a fresh object every render (e.g. `table.apiParams`)
 *   does not refetch; the request is sent with exactly these params.
 * - A response that arrives after the params changed, the list was reloaded or the page unmounted
 *   is dropped (and its request aborted).
 * - The previous rows stay on screen while the next page loads. They are cleared only when
 *   `resetKey` changes (defaults to `url`, so switching store never shows the old store's rows).
 *
 * @param {object}   config
 * @param {string}   config.url
 * @param {object}   [config.params]
 * @param {boolean}  [config.enabled=true]  When false no request is sent and the state is left alone.
 * @param {Function} [config.map]           Maps the response body before it is stored (`{ data, meta, ... }`).
 * @param {Function} [config.accept]        Return `false` to discard a response (e.g. to jump to the last page instead).
 * @param {Function} [config.formatError]   Turns a failed request into the `error` message.
 * @param {Function} [config.onError]       Called with the error of a failed (non-quiet) request.
 * @param {*}        [config.resetKey=url]  Clears the stored result when it changes.
 * @returns {{ result: object|null, data: Array, meta: object|undefined, loading: boolean, error: string,
 *   reload: (options?: { quiet?: boolean }) => void, setResult: Function, setError: Function }}
 *   `reload({ quiet: true })` refreshes in the background: no loading state, and a failure keeps the current rows.
 */
export default function useIndexQuery({ url, params, enabled = true, map, accept, formatError = defaultError, onError, resetKey = url }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);
    const quiet = useRef(false);
    // Latest callbacks, read when a response arrives; they never trigger a request themselves.
    const callbacks = useRef({});
    callbacks.current = { map, accept, formatError, onError };

    const lastResetKey = useRef(resetKey);
    useEffect(() => {
        if (Object.is(lastResetKey.current, resetKey)) return;
        lastResetKey.current = resetKey;
        setResult(null);
    }, [resetKey]);

    const paramsKey = JSON.stringify(params ?? {});
    useEffect(() => {
        if (!enabled || !url) return undefined;
        const background = quiet.current; quiet.current = false;
        let active = true;
        const controller = new AbortController();
        if (!background) { setLoading(true); setError(''); }
        api.get(url, { params: JSON.parse(paramsKey), signal: controller.signal })
            .then(({ data }) => {
                if (!active) return;
                const { map: select, accept: keep } = callbacks.current;
                if (keep && keep(data) === false) return;
                setResult(select ? select(data) : data);
            })
            .catch((e) => {
                if (!active || background) return;
                setError(callbacks.current.formatError(e));
                callbacks.current.onError?.(e);
            })
            .finally(() => { if (active && !background) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [url, paramsKey, enabled, tick]);

    const reload = useCallback((options) => {
        quiet.current = options?.quiet === true;
        setTick((value) => value + 1);
    }, []);

    return { result, data: result?.data ?? NO_ROWS, meta: result?.meta, loading, error, reload, setResult, setError };
}
