/**
 * SearchOverlay — the full search surface the chrome SearchBar opens. Slides down from the top with
 * a scrim, traps focus (initial focus in the query field), locks scroll, and closes on Esc / scrim
 * click. Results are provided by the caller (Phase 6 wires the live index). See §32.6.
 */
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from './Container';
import { Portal } from './overlay/Portal';
import { useFocusTrap } from './overlay/useFocusTrap';
import { useScrollLock } from './overlay/useScrollLock';
import { SearchBar } from './SearchBar';

const EXIT_MS = 640;

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  /** Results / suggestions region. */
  children?: ReactNode;
}

export function SearchOverlay(props: SearchOverlayProps): ReactElement | null {
  const { open, onClose, query, onQueryChange, onSubmit, placeholder, children } = props;
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [present, setPresent] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>('closed');

  useEffect(() => {
    if (open) {
      setPresent(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setState('open'));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setState('closed');
    const timer = setTimeout(() => setPresent(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [present, onClose]);

  useScrollLock(present);
  useFocusTrap(present && state === 'open', panelRef, inputRef);

  if (!present) return null;

  return (
    <Portal>
      <div className="sf-search-overlay" data-state={state}>
        <div className="sf-search-overlay__scrim" aria-hidden onClick={onClose} />
        <div ref={panelRef} className="sf-search-overlay__panel" role="dialog" aria-modal="true" aria-label={t('search.title')} tabIndex={-1}>
          <Container>
            <div className="sf-search-overlay__head">
              <SearchBar
                value={query}
                onChange={onQueryChange}
                onSubmit={(v) => {
                  onSubmit?.(v);
                }}
                placeholder={placeholder}
                size="lg"
                inputRef={inputRef}
                className="sf-search-overlay__bar"
              />
            </div>
            {children ? <div className="sf-search-overlay__results">{children}</div> : null}
          </Container>
        </div>
      </div>
    </Portal>
  );
}
