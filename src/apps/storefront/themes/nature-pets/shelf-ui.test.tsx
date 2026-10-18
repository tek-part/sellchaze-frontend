import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { SectionRenderProps } from '../../theme-engine/rendering';
vi.mock('../../sections-lib/i18n', () => ({ useLocaleCode: () => 'en', useLibT: () => (key: string) => key }));
vi.mock('../../sections-lib/data', () => ({ useSectionData: () => ({ category: () => undefined, loading: false, error: false }) }));
import { NatureShelf } from './sections';
const props = { instance: { id: 'shelf', type: 'nature-pets-shelf' }, settings: { title: '', layout: 'grid' }, context: { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { collections: { featured: [] } } } } as SectionRenderProps;
it('omits an empty optional shelf heading and preserves a link-only header', () => {
  for (const title of ['', '  ']) {
    const html = renderToStaticMarkup(createElement(NatureShelf, { ...props, settings: { ...props.settings, title } }));
    expect(html).not.toContain('<h2'); expect(html).not.toContain('npt-section-header');
  }
  const linked = renderToStaticMarkup(createElement(NatureShelf, { ...props, settings: { ...props.settings, button: 'Shop all', url: '/shop' } }));
  expect(linked).toContain('npt-section-header'); expect(linked).toContain('href="/shop"'); expect(linked).not.toContain('<h2');
  expect(renderToStaticMarkup(createElement(NatureShelf, { ...props, settings: { ...props.settings, title: 'Collection' } }))).toContain('<h2>Collection</h2>');
});
