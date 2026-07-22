/** Rouge Breadcrumb — a quiet trail with gilt separators; last item is the current page. */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface Crumb {
  label: string;
  href?: string;
}
export interface BreadcrumbProps {
  items: ReadonlyArray<Crumb>;
  className?: string;
}

export function Breadcrumb(props: BreadcrumbProps): ReactElement {
  const { items, className } = props;
  return (
    <nav className={cn('rge-breadcrumb', className)} aria-label="Breadcrumb">
      <ol className="rge-breadcrumb__list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label + i} className="rge-breadcrumb__item">
              {item.href && !last ? (
                <a className="rge-breadcrumb__link" href={item.href}>{item.label}</a>
              ) : (
                <span className="rge-breadcrumb__current" aria-current={last ? 'page' : undefined}>{item.label}</span>
              )}
              {!last ? <span className="rge-breadcrumb__sep" aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
