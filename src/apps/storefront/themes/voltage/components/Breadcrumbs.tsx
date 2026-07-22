/** Voltage Breadcrumbs — mono trail with chevron separators. Self-hides when there's nothing to show. */
import type { ReactElement } from 'react';
import type { Breadcrumb } from '../sections/section-data';
import { IconChevronRight } from './icons';

export interface BreadcrumbsProps {
  items: ReadonlyArray<Breadcrumb>;
  className?: string;
}

export function Breadcrumbs(props: BreadcrumbsProps): ReactElement | null {
  const { items, className } = props;
  if (items.length === 0) return null;
  return (
    <nav className={className} aria-label="Breadcrumb">
      <ol className="vlt-crumbs">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.url || item.label} className="vlt-crumbs__item">
              {last ? (
                <span className="vlt-crumbs__current" aria-current="page">{item.label}</span>
              ) : (
                <>
                  <a href={item.url} className="vlt-crumbs__link">{item.label}</a>
                  <IconChevronRight className="vlt-crumbs__sep" width={12} height={12} aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
