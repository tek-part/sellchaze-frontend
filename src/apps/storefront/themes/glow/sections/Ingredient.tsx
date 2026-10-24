/**
 * glow-ingredient — one key ingredient under the spotlight: name + plain-language description, a
 * numbered benefits list, and (optionally) the product it lives in as a compact "find it in" card.
 * Without an image the visual is a drawn molecule on a soft gradient, so it is complete from day one.
 * Variants: `visual-start` · `visual-end`.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import {
  LibImage, LibPrice, defineSection, useLibId, fields, list, spacingFields, spacingStyle, str, tr, useLocaleCode, useSectionData, useSectionSettings, useVariant,
  variantSelect, variants,
} from '../../../sections-lib';
import { glText } from '../components/i18n';
import { sizeLabel } from '../components/size';
import { IconArrow, IconCheck } from '../chrome/icons';

const INGREDIENT_LAYOUTS = variants('layout', [
  { value: 'visual-start', label: 'Visual first', description: 'Image or molecule before the copy.', icon: 'HiOutlinePhoto' },
  { value: 'visual-end', label: 'Copy first', description: 'Copy before the image or molecule.', icon: 'HiOutlineDocumentText' },
]);

export const glowIngredientSchema = defineSection({
  type: 'glow-ingredient',
  label: 'Ingredient spotlight',
  description: 'A key ingredient with its benefits and the product it is in.',
  category: 'content',
  icon: 'HiOutlineBeaker',
  variants: INGREDIENT_LAYOUTS,
  settings: [
    variantSelect(INGREDIENT_LAYOUTS, 'visual-start'),
    fields.text('eyebrow', 'Eyebrow', tr('مكوّن تحت الضوء', 'Ingredient spotlight')),
    fields.text('name', 'Ingredient', tr('النياسيناميد', 'Niacinamide')),
    fields.text('tagline', 'Also known as', tr('فيتامين B3', 'Vitamin B3')),
    fields.textarea('text', 'Description', tr('مكوّن متعدد المهام يساعد على توحيد مظهر لون البشرة وتنعيم ملمسها ودعم حاجزها الطبيعي — ويتناسب مع معظم أنواع البشرة.', 'A multitasking active that helps even the look of skin tone, refine texture and support the skin’s natural barrier — and it plays well with most skin types.')),
    fields.list('benefits', 'Benefits', [fields.text('text', 'Benefit', '')], [
      { text: tr('يوحّد مظهر لون البشرة', 'Evens the look of skin tone') },
      { text: tr('ينعّم الملمس ويقلّل مظهر المسام', 'Refines texture and the look of pores') },
      { text: tr('يدعم حاجز الترطيب الطبيعي', 'Supports the natural moisture barrier') },
    ], 6),
    fields.image('image', 'Image', '', 'Leave empty for the drawn molecule.'),
    fields.product('product', 'Featured product', ''),
    fields.text('cta_label', 'Link label', tr('تسوّقي العناية بالبشرة', 'Shop skincare')),
    fields.url('cta_url', 'Link', '/collections/skincare'),
    fields.text('note', 'Small print', ''),
    ...spacingFields(),
  ],
});

/** Decorative molecule — hexagonal rings and nodes over a radial glow. */
export function GlowMolecule(): ReactElement {
  const id = useLibId('gl-mol');
  const hex = (cx: number, cy: number, r: number): string =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  return (
    <svg className="gl-art gl-art--molecule" viewBox="0 0 240 240" aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={id} cx="50%" cy="45%" r="65%">
          <stop offset="0" stopColor="var(--surface)" />
          <stop offset=".6" stopColor="var(--surface-2)" />
          <stop offset="1" stopColor="var(--accent)" />
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill={`url(#${id})`} />
      <g fill="none" stroke="var(--primary)" strokeWidth="1.4" strokeOpacity=".7" strokeLinejoin="round">
        <polygon points={hex(104, 118, 30)} />
        <polygon points={hex(156, 88, 22)} strokeOpacity=".45" />
        <path d="M130 103l11-7M78 133l-22 12M104 88V64M156 66V48" />
        <path d="M110 150l8 22" strokeOpacity=".5" />
      </g>
      <g fill="var(--primary)" fillOpacity=".8">
        <circle cx="104" cy="64" r="4" />
        <circle cx="56" cy="145" r="5" />
        <circle cx="156" cy="48" r="3.5" />
        <circle cx="118" cy="172" r="4.5" />
      </g>
      <g fill="var(--accent)">
        <circle cx="178" cy="160" r="9" fillOpacity=".7" />
        <circle cx="62" cy="70" r="6" fillOpacity=".55" />
      </g>
    </svg>
  );
}

export function GlowIngredient(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(glowIngredientSchema, props.settings);
  const layout = useVariant(glowIngredientSchema, props.settings);
  const data = useSectionData(props.context);
  const locale = useLocaleCode();
  const name = str(s, 'name');
  if (!name) return null;
  const image = str(s, 'image');
  const product = data.product(str(s, 'product'));
  const benefits = list(s, 'benefits').map((b) => str(b, 'text')).filter(Boolean);
  const size = product ? sizeLabel(product, locale) : '';

  return (
    <section className={cn('lib-section', 'gl-ingredient', `gl-ingredient--${layout}`)} style={spacingStyle(s)}>
      <div className="lib-container gl-ingredient__grid">
        <div className="gl-ingredient__visual">
          {image ? <LibImage src={image} alt="" sizes="(min-width: 1024px) 45vw, 92vw" className="gl-ingredient__img" /> : <GlowMolecule />}
          <span className="gl-ingredient__badge" aria-hidden>{name}</span>
        </div>
        <div className="gl-ingredient__copy">
          {str(s, 'eyebrow') ? <p className="gl-eyebrow">{str(s, 'eyebrow')}</p> : null}
          <h2 className="gl-ingredient__name">
            {name}
            {str(s, 'tagline') ? <span className="gl-ingredient__tagline">{str(s, 'tagline')}</span> : null}
          </h2>
          {str(s, 'text') ? <p className="gl-ingredient__text">{str(s, 'text')}</p> : null}
          {benefits.length > 0 ? (
            <>
              <h3 className="gl-ingredient__label">{glText(locale, 'keyBenefits')}</h3>
              <ul className="gl-benefits">
                {benefits.map((b, i) => (
                  <li key={`${b}-${i}`} className="gl-benefit"><span className="gl-benefit__mark" aria-hidden><IconCheck width={14} height={14} /></span>{b}</li>
                ))}
              </ul>
            </>
          ) : null}
          {product ? (
            <a href={product.url} className="gl-mini">
              <span className="gl-mini__media"><LibImage src={product.image?.src} alt="" sizes="88px" className="gl-mini__img" monogram={product.title.charAt(0)} /></span>
              <span className="gl-mini__text">
                <span className="gl-mini__label">{glText(locale, 'foundIn')}</span>
                <span className="gl-mini__name">{product.title}</span>
                <span className="gl-mini__meta">
                  {size ? <span>{size}</span> : null}
                  <LibPrice amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} />
                </span>
              </span>
              <IconArrow className="gl-mini__arrow" />
            </a>
          ) : str(s, 'cta_label') ? (
            <a href={str(s, 'cta_url') || '/shop'} className="gl-textlink">{str(s, 'cta_label')}</a>
          ) : null}
          {str(s, 'note') ? <p className="gl-smallprint">{str(s, 'note')}</p> : null}
        </div>
      </div>
    </section>
  );
}
