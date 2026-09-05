/**
 * Naseem AnnouncementBar — slim top band from the `announcement_text` setting (or the store's
 * announcements); rotates when there are several, dismissible for the session. The close control is
 * hidden in customize mode (customize.css) so the merchant always sees it.
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
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (dismissed || messages.length === 0) return null;
  const message = messages[index] ?? messages[0]!;
  return (
    <div className="nsm-announcement" role="region" aria-label="Announcement">
      <div className="lib-container nsm-announcement__inner">
        <span aria-live="polite" className="nsm-announcement__text">
          {url ? <a href={url}>{message}</a> : message}
        </span>
        <button type="button" className="nsm-announcement__close" aria-label={t('common.close')} onClick={() => setDismissed(true)}>
          <IconClose width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
