import { useId, useState, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import type { ProductCardModel } from '../../types/catalog';
import { defineSection, fields, tr } from '../../sections-lib/schema';
import { str, num, useSectionSettings } from '../../sections-lib/use-section';
import { productsFromContext, useSectionData } from '../../sections-lib/data';
import { LibCarousel, LibEmpty, LibImage } from '../../sections-lib/primitives';
import { useLibT, useLocaleCode } from '../../sections-lib/i18n';
import { formatMoney } from '../../utils/format';
import { ProductDetailsSection } from '../../foundation/sections/ProductDetailsSection';
import { productDetailsSchema } from '../../sections-lib/components/ProductDetails';
import { productGridSchema } from '../../sections-lib/components/ProductGrid';
import { relatedProductsSchema } from '../../sections-lib/components/RelatedProducts';

export const eliteHeroSchema = defineSection({ type: 'elite-hero', label: 'Cinematic hero', category: 'hero', settings: [fields.image('image', 'Desktop image', ''), fields.image('mobile_image', 'Mobile image', ''), fields.text('eyebrow', 'Eyebrow', tr('مساحات ملهمة', 'Inspired spaces')), fields.text('title', 'Heading', tr('أناقة تدوم', 'Made for everyday living')), fields.text('text', 'Description', tr('قطع مختارة لتجعل كل مساحة أقرب إليك', 'Thoughtful furniture for a home that feels like you.')), fields.text('button', 'Button', tr('تسوق المجموعة', 'Shop collection')), fields.url('url', 'Link', '/shop'), fields.range('overlay', 'Image overlay', 30, 0, 80)] });
export function EliteHero(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(eliteHeroSchema, props.settings);
  return <section className="elt-hero"><picture>{str(s, 'mobile_image') ? <source media="(max-width:767px)" srcSet={str(s, 'mobile_image')} /> : null}<img src={str(s, 'image') || undefined} alt="" fetchPriority="high" /></picture><div className="elt-hero__shade" style={{ opacity: num(s, 'overlay', 30) / 100 }} /><div className="elt-hero__copy"><p className="elt-eyebrow">{str(s, 'eyebrow')}</p><h1>{str(s, 'title')}</h1><p>{str(s, 'text')}</p>{str(s, 'button') ? <a className="elt-pill" href={str(s, 'url', '/shop')}>{str(s, 'button')}</a> : null}</div></section>;
}

export const eliteCategoriesSchema = defineSection({ type: 'elite-categories', label: 'Category photo tiles', category: 'categories', settings: [fields.text('eyebrow', 'Eyebrow', tr('مجموعات مختارة', 'Featured collections')), fields.text('title', 'Heading', tr('تسوق حسب القسم', 'Shop by category')), fields.range('limit', 'Categories', 5, 1, 12)] });
export function EliteCategories(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(eliteCategoriesSchema, props.settings); const data = useSectionData(props.context); const t = useLibT();
  return <section className="elt-categories"><header className="elt-section-title"><p className="elt-eyebrow">{str(s, 'eyebrow')}</p><h2>{str(s, 'title')}</h2></header><div className="elt-category-grid">{data.categories(num(s, 'limit', 5)).map(category => <a className="elt-category" key={category.id} href={category.url}><LibImage src={category.image?.src} alt="" /><span>{category.title}</span></a>)}</div>{!data.loading && !data.categories(1).length ? <LibEmpty message={t('emptyCategories')} /> : null}</section>;
}

export function eliteCollectionContext(props: SectionRenderProps): SectionRenderProps {
  const authoritative = props.context.data['merchandisingCollections'];
  if (!authoritative || typeof authoritative !== 'object' || Array.isArray(authoritative)) return props;
  return { ...props, context: { ...props.context, data: { ...props.context.data, collections: { ...(props.context.data['collections'] as Record<string, ReadonlyArray<ProductCardModel>>), ...authoritative } } } };
}
export function eliteProducts(props: SectionRenderProps, fallback: ReadonlyArray<ProductCardModel>, key: string, limit: number): ReadonlyArray<ProductCardModel> {
  const scoped = eliteCollectionContext(props);
  const collections = scoped.context.data['collections'] as Record<string, unknown> | undefined;
  if (Array.isArray(collections?.[key]) || Array.isArray(scoped.context.data['products'])) return productsFromContext(scoped.context, key).slice(0, limit);
  return fallback;
}
export function EliteCard({ product, eager = false }: { product: ProductCardModel; eager?: boolean }): ReactElement {
  const locale = useLocaleCode(); const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return <a className="elt-card" href={product.url}><div className="elt-card__media"><LibImage src={product.image?.src} alt={product.title} eager={eager} />{product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" className="elt-card__hover" /> : null}{discount > 0 ? <span className="elt-card__discount">{locale === 'ar' ? 'وفر' : 'Save'} {discount}%</span> : null}</div>{product.colors?.length ? <div className="elt-card__colors">{product.colors.map(color => <span key={color.value} title={color.label} style={{ background: color.color }} />)}</div> : null}<h3>{product.title}</h3><div className="elt-card__price"><span>{formatMoney(product.price, product.currency, locale)}</span>{product.compareAtPrice && product.compareAtPrice > product.price ? <del>{formatMoney(product.compareAtPrice, product.currency, locale)}</del> : null}</div></a>;
}
export const eliteShelfSchema = defineSection({ type: 'elite-shelf', label: 'Featured category shelf', category: 'products', settings: [fields.text('title', 'Heading', tr('المجموعة المميزة', 'Featured collection')), fields.collection('collection', 'Products', 'bestsellers'), fields.category('category', 'Category banner', ''), fields.range('limit', 'Products', 7, 1, 24), fields.select('layout', 'Layout', [{ value: 'shelf', label: 'Category and products' }, { value: 'carousel', label: 'Product carousel' }, { value: 'grid', label: 'Product grid' }], 'shelf')] });
export function EliteShelf(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(eliteShelfSchema, props.settings); const data = useSectionData(eliteCollectionContext(props).context); const t = useLibT();
  const key = str(s, 'collection', 'bestsellers'); const limit = num(s, 'limit', 7);
  const products = eliteProducts(props, data.products(key, limit), key, limit); const category = data.category(str(s, 'category')) ?? data.categories(1)[0]; const carousel = str(s, 'layout') === 'carousel';
  return <section className="elt-shelf"><header className="elt-section-title"><h2>{str(s, 'title')}</h2></header>{carousel ? <LibCarousel ariaLabel={str(s, 'title')} className="elt-carousel" showArrows>{products.map(product => <EliteCard key={product.id} product={product} />)}</LibCarousel> : <div className={`elt-shelf-grid${str(s, 'layout') === 'grid' ? ' is-products-only' : ''}`}>{str(s, 'layout') !== 'grid' && category ? <a className="elt-shelf-banner" href={category.url}><LibImage src={category.image?.src} alt="" /><div><p>{category.title}</p><span>{t('viewAll')}</span></div></a> : null}{products.map(product => <EliteCard key={product.id} product={product} />)}</div>}{!data.loading && !products.length ? <LibEmpty message={data.error ? t('loadFailed') : t('emptyProducts')} /> : null}</section>;
}

export const eliteCompareSchema = defineSection({ type: 'elite-image-compare', label: 'Compare two photos', category: 'content', settings: [fields.text('eyebrow', 'Eyebrow', tr('التفاصيل تصنع الفرق', 'Consider every detail')), fields.text('title', 'Heading', tr('اختر ما يناسب مساحتك', 'Find your perfect finish')), fields.image('before_image', 'First photo', ''), fields.image('after_image', 'Second photo', ''), fields.text('before_label', 'First photo description', tr('الصورة الأولى', 'First photo')), fields.text('after_label', 'Second photo description', tr('الصورة الثانية', 'Second photo'))] });
export function comparisonPercent(value: number): number { return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50; }
export function EliteImageCompare(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(eliteCompareSchema, props.settings); const [value, setValue] = useState(50); const id = useId(); const locale = useLocaleCode();
  if (!str(s, 'before_image') || !str(s, 'after_image')) return <section className="elt-compare is-empty"><header className="elt-section-title"><h2>{str(s, 'title')}</h2></header></section>;
  return <section className="elt-compare"><header className="elt-section-title"><p className="elt-eyebrow">{str(s, 'eyebrow')}</p><h2 id={id}>{str(s, 'title')}</h2></header><div className="elt-compare__photos" style={{ '--compare': `${value}%` } as CSSProperties}><img src={str(s, 'after_image')} alt={str(s, 'after_label')} loading="lazy" /><img className="elt-compare__first" src={str(s, 'before_image')} alt={str(s, 'before_label')} loading="lazy" /><span className="elt-compare__divider" aria-hidden><span>‹ ›</span></span><input type="range" min="0" max="100" value={value} onChange={event => setValue(comparisonPercent(Number(event.target.value)))} aria-labelledby={id} aria-valuetext={`${value}% ${str(s, 'before_label')}`} /><p className="lib-sr-only">{locale === 'ar' ? 'حرك المؤشر أو استخدم الأسهم لمقارنة الصورتين.' : 'Drag the handle or use arrow keys to compare both photos.'}</p></div></section>;
}

export const eliteProductSchema = defineSection({ ...productDetailsSchema, settings: productDetailsSchema.settings.map(field => field.type === 'toggle' && ['show_buy_now', 'show_wishlist', 'show_share', 'show_sku'].includes(field.id) ? { ...field, default: field.id === 'show_buy_now' } : field) });
export function EliteProductDetails(props: SectionRenderProps): ReactElement | null { return <ProductDetailsSection {...props} settings={{ ...useSectionSettings(eliteProductSchema, props.settings), elite_layout: true }} />; }

export const eliteRelatedSchema = defineSection({ ...relatedProductsSchema, settings: relatedProductsSchema.settings.filter(field => ['title', 'collection', 'limit'].includes(field.id)).map(field => field.type === 'text' && field.id === 'title' ? { ...field, default: tr('منتجات مشابهة', 'Similar products') } : field) });
export function EliteRelatedProducts(props: SectionRenderProps): ReactElement { const s = useSectionSettings(eliteRelatedSchema, props.settings); return <EliteShelf {...props} settings={{ ...s, collection: 'related', layout: 'carousel' }} />; }

export const eliteGridSchema = defineSection({ ...productGridSchema, settings: productGridSchema.settings.filter(field => !['show_quick_add', 'show_wishlist', 'show_ratings'].includes(field.id)) });
export function rankEliteProducts(products: ReadonlyArray<ProductCardModel>, sort: string): ReadonlyArray<ProductCardModel> {
  if (sort === 'price-asc') return [...products].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return [...products].sort((a, b) => b.price - a.price);
  if (sort === 'rating') return [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return products;
}
export function EliteProductGrid(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(eliteGridSchema, props.settings); const data = useSectionData(props.context); const t = useLibT(); const locale = useLocaleCode(); const ar = locale === 'ar'; const [sort, setSort] = useState('rating');
  const products = rankEliteProducts(data.products(str(s, 'source', 'all'), num(s, 'limit', 24)), sort);
  return <section className="elt-listing"><label className="elt-sort"><span className="lib-sr-only">{ar ? 'ترتيب المنتجات' : 'Sort products'}</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="rating">{ar ? 'الأعلى تقييمًا' : 'Highest rate'}</option><option value="price-asc">{ar ? 'السعر: الأقل أولًا' : 'Price: low to high'}</option><option value="price-desc">{ar ? 'السعر: الأعلى أولًا' : 'Price: high to low'}</option><option value="default">{ar ? 'ترتيب المتجر' : 'Store order'}</option></select></label><div className="elt-shelf-grid is-products-only">{products.map((product, index) => <EliteCard key={product.id} product={product} eager={index < 4} />)}</div>{!products.length ? <LibEmpty message={data.loading ? ar ? 'جارٍ التحميل…' : 'Loading…' : data.error ? t('loadFailed') : t('emptyProducts')} /> : null}</section>;
}
