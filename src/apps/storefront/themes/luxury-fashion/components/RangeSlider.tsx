/**
 * RangeSlider — dual-thumb range (price filter). Two overlaid native range inputs (keyboard- and
 * screen-reader-friendly) with a hairline track and an ink fill between the thumbs; values clamp so
 * min never crosses max. `formatValue` renders the readout (e.g. currency).
 */
import { useId, type CSSProperties, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  label?: string;
  className?: string;
}

export function RangeSlider(props: RangeSliderProps): ReactElement {
  const { t } = useTranslation();
  const { min, max, step = 1, value, onChange, formatValue, label = t('shop.price'), className } = props;
  const [lo, hi] = value;
  const id = useId();
  const span = max - min || 1;
  const start = ((lo - min) / span) * 100;
  const end = ((hi - min) / span) * 100;
  const format = formatValue ?? ((n: number) => String(n));

  const fillStyle: CSSProperties = { insetInlineStart: `${start}%`, width: `${Math.max(0, end - start)}%` };

  return (
    <div className={cn('sf-range-field', className)}>
      <div className="sf-range" role="group" aria-label={label}>
        <span className="sf-range__track" aria-hidden />
        <span className="sf-range__fill" style={fillStyle} aria-hidden />
        <input
          className="sf-range__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={t('shop.priceMin', { label })}
          aria-describedby={`${id}-lo`}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        />
        <input
          className="sf-range__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={t('shop.priceMax', { label })}
          aria-describedby={`${id}-hi`}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        />
      </div>
      <div className="sf-range__values">
        <span id={`${id}-lo`}>{format(lo)}</span>
        <span id={`${id}-hi`}>{format(hi)}</span>
      </div>
    </div>
  );
}
