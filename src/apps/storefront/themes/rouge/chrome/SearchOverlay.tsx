/**
 * Rouge SearchOverlay — a frosted top-sheet search: a large field over an aura glow with a few
 * suggested queries. Submitting routes to /search. Portalled; traps focus, locks scroll, Escape/scrim
 * to close.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Portal } from '../components/overlay/Portal';
import { useFocusTrap } from '../components/overlay/useFocusTrap';
import { useScrollLock } from '../components/overlay/useScrollLock';
import { IconButton } from '../components/IconButton';
import { IconClose, IconSearch } from '../components/icons';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = ['Lip oil', 'Foundation', 'Blush', 'Serum', 'Gift sets'];

export function SearchOverlay(props: SearchOverlayProps): ReactElement | null {
  const { open, onClose } = props;
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  useScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (q: string): void => {
    if (q.trim() === '') return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };
  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    go(term);
  };

  return (
    <Portal>
      <div className="rge-overlay rge-searchoverlay" role="presentation">
        <div className="rge-overlay__scrim" onClick={onClose} aria-hidden />
        <div ref={panelRef} className="rge-searchoverlay__panel" role="dialog" aria-modal="true" aria-label="Search">
          <div className="rge-aura rge-searchoverlay__aura" aria-hidden />
          <div className="rge-searchoverlay__inner">
            <form className="rge-searchoverlay__form" onSubmit={onSubmit} role="search">
              <span className="rge-searchoverlay__icon" aria-hidden><IconSearch width={22} height={22} /></span>
              <input
                ref={inputRef}
                className="rge-searchoverlay__input"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products, shades, rituals…"
                aria-label="Search"
              />
              <IconButton label="Close search" onClick={onClose}><IconClose /></IconButton>
            </form>
            <div className="rge-searchoverlay__suggest">
              <span className="rge-searchoverlay__suggest-label">Popular</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="rge-chip" onClick={() => go(s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
