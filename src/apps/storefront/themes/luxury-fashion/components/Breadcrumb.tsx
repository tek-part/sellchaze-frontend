/**
 * Breadcrumb — the up-navigation trail. Thin chevron separators in --muted; the current page is
 * plain --text, not a link. Renders nothing rather than faking a trail when there's no data. §32.6.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconChevronRight } from './icons';

export interface Crumb {
  label: ReactNode;
  href?: string;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<Crumb>;
  separator?: ReactNode;
  className?: string;
}

export function Breadcrumb(props: BreadcrumbProps): ReactElement | null {
  const { items, separator, className } = props;
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn('sf-breadcrumb')}>
        {items.map((crumb, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="sf-breadcrumb__item">
              {crumb.href && !last ? (
                <a href={crumb.href} className="sf-breadcrumb__link">
                  {crumb.label}
                </a>
              ) : (
                <span className={last ? 'sf-breadcrumb__current' : undefined} aria-current={last ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
              {last ? null : (
                <span className="sf-breadcrumb__sep" aria-hidden>
                  {separator ?? <IconChevronRight width={12} height={12} />}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
