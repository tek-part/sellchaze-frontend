/**
 * Sahra AnnouncementBar — a hairline band above the header: gold-ruled, small caps, from the
 * `announcement_text` setting (or the store's announcements). Rotates when there are several and
 * can be dismissed for the session (the close control is hidden in customize mode).
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { IconClose } from './icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  url?: string;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, url } = props;
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (messages.length <= 1 || prefersReducedMotion()) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 6000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (dismissed || messages.length === 0) return null;
  const message = messages[index] ?? messages[0]!;
  return (
    <div className="sh-announcement" role="region" aria-label="Announcement">
      <div className="lib-container sh-announcement__inner">
        <span aria-live="polite" className="sh-announcement__text">
          {url ? <a href={url}>{message}</a> : message}
        </span>
        <button type="button" className="sh-announcement__close" aria-label={t('common.close')} onClick={() => setDismissed(true)}>
          <IconClose width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
