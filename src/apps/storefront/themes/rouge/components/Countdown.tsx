/**
 * Rouge Countdown — a compact days/hours/minutes/seconds timer to an ISO deadline. Ticks each second
 * (paused visually under reduced motion is unnecessary — a clock is content, not decoration). Renders
 * nothing once elapsed / on an invalid date.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface CountdownProps {
  to: string;
  className?: string;
}

interface Parts { d: number; h: number; m: number; s: number }

function remaining(toMs: number): Parts | null {
  const diff = toMs - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown(props: CountdownProps): ReactElement | null {
  const { to, className } = props;
  const toMs = Date.parse(to);
  const [parts, setParts] = useState<Parts | null>(() => remaining(toMs));

  useEffect(() => {
    if (Number.isNaN(toMs)) return;
    const id = window.setInterval(() => setParts(remaining(toMs)), 1000);
    return () => window.clearInterval(id);
  }, [toMs]);

  if (!parts) return null;
  const units: ReadonlyArray<[number, string]> = [[parts.d, 'Days'], [parts.h, 'Hrs'], [parts.m, 'Min'], [parts.s, 'Sec']];

  return (
    <div className={cn('rge-countdown', className)} role="timer" aria-label="Time remaining">
      {units.map(([value, label], i) => (
        <div key={label} className="rge-countdown__unit">
          <span className="rge-countdown__value rge-num">{String(value).padStart(2, '0')}</span>
          <span className="rge-countdown__label">{label}</span>
          {i < units.length - 1 ? <span className="rge-countdown__sep" aria-hidden>:</span> : null}
        </div>
      ))}
    </div>
  );
}
