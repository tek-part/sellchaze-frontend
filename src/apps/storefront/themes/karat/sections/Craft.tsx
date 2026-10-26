/**
 * karat-craft — craftsmanship & certification: the promises a fine-jewellery buyer looks for (karat
 * purity, certificate, warranty, engraving, trade-in…). Every promise is merchant-written and can be
 * switched off individually, so the store never claims a service it does not offer. `band` is the
 * home-page statement; `compact` is a quiet row for the product page.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { LibSection, bool, defineSection, fields, list, str, tr, useSectionSettings } from '../../../sections-lib';
import { cn } from '../../../../../shared/utils/cn';

const ICONS = [
  { value: 'purity', label: 'Gold bar (purity)' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'warranty', label: 'Shield (warranty)' },
  { value: 'engraving', label: 'Engraving' },
  { value: 'gift', label: 'Gift box' },
  { value: 'exchange', label: 'Trade-in / exchange' },
  { value: 'delivery', label: 'Insured delivery' },
] as const;

export const karatCraftSchema = defineSection({
  type: 'karat-craft',
  label: 'Karat — craftsmanship & certification',
  description: 'Purity, certificates, warranty, engraving and other promises — each editable and switchable.',
  category: 'content',
  icon: 'HiOutlineShieldCheck',
  settings: [
    fields.select('layout', 'Layout', [{ value: 'band', label: 'Statement band' }, { value: 'compact', label: 'Compact row (product page)' }], 'band'),
    fields.text('eyebrow', 'Eyebrow', tr('الحِرفة والضمان', 'Craft & assurance')),
    fields.text('title', 'Title', tr('ما نعد به مع كل قطعة', 'What comes with every piece')),
    fields.textarea('text', 'Introduction', tr('نختار الخامات بعناية، ونوثّق كل قطعة بما يثبت أصالتها.', 'We choose our materials carefully and document every piece so you know exactly what you own.')),
    fields.list(
      'items',
      'Promises',
      [
        fields.toggle('enabled', 'Show this promise', true),
        fields.select('icon', 'Icon', ICONS, 'purity'),
        fields.text('title', 'Title', ''),
        fields.textarea('text', 'Text', ''),
      ],
      [
        { enabled: true, icon: 'purity', title: tr('عيار مدموغ', 'Hallmarked purity'), text: tr('كل قطعة ذهب تحمل دمغة عيارها الرسمية — ١٨ أو ٢١ أو ٢٤.', 'Every gold piece carries its official karat hallmark — 18K, 21K or 24K.') },
        { enabled: true, icon: 'certificate', title: tr('شهادة أصالة', 'Certificate of authenticity'), text: tr('الألماس والأحجار الكريمة مرفقة بشهادة توضح المواصفات.', 'Diamonds and precious stones come with a certificate stating their grade.') },
        { enabled: true, icon: 'warranty', title: tr('ضمان على الصنعة', 'Craftsmanship warranty'), text: tr('نتكفّل بأي عيب في التصنيع — اسألنا عن شروط الضمان.', 'We stand behind our workmanship — ask us for the warranty terms.') },
        { enabled: true, icon: 'engraving', title: tr('نقش مجاني', 'Complimentary engraving'), text: tr('اسم أو تاريخ أو حرف على الخواتم والأساور، بلا تكلفة إضافية.', 'A name, date or initial on rings and bracelets, at no extra cost.') },
      ],
      6,
    ),
    fields.text('cta_label', 'Link label', ''),
    fields.url('cta_url', 'Link', '/pages/warranty'),
  ],
});

export function CraftIcon(props: { name: string }): ReactElement {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden focusable="false">
      {props.name === 'certificate' ? <g {...p}><path d="M9 7h18l4 4v15" /><path d="M9 7v24h12" /><path d="M13 14h12M13 18h12M13 22h6" /><circle cx="28" cy="29" r="4.5" /><path d="M25.5 33l-1 5 3.5-2 3.5 2-1-5" /></g> : null}
      {props.name === 'warranty' ? <g {...p}><path d="M20 5l12 4.5v9c0 8-5.4 13.4-12 16.5C13.4 31.9 8 26.5 8 18.5v-9z" /><path d="M14.5 20l4 4 7-8" /></g> : null}
      {props.name === 'engraving' ? <g {...p}><path d="M27 6l7 7-15 15-8 1 1-8z" /><path d="M24 9l7 7" /><path d="M6 34c4-2 8 2 12 0s8 2 12 0" /></g> : null}
      {props.name === 'gift' ? <g {...p}><rect x="7" y="16" width="26" height="18" /><path d="M5 11h30v5H5zM20 11v23" /><path d="M20 11c-2-5-9-6-9-2s7 2 9 2c2 0 9 2 9-2s-7-3-9 2z" /></g> : null}
      {props.name === 'exchange' ? <g {...p}><path d="M30 15a11 11 0 0 0-19.5-4L8 14" /><path d="M8 7v7h7" /><path d="M10 25a11 11 0 0 0 19.5 4L32 26" /><path d="M32 33v-7h-7" /></g> : null}
      {props.name === 'delivery' ? <g {...p}><path d="M6 13l14-7 14 7v14l-14 7-14-7z" /><path d="M6 13l14 7 14-7M20 20v14" /><rect x="23" y="23" width="7" height="6" rx="1" /><path d="M24.5 23v-2a2 2 0 0 1 4 0v2" /></g> : null}
      {props.name !== 'certificate' && props.name !== 'warranty' && props.name !== 'engraving' && props.name !== 'gift' && props.name !== 'exchange' && props.name !== 'delivery' ? (
        <g {...p}><path d="M6 32l3-9h10l3 9z" /><path d="M18 32l3-9h10l3 9z" /><path d="M12 23l3-9h10l3 9" /><path d="M17.5 18h5" /></g>
      ) : null}
    </svg>
  );
}

export function KaratCraft(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(karatCraftSchema, props.settings);
  const items = list(s, 'items').filter((item) => bool(item, 'enabled', true) && str(item, 'title').trim() !== '');
  if (items.length === 0) return null;
  const compact = str(s, 'layout') === 'compact';
  const cta = str(s, 'cta_label');

  if (compact) {
    return (
      <section className="kr-craft kr-craft--compact" aria-label={str(s, 'title') || str(s, 'eyebrow') || undefined}>
        <div className="lib-container">
          <ul className="kr-craft__row">
            {items.map((item, i) => (
              <li key={`${str(item, 'title')}-${i}`} className="kr-craft__chip">
                <span className="kr-craft__icon"><CraftIcon name={str(item, 'icon', 'purity')} /></span>
                <span className="kr-craft__chip-text">
                  <strong>{str(item, 'title')}</strong>
                  {str(item, 'text') ? <span>{str(item, 'text')}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'text')} align="center" className="kr-craft kr-craft--band">
      <ol className={cn('kr-craft__grid', items.length < 4 && 'kr-craft__grid--few')}>
        {items.map((item, i) => (
          <li key={`${str(item, 'title')}-${i}`} className="kr-craft__item">
            <span className="kr-craft__seal"><CraftIcon name={str(item, 'icon', 'purity')} /></span>
            <span className="kr-craft__num" aria-hidden>{['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span>
            <h3 className="kr-craft__title">{str(item, 'title')}</h3>
            {str(item, 'text') ? <p className="kr-craft__text">{str(item, 'text')}</p> : null}
          </li>
        ))}
      </ol>
      {cta ? (
        <p className="kr-craft__more">
          <a href={str(s, 'cta_url') || '/pages/warranty'} className="kr-textlink">{cta}<span aria-hidden className="kr-textlink__arrow">→</span></a>
        </p>
      ) : null}
    </LibSection>
  );
}
