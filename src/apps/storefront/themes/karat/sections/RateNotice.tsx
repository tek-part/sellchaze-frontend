/**
 * karat-rate-notice — a "today's gold rate" style notice whose every word and number is typed by
 * the merchant. There is no live feed, no ticking indicator and no default figures: out of the box it
 * explains that prices follow the daily rate and invites a quote. Rates appear only when the
 * merchant enters them, next to the merchant's own "updated" note and disclaimer.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { defineSection, fields, list, str, tr, useLocaleCode, useSectionSettings } from '../../../sections-lib';
import { cn } from '../../../../../shared/utils/cn';
import { useConciergePhone } from '../components/concierge';
import { whatsappHref } from '../components/i18n';

export const karatRateNoticeSchema = defineSection({
  type: 'karat-rate-notice',
  label: 'Karat — gold-rate notice',
  description: 'A notice about daily gold prices. All text and any rates are typed by you — nothing is fetched live.',
  category: 'marketing',
  icon: 'HiOutlineCurrencyDollar',
  settings: [
    fields.select('style', 'Style', [{ value: 'band', label: 'Slim band' }, { value: 'card', label: 'Framed card' }], 'band'),
    fields.text('label', 'Label', tr('أسعار الذهب', 'Gold prices')),
    fields.textarea('message', 'Message', tr('تتغيّر أسعار الذهب يومياً؛ يُحسب سعر كل قطعة على سعر اليوم مضافاً إليه المصنعية. راسلنا لعرض سعر دقيق.', 'Gold prices move daily: each piece is priced at the day’s rate plus craftsmanship. Message us for an exact quote.')),
    fields.list('rates', 'Rates (optional — typed by you)', [fields.text('label', 'Label', ''), fields.text('value', 'Value', '')], [], 6, 'Leave empty to show the message only. Keep these up to date yourself.'),
    fields.text('updated', 'Updated note', '', { hint: 'e.g. “Updated Sunday, 10:00” — shown only when filled in.' }),
    fields.text('disclaimer', 'Disclaimer', tr('الأسعار يُدخلها المتجر للاسترشاد فقط، والسعر النهائي يُؤكَّد عند الطلب.', 'Prices are entered by the store for guidance; the final price is confirmed when you order.')),
    fields.select('cta_type', 'Button', [{ value: 'whatsapp', label: 'WhatsApp quote' }, { value: 'link', label: 'Link' }, { value: 'none', label: 'No button' }], 'whatsapp'),
    fields.text('cta_label', 'Button label', tr('اطلب سعر اليوم', 'Ask for today’s quote')),
    fields.url('cta_url', 'Button link', '/contact'),
    fields.text('whatsapp_message', 'WhatsApp message', tr('مرحباً، أود معرفة سعر الذهب اليوم.', 'Hello, I would like today’s gold price.')),
  ],
});

export function KaratRateNotice(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(karatRateNoticeSchema, props.settings);
  const phone = useConciergePhone();
  const ar = useLocaleCode().startsWith('ar');
  const rates = list(s, 'rates').filter((r) => str(r, 'label').trim() !== '' && str(r, 'value').trim() !== '');
  const message = str(s, 'message');
  const label = str(s, 'label');
  if (!message.trim() && rates.length === 0) return null;

  const type = str(s, 'cta_type', 'whatsapp');
  const wa = type === 'whatsapp' ? whatsappHref(phone, str(s, 'whatsapp_message')) : '';
  const href = type === 'whatsapp' ? wa || str(s, 'cta_url') : type === 'link' ? str(s, 'cta_url') : '';
  const ctaLabel = str(s, 'cta_label');
  const updated = str(s, 'updated');
  const disclaimer = str(s, 'disclaimer');
  const external = href.startsWith('https://wa.me/');

  return (
    <section className={cn('kr-rate', `kr-rate--${str(s, 'style', 'band') === 'card' ? 'card' : 'band'}`)} aria-label={label || (ar ? 'أسعار الذهب' : 'Gold prices')}>
      <div className="lib-container kr-rate__inner">
        <div className="kr-rate__head">
          {label ? <p className="kr-rate__label"><span className="kr-rate__mark" aria-hidden />{label}</p> : null}
          {updated ? <p className="kr-rate__updated">{updated}</p> : null}
        </div>
        {rates.length > 0 ? (
          <dl className="kr-rate__list">
            {rates.map((r, i) => (
              <div key={`${str(r, 'label')}-${i}`} className="kr-rate__item">
                <dt>{str(r, 'label')}</dt>
                <dd><bdi>{str(r, 'value')}</bdi></dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="kr-rate__body">
          {message ? <p className="kr-rate__message">{message}</p> : null}
          {disclaimer ? <p className="kr-rate__note">{disclaimer}</p> : null}
        </div>
        {href && ctaLabel ? (
          <a href={href} className="kr-btn kr-btn--outline kr-rate__cta" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{ctaLabel}</a>
        ) : null}
      </div>
    </section>
  );
}
