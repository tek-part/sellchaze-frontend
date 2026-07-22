/**
 * EmptyState / ErrorState — dead-ends composed like editorial moments: one hairline line-drawing, a
 * serif headline, one sentence, one CTA. `--danger` colours the error *message* only, never the
 * panel. Calm, never apologetic-cute. See §32.5.
 *
 * The markup and ARIA now live in `shared-ui/StateMessage`; this file keeps Theme 01's identity —
 * its `variant` vocabulary and its own hairline icons — and passes the `sf` namespace so every
 * existing `.sf-state*` rule and every existing call site is untouched.
 */
import type { ReactElement } from 'react';
import {
  EmptyState as SharedEmptyState,
  ErrorState as SharedErrorState,
  type EmptyStateProps as SharedEmptyProps,
  type ErrorStateProps as SharedErrorProps,
} from '../../../shared-ui';
import { IconBag, IconHeart, IconSearch, type IconProps } from './icons';

const ART_SIZE = 56;

export type EmptyStateVariant = 'search' | 'cart' | 'wishlist' | 'orders' | 'generic';

const EMPTY_ART: Record<EmptyStateVariant, ((p: IconProps) => ReactElement) | null> = {
  search: IconSearch,
  cart: IconBag,
  wishlist: IconHeart,
  orders: IconBag,
  generic: null,
};

export interface EmptyStateProps extends Omit<SharedEmptyProps, 'ns'> {
  variant?: EmptyStateVariant;
}

export function EmptyState(props: EmptyStateProps): ReactElement {
  const { variant = 'generic', art, ...rest } = props;
  const Art = EMPTY_ART[variant];
  const artNode = art ?? (Art ? <Art width={ART_SIZE} height={ART_SIZE} strokeWidth={1} /> : null);

  return <SharedEmptyState {...rest} ns="sf" {...(artNode ? { art: artNode } : {})} />;
}

export type ErrorStateProps = Omit<SharedErrorProps, 'ns'>;

export function ErrorState(props: ErrorStateProps): ReactElement {
  return <SharedErrorState {...props} ns="sf" />;
}
