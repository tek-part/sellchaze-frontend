/**
 * Voltage ToastProvider — hosts a small auto-dismissing toast stack in a polite aria-live region so
 * screen readers announce cart/wishlist feedback. Reduced-motion aware (CSS). Voltage's own chrome.
 */
import { useCallback, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ToastContext, type ToastApi, type ToastTone } from './toast-context';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export function ToastProvider(props: { children: ReactNode }): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const notify = useCallback((message: string, tone: ToastTone = 'default'): void => {
    const id = (seq.current += 1);
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const api: ToastApi = { notify };

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <div className="vlt-toasts" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`vlt-toast vlt-toast--${toast.tone}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
