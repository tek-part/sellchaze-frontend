/**
 * Fresh SearchOverlay — thin wrapper over the shared overlay component (focus management, ESC,
 * animated presence) with Fresh's grocery placeholder and a direct submit to /search.
 */
import { useState, type ReactElement } from 'react';
import { SearchOverlay as SharedSearchOverlay } from '../../../foundation/components/SearchOverlay';
import { useLocale } from '../../../i18n/useLocale';
import { frText } from './text';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay(props: SearchOverlayProps): ReactElement | null {
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const submit = (value: string): void => {
    const q = value.trim();
    if (!q) return;
    const preview = window.location.search.includes('preview=1') ? '&preview=1' : '';
    window.location.assign(`/search?q=${encodeURIComponent(q)}${preview}`);
  };
  return <SharedSearchOverlay open={props.open} onClose={props.onClose} query={query} onQueryChange={setQuery} onSubmit={submit} placeholder={frText(locale, 'searchPlaceholder')} />;
}
