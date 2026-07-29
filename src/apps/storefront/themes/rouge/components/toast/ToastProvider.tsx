/**
 * Rouge ToastProvider — holds the toast stack and renders a bottom-inline-end viewport via Portal.
 * Each toast blooms in, auto-dismisses on a hairline gilt progress rule (hover pauses via a timer
 * fallback under reduced motion), and can be dismissed. Calm + singular. Rouge's own skin (`.rge-*`).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../../../../../../shared/env/media';
import { cn } from '../../../../../../shared/utils/cn';
import { IconButton } from '../IconButton';
import { IconClose, IconCheck } from '../icons';
import { Portal } from '../overlay/Portal';
import { ToastContext, type ToastApi, type ToastOptions } from './toast-context';

interface ToastRecord extends ToastOptions {
  id: string;
}

const EXIT_MS = 360;

function ToastItem(props: { record: ToastRecord; closing: boolean; onDismiss: (id: string) => void }): ReactElement {
  const { record, closing, onDismiss } = props;
  const { t } = useTranslation();
  const [entered, setEntered] = useState(false);
  const duration = record.duration ?? 4000;
  const isError = record.variant === 'error';

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion()) return;
    const timer = setTimeout(() => onDismiss(record.id), duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss, record.id]);

  const state = closing ? 'closed' : entered ? 'open' : 'closed';

  return (
    <div
      className={cn('rge-toast', record.variant && record.variant !== 'default' && `rge-toast--${record.variant}`)}
      data-state={state}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {record.variant === 'success' ? <span className="rge-toast__glyph" aria-hidden><IconCheck width={18} height={18} /></span> : null}
      <div className="rge-toast__body">
        {record.title ? <span className="rge-toast__title">{record.title}</span> : null}
        <span className="rge-toast__msg">{record.message}</span>
      </div>
      <IconButton label={t('misc.dismiss')} onClick={() => onDismiss(record.id)}>
        <IconClose width={18} height={18} />
      </IconButton>
      <span className="rge-toast__progress" style={{ animationDuration: `${duration}ms` }} onAnimationEnd={() => onDismiss(record.id)} />
    </div>
  );
}

export function ToastProvider(props: { children: ReactNode }): ReactElement {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ReadonlyArray<ToastRecord>>([]);
  const [closing, setClosing] = useState<ReadonlySet<string>>(() => new Set());
  const counter = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    setClosing((set) => {
      if (!set.has(id)) return set;
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      setClosing((set) => {
        if (set.has(id)) return set;
        const next = new Set(set);
        next.add(id);
        return next;
      });
      setTimeout(() => remove(id), EXIT_MS);
    },
    [remove],
  );

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = `rge-toast-${counter.current}`;
    setToasts((list) => [...list, { id, ...options }]);
    return id;
  }, []);

  const api = useMemo<ToastApi>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      {toasts.length > 0 ? (
        <Portal>
          <div className="rge-toast-viewport" role="region" aria-label={t('misc.notifications')}>
            {toasts.map((record) => (
              <ToastItem key={record.id} record={record} closing={closing.has(record.id)} onDismiss={dismiss} />
            ))}
          </div>
        </Portal>
      ) : null}
    </ToastContext.Provider>
  );
}
