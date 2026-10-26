/**
 * stride-kit-builder — "build your kit": numbered slots (shoe + socks + bag…) joined by plus signs,
 * each showing the merchant's picked product (or the n-th product of a fallback collection) with
 * a link to choose size and colour on its page, and a running kit total. Purely navigational — no
 * bundle pricing or cart logic, so nothing is promised that checkout would not honour.
 */
import { Fragment, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { cn } from '../../../../../shared/utils/cn';
import {
  LibImage, LibPrice, defineBlock, defineSection, fields, spacingFields, spacingStyle, str, tr, useLibId, useLocaleCode,
  useSectionBlocks, useSectionData, useSectionSettings, type RawBlock,
} from '../../../sections-lib';
import { stText } from '../components/i18n';
import { SPORT_ICON_OPTIONS, SportIcon } from './sport-icons';

export const kitSlotBlock = defineBlock({
  type: 'slot',
  label: 'Kit item',
  icon: 'HiOutlineShoppingBag',
  limit: 4,
  settings: [
    fields.text('label', 'Label', tr('الحذاء', 'The shoe')),
    fields.product('product', 'Product', ''),
    fields.collection('collection', 'Fallback collection', 'newest', 'Used when no product is picked: the n-th product of this collection.'),
    fields.url('url', 'Link when empty', '/shop'),
    fields.select('icon', 'Icon', SPORT_ICON_OPTIONS, 'running'),
  ],
});

const slot = (id: string, ar: string, en: string, icon: string, collection: string, url: string): RawBlock => ({
  id, type: 'slot', settings: { label: tr(ar, en), icon, collection, url },
});

export const DEMO_KIT: ReadonlyArray<RawBlock> = [
  slot('demo-shoe', 'الحذاء', 'The shoe', 'running', 'newest', '/collections/running'),
  slot('demo-socks', 'الشراب', 'The socks', 'socks', 'bestsellers', '/collections/socks'),
  slot('demo-bag', 'الشنطة', 'The bag', 'bag', 'trending', '/collections/bags'),
];

export const strideKitSchema = defineSection({
  type: 'stride-kit-builder',
  label: 'Kit builder',
  description: 'Shoe + socks + bag style slots with a kit total; each links to its product.',
  category: 'products',
  icon: 'HiOutlineSquaresPlus',
  blocks: { types: [kitSlotBlock], max: 4 },
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('جهّز طقمك', 'Build your kit')),
    fields.text('title', 'Title', tr('حذاء + شراب + شنطة', 'Shoe + socks + bag')),
    fields.textarea('text', 'Text', tr('اختار كل قطعة من صفحتها بالمقاس واللون اللي يناسبك.', 'Pick each piece on its own page, in the size and colour that fits you.')),
    fields.text('cta_label', 'Button', tr('تسوق كل الإكسسوارات', 'Shop all accessories')),
    fields.url('cta_url', 'Button link', '/shop'),
    ...spacingFields(),
  ],
  presets: [{ label: 'Shoe + socks + bag', settings: { blocks: DEMO_KIT } }],
});

export function StrideKitBuilder(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(strideKitSchema, props.settings);
  const data = useSectionData(props.context);
  const locale = useLocaleCode();
  const headingId = useLibId('st-kit');
  const blocks = useSectionBlocks(strideKitSchema, s, undefined, DEMO_KIT);
  if (blocks.length === 0) return null;

  const used = new Set<string>();
  const picks: ReadonlyArray<ProductCardModel | undefined> = blocks.map((b, i) => {
    const chosen = data.product(str(b.settings, 'product'));
    if (chosen) {
      used.add(chosen.id);
      return chosen;
    }
    const pool = data.products(str(b.settings, 'collection', 'newest'), 24).filter((p) => !p.soldOut && !used.has(p.id));
    const fallback = pool[i] ?? pool[0];
    if (fallback) used.add(fallback.id);
    return fallback;
  });
  const priced = picks.filter((p): p is ProductCardModel => Boolean(p));
  const currency = priced[0]?.currency;
  const sameCurrency = priced.every((p) => p.currency === currency);
  const total = priced.reduce((sum, p) => sum + p.price, 0);
  const fmt = new Intl.NumberFormat(locale.startsWith('ar') ? 'ar-EG' : 'en', { minimumIntegerDigits: 2 });

  return (
    <section className="lib-section st-kit" aria-labelledby={headingId} style={spacingStyle(s)}>
      <div className="lib-container">
        <header className="st-kit__head">
          {str(s, 'eyebrow') ? <p className="st-eyebrow"><span className="st-eyebrow__mark" aria-hidden />{str(s, 'eyebrow')}</p> : null}
          <h2 id={headingId} className="st-display st-kit__title">{str(s, 'title')}</h2>
          {str(s, 'text') ? <p className="st-kit__text">{str(s, 'text')}</p> : null}
        </header>
        <ol className="st-kit__slots" style={{ '--st-slots': blocks.length } as CSSProperties}>
          {blocks.map((b, i) => {
            const p = picks[i];
            return (
              <Fragment key={b.id}>
                {i > 0 ? <li className="st-kit__join" aria-hidden>+</li> : null}
                <li className={cn('st-kit__slot', !p && 'is-empty')}>
                  <span className="st-kit__step"><span className="st-kit__step-num">{fmt.format(i + 1)}</span>{str(b.settings, 'label')}</span>
                  {p ? (
                    <a href={p.url} className="st-kit__card">
                      <span className="st-kit__media">
                        <LibImage src={p.image?.src} srcSet={p.image?.srcSet} alt="" sizes="(min-width: 1024px) 22vw, 80vw" className="st-kit__img" monogram={p.title.charAt(0)} />
                      </span>
                      <span className="st-kit__name">{p.title}</span>
                      <span className="st-kit__row">
                        <LibPrice amount={p.price} compareAt={p.compareAtPrice} currency={p.currency} />
                        <span className="st-kit__go">{stText(locale, 'view')} <span className="st-link__arrow" aria-hidden>→</span></span>
                      </span>
                    </a>
                  ) : (
                    <a href={str(b.settings, 'url', '/shop')} className="st-kit__card st-kit__card--empty">
                      <SportIcon name={str(b.settings, 'icon', 'running')} className="st-kit__icon" />
                      <span className="st-kit__go">{stText(locale, 'choose')} <span className="st-link__arrow" aria-hidden>→</span></span>
                    </a>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
        <div className="st-kit__summary">
          {priced.length > 0 && sameCurrency && currency ? (
            <p className="st-kit__total">
              <span className="st-kit__total-label">{stText(locale, 'kitTotal')}</span>
              <LibPrice amount={total} currency={currency} className="st-kit__total-price" />
            </p>
          ) : null}
          {str(s, 'cta_label') ? <a href={str(s, 'cta_url', '/shop')} className="st-btn st-btn--accent st-btn--lg">{str(s, 'cta_label')}<span className="st-btn__arrow" aria-hidden>→</span></a> : null}
        </div>
      </div>
    </section>
  );
}
