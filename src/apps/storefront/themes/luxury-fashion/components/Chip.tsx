/**
 * Chip (toggle quick/sort filter), FilterChip (applied, removable) and Tag (static label).
 * Pill-shaped; selected chips take the --primary fill. Tag is non-interactive tracked-caps --muted.
 * See §32.6.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconClose } from './icons';

export interface ChipProps {
  selected?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** Toggle chip (quick filter / sort). */
export function Chip(props: ChipProps): ReactElement {
  const { selected = false, onToggle, disabled = false, className, children } = props;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn('sf-chip', selected && 'sf-chip--selected', className)}
      onClick={onToggle}
    >
      {children}
    </button>
  );
}

export interface FilterChipProps {
  /** The applied filter's label. */
  children: ReactNode;
  onRemove: () => void;
  /** Accessible remove label, e.g. "Remove filter: Size M". */
  removeLabel?: string;
  className?: string;
}

/** Applied filter with a thin × remove affordance. */
export function FilterChip(props: FilterChipProps): ReactElement {
  const { children, onRemove, removeLabel = 'Remove filter', className } = props;
  return (
    <span className={cn('sf-chip', 'sf-chip--selected', className)}>
      <span>{children}</span>
      <button type="button" className="sf-chip__remove" aria-label={removeLabel} onClick={onRemove}>
        <IconClose width={14} height={14} />
      </button>
    </span>
  );
}

export interface TagProps {
  variant?: 'outline' | 'subtle';
  className?: string;
  children: ReactNode;
}

export function Tag(props: TagProps): ReactElement {
  const { variant = 'outline', className, children } = props;
  return <span className={cn('sf-tag', variant === 'subtle' && 'sf-tag--subtle', className)}>{children}</span>;
}
