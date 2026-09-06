/**
 * Sahra SearchOverlay — thin wrapper over the shared overlay component (focus management, ESC,
 * animated presence) with a direct submit to /search.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchOverlay as SharedSearchOverlay } from '../../../foundation/components/SearchOverlay';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay(props: SearchOverlayProps): ReactElement | null {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const submit = (value: string): void => {
    const q = value.trim();
    if (!q) return;
    const preview = window.location.search.includes('preview=1') ? '&preview=1' : '';
    window.location.assign(`/search?q=${encodeURIComponent(q)}${preview}`);
  };
  return <SharedSearchOverlay open={props.open} onClose={props.onClose} query={query} onQueryChange={setQuery} onSubmit={submit} placeholder={t('search.placeholder')} />;
}
