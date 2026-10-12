import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, tr } from '../../sections-lib/schema';
import { str, num, useSectionSettings } from '../../sections-lib/use-section';
import { useSectionData } from '../../sections-lib/data';
import { LibCategoryCard, LibProductCard, LibSection, LibEmpty } from '../../sections-lib/primitives';
import { useLibT } from '../../sections-lib/i18n';
import { FeaturedProducts } from '../../sections-lib/components/FeaturedProducts';
import type { ProductCardModel } from '../../types/catalog';
import { ProductDetailsSection } from '../../foundation/sections/ProductDetailsSection';
import { productDetailsSchema } from '../../sections-lib/components/ProductDetails';

export const sphinxProductSchema = defineSection({ ...productDetailsSchema, settings: productDetailsSchema.settings.map((field) => field.type === 'toggle' && ['show_buy_now', 'show_wishlist', 'show_share'].includes(field.id) ? { ...field, default: field.id === 'show_buy_now' } : field) });

export function SphinxProductDetails(props: SectionRenderProps): ReactElement | null {
  const settings = useSectionSettings(sphinxProductSchema, props.settings);
  return <ProductDetailsSection {...props} settings={{ ...settings, sphinx_layout: true }} />;
}

export function withSphinxCollections(props: SectionRenderProps): SectionRenderProps {
  const authoritative = props.context.data['merchandisingCollections'];
  if (!authoritative || typeof authoritative !== 'object' || Array.isArray(authoritative)) return props;
  return { ...props, context: { ...props.context, data: { ...props.context.data, collections: { ...(props.context.data['collections'] as Record<string, ReadonlyArray<ProductCardModel>>), ...authoritative } } } };
}
export function SphinxFeaturedProducts(props: SectionRenderProps): ReactElement | null {
  return <FeaturedProducts {...withSphinxCollections(props)} />;
}

export const sphinxCategoriesSchema = defineSection({ type: 'sphinx-categories', label: 'Category mosaic', category: 'categories', icon: 'HiOutlineSquares2X2', settings: [fields.text('title', 'Title', tr('استكشف أقسام المتجر', 'Browse our featured categories')), fields.text('subtitle', 'Description', ''), fields.range('limit', 'Categories', 6, 1, 6)] });
export function SphinxCategories(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(sphinxCategoriesSchema, props.settings); const data = useSectionData(props.context); const categories = data.categories(num(s, 'limit', 6));
  const t = useLibT();
  return <LibSection className="sph-categories" title={str(s, 'title')} subtitle={str(s, 'subtitle')}><div className="sph-mosaic">{categories.map((category, i) => <div key={category.id} className={`sph-mosaic__tile sph-mosaic__tile--${i % 6}`}><LibCategoryCard category={category} eager={i < 2} /></div>)}</div>{!data.loading && !categories.length ? <LibEmpty message={t('emptyCategories')} /> : null}</LibSection>;
}
export const sphinxShelfSchema = defineSection({ type: 'sphinx-shelf', label: 'Featured category and products', category: 'products', icon: 'HiOutlineShoppingBag', settings: [fields.text('title', 'Title', tr('الأكثر مبيعًا', 'Best sellers')), fields.collection('collection', 'Products', 'bestsellers'), fields.category('category', 'Featured category', ''), fields.range('limit', 'Products', 6, 1, 12)] });
export function SphinxShelf(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(sphinxShelfSchema, props.settings); const data = useSectionData(withSphinxCollections(props).context); const products = data.products(str(s, 'collection', 'bestsellers'), num(s, 'limit', 6));
  const category = data.category(str(s, 'category')) ?? data.categories(1)[0];
  return <LibSection className="sph-shelf" title={str(s, 'title')}><div className={category ? 'sph-shelf__layout' : ''}>{category ? <LibCategoryCard category={category} /> : null}<div className="sph-product-grid">{products.map((product) => <LibProductCard key={product.id} product={product} showWishlist={false} showRatings={false} style="plain" />)}</div></div></LibSection>;
}

