/**
 * coupons-strip — distribute codes; nudge first order. Settings: title, codes (one "CODE | short
 * description" per line). PromoCard row with copy-to-clipboard; copying yields exactly one toast.
 * Self-hides with no codes. §08 coupons-strip.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { PromoCard } from '../components/PromoCard';
import { useToast } from '../components/toast/useToast';
import { SectionShell } from './SectionShell';
import { pairs, text } from './section-settings';
import { couponsFrom } from '../../../content/home-data';

export function CouponsStripSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const fromData = couponsFrom(context);
  const codes = fromData.length
    ? fromData.map((c) => ({ term: c.code, definition: c.type === 'percentage' ? `${c.value}% off your order` : `${c.value} off your order` }))
    : pairs(settings, 'codes').filter((c) => c.term);
  const toast = useToast();

  if (codes.length === 0) return null;

  return (
    <SectionShell title={title || undefined}>
      <div className="sf-coupons">
        {codes.map((code, i) => (
          <div key={i} className="sf-coupons__item">
            <PromoCard
              code={code.term}
              text={code.definition}
              onCopied={(value) => toast.toast({ message: `Code ${value} copied`, variant: 'success' })}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
