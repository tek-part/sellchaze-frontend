/**
 * Countdown — time-boxed urgency (flash deal, drop). Serif tabular digits, hairline-separated units;
 * turns --sale when ending soon and SELF-HIDES (renders null) once expired — never a frozen 00:00.
 * Ticks once a second (no flashing). See §32.3.
 */
import { Fragment, useEffect, useRef, useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface CountdownProps {
  /** Target time — epoch ms, ISO string, or Date. */
  endsAt: number | string | Date;
  onExpire?: () => void;
  /** Below this many ms remaining, the digits turn --sale. Default 1h. */
  endingSoonMs?: number;
  className?: string;
}

function toEpoch(value: number | string | Date): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function Countdown(props: CountdownProps): ReactElement | null {
  const { endsAt, onExpire, endingSoonMs = 3_600_000, className } = props;
  const target = toEpoch(endsAt);
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  const expiredFired = useRef(false);

  useEffect(() => {
    const tick = (): void => {
      const next = Math.max(0, target - Date.now());
      setRemaining(next);
      if (next <= 0 && !expiredFired.current) {
        expiredFired.current = true;
        onExpire?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target, onExpire]);

  if (remaining <= 0) return null;

  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const units: Array<{ label: string; value: number }> = [
    ...(days > 0 ? [{ label: 'Days', value: days }] : []),
    { label: 'Hrs', value: hours },
    { label: 'Min', value: minutes },
    { label: 'Sec', value: seconds },
  ];

  return (
    <div
      className={cn('sf-countdown', remaining <= endingSoonMs && 'sf-countdown--ending', className)}
      role="timer"
      aria-label={`${days ? `${days} days ` : ''}${hours} hours ${minutes} minutes ${seconds} seconds remaining`}
    >
      {units.map((unit, i) => (
        <Fragment key={unit.label}>
          <span className="sf-countdown__unit">
            <span className="sf-countdown__value" aria-hidden>
              {pad(unit.value)}
            </span>
            <span className="sf-countdown__label" aria-hidden>
              {unit.label}
            </span>
          </span>
          {i < units.length - 1 ? (
            <span className="sf-countdown__sep" aria-hidden>
              :
            </span>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
