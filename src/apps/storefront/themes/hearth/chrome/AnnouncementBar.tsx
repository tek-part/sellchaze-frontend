/**
 * AnnouncementBar — a thin warm strip above the header (free-delivery, seasonal, offers). Rotates
 * through messages and is dismissible; when there are no messages it renders nothing.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { IconButton } from '../components/IconButton';
import { CloseIcon } from '../components/icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  dismissible?: boolean;
  /** Rotate interval (ms); 0 disables rotation. */
  interval?: number;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, dismissible = true, interval = 5000 } = props;
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1 || interval <= 0) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), interval);
    return () => window.clearInterval(id);
  }, [messages.length, interval]);

  if (dismissed || messages.length === 0) return null;
  const message = messages[index % messages.length] ?? messages[0];

  return (
    <div className="hh-announce" role="region" aria-label="Announcement">
      <p className="hh-announce__msg" aria-live="polite">
        {message}
      </p>
      {dismissible ? (
        <IconButton
          className="hh-announce__close"
          label="Dismiss announcement"
          size="sm"
          icon={<CloseIcon />}
          onClick={() => setDismissed(true)}
        />
      ) : null}
    </div>
  );
}
