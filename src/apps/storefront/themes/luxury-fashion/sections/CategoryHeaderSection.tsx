/**
 * category-header — orient the PLP: breadcrumb, title, description, optional banner. Reads the
 * page header from context.data (the category page supplies it). Settings: show_description, banner,
 * align. §08 category-header.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Breadcrumb } from '../components/Breadcrumb';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { StoreImage } from '../components/Image';
import { pageHeaderOf } from './section-data';
import { flag, text } from './section-settings';

export function CategoryHeaderSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const header = pageHeaderOf(context);
  const title = header.title ?? text(settings, 'title');
  const showDescription = flag(settings, 'show_description', true);
  const banner = text(settings, 'banner') || header.image || '';

  if (!title) return null;

  // With a banner the header becomes a full-bleed hero: the image spans the
  // viewport and the text sits inside the container on top of it — the same
  // shape the editorial pages use, so a collection does not read as a lesser
  // page than /about. Without one it stays a plain text header rather than
  // inventing a placeholder image.
  if (banner) {
    return (
      <section className="sf-cat-hero">
        <StoreImage className="sf-cat-hero__img" src={banner} alt="" eager />
        <div className="sf-cat-hero__scrim" aria-hidden />
        <Container className="sf-cat-hero__inner">
          {header.breadcrumbs && header.breadcrumbs.length > 0 ? (
            <Breadcrumb items={header.breadcrumbs.map((c) => ({ label: c.label, href: c.url }))} />
          ) : null}
          <h1 className="sf-cat-hero__title">{title}</h1>
          {showDescription && header.description ? <p className="sf-cat-hero__sub">{header.description}</p> : null}
        </Container>
      </section>
    );
  }

  return (
    <Section tight>
      <Container>
        <div className="sf-cat-header">
          {header.breadcrumbs && header.breadcrumbs.length > 0 ? (
            <Breadcrumb items={header.breadcrumbs.map((c) => ({ label: c.label, href: c.url }))} />
          ) : null}
          <h1 className="sf-section-head__title">{title}</h1>
          {showDescription && header.description ? <p className="sf-cat-header__desc">{header.description}</p> : null}
        </div>
      </Container>
    </Section>
  );
}
