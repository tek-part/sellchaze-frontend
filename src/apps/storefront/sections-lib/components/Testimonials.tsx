/**
 * testimonials — customer `quote` blocks as cards, a carousel, a quote wall (masonry columns) or
 * one large rotating quote. When there are no blocks and `use_store_reviews` is on, falls back to
 * store testimonials/reviews from the page data.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { bandClass, bool, gridStyle, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibGrid, LibImage, LibRating, LibSection } from '../primitives';
import { useLibT } from '../i18n';

interface Quote {
  id: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
  avatar: string;
}

const QUOTE_FIELDS = [
  fields.textarea('quote', 'Quote', ''),
  fields.text('author', 'Name', ''),
  fields.text('role', 'Role / city', ''),
  fields.range('rating', 'Rating', 5, 1, 5),
  fields.image('avatar', 'Photo', ''),
] as const;

export const quoteBlock = defineBlock({ type: 'quote', label: 'Quote', icon: 'HiOutlineChatBubbleLeftRight', settings: QUOTE_FIELDS, limit: 12 });

export const TESTIMONIAL_LAYOUTS = variants('layout', [
  { value: 'carousel', label: 'Carousel', description: 'Quote cards in a scrolling rail.', icon: 'HiOutlineArrowsRightLeft' },
  { value: 'cards', label: 'Cards', description: 'A grid of quote cards.', icon: 'HiOutlineSquares2X2' },
  { value: 'quote-wall', label: 'Quote wall', description: 'Masonry columns of quotes.', icon: 'HiOutlineRectangleGroup' },
  { value: 'single-large', label: 'Single large', description: 'One big quote at a time.', icon: 'HiOutlineChatBubbleOvalLeft' },
], { layout: { grid: 'cards' } });

export const testimonialsSchema = defineSection({
  type: 'testimonials',
  label: 'Testimonials',
  description: 'Customer quotes with ratings.',
  category: 'social',
  icon: 'HiOutlineChatBubbleLeftRight',
  variants: TESTIMONIAL_LAYOUTS,
  blocks: { types: [quoteBlock], max: 12, legacy: 'items' },
  settings: [
    fields.text('title', 'Title', tr('ماذا يقول عملاؤنا', 'What our customers say')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(TESTIMONIAL_LAYOUTS, 'carousel'),
    fields.list(
      'items',
      'Testimonials',
      QUOTE_FIELDS,
      [
        { quote: tr('تجربة رائعة من أول طلب — توصيل سريع وتغليف ممتاز.', 'A great experience from the first order — fast delivery and lovely packaging.'), author: tr('سارة م.', 'Sara M.'), role: tr('الرياض', 'Riyadh'), rating: 5, avatar: '' },
        { quote: tr('المنتجات مطابقة للوصف والدعم متجاوب جداً.', 'Products exactly as described and support replies quickly.'), author: tr('خالد ع.', 'Khalid A.'), role: tr('جدة', 'Jeddah'), rating: 5, avatar: '' },
        { quote: tr('أسعار منافسة وجودة أفضل مما توقعت.', 'Competitive prices and better quality than I expected.'), author: tr('نورة س.', 'Noura S.'), role: tr('الدمام', 'Dammam'), rating: 4, avatar: '' },
      ],
      12,
    ),
    fields.toggle('use_store_reviews', 'Use store reviews when the list is empty', true),
    fields.select('columns', 'Columns', OPTIONS.columns(1, 4), '3'),
    fields.select('background', 'Background', OPTIONS.background, 'surface'),
    ...spacingFields(),
  ],
});

export function Testimonials(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(testimonialsSchema, props.settings);
  const layout = useVariant(testimonialsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  let quotes: Quote[] = useSectionBlocks(testimonialsSchema, s)
    .map((b) => ({ id: b.id, quote: str(b.settings, 'quote'), author: str(b.settings, 'author'), role: str(b.settings, 'role'), rating: num(b.settings, 'rating', 5), avatar: str(b.settings, 'avatar') }))
    .filter((q) => q.quote);
  if (quotes.length === 0 && bool(s, 'use_store_reviews', true)) {
    quotes = data.testimonials().map((r) => ({ id: r.id, quote: r.body, author: r.author, role: r.verified ? t('verified') : '', rating: r.rating, avatar: r.avatar ?? '' })).filter((q) => q.quote);
  }
  if (quotes.length === 0) return null;
  const large = layout === 'single-large';
  const cards = quotes.map((q) => (
    <figure key={q.id} className={cn('lib-quote', large && 'lib-quote--large')}>
      <LibRating value={q.rating} />
      <blockquote className="lib-quote__text">“{q.quote}”</blockquote>
      <figcaption className="lib-quote__by">
        {q.avatar ? <LibImage src={q.avatar} alt="" className="lib-quote__avatar" /> : <span className="lib-quote__avatar lib-quote__avatar--initial" aria-hidden>{q.author.charAt(0)}</span>}
        <span>
          <span className="lib-quote__name">{q.author}</span>
          {q.role ? <span className="lib-quote__role">{q.role}</span> : null}
        </span>
      </figcaption>
    </figure>
  ));
  const title = str(s, 'title');
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} align="center" narrow={large} className={cn(bandClass(str(s, 'background', 'surface')), `lib-testimonials--${layout}`)} style={spacingStyle(s)}>
      {layout === 'carousel' ? (
        <LibCarousel ariaLabel={title || 'Testimonials'} itemSize="wide" showDots>{cards}</LibCarousel>
      ) : large ? (
        <LibCarousel ariaLabel={title || 'Testimonials'} itemSize="full" showDots showArrows={false} autoplay intervalMs={8000}>{cards}</LibCarousel>
      ) : layout === 'quote-wall' ? (
        <div className="lib-quote-wall" style={gridStyle(num(s, 'columns', 3), 1)}>{cards}</div>
      ) : (
        <LibGrid style={gridStyle(num(s, 'columns', 3), 1)}>{cards}</LibGrid>
      )}
    </LibSection>
  );
}
