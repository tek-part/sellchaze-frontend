/**
 * Glow AnnouncementBar — a slim ink band with one centred line. Several messages (from the setting,
 * split on "|", or the store's announcements) cross-fade every 5s; paused for reduced motion and
 * while hovered/focused. Dismissible for the session.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { useLocaleCode } from '../../../sections-lib';
import { glText } from '../components/i18n';
import { IconClose, IconSparkle } from './icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  url?: string;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, url } = props;
  const locale = useLocaleCode();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (messages.length <= 1 || paused || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(timer);
  }, [messages.length, paused]);

  if (dismissed || messages.length === 0) return null;
  const message = messages[index % messages.length] ?? messages[0]!;
  return (
    <div className="gl-announcement" role="region" aria-label={glText(locale, 'announcement')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="lib-container gl-announcement__inner">
        <p key={index} className="gl-announcement__text" aria-live="polite">
          <IconSparkle className="gl-announcement__mark" />
          {url ? <a href={url}>{message}</a> : <span>{message}</span>}
        </p>
        <button type="button" className="gl-announcement__close" aria-label={glText(locale, 'close')} onClick={() => setDismissed(true)}>
          <IconClose width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
