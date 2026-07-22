/**
 * NavigationInterceptor — lets the theme's plain internal `<a href="/…">` links (components stay
 * router-agnostic) drive client-side navigation. Captures same-tab left-clicks on internal absolute
 * links and routes them through React Router; external links, new-tab, downloads and modified clicks
 * pass through untouched. Scrolls to top on navigation.
 *
 * Session params (`theme`, `preview`, `scheme`, `settings`) are carried across every navigation.
 * Without that, clicking from `/about?theme=rouge&preview=1` to `/blog` would drop them: the page
 * would look right because the app is already running, but a refresh or a shared link would land on
 * a URL the dev server no longer recognises as a storefront request — and in production would lose
 * the theme override. A link that only works until you reload is worse than one that never worked,
 * because nothing looks broken until someone else opens it.
 */
import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

/** Params that describe the viewing session rather than the page, so they must survive navigation. */
const SESSION_PARAMS = ['theme', 'preview', 'scheme', 'settings'] as const;

/** Merge the current session params into a target href, without overriding ones it already sets. */
export function withSessionParams(href: string, search: string): string {
  const current = new URLSearchParams(search);
  const carried = SESSION_PARAMS.filter((key) => current.has(key));
  if (carried.length === 0) return href;

  const [path, existing = ''] = href.split('?');
  const target = new URLSearchParams(existing);
  for (const key of carried) {
    if (!target.has(key)) target.set(key, current.get(key)!);
  }
  const query = target.toString();
  return query ? `${path}?${query}` : (path ?? href);
}

export function NavigationInterceptor(): ReactElement | null {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      if (!href || (target && target !== '_self') || anchor.hasAttribute('download')) return;
      // Only same-site absolute paths (not protocol-relative or hash-only).
      if (href.startsWith('/') && !href.startsWith('//')) {
        event.preventDefault();
        navigate(withSessionParams(href, window.location.search));
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);

  return null;
}
