/**
 * Maison SearchOverlay — thin wrapper over the shared overlay component (focus management, ESC,
 * animated presence) with the theme's placeholder and a direct submit to /search.
 */
import { useState, type ReactElement } from 'react';
import { preservePreviewNavigation } from '../../../preview-session';
import { SearchOverlay as SharedSearchOverlay } from '../../../foundation/components/SearchOverlay';
import { useLocaleCode } from '../../../sections-lib';
import { maiText } from '../components/i18n';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay(props: SearchOverlayProps): ReactElement | null {
  const locale = useLocaleCode();
  const [query, setQuery] = useState('');
  const submit = (value: string): void => {
    const q = value.trim();
    if (!q) return;
    const preview = window.location.search.includes('preview=1') ? '&preview=1' : '';
    window.location.assign(preservePreviewNavigation(`/search?q=${encodeURIComponent(q)}${preview}`));
  };
  return <SharedSearchOverlay open={props.open} onClose={props.onClose} query={query} onQueryChange={setQuery} onSubmit={submit} placeholder={maiText(locale, 'searchPlaceholder')} />;
}
