/**
 * SortSelect — the PLP sort control, as a labelled native `<select>`.
 *
 * Native on purpose: it gives correct keyboard and screen-reader behaviour on every platform and a
 * real mobile picker, which a custom listbox has to re-earn. Themes style `${ns}-sort` /
 * `${ns}-sort__label` / `${ns}-sort__control`.
 *
 * Shared because only Theme 01 had a sort component (unwired), Voltage hand-rolled an inline
 * `<select>`, and Hearth and Rouge had no sort at all.
 */
import type { ChangeEvent, ReactElement } from 'react';
import { cn } from '../../../shared/utils/cn';
import { block, el, DEFAULT_NS, type ClassNamespace } from './ns';
import { SORT_OPTIONS, type SortKey } from './sort';

export interface SortSelectProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  id?: string;
  label?: string;
  className?: string;
  ns?: ClassNamespace;
  options?: ReadonlyArray<{ value: SortKey; label: string }>;
  /**
   * Optional wrapper around the `<select>`. Theme 01 nests its control in a field box to get the
   * hairline border and 45° chevron; letting the theme supply that keeps its chrome intact without
   * a second copy of the control.
   */
  controlWrapperClassName?: string;
  /** Extra classes on the `<select>` itself, for themes whose form controls share a base class. */
  controlClassName?: string;
}

export function SortSelect(props: SortSelectProps): ReactElement {
  const {
    value,
    onChange,
    id = 'sf-sort',
    label = 'Sort by',
    className,
    ns = DEFAULT_NS,
    options = SORT_OPTIONS,
    controlWrapperClassName,
    controlClassName,
  } = props;

  const control = (
    <select
      id={id}
      className={cn(el('sort', 'control', ns), controlClassName)}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as SortKey)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className={cn(block('sort', ns), className)}>
      <label className={el('sort', 'label', ns)} htmlFor={id}>
        {label}
      </label>
      {controlWrapperClassName ? <div className={controlWrapperClassName}>{control}</div> : control}
    </div>
  );
}
