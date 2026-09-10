/**
 * countdown-banner — a promotional band with a big countdown to `ends_at` and `cta` button blocks.
 * Reuses the flash-deals timer; hides itself after the deadline when `hide_when_expired`.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { bandClass, bool, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibButton, LibImage, LibSection } from '../primitives';
import { Countdown, defaultEndsAt, useCountdown } from './FlashDeals';

const CTA_FIELDS = [
  fields.text('label', 'Label', ''),
  fields.url('url', 'Link', '/shop'),
  fields.select('style', 'Style', [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'ghost', label: 'Ghost' }], 'primary'),
] as const;

export const ctaBlock = defineBlock({ type: 'cta', label: 'Button', icon: 'HiOutlineCursorArrowRays', settings: CTA_FIELDS, limit: 3 });

export const COUNTDOWN_LAYOUTS = variants('layout', [
  { value: 'centered', label: 'Centered', description: 'Heading, timer and buttons stacked in the middle.', icon: 'HiOutlineClock' },
  { value: 'inline', label: 'Inline', description: 'Text on one side, timer and buttons on the other.', icon: 'HiOutlineArrowsRightLeft' },
  { value: 'image', label: 'With image', description: 'Text over a background image.', icon: 'HiOutlinePhoto' },
]);

const DEMO_CTAS: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'cta', settings: { label: tr('تسوق العرض', 'Shop the sale'), url: '/collections/sale', style: 'primary' } },
];

export const countdownBannerSchema = defineSection({
  type: 'countdown-banner',
  label: 'Countdown banner',
  description: 'A promo band with a countdown and buttons.',
  category: 'marketing',
  icon: 'HiOutlineClock',
  variants: COUNTDOWN_LAYOUTS,
  blocks: { types: [ctaBlock], max: 3 },
  settings: [
    variantSelect(COUNTDOWN_LAYOUTS, 'centered'),
    fields.text('eyebrow', 'Eyebrow', tr('لفترة محدودة', 'Limited time')),
    fields.text('heading', 'Heading', tr('تخفيضات نهاية الموسم', 'End-of-season sale')),
    fields.textarea('text', 'Text', tr('خصومات تصل إلى ٥٠٪ على تشكيلة مختارة — حتى انتهاء العد.', 'Up to 50% off selected styles — until the clock runs out.')),
    { id: 'ends_at', type: 'text', label: 'Ends at (date & time)', default: defaultEndsAt(3), hint: 'ISO format, e.g. 2026-12-31T23:59 (store time zone).' },
    fields.image('image', 'Background image (With image layout)', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1920&h=800&q=80'),
    fields.range('overlay', 'Overlay darkness', 50, 0, 90, 5),
    fields.select('background', 'Background', OPTIONS.background, 'primary'),
    fields.toggle('hide_when_expired', 'Hide the section when the timer ends', true),
    ...spacingFields(),
  ],
  presets: [{ label: 'Sale countdown', settings: { blocks: DEMO_CTAS } }],
});

export function CountdownBanner(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(countdownBannerSchema, props.settings);
  const layout = useVariant(countdownBannerSchema, props.settings);
  const ctas = useSectionBlocks(countdownBannerSchema, s, undefined, DEMO_CTAS).filter((b) => str(b.settings, 'label'));
  const timer = useCountdown(str(s, 'ends_at'));
  if (timer.expired && bool(s, 'hide_when_expired', true)) return null;
  const withImage = layout === 'image';
  const band = withImage ? '' : bandClass(str(s, 'background', 'primary'));
  const buttons = ctas.length > 0 ? (
    <div className="lib-cdb__actions">
      {ctas.map((b) => {
        const style = str(b.settings, 'style', 'primary');
        const variant = withImage || band.includes('primary') || band.includes('accent') ? (style === 'primary' ? 'inverse' : 'ghost') : style === 'ghost' ? 'ghost' : style === 'secondary' ? 'secondary' : 'primary';
        return <LibButton key={b.id} href={str(b.settings, 'url', '/shop')} variant={variant} size="lg">{str(b.settings, 'label')}</LibButton>;
      })}
    </div>
  ) : null;
  return (
    <LibSection className={cn('lib-cdb', `lib-cdb--${layout}`, band)} style={{ ...spacingStyle(s), '--lib-overlay': String(num(s, 'overlay', 50) / 100) } as CSSProperties} flush={withImage}>
      <div className={cn('lib-cdb__inner', withImage && 'lib-cdb__inner--image')}>
        {withImage ? (
          <>
            <LibImage src={str(s, 'image')} alt="" className="lib-cdb__img" />
            <span className="lib-cdb__scrim" aria-hidden />
          </>
        ) : null}
        <div className={cn('lib-cdb__content', withImage && 'lib-container')}>
          <div className="lib-cdb__copy">
            {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
            {str(s, 'heading') ? <h2 className="lib-title">{str(s, 'heading')}</h2> : null}
            {str(s, 'text') ? <p className="lib-subtitle">{str(s, 'text')}</p> : null}
          </div>
          <div className="lib-cdb__side">
            <Countdown timer={timer} size="lg" />
            {buttons}
          </div>
        </div>
      </div>
    </LibSection>
  );
}
