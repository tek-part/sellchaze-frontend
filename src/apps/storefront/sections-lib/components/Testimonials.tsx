/**
 * testimonials — customer quotes as a carousel or grid. Uses the merchant's list; when the list is
 * empty and `use_store_reviews` is on, falls back to store testimonials/reviews from the page data.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bandClass, bool, gridStyle, list, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibGrid, LibImage, LibRating, LibSection } from '../primitives';
import { useLibT } from '../i18n';

interface Quote {
  quote: string;
  author: string;
  role: string;
  rating: number;
  avatar: string;
}

export const testimonialsSchema = defineSection({
  type: 'testimonials',
  label: 'Testimonials',
  description: 'Customer quotes with ratings.',
  category: 'social',
  icon: 'HiOutlineChatBubbleLeftRight',
  settings: [
    fields.text('title', 'Title', tr('ماذا يقول عملاؤنا', 'What our customers say')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.list(
      'items',
      'Testimonials',
      [fields.textarea('quote', 'Quote', ''), fields.text('author', 'Name', ''), fields.text('role', 'Role / city', ''), fields.range('rating', 'Rating', 5, 1, 5), fields.image('avatar', 'Photo', '')],
      [
        { quote: tr('تجربة رائعة من أول طلب — توصيل سريع وتغليف ممتاز.', 'A great experience from the first order — fast delivery and lovely packaging.'), author: tr('سارة م.', 'Sara M.'), role: tr('الرياض', 'Riyadh'), rating: 5, avatar: '' },
        { quote: tr('المنتجات مطابقة للوصف والدعم متجاوب جداً.', 'Products exactly as described and support replies quickly.'), author: tr('خالد ع.', 'Khalid A.'), role: tr('جدة', 'Jeddah'), rating: 5, avatar: '' },
        { quote: tr('أسعار منافسة وجودة أفضل مما توقعت.', 'Competitive prices and better quality than I expected.'), author: tr('نورة س.', 'Noura S.'), role: tr('الدمام', 'Dammam'), rating: 4, avatar: '' },
      ],
      12,
    ),
    fields.toggle('use_store_reviews', 'Use store reviews when the list is empty', true),
    fields.select('layout', 'Layout', OPTIONS.layout, 'carousel'),
    fields.select('columns', 'Columns', OPTIONS.columns(1, 4), '3'),
    fields.select('background', 'Background', OPTIONS.background, 'surface'),
    ...spacingFields(),
  ],
});

export function Testimonials(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(testimonialsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  let quotes: Quote[] = list(s, 'items')
    .map((i) => ({ quote: str(i, 'quote'), author: str(i, 'author'), role: str(i, 'role'), rating: num(i, 'rating', 5), avatar: str(i, 'avatar') }))
    .filter((q) => q.quote);
  if (quotes.length === 0 && bool(s, 'use_store_reviews', true)) {
    quotes = data.testimonials().map((r) => ({ quote: r.body, author: r.author, role: r.verified ? t('verified') : '', rating: r.rating, avatar: r.avatar ?? '' })).filter((q) => q.quote);
  }
  if (quotes.length === 0) return null;
  const cards = quotes.map((q, i) => (
    <figure key={i} className="lib-quote">
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
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className={cn(bandClass(str(s, 'background', 'surface')))} style={spacingStyle(s)}>
      {str(s, 'layout', 'carousel') === 'carousel' ? (
        <LibCarousel ariaLabel={str(s, 'title') || 'Testimonials'} itemSize="wide" showDots>{cards}</LibCarousel>
      ) : (
        <LibGrid style={gridStyle(num(s, 'columns', 3), 1)}>{cards}</LibGrid>
      )}
    </LibSection>
  );
}
