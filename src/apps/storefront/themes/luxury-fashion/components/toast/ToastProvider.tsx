/**
 * ToastProvider — holds the toast stack and renders the portal viewport (bottom inline-end). Each
 * toast rises quietly, auto-dismisses via its hairline progress rule (CSS-driven, so hover pauses it
 * for free), and falls back to a timer under reduced-motion. Calm and singular. See §32.5.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../../../../../../shared/env/media';
import { cn } from '../../../../../../shared/utils/cn';
import { IconButton } from '../IconButton';
import { IconClose } from '../icons';
import { Portal } from '../overlay/Portal';
import { ToastContext, type ToastApi, type ToastOptions } from './toast-context';

interface ToastRecord extends ToastOptions {
  id: string;
}

const EXIT_MS = 340;

function ToastItem(props: { record: ToastRecord; closing: boolean; onDismiss: (id: string) => void }): ReactElement {
  const { record, closing, onDismiss } = props;
  const { t } = useTranslation();
  const [entered, setEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const duration = record.duration ?? 4000;
  const isError = record.variant === 'error';
  const action = record.action;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Under reduced motion the progress animation is disabled, so drive dismissal with a timer.
  useEffect(() => {
    if (!prefersReducedMotion()) return;
    const timer = setTimeout(() => onDismiss(record.id), duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss, record.id]);

  const state = closing ? 'closed' : entered ? 'open' : 'closed';

  return (
    <div
      className={cn('sf-toast', record.variant && record.variant !== 'default' && `sf-toast--${record.variant}`)}
      data-state={state}
      data-paused={paused}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="sf-toast__body">
        {record.title ? <span className="sf-toast__title">{record.title}</span> : null}
        <span className="sf-toast__msg">{record.message}</span>
        {action ? (
          <button
            type="button"
            className="sf-link sf-toast__action"
            onClick={() => {
              action.onClick();
              onDismiss(record.id);
            }}
          >
            <span className="sf-link__label">{action.label}</span>
          </button>
        ) : null}
      </div>
      <IconButton label={t('misc.dismiss')} onClick={() => onDismiss(record.id)}>
        <IconClose />
      </IconButton>
      <span
        className="sf-toast__progress"
        style={{ animationDuration: `${duration}ms` }}
        onAnimationEnd={() => onDismiss(record.id)}
      />
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
    const id = `sf-toast-${counter.current}`;
    setToasts((list) => [...list, { id, ...options }]);
    return id;
  }, []);

  const api = useMemo<ToastApi>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      {toasts.length > 0 ? (
        <Portal>
          <div className="sf-toast-viewport" role="region" aria-label={t('misc.notifications')}>
            {toasts.map((record) => (
              <ToastItem key={record.id} record={record} closing={closing.has(record.id)} onDismiss={dismiss} />
            ))}
          </div>
        </Portal>
      ) : null}
    </ToastContext.Provider>
  );
}
