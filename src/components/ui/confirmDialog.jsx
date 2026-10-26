import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const loadView = () => import('./ConfirmDialogView');
const ConfirmDialogView = lazy(loadView);

/**
 * SweetAlert-style confirmation, callable imperatively like `window.confirm`.
 *
 *   if (!(await confirmDialog({ title, text, confirmText, danger }))) return;
 *
 * Mount <ConfirmDialogHost /> ONCE near the app root (next to <Toaster/>). The
 * helper resolves to true (confirmed) or false (cancelled / dismissed). If the
 * host isn't mounted it degrades to the native window.confirm.
 */

let trigger = null;

export function confirmDialog(options = {}) {
    return new Promise((resolve) => {
        if (typeof trigger !== 'function') {
            resolve(typeof window !== 'undefined' ? window.confirm(options.text || options.title || '') : false);
            return;
        }
        trigger(options, resolve);
    });
}

export function ConfirmDialogHost() {
    const [state, setState] = useState(null); // { options }
    // The dialog chunk mounts on the first request and then stays mounted, so its close
    // transition keeps working exactly as before.
    const [mounted, setMounted] = useState(false);
    const resolveRef = useRef(null);

    useEffect(() => {
        trigger = (options, resolve) => {
            // Mount only once the chunk is in, so a failed fetch degrades to the native prompt
            // instead of suspending/throwing outside the app's error boundary.
            loadView().then(
                () => {
                    resolveRef.current = resolve;
                    setMounted(true);
                    setState({ options });
                },
                () => resolve(window.confirm(options.text || options.title || '')),
            );
        };
        // Fetch the dialog while the browser is idle so the first confirmation opens instantly.
        const idle = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 2000));
        const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
        const handle = idle(() => { void loadView().catch(() => undefined); });
        return () => {
            trigger = null;
            cancelIdle(handle);
        };
    }, []);

    const settle = (result) => {
        const resolve = resolveRef.current;
        resolveRef.current = null;
        setState(null);
        resolve?.(result);
    };

    if (!mounted) return null;
    return (
        <Suspense fallback={null}>
            <ConfirmDialogView state={state} settle={settle} />
        </Suspense>
    );
}
