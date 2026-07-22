/**
 * rich-text — arbitrary editorial / CTA band / legal copy. Serif headings, sans body. Settings:
 * content (richtext), align, width. Content is merchant-authored and sanitised server-side. §08 rich-text.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { option, text } from './section-settings';

export function RichTextSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const content = text(settings, 'content');
  const align = option(settings, 'align', ['start', 'center'] as const, 'start');
  const width = option(settings, 'width', ['narrow', 'wide'] as const, 'narrow');

  if (!content.trim()) return null;

  const style: CSSProperties = { textAlign: align === 'center' ? 'center' : 'start' };

  return (
    <Section>
      <Container narrow={width === 'narrow'}>
        {/* Merchant-authored rich text (sanitised by the backend before it reaches the storefront). */}
        <div
          className={cn('sf-prose', width === 'narrow' && 'sf-prose--narrow')}
          style={style}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Container>
    </Section>
  );
}
