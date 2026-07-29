/**
 * Small structural primitives — Divider, Chip and Breadcrumb — grouped to keep the library tidy.
 */
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';

/* --------------------------------------------------------------------------- Divider */
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Reduced spacing. */
  tight?: boolean;
}
export function Divider(props: DividerProps): ReactElement {
  const { tight = false, className, ...rest } = props;
  return <hr className={cn('hh-divider', tight && 'hh-divider--tight', className)} {...rest} />;
}

/* ----------------------------------------------------------------------------- Chip */
export interface ChipProps {
  children: ReactNode;
  href?: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}
export function Chip(props: ChipProps): ReactElement {
  const { children, href, selected = false, onClick, onRemove, className } = props;
  const { t } = useTranslation();
  const cls = cn('hh-chip', selected && 'hh-chip--selected', className);
  const body = (
    <>
      <span className="hh-chip__label">{children}</span>
      {onRemove ? (
        <button
          type="button"
          className="hh-chip__remove"
          aria-label={t('common.remove')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </button>
      ) : null}
    </>
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      {...(selected ? { 'aria-pressed': true } : {})}
      onClick={onClick}
    >
      {body}
    </button>
  );
}

/* ------------------------------------------------------------------------ Breadcrumb */
export interface Crumb {
  label: string;
  url: string;
}
export interface BreadcrumbProps {
  items: ReadonlyArray<Crumb>;
  className?: string;
}
export function Breadcrumb(props: BreadcrumbProps): ReactElement | null {
  const { items, className } = props;
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <nav className={cn('hh-breadcrumb', className)} aria-label={t('misc.breadcrumb')}>
      <ol className="hh-breadcrumb__list">
        {items.map((c, i) => (
          <li key={c.url} className="hh-breadcrumb__item">
            {i < items.length - 1 ? <a href={c.url}>{c.label}</a> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
