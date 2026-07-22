/**
 * Pagination — numbered sharp 2px tiles with prev/next; current is an ink fill. Ellipses collapse
 * long ranges; kept numbered for SEO/deep pages (Load-more is a separate control). §32.6.
 *
 * The range-collapsing maths and ARIA live in `shared-ui/Pagination`. Theme 01 keeps its own
 * chevrons and the `sf` namespace, so `.sf-pagination` / `.sf-page` styling is unchanged.
 */
import type { ReactElement } from 'react';
import { Pagination as SharedPagination, type PaginationProps as SharedProps } from '../../../shared-ui';
import { IconChevronLeft, IconChevronRight } from './icons';

export type PaginationProps = Omit<SharedProps, 'ns' | 'prevIcon' | 'nextIcon'>;

export function Pagination(props: PaginationProps): ReactElement | null {
  return (
    <SharedPagination
      {...props}
      ns="sf"
      prevIcon={<IconChevronLeft width={16} height={16} />}
      nextIcon={<IconChevronRight width={16} height={16} />}
    />
  );
}
