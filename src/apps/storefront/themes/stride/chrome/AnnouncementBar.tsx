/**
 * Stride AnnouncementBar — an accent ticker. Messages (`|`-separated in the setting, or the store's
 * announcements) scroll as a continuous marquee with a pause button (WCAG 2.2.2); it also pauses
 * on hover / focus. With `ticker_motion` off or reduced motion the bar is static. The duplicated
 * copies that make the loop seamless are hidden from assistive tech.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { IconBolt } from './icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  url?: string;
  motion: boolean;
  label: string;
  pauseLabel: string;
  playLabel: string;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement | null {
  const { messages, url, motion, label, pauseLabel, playLabel } = props;
  const [animate, setAnimate] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => setAnimate(motion && !prefersReducedMotion()), [motion]);
  if (messages.length === 0) return null;

  const run = (hidden: boolean): ReactElement => (
    <span className="st-ticker__run" aria-hidden={hidden || undefined}>
      {messages.map((m, i) => (
        <span key={`${i}-${m}`} className="st-ticker__msg">
          <IconBolt className="st-ticker__bolt" width={12} height={12} />
          {m}
        </span>
      ))}
    </span>
  );

  const track = (
    <span className={cn('st-ticker__track', animate && 'is-moving', paused && 'is-paused')}>
      {run(false)}
      {animate ? run(true) : null}
      {animate ? run(true) : null}
    </span>
  );

  return (
    <div className={cn('st-ticker', animate && 'st-ticker--moving')} role="region" aria-label={label}>
      <div className="st-ticker__viewport">{url ? <a href={url} className="st-ticker__link">{track}</a> : track}</div>
      {animate ? (
        <button type="button" className="st-ticker__toggle" aria-pressed={paused} aria-label={paused ? playLabel : pauseLabel} onClick={() => setPaused((p) => !p)}>
          {paused ? (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path d="M7 5l12 7-12 7z" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
          )}
        </button>
      ) : null}
    </div>
  );
}
