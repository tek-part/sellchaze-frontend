/**
 * EmptyState / ErrorState — a warm zero-data slot (empty cart / wishlist / search / orders). A
 * schematic-free, on-brand block: a soft monogram/leaf mark, a serif heading, one line of guidance
 * and a CTA.
 *
 * Markup and ARIA come from `shared-ui/StateMessage`; Hearth keeps its `variant` marks and passes
 * the `hh` namespace so the warm styling is unchanged. ErrorState is new here — Hearth had no error
 * surface at all, so a failed fetch rendered nothing.
 */
import type { ReactElement } from 'react';
import {
  EmptyState as SharedEmptyState,
  ErrorState as SharedErrorState,
  type EmptyStateProps as SharedEmptyProps,
  type ErrorStateProps as SharedErrorProps,
} from '../../../shared-ui';

export type EmptyStateVariant = 'cart' | 'wishlist' | 'search' | 'orders' | 'generic';

const MARK: Readonly<Record<EmptyStateVariant, string>> = {
  cart: '🧺',
  wishlist: '♥',
  search: '⌕',
  orders: '☰',
  generic: '·',
};

export interface EmptyStateProps extends Omit<SharedEmptyProps, 'ns' | 'art'> {
  variant?: EmptyStateVariant;
}

export function EmptyState(props: EmptyStateProps): ReactElement {
  const { variant = 'generic', ...rest } = props;
  return <SharedEmptyState {...rest} ns="hh" art={MARK[variant]} />;
}

export type ErrorStateProps = Omit<SharedErrorProps, 'ns'>;

export function ErrorState(props: ErrorStateProps): ReactElement {
  return <SharedErrorState {...props} ns="hh" />;
}
