/**
 * Rouge AnnouncementBar — a slim gilt-on-rouge ribbon above the header for free-ship / GWP / drops.
 * Rotates through messages on a gentle interval (paused for reduced-motion). Self-hides when empty.
 */
import { useEffect, useState, type ReactElement } from 'react';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  intervalMs?: number;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, intervalMs = 5000 } = props;
  const [index, setIndex] = useState(0);
  const count = messages.length;

  useEffect(() => {
    if (count <= 1) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(t);
  }, [count, intervalMs]);

  if (count === 0) return null;
  return (
    <div className="rge-announce" role="region" aria-label="Announcements">
      <p className="rge-announce__msg" key={index}>{messages[index]}</p>
    </div>
  );
}
