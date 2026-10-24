/**
 * glow-routine — a numbered "step 1 · 2 · 3" regimen strip. Each step names what it does and links
 * to the product that does it (picked by the merchant); steps without a product still read as a
 * routine and link to a collection. When two or more steps have a purchasable product the strip
 * ends with the routine total and one button that adds every step to the bag.
 */
import { useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { cn } from '../../../../../shared/utils/cn';
import { useCart } from '../../../state/cart';
import { cartAdditionLimit } from '../../../state/cart-quantity';
import { cardCartInput } from '../../../utils/card-purchase';
import {
  LibImage, LibPrice, LibSection, bool, defineSection, fields, list, spacingFields, spacingStyle, str, tr, useLocaleCode, useSectionData, useSectionSettings,
} from '../../../sections-lib';
import { glText } from '../components/i18n';
import { sizeLabel } from '../components/size';
import { IconArrow, IconBag, IconCheck } from '../chrome/icons';

export const ROUTINE_STEP_FIELDS = [
  fields.text('label', 'Step name', ''),
  fields.text('title', 'Title', ''),
  fields.textarea('text', 'What it does', ''),
  fields.product('product', 'Product', ''),
  fields.url('url', 'Link when no product', '/shop'),
] as const;

export const glowRoutineSchema = defineSection({
  type: 'glow-routine',
  label: 'Routine builder',
  description: 'A numbered skincare routine; each step links to its product, with “add the full routine”.',
  category: 'products',
  icon: 'HiOutlineListBullet',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('روتين من ثلاث خطوات', 'A three-step ritual')),
    fields.text('title', 'Title', tr('روتين بسيط تلتزمين به', 'A routine you’ll actually keep')),
    fields.text('subtitle', 'Subtitle', tr('صباحاً ومساءً: نظّفي، عالجي، ثم رطّبي.', 'Morning and night: cleanse, treat, then moisturise.')),
    fields.list('steps', 'Steps', ROUTINE_STEP_FIELDS, [
      { label: tr('تنظيف', 'Cleanse'), title: tr('ابدئي ببشرة نظيفة', 'Start with a clean canvas'), text: tr('يزيل المكياج والشوائب دون أن يجرّد البشرة من زيوتها.', 'Lifts make-up and the day without stripping skin.'), product: '', url: '/collections/cleansers' },
      { label: tr('علاج', 'Treat'), title: tr('سيروم بمكوّن فعّال', 'Target with a serum'), text: tr('طبقة خفيفة من مكوّن فعّال يستهدف احتياج بشرتك.', 'A light layer of the active your skin needs most.'), product: '', url: '/collections/skincare' },
      { label: tr('ترطيب', 'Moisturise'), title: tr('احبسي الترطيب', 'Seal it in'), text: tr('مرطّب يدعم حاجز البشرة ويحافظ على نعومتها.', 'A moisturiser that supports the barrier and keeps skin soft.'), product: '', url: '/collections/skincare' },
    ], 5),
    fields.toggle('show_bundle', 'Show routine total + “add the full routine”', true),
    ...spacingFields(),
  ],
});

interface Step {
  label: string;
  title: string;
  text: string;
  url: string;
  product?: ProductCardModel;
}

export function GlowRoutine(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(glowRoutineSchema, props.settings);
  const data = useSectionData(props.context);
  const locale = useLocaleCode();
  const cart = useCart();
  const [added, setAdded] = useState(false);

  const steps: Step[] = list(s, 'steps')
    .map((raw) => {
      const product = data.product(str(raw, 'product'));
      return { label: str(raw, 'label'), title: str(raw, 'title'), text: str(raw, 'text'), url: str(raw, 'url') || '/shop', ...(product ? { product } : {}) };
    })
    .filter((step) => step.title || step.label || step.product);
  if (steps.length === 0) return null;

  const buyable = steps.flatMap((step) => {
    const input = step.product ? cardCartInput(step.product) : null;
    return input && cartAdditionLimit(cart.lines, input) > 0 ? [{ input, product: step.product! }] : [];
  });
  const showBundle = bool(s, 'show_bundle', true) && buyable.length >= 2;
  const currency = buyable[0]?.product.currency ?? 'USD';
  const total = buyable.reduce((sum, b) => sum + b.input.price, 0);

  const addAll = (): void => {
    for (const b of buyable) cart.add(b.input);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  };

  return (
    <LibSection eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'subtitle')} align="center" style={spacingStyle(s)} className="gl-routine">
      <ol className={cn('gl-steps', `gl-steps--${Math.min(steps.length, 5)}`)}>
        {steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className={cn('gl-step', step.product && 'has-product')}>
            <div className="gl-step__head">
              <span className="gl-step__num" aria-hidden>{new Intl.NumberFormat(locale).format(i + 1)}</span>
              <span className="gl-step__label">
                <span className="lib-sr-only">{glText(locale, 'step', { n: i + 1 })}: </span>
                {step.label}
              </span>
            </div>
            {step.product ? (
              <a href={step.product.url} className="gl-step__media" tabIndex={-1} aria-hidden>
                <LibImage src={step.product.image?.src} srcSet={step.product.image?.srcSet} alt="" sizes="(min-width: 1024px) 24vw, 80vw" className="gl-step__img" monogram={step.product.title.charAt(0)} />
              </a>
            ) : null}
            <div className="gl-step__body">
              {step.title ? <h3 className="gl-step__title">{step.title}</h3> : null}
              {step.text ? <p className="gl-step__text">{step.text}</p> : null}
              {step.product ? (
                <a href={step.product.url} className="gl-step__product">
                  <span className="gl-step__pname">{step.product.title}</span>
                  <span className="gl-step__pmeta">
                    {sizeLabel(step.product, locale) ? <span>{sizeLabel(step.product, locale)}</span> : null}
                    <LibPrice amount={step.product.price} compareAt={step.product.compareAtPrice} currency={step.product.currency} />
                  </span>
                </a>
              ) : (
                <a href={step.url} className="gl-textlink">{glText(locale, 'shopStep')}</a>
              )}
            </div>
          </li>
        ))}
      </ol>
      {showBundle ? (
        <div className="gl-routine__bundle">
          <p className="gl-routine__total">
            <span>{glText(locale, 'routineTotal')}</span>
            <LibPrice amount={total} currency={currency} />
          </p>
          <button type="button" className={cn('lib-btn lib-btn--primary lib-btn--lg gl-btn', added && 'is-added')} onClick={addAll}>
            {added ? <IconCheck width={18} height={18} /> : <IconBag width={18} height={18} />}
            {added ? glText(locale, 'routineAdded') : glText(locale, 'addRoutine')}
            {!added ? <IconArrow /> : null}
          </button>
          <span className="lib-sr-only" role="status">{added ? glText(locale, 'routineAdded') : ''}</span>
        </div>
      ) : null}
    </LibSection>
  );
}
