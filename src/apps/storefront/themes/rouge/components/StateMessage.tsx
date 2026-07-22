/**
 * EmptyState / ErrorState — Rouge's zero-data and failure surfaces.
 *
 * Rouge previously had no state component: sections hand-rolled `.rge-empty` markup inline, and no
 * section had any error surface at all. Both now come from `shared-ui/StateMessage` with the `rge`
 * namespace, so the luminous styling stays Rouge's own while the markup and ARIA are shared.
 */
import type { ReactElement } from 'react';
import {
  EmptyState as SharedEmptyState,
  ErrorState as SharedErrorState,
  type EmptyStateProps as SharedEmptyProps,
  type ErrorStateProps as SharedErrorProps,
} from '../../../shared-ui';

export type EmptyStateProps = Omit<SharedEmptyProps, 'ns'>;

export function EmptyState(props: EmptyStateProps): ReactElement {
  return <SharedEmptyState {...props} ns="rge" />;
}

export type ErrorStateProps = Omit<SharedErrorProps, 'ns'>;

export function ErrorState(props: ErrorStateProps): ReactElement {
  return <SharedErrorState {...props} ns="rge" />;
}
