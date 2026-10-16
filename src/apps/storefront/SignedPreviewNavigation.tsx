import { useEffect, useLayoutEffect, useRef, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { readSignedPreviewToken, withPreviewLink } from './preview-session';
import './signed-preview.css';

/** Keep a signed owner preview on its selected theme across normal store navigation. */
export function SignedPreviewNavigation({ verified }: { verified?: boolean | undefined }): ReactElement | null {
  const location = useLocation(); const navigate = useNavigate(); const { i18n } = useTranslation();
  const initial = useRef(readSignedPreviewToken(location.search));
  const params = new URLSearchParams(location.search); const explicit = params.has('__preview');
  const token = explicit ? readSignedPreviewToken(location.search) : initial.current;
  useLayoutEffect(() => {
    if (explicit) { initial.current = readSignedPreviewToken(location.search); return; }
    if (!initial.current) return;
    const target = withPreviewLink(`${location.pathname}${location.search}${location.hash}`, window.location.href, initial.current);
    if (target) navigate(target, { replace: true });
  }, [explicit, location.pathname, location.search, location.hash, navigate]);
  useEffect(() => {
    if (!token) return;
    const follow = (event: MouseEvent): void => {
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || anchor.hasAttribute('data-preview-exit')) return;
      const target = withPreviewLink(anchor.getAttribute('href') ?? '', window.location.href, token);
      if (!target) return;
      // Modified clicks and explicit new tabs retain normal browser behavior.
      if (event.type === 'auxclick' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (anchor.target && anchor.target !== '_self')) {
        anchor.href = target; return;
      }
      if (event.defaultPrevented) return;
      event.preventDefault();
      // Do not stop propagation: menu links still close their drawer. Router
      // links honor defaultPrevented and therefore do not navigate twice.
      navigate(target);
    };
    document.addEventListener('click', follow, true); document.addEventListener('auxclick', follow, true);
    return () => { document.removeEventListener('click', follow, true); document.removeEventListener('auxclick', follow, true); };
  }, [token, navigate]);
  if (!token && !explicit) return null;
  const ar = i18n.language.startsWith('ar'); const clean = new URLSearchParams(location.search); clean.delete('__preview');
  const exit = `${location.pathname}${clean.size ? `?${clean}` : ''}${location.hash}`;
  const unavailable = verified === false || !token;
  return <aside className={`sf-signed-preview${unavailable ? ' is-unavailable' : ''}`} role={unavailable ? 'alert' : 'status'}><span>{unavailable ? ar ? 'رابط المعاينة غير صالح أو انتهت صلاحيته.' : 'The preview link is invalid or has expired.' : ar ? 'معاينة المتجر' : 'Store preview'}</span><a href={exit} data-preview-exit>{ar ? 'العودة للمتجر' : 'Return to store'}</a></aside>;
}
