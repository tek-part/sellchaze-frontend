/**
 * glow-results — a results / numbers band that never invents a claim. By default (`source: auto`)
 * the figures are computed from the store's own catalogue: average rating, number of published
 * reviews, and the share of rated products at 4.5★+. A merchant who has documented results (a
 * consumer study, a clinical test) switches to `manual` and enters them with their source, and can
 * add a before/after image pair. With no data the section renders nothing.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { cn } from '../../../../../shared/utils/cn';
import { LibImage, LibSection, defineSection, fields, list, spacingFields, spacingStyle, str, tr, useLocaleCode, useSectionData, useSectionSettings } from '../../../sections-lib';
import { glText } from '../components/i18n';
import { formatCount, formatRating } from '../components/ProductCard';

export const glowResultsSchema = defineSection({
  type: 'glow-results',
  label: 'Results & numbers',
  description: 'Figures from your store’s ratings — or results you have documented — with optional before/after.',
  category: 'social',
  icon: 'HiOutlineChartBar',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('بالأرقام', 'By the numbers')),
    fields.text('title', 'Title', tr('ما تقوله عميلاتنا', 'What our customers say, in numbers')),
    fields.select('source', 'Figures', [
      { value: 'auto', label: 'Calculated from store ratings & reviews' },
      { value: 'manual', label: 'Entered by me (documented results only)' },
    ], 'auto', 'Only enter results you can document; add their source in the small print.'),
    fields.list('items', 'My figures (manual)', [
      fields.text('value', 'Figure (e.g. 92%)', ''),
      fields.text('label', 'What it measures', ''),
    ], [], 4),
    fields.image('before_image', 'Before image', ''),
    fields.image('after_image', 'After image', ''),
    fields.text('disclaimer', 'Small print / source', tr('النتائج الفردية تختلف من شخص لآخر.', 'Individual results vary.')),
    ...spacingFields(),
  ],
});

export interface GlowStat {
  value: string;
  label: string;
  note?: string;
}

function formatPercent(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(n / 100);
  } catch {
    return `${n}%`;
  }
}

/** Store-derived figures (pure). Empty when no product carries a rating. */
export function storeStats(products: ReadonlyArray<ProductCardModel>, locale: string): ReadonlyArray<GlowStat> {
  const rated = products.filter((p) => typeof p.rating === 'number' && p.rating > 0);
  if (rated.length === 0) return [];
  const weights = rated.map((p) => Math.max(1, p.reviewCount ?? 0));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const avg = rated.reduce((sum, p, i) => sum + (p.rating ?? 0) * weights[i]!, 0) / weightSum;
  const reviews = rated.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0);
  const top = Math.round((rated.filter((p) => (p.rating ?? 0) >= 4.5).length / rated.length) * 100);
  const out: GlowStat[] = [
    { value: `${formatRating(avg, locale)}/${formatCount(5, locale)}`, label: glText(locale, 'avgRating'), note: glText(locale, 'avgRatingNote', { n: formatCount(rated.length, locale) }) },
  ];
  if (reviews > 0) out.push({ value: formatCount(reviews, locale), label: glText(locale, 'reviewCount'), note: glText(locale, 'reviewCountNote') });
  out.push({ value: formatPercent(top, locale), label: glText(locale, 'topRated'), note: glText(locale, 'topRatedNote') });
  return out;
}

export function GlowResults(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(glowResultsSchema, props.settings);
  const data = useSectionData(props.context);
  const locale = useLocaleCode();
  const manual = str(s, 'source', 'auto') === 'manual';
  const stats: ReadonlyArray<GlowStat> = manual
    ? list(s, 'items').map((i) => ({ value: str(i, 'value'), label: str(i, 'label') })).filter((i) => i.value && i.label)
    : storeStats(data.products('newest'), locale);
  const before = str(s, 'before_image');
  const after = str(s, 'after_image');
  const pair = Boolean(before && after);
  if (stats.length === 0 && !pair) return null;

  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} align="center" style={spacingStyle(s)} className={cn('gl-results', pair && 'has-pair')}>
      {pair ? (
        <div className="gl-results__pair">
          <figure className="gl-results__shot">
            <LibImage src={before} alt={glText(locale, 'before')} sizes="(min-width: 768px) 40vw, 46vw" className="gl-results__img" />
            <figcaption>{glText(locale, 'before')}</figcaption>
          </figure>
          <figure className="gl-results__shot">
            <LibImage src={after} alt={glText(locale, 'after')} sizes="(min-width: 768px) 40vw, 46vw" className="gl-results__img" />
            <figcaption>{glText(locale, 'after')}</figcaption>
          </figure>
        </div>
      ) : null}
      {stats.length > 0 ? (
        <dl className={cn('gl-stats', `gl-stats--${Math.min(stats.length, 4)}`)}>
          {stats.map((stat, i) => (
            <div key={`${stat.label}-${i}`} className="gl-stat">
              <dt className="gl-stat__label">{stat.label}</dt>
              <dd className="gl-stat__value"><bdi>{stat.value}</bdi></dd>
              {stat.note ? <dd className="gl-stat__note">{stat.note}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
      {str(s, 'disclaimer') && (manual || pair) ? <p className="gl-smallprint gl-results__fine">{str(s, 'disclaimer')}</p> : null}
    </LibSection>
  );
}
