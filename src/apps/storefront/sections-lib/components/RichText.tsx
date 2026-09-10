/**
 * rich-text — a headline + merchant-authored HTML paragraph block, centred, left-aligned or flowing
 * in two columns. `RichHtml` sanitises the merchant HTML (allow-list of inline/block tags, no
 * scripts/handlers) and is shared with other sections that render richtext fields.
 */
import { useMemo, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { bandClass, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { LibButton, LibSection } from '../primitives';

const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'A', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'SPAN', 'DIV', 'HR', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SMALL', 'SUB', 'SUP', 'CODE', 'PRE']);
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'dir', 'width', 'height', 'loading', 'colspan', 'rowspan']);

/** Strip anything but a safe subset of HTML. Server-side (no DOM) returns the text escaped. */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node: Element): void => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (!ALLOWED_ATTRS.has(name) || name.startsWith('on') || ((name === 'href' || name === 'src') && (value.startsWith('javascript:') || value.startsWith('data:text')))) {
          child.removeAttribute(attr.name);
        }
      }
      if (child.tagName === 'A' && child.getAttribute('target') === '_blank') child.setAttribute('rel', 'noopener noreferrer');
      walk(child);
    }
  };
  walk(tpl.content as unknown as Element);
  return tpl.innerHTML;
}

export function RichHtml(props: { html: string; className?: string }): ReactElement {
  const safe = useMemo(() => sanitizeHtml(props.html), [props.html]);
  // The markup is merchant-authored and sanitised above; this is the one deliberate raw-HTML sink.
  return <div className={cn('lib-rich', props.className)} dangerouslySetInnerHTML={{ __html: safe }} />;
}

export const RICH_TEXT_LAYOUTS = variants('layout', [
  { value: 'centered', label: 'Centered', description: 'Centred heading and text in a reading measure.', icon: 'HiOutlineBars3CenterLeft' },
  { value: 'left', label: 'Start aligned', description: 'Heading and text aligned to the start edge.', icon: 'HiOutlineBars3BottomLeft' },
  { value: 'two-columns', label: 'Two columns', description: 'Heading on one side, text flowing in two columns.', icon: 'HiOutlineViewColumns' },
], { align: { center: 'centered', start: 'left', end: 'left' } });

export const richTextSchema = defineSection({
  type: 'rich-text',
  label: 'Rich text',
  description: 'A headline and formatted paragraph text.',
  category: 'content',
  icon: 'HiOutlineBars3BottomLeft',
  variants: RICH_TEXT_LAYOUTS,
  settings: [
    variantSelect(RICH_TEXT_LAYOUTS, 'centered'),
    fields.text('eyebrow', 'Eyebrow', ''),
    fields.text('heading', 'Heading', tr('مرحباً بك في متجرنا', 'Welcome to our store')),
    fields.richtext('body', 'Text', tr('<p>نقدم لك أفضل المنتجات بأسعار منافسة وخدمة عملاء تسعدك. تصفح تشكيلتنا واكتشف الجديد كل أسبوع.</p>', '<p>We bring you the best products at fair prices with customer service that delights. Browse the range and discover something new every week.</p>')),
    fields.text('cta_label', 'Button label', ''),
    fields.url('cta_url', 'Button link', '/about'),
    fields.select('background', 'Background', OPTIONS.background, 'none'),
    ...spacingFields(),
  ],
});

export function RichText(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(richTextSchema, props.settings);
  const layout = useVariant(richTextSchema, props.settings);
  const heading = str(s, 'heading');
  const body = str(s, 'body');
  if (!heading && !body) return null;
  const align = layout === 'centered' ? 'center' : 'start';
  const head = (
    <>
      {str(s, 'eyebrow') ? <span className="lib-eyebrow">{str(s, 'eyebrow')}</span> : null}
      {heading ? <h2 className="lib-title">{heading}</h2> : null}
    </>
  );
  const cta = str(s, 'cta_label') ? (
    <div className="lib-richtext__actions">
      <LibButton href={str(s, 'cta_url', '/about')} variant="secondary">{str(s, 'cta_label')}</LibButton>
    </div>
  ) : null;
  return (
    <LibSection className={bandClass(str(s, 'background', 'none'))} narrow={layout !== 'two-columns'} style={spacingStyle(s)}>
      {layout === 'two-columns' ? (
        <div className="lib-richtext lib-richtext--columns">
          <div className="lib-richtext__head">{head}{cta}</div>
          {body ? <RichHtml html={body} className="lib-prose lib-richtext__flow" /> : null}
        </div>
      ) : (
        <div className={cn('lib-richtext', `lib-richtext--${align}`)}>
          {head}
          {body ? <RichHtml html={body} className="lib-prose" /> : null}
          {cta}
        </div>
      )}
    </LibSection>
  );
}
