/**
 * karat-concierge — the private-appointment / WhatsApp invitation. WhatsApp opens a chat with the
 * merchant's number (theme setting, else the store phone) and a pre-written message; the appointment
 * button links wherever the merchant books visits. Without a number the WhatsApp button is hidden,
 * never pointed at a placeholder.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { LibImage, defineSection, fields, str, tr, useSectionSettings } from '../../../sections-lib';
import { cn } from '../../../../../shared/utils/cn';
import { useConciergePhone } from '../components/concierge';
import { phoneDigits, whatsappHref } from '../components/i18n';
import { IconPhone, IconWhatsapp } from '../chrome/icons';
import { Motif, type MotifKind } from './motifs';

export const karatConciergeSchema = defineSection({
  type: 'karat-concierge',
  label: 'Karat — concierge & appointments',
  description: 'Invite visitors to a private viewing or a WhatsApp consultation.',
  category: 'marketing',
  icon: 'HiOutlineChatBubbleLeftRight',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('خدمة شخصية', 'Personal service')),
    fields.text('title', 'Title', tr('اختر قطعتك بصحبة خبير', 'Choose with an expert beside you')),
    fields.textarea('text', 'Text', tr('احجز موعداً خاصاً في المعرض أو تحدّث معنا على واتساب: نساعدك في المقاسات، العيار، النقش، واختيار الهدية المناسبة.', 'Book a private viewing in the boutique or talk to us on WhatsApp — sizing, karat, engraving and choosing the right gift.')),
    fields.image('image', 'Photo', '', 'Optional — without a photo the arch shows a line drawing.'),
    fields.select('motif', 'Line drawing (no photo)', [
      { value: 'ring', label: 'Ring' }, { value: 'watch', label: 'Watch' }, { value: 'gem', label: 'Gemstone' }, { value: 'pearl', label: 'Pearl strand' }, { value: 'diamond', label: 'Cut diamond' },
    ], 'ring'),
    fields.text('whatsapp_label', 'WhatsApp button', tr('تحدّث معنا على واتساب', 'Chat on WhatsApp')),
    fields.text('whatsapp_message', 'WhatsApp message', tr('مرحباً، أرغب في استشارة بخصوص قطعة مجوهرات.', 'Hello, I would like some advice on a piece of jewellery.')),
    fields.text('appointment_label', 'Appointment button', tr('احجز موعداً خاصاً', 'Book a private viewing')),
    fields.url('appointment_url', 'Appointment link', '/contact'),
    fields.toggle('show_phone', 'Show phone number', true),
    fields.text('hours', 'Opening hours', tr('يومياً من ١١ صباحاً حتى ١١ مساءً', 'Daily, 11 am – 11 pm')),
  ],
});

export function KaratConcierge(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(karatConciergeSchema, props.settings);
  const phone = useConciergePhone();
  const image = str(s, 'image');
  const wa = whatsappHref(phone, str(s, 'whatsapp_message'));
  const waLabel = str(s, 'whatsapp_label');
  const apptLabel = str(s, 'appointment_label');
  const hours = str(s, 'hours');
  const eyebrow = str(s, 'eyebrow');
  const text = str(s, 'text');
  const showPhone = s['show_phone'] !== false && phone !== '';

  return (
    <section className="kr-concierge">
      <div className="lib-container kr-concierge__grid">
        <div className={cn('kr-arch kr-arch--small kr-concierge__arch', !image && 'kr-arch--empty')}>
          {image ? <LibImage src={image} alt="" sizes="(min-width: 900px) 30vw, 70vw" className="kr-arch__img" /> : <Motif kind={str(s, 'motif', 'ring') as MotifKind} className="kr-concierge__motif" />}
        </div>
        <div className="kr-concierge__copy">
          {eyebrow ? <p className="kr-eyebrow">{eyebrow}</p> : null}
          <h2 className="kr-concierge__title">{str(s, 'title')}</h2>
          {text ? <p className="kr-concierge__text">{text}</p> : null}
          <div className="kr-concierge__actions">
            {wa && waLabel ? (
              <a href={wa} className="kr-btn kr-btn--primary" target="_blank" rel="noopener noreferrer">
                <IconWhatsapp width={18} height={18} />
                <span>{waLabel}</span>
              </a>
            ) : null}
            {apptLabel ? <a href={str(s, 'appointment_url') || '/contact'} className={cn('kr-btn', wa && waLabel ? 'kr-btn--outline' : 'kr-btn--primary')}>{apptLabel}</a> : null}
          </div>
          {showPhone || hours ? (
            <p className="kr-concierge__meta">
              {showPhone ? (
                <a href={`tel:${phoneDigits(phone)}`} className="kr-concierge__phone"><IconPhone width={16} height={16} /><bdi dir="ltr">{phone}</bdi></a>
              ) : null}
              {hours ? <span className="kr-concierge__hours">{hours}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
