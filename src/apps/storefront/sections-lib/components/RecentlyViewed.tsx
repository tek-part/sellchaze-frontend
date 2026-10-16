/**
 * recently-viewed — the shopper's client-side history (excluding the product being viewed).
 * Self-hides with fewer than `min_items` products.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { useRecentlyViewed } from '../../state/recently-viewed';
import { useOptionalStore } from '../../state/store-context';
import { useAsync } from '../../api/useAsync';
import { getCartCatalog } from '../../api/storefront';
import { toProductCard } from '../../api/mappers';
import { useLocaleCode } from '../i18n';
import { defineSection, fields, spacingFields, tr } from '../schema';
import { num, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibCarousel, LibProductCard, LibSection } from '../primitives';

export const recentlyViewedSchema = defineSection({
  type: 'recently-viewed',
  label: 'Recently viewed',
  description: 'Products the visitor looked at recently.',
  category: 'products',
  icon: 'HiOutlineClock',
  settings: [
    fields.text('title', 'Title', tr('شاهدت مؤخراً', 'Recently viewed')),
    fields.range('limit', 'Products to show', 8, 2, 16),
    fields.range('min_items', 'Hide below this many', 2, 1, 6),
    ...spacingFields(48),
  ],
});

export function RecentlyViewed(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(recentlyViewedSchema, props.settings);
  const { items } = useRecentlyViewed();
  const storeState = useOptionalStore(); const store = storeState?.store; const locale = useLocaleCode();
  const key = JSON.stringify(items.map((product) => Number(product.id)).filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 12));
  const query = useAsync(async () => storeState?.apiOk && key !== '[]' ? { key, ...(await getCartCatalog(JSON.parse(key) as number[])) } : null, [key, storeState?.apiOk, store?.id, locale]);
  // History can outlive a merchant visibility change. Revalidate before showing old cards.
  const fresh = store && query.data?.key === key && String(query.data.store_id) === store.id && !query.loading && !query.error ? query.data.data.filter((product) => product.catalog_hidden !== true && product.is_active !== false).map((product) => toProductCard(product, store.currency, store.currencyMultipliers[store.currency] ?? 1)) : [];
  const history = storeState?.apiOk ? items.flatMap((item) => fresh.find((product) => product.id === item.id) ?? []) : items;
  const current = (props.context.data as { product?: { id?: string } }).product?.id;
  const products = history.filter((p) => p.id !== current).slice(0, num(s, 'limit', 8));
  if (products.length < num(s, 'min_items', 2)) return null;
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      <LibCarousel ariaLabel={str(s, 'title')} itemSize="card">
        {products.map((p) => <LibProductCard key={p.id} product={p} showQuickAdd={false} />)}
      </LibCarousel>
    </LibSection>
  );
}
