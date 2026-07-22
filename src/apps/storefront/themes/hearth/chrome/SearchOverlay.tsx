/**
 * SearchOverlay — a warm top sheet for search: a big input + popular suggestions. Focus-trapped,
 * scroll-locked, Escape-to-close. Submitting routes to /search (a real navigation), so search works
 * even without live suggestions (the index is a data gap) — never a fabricated result list.
 */
import { type FormEvent, type ReactElement } from 'react';
import { Portal } from '../components/overlay/Portal';
import { useOverlay } from '../components/overlay/useOverlay';
import { Chip } from '../components/Misc';
import { IconButton } from '../components/IconButton';
import { SearchIcon, CloseIcon } from '../components/icons';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  popular?: ReadonlyArray<string>;
}

const DEFAULT_POPULAR = ['Sofas', 'Dining tables', 'Rugs', 'Lighting', 'Bed frames'];

export function SearchOverlay(props: SearchOverlayProps): ReactElement | null {
  const { open, onClose, query, onQueryChange, onSubmit, placeholder = 'Search for pieces, rooms…', popular = DEFAULT_POPULAR } = props;
  const ref = useOverlay<HTMLDivElement>(open, onClose);
  if (!open) return null;

  const submit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit(query);
  };

  return (
    <Portal>
      <div className="hh-search-overlay" role="dialog" aria-modal="true" aria-label="Search">
        <div className="hh-search-overlay__scrim" onClick={onClose} />
        <div className="hh-search-overlay__panel" ref={ref}>
          <form className="hh-search-overlay__form" onSubmit={submit}>
            <span className="hh-search-overlay__icon" aria-hidden>
              <SearchIcon />
            </span>
            <label htmlFor="hh-search-input" className="hh-visually-hidden">
              Search
            </label>
            <input
              id="hh-search-input"
              className="hh-search-overlay__input"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            <IconButton label="Close search" icon={<CloseIcon />} onClick={onClose} />
          </form>
          <div className="hh-search-overlay__popular">
            <p className="hh-search-overlay__popular-label">Popular</p>
            <div className="hh-search-overlay__chips">
              {popular.map((term) => (
                <Chip key={term} onClick={() => onSubmit(term)}>
                  {term}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
