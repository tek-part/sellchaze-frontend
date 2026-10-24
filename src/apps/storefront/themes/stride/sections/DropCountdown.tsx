/**
 * stride-drop-countdown — a launch band for the next release: drop number, name, big countdown
 * (the library `Countdown` primitive) and a teaser of the product when one is picked. At the
 * merchant's release time the band flips to an "Out now" state with a shop button, or hides.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import {
  Countdown, LibImage, LibPrice, defineSection, fields, spacingFields, spacingStyle, str, tr, useCountdown, useLibId, useLocaleCode,
  useSectionData, useSectionSettings, useVariant, variantSelect, variants,
} from '../../../sections-lib';
import { stText } from '../components/i18n';

/** Five days out, on the hour — a demo drop that never starts already released. */
export function defaultReleaseAt(days = 5): string {
  const d = new Date(Date.now() + days * 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export const DROP_STYLES = variants('style', [
  { value: 'accent', label: 'Accent band', description: 'Full accent colour, black type.', icon: 'HiOutlineBolt' },
  { value: 'night', label: 'Night', description: 'Dark band with accent numerals.', icon: 'HiOutlineMoon' },
  { value: 'outline', label: 'Outline', description: 'Page background framed by a heavy rule.', icon: 'HiOutlineSquare2Stack' },
]);

export const strideDropSchema = defineSection({
  type: 'stride-drop-countdown',
  label: 'Drop countdown',
  description: 'Countdown to a launch date with the drop’s name, a teaser product and a button.',
  category: 'marketing',
  icon: 'HiOutlineClock',
  variants: DROP_STYLES,
  settings: [
    variantSelect(DROP_STYLES, 'accent', 'Style'),
    fields.text('drop_label', 'Drop label', tr('إصدار ٠٧', 'Drop 07')),
    fields.text('eyebrow', 'Eyebrow', tr('الإصدار القادم', 'Next release')),
    fields.text('heading', 'Name', tr('Aero Runner 2 — كمية محدودة', 'Aero Runner 2 — limited run')),
    fields.textarea('text', 'Text', tr('نعل أخف ٢٠٪ وثبات أعلى في السرعات العالية. الكمية محدودة ومفيش إعادة طرح.', '20% lighter midsole and more grip at pace. Limited quantity, no restock.')),
    { id: 'release_at', type: 'text', label: 'Release date & time', default: defaultReleaseAt(), hint: 'ISO format, e.g. 2026-12-31T20:00 (store time zone).' },
    fields.product('product', 'Teaser product (optional)', ''),
    fields.image('image', 'Teaser image (optional)', '', 'Shown when no product is picked.'),
    fields.text('cta_label', 'Button before release', tr('شاهد التفاصيل', 'See the details')),
    fields.url('cta_url', 'Link before release', '/collections/new-arrivals'),
    fields.text('live_label', 'Button after release', tr('تسوق الآن', 'Shop now')),
    fields.url('live_url', 'Link after release', '/collections/new-arrivals'),
    fields.select('after_release', 'After the release time', [{ value: 'live', label: 'Show “Out now”' }, { value: 'hide', label: 'Hide the section' }], 'live'),
    ...spacingFields(0),
  ],
});

export function StrideDropCountdown(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(strideDropSchema, props.settings);
  const style = useVariant(strideDropSchema, props.settings);
  const data = useSectionData(props.context);
  const locale = useLocaleCode();
  const headingId = useLibId('st-drop');
  const timer = useCountdown(str(s, 'release_at'));
  const live = timer.valid && timer.expired;
  if (live && str(s, 'after_release', 'live') === 'hide') return null;
  const product = data.product(str(s, 'product'));
  const image = product?.image?.src ?? str(s, 'image');
  const label = live ? str(s, 'live_label') : str(s, 'cta_label');
  const url = live ? str(s, 'live_url', '/shop') : str(s, 'cta_url', '/shop');

  return (
    <section className={cn('st-drop', `st-drop--${style}`, live && 'is-live')} aria-labelledby={headingId} style={spacingStyle(s)}>
      <div className="lib-container st-drop__inner">
        <div className="st-drop__copy">
          <p className="st-drop__meta">
            {str(s, 'drop_label') ? <span className="st-drop__tag">{str(s, 'drop_label')}</span> : null}
            <span className="st-drop__eyebrow">{live ? stText(locale, 'dropLive') : str(s, 'eyebrow')}</span>
          </p>
          <h2 id={headingId} className="st-display st-drop__title">{str(s, 'heading')}</h2>
          {str(s, 'text') ? <p className="st-drop__text">{str(s, 'text')}</p> : null}
          {label ? <a href={url} className="st-btn st-btn--lg st-drop__cta">{label}<span className="st-btn__arrow" aria-hidden>→</span></a> : null}
        </div>
        <div className="st-drop__side">
          {!live && timer.valid ? (
            <div className="st-drop__timer">
              <span className="st-drop__timer-label">{stText(locale, 'dropsIn')}</span>
              <Countdown timer={timer} size="lg" className="st-countdown st-countdown--drop" />
            </div>
          ) : null}
          {product || image ? (
            <a href={product?.url ?? url} className="st-drop__teaser">
              <span className="st-drop__teaser-media">
                <LibImage src={image} alt="" sizes="(min-width: 1024px) 220px, 40vw" className="st-drop__teaser-img" monogram={(product?.title ?? str(s, 'heading')).charAt(0)} />
              </span>
              {product ? (
                <span className="st-drop__teaser-info">
                  <span className="st-drop__teaser-name">{product.title}</span>
                  <LibPrice amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} />
                </span>
              ) : null}
            </a>
          ) : (
            <span className="st-drop__stack" aria-hidden>
              <span>{str(s, 'drop_label') || 'DROP'}</span>
              <span>{str(s, 'drop_label') || 'DROP'}</span>
              <span>{str(s, 'drop_label') || 'DROP'}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
