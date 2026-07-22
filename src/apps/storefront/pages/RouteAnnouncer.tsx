/**
 * RouteAnnouncer — accessibility for client-side navigation. On each route change it announces the
 * new page (its document title) via a polite live region and moves focus to the main landmark, so
 * screen-reader and keyboard users are told where they are and start from the top of the new page.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteAnnouncer(): ReactElement {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Wait a tick for the new page to render and set its <title>.
    const timer = window.setTimeout(() => {
      setMessage(document.title);
      const main = document.getElementById('sf-main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.key]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
