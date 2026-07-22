/**
 * Pagination — numbered pages with prev/next and collapsing ellipses. Kept numbered (rather than
 * load-more) so deep pages stay crawlable.
 *
 * Shared: the range-collapsing maths and ARIA wiring live here once. Themes style
 * `${ns}-pagination`, `${ns}-page`, `${ns}-page--current`, `${ns}-page--ellipsis`.
 *
 * Extracted from Theme 01, which was the only theme that had pagination at all — Voltage, Hearth and
 * Rouge hard-sliced their grids by `limit`, making products past the first page unreachable.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../shared/utils/cn';
import { block, mod, DEFAULT_NS, type ClassNamespace } from './ns';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Pages shown either side of the current page before collapsing to an ellipsis. */
  siblingCount?: number;
  className?: string;
  ns?: ClassNamespace;
  /** Theme-supplied chevrons; falls back to text arrows so the control is never iconless. */
  prevIcon?: ReactNode;
  nextIcon?: ReactNode;
}

type PageToken = number | 'start-ellipsis' | 'end-ellipsis';

export function buildRange(page: number, pageCount: number, sibling: number): PageToken[] {
  const total = sibling * 2 + 5; // first, last, current, 2 ellipses, siblings
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const left = Math.max(page - sibling, 1);
  const right = Math.min(page + sibling, pageCount);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < pageCount - 1;
  const tokens: PageToken[] = [1];

  if (showLeftEllipsis) tokens.push('start-ellipsis');
  else for (let i = 2; i < left; i++) tokens.push(i);

  for (let i = left; i <= right; i++) {
    if (i !== 1 && i !== pageCount) tokens.push(i);
  }

  if (showRightEllipsis) tokens.push('end-ellipsis');
  else for (let i = right + 1; i < pageCount; i++) tokens.push(i);

  tokens.push(pageCount);
  return tokens;
}

export function Pagination(props: PaginationProps): ReactElement | null {
  const { page, pageCount, onPageChange, siblingCount = 1, className, ns = DEFAULT_NS } = props;
  if (pageCount <= 1) return null;

  const tokens = buildRange(page, pageCount, siblingCount);
  const pageClass = block('page', ns);

  return (
    <nav aria-label="Pagination" className={cn(block('pagination', ns), className)}>
      <button
        type="button"
        className={pageClass}
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {props.prevIcon ?? <span aria-hidden>‹</span>}
      </button>

      {tokens.map((token) =>
        typeof token === 'number' ? (
          <button
            key={token}
            type="button"
            className={cn(pageClass, token === page && mod('page', 'current', ns))}
            aria-current={token === page ? 'page' : undefined}
            aria-label={`Page ${token}`}
            onClick={() => onPageChange(token)}
          >
            {token}
          </button>
        ) : (
          <span key={token} className={cn(pageClass, mod('page', 'ellipsis', ns))} aria-hidden>
            …
          </span>
        ),
      )}

      <button
        type="button"
        className={pageClass}
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {props.nextIcon ?? <span aria-hidden>›</span>}
      </button>
    </nav>
  );
}
