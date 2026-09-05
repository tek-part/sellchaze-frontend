/**
 * flash-deals — a countdown to `ends_at` + a product collection. Ticks once a second (client only),
 * hides itself when expired if `hide_when_expired`, otherwise shows an "ended" note.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bandClass, bool, gridStyle, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibEmpty, LibGrid, LibProductCard, LibSection } from '../primitives';
import { useLibT } from '../i18n';
import { PRODUCT_CARD_FIELDS } from './FeaturedProducts';

/** Default: seven days from the moment the schema module loads — a demo that never starts expired. */
function defaultEndsAt(): string {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export const flashDealsSchema = defineSection({
  type: 'flash-deals',
  label: 'Flash deals',
  description: 'A countdown timer with the products on offer.',
  category: 'products',
  icon: 'HiOutlineBolt',
  settings: [
    fields.text('title', 'Title', tr('عروض اليوم', 'Deals of the day'), { translatable: true }),
    fields.text('subtitle', 'Subtitle', tr('أسعار خاصة لفترة محدودة', 'Special prices for a limited time')),
    { id: 'ends_at', type: 'text', label: 'Ends at (date & time)', default: defaultEndsAt(), hint: 'ISO format, e.g. 2026-12-31T23:59 (store time zone).' },
    fields.collection('collection', 'Collection', 'sale'),
    fields.select('layout', 'Layout', OPTIONS.layout, 'carousel'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Products to show', 8, 1, 24),
    fields.select('background', 'Background', OPTIONS.background, 'surface'),
    fields.toggle('hide_when_expired', 'Hide the section when the timer ends', true),
    ...PRODUCT_CARD_FIELDS,
    ...spacingFields(),
  ],
});

function useCountdown(endsAt: string): { d: number; h: number; m: number; s: number; expired: boolean; valid: boolean } {
  const target = Date.parse(endsAt);
  const valid = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!valid) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [valid, target]);
  const remaining = valid ? Math.max(0, target - now) : 0;
  const total = Math.floor(remaining / 1000);
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60, expired: valid && remaining <= 0, valid };
}

export function FlashDeals(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(flashDealsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const timer = useCountdown(str(s, 'ends_at'));
  const products = data.products(str(s, 'collection', 'sale'), num(s, 'limit', 8));
  if (timer.expired && bool(s, 'hide_when_expired', true)) return null;
  const columns = num(s, 'columns', 4);
  const card = { showBadges: bool(s, 'show_badges', true), showRatings: bool(s, 'show_ratings', true), showQuickAdd: bool(s, 'show_quick_add', true), showWishlist: bool(s, 'show_wishlist', true) };
  const cards = products.map((p) => <LibProductCard key={p.id} product={p} {...card} />);
  const pad = (n: number): string => String(n).padStart(2, '0');
  const units: Array<[number, string]> = [[timer.d, t('days')], [timer.h, t('hours')], [timer.m, t('minutes')], [timer.s, t('seconds')]];

  const countdown = timer.valid ? (
    <div className={cn('lib-countdown', timer.expired && 'is-expired')} role="timer" aria-live="off">
      {timer.expired ? (
        <span className="lib-countdown__ended">{t('expired')}</span>
      ) : (
        <>
          <span className="lib-countdown__label">{t('endsIn')}</span>
          {units.map(([value, label]) => (
            <span key={label} className="lib-countdown__unit">
              <span className="lib-countdown__value">{pad(value)}</span>
              <span className="lib-countdown__name">{label}</span>
            </span>
          ))}
        </>
      )}
    </div>
  ) : null;

  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className={bandClass(str(s, 'background', 'surface'))} aside={countdown} style={spacingStyle(s)}>
      {products.length === 0 ? (
        <LibEmpty message={t('emptyProducts')} />
      ) : str(s, 'layout', 'carousel') === 'carousel' ? (
        <LibCarousel ariaLabel={str(s, 'title') || t('products')} itemSize="card">{cards}</LibCarousel>
      ) : (
        <LibGrid style={gridStyle(columns)}>{cards}</LibGrid>
      )}
    </LibSection>
  );
}
