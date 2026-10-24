/**
 * glow-trust — the beauty trust strip. Each claim (authentic, cruelty-free, dermatologist-tested,
 * halal, cash on delivery) is a separate toggle so a merchant only shows what is true for their
 * range; extra custom badges can be added. Variants: `strip` (one quiet row) · `cards`.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { bool, defineSection, fields, list, spacingFields, spacingStyle, str, useLocaleCode, useSectionSettings, useVariant, variantSelect, variants } from '../../../sections-lib';
import { glText, type GlKey } from '../components/i18n';
import { CONCERN_ICON_OPTIONS, ConcernGlyph, IconCash, IconFlask, IconRabbit, IconSeal, IconCrescent } from '../chrome/icons';

const TRUST_LAYOUTS = variants('layout', [
  { value: 'strip', label: 'Strip', description: 'One quiet row of icons and short lines.', icon: 'HiOutlineBars2' },
  { value: 'cards', label: 'Cards', description: 'Soft cards, two per row on mobile.', icon: 'HiOutlineSquares2X2' },
]);

export const TRUST_CLAIMS = [
  { id: 'show_authentic', title: 'trustAuthentic', text: 'trustAuthenticText', Icon: IconSeal, def: true },
  { id: 'show_cruelty_free', title: 'trustCrueltyFree', text: 'trustCrueltyFreeText', Icon: IconRabbit, def: true },
  { id: 'show_derm_tested', title: 'trustDerm', text: 'trustDermText', Icon: IconFlask, def: true },
  { id: 'show_halal', title: 'trustHalal', text: 'trustHalalText', Icon: IconCrescent, def: false },
  { id: 'show_cod', title: 'trustCod', text: 'trustCodText', Icon: IconCash, def: false },
] as const satisfies ReadonlyArray<{ id: string; title: GlKey; text: GlKey; def: boolean; Icon: unknown }>;

export const glowTrustSchema = defineSection({
  type: 'glow-trust',
  label: 'Trust strip',
  description: 'Authentic, cruelty-free, dermatologist-tested… switch on only the claims that are true for you.',
  category: 'marketing',
  icon: 'HiOutlineShieldCheck',
  variants: TRUST_LAYOUTS,
  settings: [
    variantSelect(TRUST_LAYOUTS, 'strip'),
    fields.toggle('show_authentic', 'Authentic products', true),
    fields.toggle('show_cruelty_free', 'Cruelty-free', true, 'Only if no product or ingredient is tested on animals.'),
    fields.toggle('show_derm_tested', 'Dermatologist-tested', true, 'Only if your range has been assessed by dermatologists.'),
    fields.toggle('show_halal', 'Halal certified', false, 'Only with a valid certificate.'),
    fields.toggle('show_cod', 'Cash on delivery', false),
    fields.list('extra', 'Extra badges', [
      fields.select('icon', 'Icon', CONCERN_ICON_OPTIONS, 'leaf'),
      fields.text('title', 'Title', ''),
      fields.text('text', 'Line', ''),
    ], [], 4),
    ...spacingFields(28),
  ],
});

export function GlowTrust(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(glowTrustSchema, props.settings);
  const layout = useVariant(glowTrustSchema, props.settings);
  const locale = useLocaleCode();
  const items = [
    ...TRUST_CLAIMS.filter((c) => bool(s, c.id, c.def)).map((c) => ({ key: c.id, title: glText(locale, c.title), text: glText(locale, c.text), icon: <c.Icon width={24} height={24} /> })),
    ...list(s, 'extra').filter((e) => str(e, 'title')).map((e, i) => ({ key: `extra-${i}`, title: str(e, 'title'), text: str(e, 'text'), icon: <ConcernGlyph name={str(e, 'icon', 'leaf')} width={24} height={24} /> })),
  ];
  if (items.length === 0) return null;
  return (
    <section className={cn('lib-section', 'gl-trust', `gl-trust--${layout}`)} style={spacingStyle(s)} aria-label={glText(locale, 'trustLabel')}>
      <div className="lib-container">
        <ul className={cn('gl-trust__list', `gl-trust__list--${Math.min(items.length, 6)}`)}>
          {items.map((item) => (
            <li key={item.key} className="gl-trust__item">
              <span className="gl-trust__icon" aria-hidden>{item.icon}</span>
              <span className="gl-trust__copy">
                <span className="gl-trust__title">{item.title}</span>
                {item.text ? <span className="gl-trust__text">{item.text}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
