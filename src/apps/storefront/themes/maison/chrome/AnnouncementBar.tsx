/**
 * Maison AnnouncementBar — a quiet sand band with one line of copy (`announcement_text`, or the
 * store's announcements, rotating gently every 6s unless reduced motion is on). Dismissible.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { IconClose, IconLeaf } from './icons';

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
    <div className="mai-announce" role="region" aria-label={t('common.announcement', { defaultValue: 'Announcement' })}>
      <div className="lib-container mai-announce__inner">
        <p className="mai-announce__text" aria-live="polite">
          <IconLeaf className="mai-announce__leaf" />
          {url ? <a href={url}>{message}</a> : <span>{message}</span>}
        </p>
        <button type="button" className="mai-announce__close" aria-label={t('common.close')} onClick={() => setDismissed(true)}>
          <IconClose width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
