/**
 * Dual-thumb price range slider.
 *
 * Built from two native `<input type="range">` elements rather than a custom pointer widget: they
 * are keyboard-operable, announced correctly by screen readers, and respect OS input settings for
 * free. The visual track is a decorative layer beneath them, so none of that is re-implemented.
 *
 * Themes style `${ns}-range` and its elements.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { cn } from '../../../shared/utils/cn';
import { block, el, DEFAULT_NS, type ClassNamespace } from './ns';

export interface RangeSliderProps {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  step?: number;
  /** Formats the printed bounds, e.g. as currency. */
  format?: (n: number) => string;
  label?: string;
  ns?: ClassNamespace;
  className?: string;
}

export function RangeSlider(props: RangeSliderProps): ReactElement | null {
  const {
    min,
    max,
    value,
    onChange,
    step = 1,
    format = (n) => String(Math.round(n)),
    label = 'Price range',
    ns = DEFAULT_NS,
    className,
  } = props;

  // Track locally so dragging feels immediate, and re-sync when the parent resets (e.g. Clear all).
  // Depend on the primitives, not the object: callers pass a fresh literal every render, which would
  // otherwise re-sync on every keystroke elsewhere on the page and fight the drag.
  const { min: valueMin, max: valueMax } = value;
  const [local, setLocal] = useState({ min: valueMin, max: valueMax });
  useEffect(() => setLocal({ min: valueMin, max: valueMax }), [valueMin, valueMax]);

  // A degenerate range has nothing to choose between; rendering a dead control is worse than none.
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

  const span = max - min;
  const leftPct = ((local.min - min) / span) * 100;
  const rightPct = ((local.max - min) / span) * 100;

  const commit = (next: { min: number; max: number }): void => {
    setLocal(next);
    onChange(next);
  };

  return (
    <div className={cn(block('range', ns), className)}>
      <div className={el('range', 'values', ns)}>
        <span>{format(local.min)}</span>
        <span aria-hidden>–</span>
        <span>{format(local.max)}</span>
      </div>

      <div className={el('range', 'track', ns)}>
        <div
          className={el('range', 'fill', ns)}
          style={{ insetInlineStart: `${leftPct}%`, inlineSize: `${Math.max(0, rightPct - leftPct)}%` }}
          aria-hidden
        />
        <input
          className={el('range', 'input', ns)}
          type="range"
          min={min}
          max={max}
          step={step}
          value={local.min}
          aria-label={`${label} — minimum`}
          onChange={(e) => {
            // Thumbs must not cross: clamp the minimum to just below the current maximum.
            const next = Math.min(Number(e.target.value), local.max - step);
            commit({ min: Math.max(min, next), max: local.max });
          }}
        />
        <input
          className={el('range', 'input', ns)}
          type="range"
          min={min}
          max={max}
          step={step}
          value={local.max}
          aria-label={`${label} — maximum`}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), local.min + step);
            commit({ min: local.min, max: Math.min(max, next) });
          }}
        />
      </div>
    </div>
  );
}
