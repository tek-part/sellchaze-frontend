/**
 * Voltage SearchOverlay — a top-sheet search console. Submitting routes to /search?q= and closes.
 * Focus starts in the field (via Drawer's focus management). Voltage's own chrome.
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '../components/Drawer';
import { Button } from '../components/Button';
import { IconSearch } from '../components/icons';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay(props: SearchOverlayProps): ReactElement {
  const { open, onClose } = props;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <Drawer open={open} onClose={onClose} side="top" title="Search" hideTitle className="vlt-searchoverlay">
      <form className="vlt-searchoverlay__form" role="search" onSubmit={submit}>
        <span className="vlt-searchoverlay__icon" aria-hidden="true"><IconSearch /></span>
        <input
          type="search"
          className="vlt-searchoverlay__input"
          placeholder="Search products, specs, brands…"
          aria-label="Search products"
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" className="vlt-searchoverlay__go">Search</Button>
      </form>
      <p className="vlt-searchoverlay__hint">Press Enter to search · Esc to close</p>
    </Drawer>
  );
}
