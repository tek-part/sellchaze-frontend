/**
 * text-with-buttons — a heading, a short paragraph and `button` blocks. The call-to-action band:
 * centred, start-aligned, or split (text on one side, buttons on the other).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { bandClass, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibButton, LibSection } from '../primitives';

const BUTTON_FIELDS = [
  fields.text('label', 'Label', ''),
  fields.url('url', 'Link', '/shop'),
  fields.select('style', 'Style', [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'ghost', label: 'Ghost' }], 'primary'),
] as const;

export const buttonBlock = defineBlock({ type: 'button', label: 'Button', icon: 'HiOutlineCursorArrowRays', settings: BUTTON_FIELDS, limit: 4 });

export const TEXT_BUTTONS_LAYOUTS = variants('layout', [
  { value: 'centered', label: 'Centered', description: 'Everything centred in a reading measure.', icon: 'HiOutlineBars3CenterLeft' },
  { value: 'left', label: 'Start aligned', description: 'Text and buttons aligned to the start.', icon: 'HiOutlineBars3BottomLeft' },
  { value: 'split', label: 'Split', description: 'Text on one side, buttons on the other.', icon: 'HiOutlineArrowsRightLeft' },
]);

const DEMO_BUTTONS: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'button', settings: { label: tr('تسوق الآن', 'Shop now'), url: '/shop', style: 'primary' } },
  { id: 'demo-2', type: 'button', settings: { label: tr('تعرّف علينا', 'About us'), url: '/about', style: 'secondary' } },
];

export const textWithButtonsSchema = defineSection({
  type: 'text-with-buttons',
  label: 'Text with buttons',
  description: 'A headline, a line of text and call-to-action buttons.',
  category: 'content',
  icon: 'HiOutlineCursorArrowRays',
  variants: TEXT_BUTTONS_LAYOUTS,
  blocks: { types: [buttonBlock], max: 4 },
  settings: [
    variantSelect(TEXT_BUTTONS_LAYOUTS, 'centered'),
    fields.text('eyebrow', 'Eyebrow', ''),
    fields.text('heading', 'Heading', tr('جاهز للبدء؟', 'Ready to start?')),
    fields.textarea('text', 'Text', tr('آلاف المنتجات، شحن سريع، وإرجاع بدون تعقيد.', 'Thousands of products, fast shipping and hassle-free returns.')),
    fields.select('background', 'Background', OPTIONS.background, 'surface'),
    ...spacingFields(),
  ],
  presets: [{ label: 'Call to action', settings: { blocks: DEMO_BUTTONS } }],
});

export function TextWithButtons(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(textWithButtonsSchema, props.settings);
  const layout = useVariant(textWithButtonsSchema, props.settings);
  const buttons = useSectionBlocks(textWithButtonsSchema, s, undefined, DEMO_BUTTONS).filter((b) => str(b.settings, 'label'));
  const heading = str(s, 'heading');
  if (!heading && !str(s, 'text') && buttons.length === 0) return null;
  const band = bandClass(str(s, 'background', 'surface'));
  const onColour = band.includes('primary') || band.includes('accent');
  const actions = buttons.length > 0 ? (
    <div className="lib-twb__actions">
      {buttons.map((b) => {
        const style = str(b.settings, 'style', 'primary');
        const variant = onColour ? (style === 'primary' ? 'inverse' : 'ghost') : style === 'secondary' ? 'secondary' : style === 'ghost' ? 'ghost' : 'primary';
        return <LibButton key={b.id} href={str(b.settings, 'url', '/shop')} variant={variant} size="lg">{str(b.settings, 'label')}</LibButton>;
      })}
    </div>
  ) : null;
  return (
    <LibSection className={cn('lib-twb', `lib-twb--${layout}`, band)} narrow={layout !== 'split'} style={spacingStyle(s)}>
      <div className="lib-twb__inner">
        <div className="lib-twb__copy">
          {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
          {heading ? <h2 className="lib-title">{heading}</h2> : null}
          {str(s, 'text') ? <p className="lib-subtitle">{str(s, 'text')}</p> : null}
        </div>
        {actions}
      </div>
    </LibSection>
  );
}
