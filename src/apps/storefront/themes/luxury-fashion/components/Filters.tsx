/**
 * FilterPanel + FilterGroup — the PLP faceting UI. FilterPanel frames the groups with a title,
 * "Clear all", and a row of applied FilterChips; FilterGroup is a collapsible facet (checkboxes,
 * swatches, a RangeSlider). Height eases via the grid-rows trick; RTL-safe chevron. See §32.6.
 */
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconChevronDown } from './icons';
import { LinkButton } from './LinkButton';

export interface FilterGroupProps {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function FilterGroup(props: FilterGroupProps): ReactElement {
  const { title, defaultOpen = true, children, className } = props;
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={cn('sf-filter-group', className)}>
      <button
        type="button"
        className="sf-filter-group__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title}</span>
        <IconChevronDown className="sf-filter-group__icon" width={18} height={18} />
      </button>
      <div id={panelId} className="sf-filter-group__panel" data-open={open} role="region">
        <div className="sf-filter-group__inner">
          <div className="sf-filter-group__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export interface FilterPanelProps {
  title?: ReactNode;
  onClearAll?: () => void;
  /** Applied-filter chips row (compose FilterChip). */
  applied?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FilterPanel(props: FilterPanelProps): ReactElement {
  const { title = 'Filters', onClearAll, applied, children, className } = props;
  return (
    <div className={cn('sf-filter-panel', className)}>
      <div className="sf-filter-panel__head">
        <span className="sf-filter-panel__title">{title}</span>
        {onClearAll ? <LinkButton onClick={onClearAll}>Clear all</LinkButton> : null}
      </div>
      {applied ? <div className="sf-filter-panel__applied">{applied}</div> : null}
      <div className="sf-filter-panel__groups">{children}</div>
    </div>
  );
}
