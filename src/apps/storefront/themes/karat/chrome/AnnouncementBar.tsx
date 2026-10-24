/**
 * Karat AnnouncementBar — a slim, letter-spaced line between two gold sparks. Several messages
 * cross-fade slowly (paused for reduced motion, where only the first is shown).
 */
import { useEffect, useState, type ReactElement } from 'react';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { IconSpark } from './icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  url?: string;
  label: string;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, url, label } = props;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1 || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 6500);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  if (messages.length === 0) return null;
  const message = messages[index] ?? messages[0]!;
  return (
    <div className="kr-announce" role="region" aria-label={label}>
      <div className="lib-container kr-announce__inner">
        <IconSpark className="kr-announce__spark" />
        <p className="kr-announce__text" key={index} aria-live="polite">
          {url ? <a href={url}>{message}</a> : message}
        </p>
        <IconSpark className="kr-announce__spark" />
      </div>
    </div>
  );
}
