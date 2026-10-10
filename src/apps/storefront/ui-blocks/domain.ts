import type { AsyncState } from '../api/useAsync';

export const UI_BLOCK_SLOTS = ['before_header', 'after_header', 'before_product_gallery', 'after_product_gallery', 'before_checkout', 'after_checkout', 'before_footer', 'after_footer'] as const;
export type UiBlockSlot = typeof UI_BLOCK_SLOTS[number];
export interface UiBlocksData { enabled: boolean; blocks: Record<UiBlockSlot, string> }
export interface UiBlocksResponse { key: string; data: { data: UiBlocksData } }

/** A locale, route or tenant transition must never display the previous response's content. */
export function currentUiBlocks(query: Pick<AsyncState<UiBlocksResponse>, 'data' | 'loading' | 'error'>, key: string): UiBlocksData | null {
  if (query.loading || query.error || query.data?.key !== key || !query.data.data.data.enabled) return null;
  return query.data.data.data;
}
