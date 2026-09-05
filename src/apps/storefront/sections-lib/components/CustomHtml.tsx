/**
 * custom-html — merchant-authored HTML (sanitised: no scripts, handlers or javascript: URLs).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, spacingFields } from '../schema';
import { bool, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibSection } from '../primitives';
import { RichHtml } from './RichText';

export const customHtmlSchema = defineSection({
  type: 'custom-html',
  label: 'Custom HTML',
  description: 'Your own HTML block (scripts are not allowed).',
  category: 'layout',
  icon: 'HiOutlineCodeBracket',
  settings: [
    { id: 'html', type: 'textarea', label: 'HTML', default: '', hint: 'Safe HTML only — script tags and inline handlers are removed.' },
    fields.toggle('container', 'Constrain to the page container', true),
    ...spacingFields(32),
  ],
});

export function CustomHtml(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(customHtmlSchema, props.settings);
  const html = str(s, 'html');
  if (!html.trim()) return null;
  if (!bool(s, 'container', true)) {
    return (
      <section className="lib-section lib-section--flush" style={spacingStyle(s)}>
        <RichHtml html={html} />
      </section>
    );
  }
  return (
    <LibSection style={spacingStyle(s)}>
      <RichHtml html={html} />
    </LibSection>
  );
}
