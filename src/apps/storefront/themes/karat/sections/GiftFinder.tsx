/**
 * karat-gift-finder — four ways into a gift (for her · for him · by occasion · by budget), each a tab
 * of editable links to the merchant's filtered collections. Proper ARIA tabs with roving focus; the
 * arrow keys follow the reading direction. A tab with no links is hidden, and the section disappears
 * when every tab is empty.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ThemeSettingListItem } from '../../../theme-engine/types';
import { LibSection, defineSection, fields, list, str, tr, useLocaleCode, useSectionSettings } from '../../../sections-lib';
import { cn } from '../../../../../shared/utils/cn';

const linkItem = [fields.text('label', 'Label', ''), fields.text('note', 'Short note', ''), fields.url('url', 'Link', '/shop')];
type Raw = { label: ReturnType<typeof tr>; note: ReturnType<typeof tr>; url: string };
const l = (arLabel: string, enLabel: string, arNote: string, enNote: string, url: string): Raw => ({ label: tr(arLabel, enLabel), note: tr(arNote, enNote), url });

const TABS = ['her', 'him', 'occasion', 'budget'] as const;

export const karatGiftFinderSchema = defineSection({
  type: 'karat-gift-finder',
  label: 'Karat — gift finder',
  description: 'Gift ideas by recipient, occasion and budget, each linking to a collection.',
  category: 'content',
  icon: 'HiOutlineGift',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('دليل الهدايا', 'The gift guide')),
    fields.text('title', 'Title', tr('هدية تليق بمن تحب', 'A gift worthy of them')),
    fields.text('subtitle', 'Subtitle', tr('اختر لمن الهدية أو المناسبة، وسنقترح لك ما يناسبها.', 'Start with who it is for, or the moment you are marking.')),
    fields.text('her_label', 'Tab 1 label', tr('لها', 'For her')),
    fields.list('her_links', 'Tab 1 links', linkItem, [
      l('خواتم', 'Rings', 'سوليتير، دبل وخواتم يومية', 'Solitaires, bands and everyday rings', '/collections/rings'),
      l('عقود وسلاسل', 'Necklaces', 'من السلسلة الرقيقة إلى الطقم الكامل', 'From a fine chain to a full set', '/collections/necklaces'),
      l('أقراط', 'Earrings', 'حلقات، دلايات ونقاط ضوء', 'Hoops, drops and studs', '/collections/earrings'),
      l('أساور', 'Bracelets', 'غوايش ذهب وأساور بنقش', 'Gold bangles and engraved cuffs', '/collections/bracelets'),
    ], 8),
    fields.text('him_label', 'Tab 2 label', tr('له', 'For him')),
    fields.list('him_links', 'Tab 2 links', linkItem, [
      l('ساعات', 'Watches', 'كلاسيكية ورياضية', 'Dress and sport', '/collections/watches'),
      l('خواتم فضة', 'Silver rings', 'فضة ٩٢٥ بأحجار طبيعية', 'Sterling silver with natural stones', '/collections/mens-rings'),
      l('أزرار أكمام', 'Cufflinks', 'لمسة أخيرة للمناسبات', 'The finishing touch', '/collections/cufflinks'),
      l('مسابح', 'Prayer beads', 'كهرمان، يسر وفضة', 'Amber, yusr and silver', '/collections/prayer-beads'),
    ], 8),
    fields.text('occasion_label', 'Tab 3 label', tr('المناسبة', 'By occasion')),
    fields.list('occasion_links', 'Tab 3 links', linkItem, [
      l('الخطوبة والزواج', 'Engagement & wedding', 'الشبكة، الدبل وطقم العروس', 'Rings, bands and bridal sets', '/collections/bridal'),
      l('العيد', 'Eid', 'هدايا تُفرح العائلة', 'Gifts the whole family will love', '/collections/eid'),
      l('هدايا المواليد', 'New baby', 'أساور وتعاليق ذهب صغيرة', 'Little gold bracelets and charms', '/collections/new-baby'),
      l('النجاح والتخرج', 'Graduation', 'هدية تبقى ذكرى', 'A keepsake for the milestone', '/collections/graduation'),
    ], 8),
    fields.text('budget_label', 'Tab 4 label', tr('الميزانية', 'By budget')),
    fields.list('budget_links', 'Tab 4 links', linkItem, [
      l('لمسات رقيقة', 'Little luxuries', 'قطع ناعمة بسعر لطيف', 'Delicate pieces, gently priced', '/collections/little-luxuries'),
      l('هدايا مميزة', 'Signature gifts', 'القطع الأكثر إهداءً', 'Our most-gifted pieces', '/collections/signature-gifts'),
      l('قطع للعمر', 'Heirloom pieces', 'استثمار يُورَّث', 'An investment to pass down', '/collections/heirloom'),
    ], 8),
    fields.text('help_label', 'Help link label', tr('محتار؟ تحدّث مع مستشارنا', 'Not sure? Ask our concierge')),
    fields.url('help_url', 'Help link', '/contact'),
  ],
});

interface Tab {
  readonly key: string;
  readonly label: string;
  readonly links: ReadonlyArray<ThemeSettingListItem>;
}

export function KaratGiftFinder(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(karatGiftFinderSchema, props.settings);
  const rtl = useLocaleCode().startsWith('ar');
  const base = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs: Tab[] = TABS.map((key) => ({
    key,
    label: str(s, `${key}_label`),
    links: list(s, `${key}_links`).filter((item) => str(item, 'label').trim() !== ''),
  })).filter((tab) => tab.label.trim() !== '' && tab.links.length > 0);
  if (tabs.length === 0) return null;
  const current = Math.min(active, tabs.length - 1);
  const tab = tabs[current]!;

  const focusTab = (index: number): void => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>): void => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) { e.preventDefault(); focusTab(current + 1); }
    else if (e.key === back) { e.preventDefault(); focusTab(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusTab(0); }
    else if (e.key === 'End') { e.preventDefault(); focusTab(tabs.length - 1); }
  };
  const help = str(s, 'help_label');

  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" className="kr-gifts">
      <div className="kr-gifts__tabs" role="tablist" aria-label={str(s, 'title') || tab.label}>
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.key}`}
            aria-selected={i === current}
            aria-controls={`${base}-panel`}
            tabIndex={i === current ? 0 : -1}
            className={cn('kr-gifts__tab', i === current && 'is-active')}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${tab.key}`} className="kr-gifts__panel" key={tab.key}>
        <ul className="kr-gifts__grid">
          {tab.links.map((item, i) => (
            <li key={`${str(item, 'label')}-${i}`} className="kr-gifts__cell" style={{ animationDelay: `${i * 70}ms` }}>
              <a href={str(item, 'url') || '/shop'} className="kr-gift">
                <span className="kr-gift__index" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                <span className="kr-gift__label">{str(item, 'label')}</span>
                {str(item, 'note') ? <span className="kr-gift__note">{str(item, 'note')}</span> : null}
                <span className="kr-gift__arrow" aria-hidden>→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {help ? (
        <p className="kr-gifts__help">
          <a href={str(s, 'help_url') || '/contact'} className="kr-textlink">{help}<span aria-hidden className="kr-textlink__arrow">→</span></a>
        </p>
      ) : null}
    </LibSection>
  );
}
