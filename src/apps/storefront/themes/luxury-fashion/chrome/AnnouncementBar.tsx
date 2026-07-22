/**
 * AnnouncementBar — slim site-wide message; rotates through 2–3 messages (≤1 change / 5s, static
 * under reduced motion) and can be dismissed for the session. Bordeaux only for genuine urgency. §32.8.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { IconButton } from '../components/IconButton';
import { IconClose } from '../components/icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  dismissible?: boolean;
  variant?: 'default' | 'sale';
  rotateMs?: number;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, dismissible = false, variant = 'default', rotateMs = 5000 } = props;
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (messages.length <= 1 || prefersReducedMotion()) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), Math.max(3000, rotateMs));
    return () => clearInterval(timer);
  }, [messages.length, rotateMs]);

  if (dismissed || messages.length === 0) return null;
  const message = messages[index] ?? messages[0];

  return (
    <div className={cn('sf-announcement', variant === 'sale' && 'sf-announcement--sale')} role="region" aria-label="Announcement">
      <span aria-live="polite">{message}</span>
      {dismissible ? (
        <IconButton label="Dismiss announcement" className="sf-announcement__close" onClick={() => setDismissed(true)}>
          <IconClose width={16} height={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
