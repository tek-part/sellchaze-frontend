import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { apiGet } from '../api/client';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { useStore } from '../state/store-context';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';
import { currentUiBlocks, type UiBlocksData, type UiBlockSlot } from './domain';
import './ui-blocks.css';

const Context = createContext<UiBlocksData | null>(null);

export function UiBlocksProvider({ children }: { children: ReactNode }): ReactElement {
  const { store, apiOk } = useStore();
  const { locale } = useLocale();
  const { pathname } = useLocation();
  const key = JSON.stringify([store.id, locale, pathname]);
  const query = useAsync(async () => ({ key, data: await apiGet<{ data: UiBlocksData }>('/ui-blocks') }), [key, apiOk]);
  return <Context.Provider value={apiOk ? currentUiBlocks(query, key) : null}>{children}</Context.Provider>;
}

/** Optional merchant content; no request is repeated for each of the eight placement hooks. */
export function UiBlock({ slot }: { slot: UiBlockSlot }): ReactElement | null {
  const config = useContext(Context);
  const html = config?.enabled ? sanitizeHtml(config.blocks[slot] ?? '', { formatting: true }) : '';
  if (!html.trim()) return null;
  return <div className="sf-ui-block sf-prose" data-ui-block={slot}><div className="sf-ui-block__body" dangerouslySetInnerHTML={{ __html: html }} /></div>;
}
