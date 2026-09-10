/**
 * multicolumn — `column` blocks (icon or image, heading, text, button) in 2–4 columns, as cards or
 * plain columns. The general-purpose "three reasons / our services / how it works" section.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect, type RawBlock } from '../schema';
import { bandClass, gridStyle, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { LibButton, LibGrid, LibImage, LibSection } from '../primitives';
import { ICON_OPTIONS, LibIcon } from './Features';

const COLUMN_FIELDS = [
  fields.select('icon', 'Icon', ICON_OPTIONS, 'none'),
  fields.image('image', 'Image', ''),
  fields.text('heading', 'Heading', ''),
  fields.textarea('text', 'Text', ''),
  fields.text('button_label', 'Button label', ''),
  fields.url('button_url', 'Button link', ''),
] as const;

export const columnBlock = defineBlock({ type: 'column', label: 'Column', icon: 'HiOutlineViewColumns', settings: COLUMN_FIELDS, limit: 8 });

export const MULTICOLUMN_LAYOUTS = variants('layout', [
  { value: 'cards', label: 'Cards', description: 'Each column on its own card.', icon: 'HiOutlineSquares2X2' },
  { value: 'plain', label: 'Plain', description: 'Open columns without borders.', icon: 'HiOutlineViewColumns' },
]);

const DEMO_COLUMNS: ReadonlyArray<RawBlock> = [
  { id: 'demo-1', type: 'column', settings: { icon: 'box', image: '', heading: tr('منتجات أصلية', 'Genuine products'), text: tr('نتعامل مباشرة مع العلامات التجارية والموزعين المعتمدين.', 'We work directly with brands and authorised distributors.'), button_label: '', button_url: '' } },
  { id: 'demo-2', type: 'column', settings: { icon: 'truck', image: '', heading: tr('توصيل سريع', 'Fast delivery'), text: tr('نشحن خلال ٢٤ ساعة ونوصّل لجميع مدن المملكة.', 'Dispatched within 24 hours to every city.'), button_label: '', button_url: '' } },
  { id: 'demo-3', type: 'column', settings: { icon: 'heart', image: '', heading: tr('خدمة تهتم بك', 'Care that shows'), text: tr('فريق دعم حقيقي يرد خلال دقائق على واتساب والبريد.', 'A real support team that replies within minutes.'), button_label: tr('تواصل معنا', 'Contact us'), button_url: '/contact' } },
];

export const multicolumnSchema = defineSection({
  type: 'multicolumn',
  label: 'Multicolumn',
  description: 'Columns of icon or image, heading, text and button.',
  category: 'content',
  icon: 'HiOutlineViewColumns',
  variants: MULTICOLUMN_LAYOUTS,
  blocks: { types: [columnBlock], max: 8 },
  settings: [
    fields.text('title', 'Title', tr('لماذا تتسوق معنا', 'Why shop with us')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(MULTICOLUMN_LAYOUTS, 'cards'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 4), '3'),
    fields.select('align', 'Alignment', OPTIONS.align, 'start'),
    fields.select('image_shape', 'Image shape', [{ value: 'landscape', label: 'Landscape' }, { value: 'square', label: 'Square' }, { value: 'circle', label: 'Circle' }], 'landscape'),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(),
  ],
  presets: [{ label: 'Three reasons', settings: { blocks: DEMO_COLUMNS } }],
});

export function Multicolumn(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(multicolumnSchema, props.settings);
  const layout = useVariant(multicolumnSchema, props.settings);
  const columns = useSectionBlocks(multicolumnSchema, s, undefined, DEMO_COLUMNS).filter((b) => str(b.settings, 'heading') || str(b.settings, 'text') || str(b.settings, 'image'));
  if (columns.length === 0) return null;
  const align = str(s, 'align', 'start');
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} align={align === 'center' ? 'center' : 'start'} className={bandClass(str(s, 'background', 'none'))} style={spacingStyle(s)}>
      <LibGrid style={gridStyle(num(s, 'columns', 3), 1)} className={cn('lib-columns', `lib-columns--${layout}`, `lib-columns--${align}`, `lib-columns--img-${str(s, 'image_shape', 'landscape')}`)}>
        {columns.map((block) => {
          const b = block.settings;
          const image = str(b, 'image');
          const icon = str(b, 'icon', 'none');
          return (
            <div key={block.id} className="lib-column">
              {image ? (
                <span className="lib-column__media"><LibImage src={image} alt="" className="lib-column__img" /></span>
              ) : icon !== 'none' ? (
                <span className="lib-column__icon"><LibIcon name={icon} /></span>
              ) : null}
              {str(b, 'heading') ? <h3 className="lib-column__title">{str(b, 'heading')}</h3> : null}
              {str(b, 'text') ? <p className="lib-column__text">{str(b, 'text')}</p> : null}
              {str(b, 'button_label') ? (
                <div className="lib-column__actions">
                  <LibButton href={str(b, 'button_url', '/')} variant="secondary" size="sm">{str(b, 'button_label')}</LibButton>
                </div>
              ) : null}
            </div>
          );
        })}
      </LibGrid>
    </LibSection>
  );
}
