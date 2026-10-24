/**
 * maison-gift-guide — gifts by price band. The merchant sets bands (min / max, optional label); the
 * section filters a collection into them and shows one band at a time behind an accessible tab
 * list (arrow keys follow reading direction, Home/End jump). Bands with nothing in them are hidden;
 * an empty label is written for the store's currency ("Under EGP 500", "EGP 500 – 1,500", "Over …").
 */
import { useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { useStore } from '../../../state/store-context';
import { cn } from '../../../../../shared/utils/cn';
import { defineSection, fields, tr, LibEmpty, LibSection, list, num, str, useLibId, useLocaleCode, useSectionData, useSectionSettings } from '../../../sections-lib';
import { MaisonCard } from '../components/ProductCard';
import { maiText } from '../components/i18n';
import { IconArrow } from '../chrome/icons';

const band = (min: number, max: number): Record<string, string | number> => ({ label: '', min, max });

export const maisonGiftGuideSchema = defineSection({
  type: 'maison-gift-guide',
  label: 'Maison · Gift guide by price',
  description: 'Tabs of price bands, each showing gifts in that range.',
  category: 'products',
  icon: 'HiOutlineGift',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('دليل الهدايا', 'The gift guide')),
    fields.text('title', 'Heading', tr('هدية لكل ميزانية', 'A gift for every budget')),
    fields.textarea('text', 'Text', tr('قطع مختارة للبيت تفرح بها من تحب — مرتبة حسب السعر لتختار بسهولة.', 'Thoughtful pieces for the home, sorted by price so choosing is easy.')),
    fields.collection('collection', 'Products', 'newest', 'The collection the bands are filled from.'),
    fields.range('limit', 'Products per band', 4, 2, 8),
    fields.text('cta_label', 'Button label', tr('شاهد كل الهدايا', 'See every gift')),
    fields.url('cta_url', 'Button link', '/shop'),
    fields.list('bands', 'Price bands', [
      fields.text('label', 'Label (leave empty to write it from the prices)', ''),
      fields.number('min', 'From price', 0, 0),
      fields.number('max', 'Up to price (0 = no limit)', 0, 0),
    ], [band(0, 200), band(200, 600), band(600, 1200), band(1200, 0)], 5),
  ],
});

interface Band {
  readonly key: string;
  readonly label: string;
  readonly products: ReadonlyArray<ProductCardModel>;
}

function money(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

export function bandLabel(min: number, max: number, currency: string, locale: string): string {
  const ar = locale.startsWith('ar');
  if (max > 0 && min <= 0) return ar ? `أقل من ${money(max, currency, locale)}` : `Under ${money(max, currency, locale)}`;
  if (max <= 0) return ar ? `${money(min, currency, locale)} فأكثر` : `${money(min, currency, locale)} & over`;
  return `${money(min, currency, locale)} – ${money(max, currency, locale)}`;
}

export function MaisonGiftGuide(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(maisonGiftGuideSchema, props.settings);
  const data = useSectionData(props.context);
  const code = useLocaleCode();
  const { store } = useStore();
  const baseId = useLibId('mai-gift');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const limit = num(s, 'limit', 4);
  const products = data.products(str(s, 'collection', 'newest'), 60);
  const rawBands = list(s, 'bands');

  const bands = useMemo<ReadonlyArray<Band>>(() => {
    const currency = products[0]?.currency ?? store.currency ?? 'USD';
    return rawBands
      .map((b, i) => {
        const min = Math.max(0, num(b, 'min', 0));
        const max = Math.max(0, num(b, 'max', 0));
        const inBand = products.filter((p) => !p.soldOut && p.price >= min && (max <= 0 || p.price < max));
        return { key: `band-${i}`, label: str(b, 'label').trim() || bandLabel(min, max, currency, code), products: inBand.slice(0, limit) };
      })
      .filter((b) => b.products.length > 0);
  }, [rawBands, products, limit, code, store.currency]);

  const [selected, setSelected] = useState(0);
  const current = Math.min(selected, Math.max(0, bands.length - 1));
  const rtl = code.startsWith('ar');

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const n = bands.length;
    if (n < 2) return;
    let next: number | null = null;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) next = (current + 1) % n;
    else if (e.key === back) next = (current - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  const active = bands[current];
  const loading = data.loading && products.length === 0;

  return (
    <LibSection className="mai-gift" eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'text')} align="center">
      {bands.length === 0 ? (
        loading ? null : <LibEmpty message={maiText(code, 'noGifts')} />
      ) : (
        <>
          <div className="mai-gift__tabs" role="tablist" aria-label={str(s, 'title') || maiText(code, 'seeAllGifts')} onKeyDown={onKey}>
            {bands.map((b, i) => (
              <button
                key={b.key}
                ref={(el) => { tabRefs.current[i] = el; }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={i === current}
                aria-controls={`${baseId}-panel`}
                tabIndex={i === current ? 0 : -1}
                className={cn('mai-gift__tab', i === current && 'is-active')}
                onClick={() => setSelected(i)}
              >
                {b.label}
              </button>
            ))}
          </div>
          {active ? (
            <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${current}`} className="mai-gift__panel" key={active.key}>
              <ul className="mai-gift__grid" data-count={active.products.length}>
                {active.products.map((p) => (
                  <li key={p.id}><MaisonCard product={p} sizes="(min-width: 1024px) 300px, 46vw" /></li>
                ))}
              </ul>
            </div>
          ) : null}
          {str(s, 'cta_label') ? (
            <div className="mai-gift__foot">
              <a href={str(s, 'cta_url', '/shop') || '/shop'} className="mai-textlink">
                <span>{str(s, 'cta_label')}</span>
                <IconArrow />
              </a>
            </div>
          ) : null}
        </>
      )}
    </LibSection>
  );
}
