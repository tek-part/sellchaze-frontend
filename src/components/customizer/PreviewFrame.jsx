import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineArrowTopRightOnSquare, HiOutlineSignalSlash } from 'react-icons/hi2';
import { isPreviewMessage } from '../../apps/storefront/platform/studio/editor-domain';

const READY_TIMEOUT_MS = 6000;

/**
 * Live storefront preview (contract §5). Waits for the SPA's `ready` message, then the parent posts
 * `hydrate` / `select-section` through the imperative `post()` handle. Shows a skeleton until ready and
 * a hint with "Reload preview" when nothing arrives within 6s.
 *
 * Props: `src` (customize URL), `width` (px), `onReady()`, `onSectionSelected(id)`, `openHref`.
 */
const PreviewFrame = forwardRef(function PreviewFrame({ src, width, onReady, onSectionSelected, openHref }, ref) {
    const { t } = useTranslation();
    const frame = useRef(null);
    const [ready, setReady] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const origin = (() => { try { return new URL(src, window.location.href).origin; } catch { return ''; } })();

    const post = useCallback((message) => {
        if (!frame.current?.contentWindow || !origin) return false;
        frame.current.contentWindow.postMessage({ channel: 'sellchaze-theme-studio', version: 1, ...message }, origin);
        return true;
    }, [origin]);

    useImperativeHandle(ref, () => ({ post, isReady: () => ready, reload: () => setReloadKey((k) => k + 1) }), [post, ready]);

    // A new src or a manual reload restarts the handshake.
    useEffect(() => { setReady(false); setTimedOut(false); }, [src, reloadKey]);

    useEffect(() => {
        if (ready || !src) return undefined;
        const timer = window.setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [ready, src, reloadKey]);

    useEffect(() => {
        const receive = (event) => {
            if (!origin || event.origin !== origin || event.source !== frame.current?.contentWindow || !isPreviewMessage(event.data)) return;
            if (event.data.type === 'ready') { setReady(true); setTimedOut(false); onReady?.(); }
            if (event.data.type === 'section-selected') onSectionSelected?.(event.data.payload.id);
        };
        window.addEventListener('message', receive);
        return () => window.removeEventListener('message', receive);
    }, [origin, onReady, onSectionSelected]);

    if (!src) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <HiOutlineSignalSlash className="h-8 w-8 text-slate-300" aria-hidden />
                <p className="text-sm font-semibold text-slate-700">{t('customizer_preview_no_url', 'No storefront URL yet')}</p>
                <p className="max-w-xs text-xs text-slate-500">{t('customizer_preview_no_url_hint', 'Publish your store or set a domain to see the live preview here.')}</p>
            </div>
        );
    }

    return (
        <div className="relative mx-auto h-full overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,.35)] ring-1 ring-slate-900/5 transition-[width] duration-300" style={{ width: `min(100%, ${width}px)` }}>
            <iframe
                key={reloadKey}
                ref={frame}
                title={t('customizer_preview_title', 'Live storefront preview')}
                src={src}
                className={`h-full w-full border-0 transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
                sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-modals"
            />
            {!ready ? (
                <div className="absolute inset-0 flex flex-col bg-white">
                    <div className="h-14 w-full animate-pulse border-b border-slate-100 bg-slate-50" />
                    <div className="mx-auto w-full max-w-4xl space-y-4 p-8">
                        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="grid grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100" />)}</div>
                        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                    {timedOut ? (
                        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 border-t border-amber-100 bg-amber-50/95 px-4 py-4 text-center backdrop-blur">
                            <p className="text-sm font-semibold text-amber-900">{t('customizer_preview_slow', 'The preview has not responded yet')}</p>
                            <p className="max-w-md text-xs text-amber-800">{t('customizer_preview_slow_hint', 'Make sure the storefront is reachable and supports customize mode, then reload.')}</p>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                                    <HiOutlineArrowPath className="h-4 w-4" aria-hidden />
                                    {t('customizer_reload_preview', 'Reload preview')}
                                </button>
                                {openHref ? (
                                    <a href={openHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                                        <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                                        {t('customizer_open_in_tab', 'Open in a new tab')}
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
});

export default PreviewFrame;
