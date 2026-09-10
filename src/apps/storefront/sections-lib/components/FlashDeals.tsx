/**
 * flash-deals — a countdown to `ends_at` + a product collection. Ticks once a second (client only),
 * hides itself when expired if `hide_when_expired`, otherwise shows an "ended" note.
 * `useCountdown` / `Countdown` are shared with the countdown-banner section.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr, variantSelect } from '../schema';
import { bandClass, bool, num, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibSection } from '../primitives';
import { useLibT } from '../i18n';
import { PRODUCT_CARD_FIELDS, PRODUCT_LAYOUTS, ProductSet } from './product-set';

/** Default: seven days from the moment the schema module loads — a demo that never starts expired. */
export function defaultEndsAt(days = 7): string {
  const d = new Date(Date.now() + days * 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export const flashDealsSchema = defineSection({
  type: 'flash-deals',
  label: 'Flash deals',
  description: 'A countdown timer with the products on offer.',
  category: 'products',
  icon: 'HiOutlineBolt',
  variants: PRODUCT_LAYOUTS,
  settings: [
    fields.text('title', 'Title', tr('عروض اليوم', 'Deals of the day'), { translatable: true }),
    fields.text('subtitle', 'Subtitle', tr('أسعار خاصة لفترة محدودة', 'Special prices for a limited time')),
    { id: 'ends_at', type: 'text', label: 'Ends at (date & time)', default: defaultEndsAt(), hint: 'ISO format, e.g. 2026-12-31T23:59 (store time zone).' },
    fields.collection('collection', 'Collection', 'sale'),
    variantSelect(PRODUCT_LAYOUTS, 'carousel'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Products to show', 8, 1, 24),
    fields.select('background', 'Background', OPTIONS.background, 'surface'),
    fields.toggle('hide_when_expired', 'Hide the section when the timer ends', true),
    ...PRODUCT_CARD_FIELDS,
    ...spacingFields(),
  ],
});

export interface CountdownState {
  d: number;
  h: number;
  m: number;
  s: number;
  expired: boolean;
  valid: boolean;
}

export function useCountdown(endsAt: string): CountdownState {
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

/** The `dd : hh : mm : ss` unit row (with the "ends in" label / "ended" note). */
export function Countdown(props: { timer: CountdownState; size?: 'md' | 'lg'; className?: string }): ReactElement | null {
  const { timer, size = 'md', className } = props;
  const t = useLibT();
  if (!timer.valid) return null;
  const pad = (n: number): string => String(n).padStart(2, '0');
  const units: Array<[number, string]> = [[timer.d, t('days')], [timer.h, t('hours')], [timer.m, t('minutes')], [timer.s, t('seconds')]];
  return (
    <div className={cn('lib-countdown', `lib-countdown--${size}`, timer.expired && 'is-expired', className)} role="timer" aria-live="off">
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
  );
}

export function FlashDeals(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(flashDealsSchema, props.settings);
  const layout = useVariant(flashDealsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const timer = useCountdown(str(s, 'ends_at'));
  const products = data.products(str(s, 'collection', 'sale'), num(s, 'limit', 8));
  if (timer.expired && bool(s, 'hide_when_expired', true)) return null;
  const card = { showBadges: bool(s, 'show_badges', true), showRatings: bool(s, 'show_ratings', true), showQuickAdd: bool(s, 'show_quick_add', true), showWishlist: bool(s, 'show_wishlist', true) };

  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className={bandClass(str(s, 'background', 'surface'))} aside={<Countdown timer={timer} />} style={spacingStyle(s)}>
      <ProductSet
        layout={layout}
        products={products}
        columns={num(s, 'columns', 4)}
        card={card}
        limit={num(s, 'limit', 8)}
        ariaLabel={str(s, 'title') || t('products')}
        emptyMessage={t('emptyProducts')}
      />
    </LibSection>
  );
}
