// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ category: vi.fn(), collection: vi.fn(), products: vi.fn(), context: null as unknown }));
vi.mock('../theme-engine', () => ({ useThemeManifest: () => ({ id: 'classic' }), useTemplate: () => ({}), ThemeRenderer: ({ context }: { context: unknown }) => { fixture.context = context; return null; } }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { id: 'merchant-1', name: 'Merchant', currency: 'USD', currencyMultipliers: { USD: 1 } } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../preview', () => ({ previewOrDev: () => false }));
vi.mock('../api/storefront', () => ({ getCategory: fixture.category, getCollection: fixture.collection, getProducts: fixture.products }));
vi.mock('../api/mappers', () => ({ toProductCard: (product: { id: number }) => product }));
vi.mock('../seo/Seo', () => ({ Seo: () => null }));
vi.mock('../seo/schema', () => ({ breadcrumbSchema: () => ({}), collectionSchema: () => ({}) }));
import { CategoryPage } from './CategoryPage';
import type { StorefrontContext } from '../theme-engine/rendering';

type Header = { title: string; descriptionHtml?: string; image?: string; children: unknown[] };
let container: HTMLDivElement; let root: Root;
const data = (): { products: Array<{ id: number }>; pageHeader: Header } => (fixture.context as StorefrontContext).data as unknown as ReturnType<typeof data>;
const render = (path: string) => act(async () => root.render(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Routes, null, createElement(Route, { path: '/collections/:slug', element: createElement(CategoryPage) })))));

beforeEach(() => {
  (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
  fixture.context = null; fixture.category.mockReset(); fixture.collection.mockReset(); fixture.products.mockReset();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

it('renders a merchant collection with its own products, title, description and image', async () => {
  fixture.collection.mockResolvedValue({ data: { id: 4, name: 'Summer deals', slug: 'summer', description: '<p>Hot picks</p>', image_url: 'https://cdn.test/summer.jpg' }, products: { data: [{ id: 11 }, { id: 12 }], meta: { last_page: 1 } } });
  fixture.products.mockResolvedValue({ data: [{ id: 99 }], meta: { last_page: 1 } });
  fixture.category.mockRejectedValue(new Error('404'));
  await render('/collections/summer');
  expect(fixture.collection).toHaveBeenCalledWith('summer', { perPage: 60 });
  expect(data().products.map((p) => p.id)).toEqual([11, 12]);
  expect(data().pageHeader).toMatchObject({ title: 'Summer deals', descriptionHtml: '<p>Hot picks</p>', image: 'https://cdn.test/summer.jpg', children: [] });
});

it('falls back to the category when no collection has the slug', async () => {
  fixture.collection.mockRejectedValue(new Error('404'));
  fixture.products.mockResolvedValue({ data: [{ id: 21 }], meta: { last_page: 1 } });
  fixture.category.mockResolvedValue({ data: { id: 2, name: 'Shoes', slug: 'shoes', description: '<p>All shoes</p>' }, children: [{ id: 3, name: 'Boots', slug: 'boots' }] });
  await render('/collections/shoes');
  expect(fixture.products).toHaveBeenCalledWith({ category: 'shoes', perPage: 60 });
  expect(data().products.map((p) => p.id)).toEqual([21]);
  expect(data().pageHeader).toMatchObject({ title: 'Shoes', descriptionHtml: '<p>All shoes</p>', children: [{ label: 'Boots', url: '/collections/boots' }] });
});

it('never asks for a collection on curated views', async () => {
  fixture.products.mockResolvedValue({ data: [], meta: { last_page: 1 } });
  await render('/collections/all');
  expect(fixture.collection).not.toHaveBeenCalled();
});
