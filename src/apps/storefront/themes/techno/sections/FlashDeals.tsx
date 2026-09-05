/**
 * flash-deals (Techno) — hero-grade deals band: navy panel, cyan countdown tiles, theme cards.
 * Same schema and countdown semantics as the library section.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { flashDealsSchema } from '../../../sections-lib/components/FlashDeals';
import { LibCarousel, LibEmpty, LibGrid, LibSection, bandClass, bool, gridStyle, num, spacingStyle, str, useLibT, useSectionData, useSectionSettings } from '../../../sections-lib';
import { TkProductCard } from '../components/ProductCard';
import { IconBolt } from '../chrome/icons';

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

export function TkFlashDeals(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(flashDealsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const timer = useCountdown(str(s, 'ends_at'));
  const products = data.products(str(s, 'collection', 'sale'), num(s, 'limit', 8));
  if (timer.expired && bool(s, 'hide_when_expired', true)) return null;
  const columns = num(s, 'columns', 4);
  const card = { showBadges: bool(s, 'show_badges', true), showRatings: bool(s, 'show_ratings', true), showQuickAdd: bool(s, 'show_quick_add', true), showWishlist: bool(s, 'show_wishlist', true) };
  const cards = products.map((p) => <TkProductCard key={p.id} product={p} {...card} />);
  const pad = (n: number): string => String(n).padStart(2, '0');
  const units: Array<[number, string]> = [[timer.d, t('days')], [timer.h, t('hours')], [timer.m, t('minutes')], [timer.s, t('seconds')]];

  const countdown = timer.valid ? (
    <div className={cn('lib-countdown', 'tk-countdown', timer.expired && 'is-expired')} role="timer" aria-live="off">
      {timer.expired ? (
        <span className="lib-countdown__ended">{t('expired')}</span>
      ) : (
        <>
          <span className="lib-countdown__label tk-countdown__label"><IconBolt width={16} height={16} /> {t('endsIn')}</span>
          {units.map(([value, label]) => (
            <span key={label} className="lib-countdown__unit tk-countdown__unit">
              <span className="lib-countdown__value">{pad(value)}</span>
              <span className="lib-countdown__name">{label}</span>
            </span>
          ))}
        </>
      )}
    </div>
  ) : null;

  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className={cn('tk-deals', bandClass(str(s, 'background', 'none')))} aside={countdown} style={spacingStyle(s)}>
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
