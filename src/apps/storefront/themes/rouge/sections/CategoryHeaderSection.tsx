/**
 * Rouge category-header — orients the PLP: breadcrumb, gilt eyebrow, didone title, description, and an
 * optional editorial banner over an aura glow. Reads the page header from context.data. Settings:
 * eyebrow, show_description, banner.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Breadcrumb } from '../components/Breadcrumb';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Eyebrow } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { pageHeaderOf } from './section-data';
import { flag, text } from './section-settings';

export function CategoryHeaderSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const header = pageHeaderOf(context);
  const title = header.title ?? text(settings, 'title');
  const eyebrow = text(settings, 'eyebrow', 'The edit');
  const showDescription = flag(settings, 'show_description', true);
  const banner = text(settings, 'banner') || header.image || '';

  if (!title) return null;

  return (
    <Section tight>
      <Container>
        <div className="rge-cat-header">
          {header.breadcrumbs && header.breadcrumbs.length > 0 ? (
            <Breadcrumb items={header.breadcrumbs.map((c) => ({ label: c.label, href: c.url }))} />
          ) : null}
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="rge-cat-header__title">{title}</h1>
          {showDescription && header.description ? <p className="rge-cat-header__desc">{header.description}</p> : null}
          {banner ? (
            <div className="rge-cat-header__banner">
              <StoreImage className="rge-cat-header__banner-img" src={banner} alt="" eager />
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
