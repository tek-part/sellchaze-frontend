/**
 * Karat overrides of the library product sections — featured-products, product-grid (the collection
 * page) and related-products — rendered with the Karat card. They reuse the library schemas, so the
 * customizer form and stored settings are unchanged.
 */
import type { ReactElement, ReactNode } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { featuredProductsSchema } from '../../../sections-lib/components/FeaturedProducts';
import { productGridSchema } from '../../../sections-lib/components/ProductGrid';
import { relatedProductsSchema } from '../../../sections-lib/components/RelatedProducts';
import {
  LibCarousel, LibEmpty, LibGrid, LibProductSkeleton, LibSection, bool, gridStyle, num, spacingStyle, str, useLibT,
  useSectionData, useSectionSettings, useVariant,
} from '../../../sections-lib';
import type { ThemeSettings } from '../../../theme-engine/types';
import { KaratProductCard } from '../components/ProductCard';

function cardOptions(s: ThemeSettings): { showBadges: boolean; showRatings: boolean; showQuickAdd: boolean; showWishlist: boolean } {
  return {
    showBadges: bool(s, 'show_badges', true),
    showRatings: bool(s, 'show_ratings', true),
    showQuickAdd: bool(s, 'show_quick_add', true),
    showWishlist: bool(s, 'show_wishlist', true),
  };
}

interface SetProps {
  products: ReadonlyArray<ProductCardModel>;
  layout: string;
  columns: number;
  card: ReturnType<typeof cardOptions>;
  loading: boolean;
  label: string;
  empty: string;
  /** Cards loaded eagerly (above-the-fold rows on the collection page). */
  eagerCount?: number;
}

function KaratProductSet(props: SetProps): ReactElement {
  const { products, layout, columns, card, loading, label, empty, eagerCount = 0 } = props;
  if (loading) return <LibGrid className="kr-grid" style={gridStyle(columns, 2)}>{Array.from({ length: columns }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>;
  if (products.length === 0) return <LibEmpty message={empty} />;
  const cards: ReactNode[] = products.map((p, i) => <KaratProductCard key={p.id} product={p} {...card} eager={i < eagerCount} />);
  if (layout === 'carousel') return <LibCarousel ariaLabel={label} itemSize="card" className="kr-rail">{cards}</LibCarousel>;
  return <LibGrid className="kr-grid" style={gridStyle(columns, 2)}>{cards}</LibGrid>;
}

export function KaratFeaturedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuredProductsSchema, props.settings);
  const layout = useVariant(featuredProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const limit = num(s, 'limit', 8);
  const products = data.products(str(s, 'collection', 'newest'), limit);
  const title = str(s, 'title');
  const loading = data.loading && products.length === 0;
  if (!loading && products.length === 0 && !title) return null;
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} align="center" viewAllHref={str(s, 'view_all_url')} viewAllLabel={str(s, 'view_all_label')} style={spacingStyle(s)} className="kr-products">
      <KaratProductSet products={products} layout={layout} columns={num(s, 'columns', 4)} card={cardOptions(s)} loading={loading} label={title || t('products')} empty={t('emptyProducts')} />
    </LibSection>
  );
}

export function KaratProductGrid(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(productGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const products = data.products(str(s, 'source', 'all'), num(s, 'limit', 24));
  const loading = data.loading && products.length === 0;
  return (
    <LibSection title={str(s, 'title')} align="center" style={spacingStyle(s)} className="kr-products kr-products--listing">
      <KaratProductSet products={products} layout="grid" columns={num(s, 'columns', 4)} card={cardOptions(s)} loading={loading} label={str(s, 'title') || t('products')} empty={data.error ? t('loadFailed') : t('emptyProducts')} eagerCount={Math.min(num(s, 'columns', 4), 4)} />
    </LibSection>
  );
}

export function KaratRelatedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(relatedProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const products = data.products(str(s, 'collection', 'related'), num(s, 'limit', 8));
  if (products.length === 0) return null;
  const title = str(s, 'title');
  return (
    <LibSection title={title} align="center" style={spacingStyle(s)} className="kr-products">
      <KaratProductSet products={products} layout={str(s, 'layout', 'carousel')} columns={num(s, 'columns', 4)} card={cardOptions(s)} loading={false} label={title} empty="" />
    </LibSection>
  );
}
