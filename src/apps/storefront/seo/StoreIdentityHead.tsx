import { useEffect } from 'react';
import { useStore } from '../state/store-context';
import { identityFontStylesheet } from '../store-identity';

/** Keep one title/icon owner across route transitions and the server shell. */
export function StoreIdentityHead(): null {
  const { store } = useStore();
  const title = store.identity?.site_title || store.name;
  const favicon = store.identity?.favicon_url;
  const stylesheet = identityFontStylesheet(store.identity?.font_family);
  useEffect(() => {
    if (!document.head.querySelector('title[data-store-page-title]')) document.title = title;
  }, [title]);
  useEffect(() => {
    if (!favicon) return;
    const old = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="shortcut icon"]'));
    old.forEach(link => link.remove());
    const link = document.createElement('link');
    link.rel = 'icon'; link.href = favicon; link.id = 'store-identity-icon';
    document.head.appendChild(link);
    return () => { link.remove(); old.forEach(item => document.head.appendChild(item)); };
  }, [favicon]);
  useEffect(() => {
    if (!stylesheet) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = stylesheet; link.id = 'store-identity-font';
    document.head.appendChild(link);
    return () => link.remove();
  }, [stylesheet]);
  return null;
}
