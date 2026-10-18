// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { ElectricTemplatePreview } from './ElectricBikerFunnel';
const state = vi.hoisted(() => ({ key: 'electric-biker-en', preview: true }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ key: state.key }) }));
vi.mock('../preview', () => ({ isPreview: () => state.preview }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { name: 'Demo store', baseCurrency: 'USD', email: 'store@example.test', phone: '+20 100 000 0000', identity: { social: [{ label: 'Instagram', url: 'https://www.instagram.com/example' }] } }, navigation: { footer: [] } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../customize/customizer-state', () => ({ useCustomizerState: () => ({ active: false, selectedId: null }) }));
vi.mock('../pages/FunnelCheckout', () => ({ FunnelCheckout: () => { throw new Error('A catalog preview cannot initialize checkout'); } }));
vi.mock('../api/storefront', () => ({ getProduct: () => { throw new Error('No commerce requests in catalog'); }, getProductReviews: () => { throw new Error('No commerce requests in catalog'); } }));
vi.mock('../shared-ui/PaymentMarks', () => ({ StorePaymentMarks: () => null }));
vi.mock('../seo/Seo', () => ({ Seo: ({ noindex }: { noindex?: boolean }) => <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} /> }));
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <p>Missing preview</p> }));
beforeEach(() => { state.key = 'electric-biker-en'; state.preview = true; window.matchMedia = vi.fn().mockReturnValue({ matches: true }); });

it('renders an independent complete composition without commerce hooks or fabricated merchant proof', () => {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<ElectricTemplatePreview />), 'text/html');
  expect(doc.querySelectorAll('.eb-section')).toHaveLength(11);
  expect(doc.querySelectorAll('.eb-editorial article')).toHaveLength(2);
  expect(doc.querySelectorAll('.eb-stories article')).toHaveLength(3);
  expect(doc.querySelectorAll('.eb-benefits article')).toHaveLength(4);
  expect(doc.querySelectorAll('.eb-technical-cards article')).toHaveLength(6);
  expect(doc.querySelectorAll('.eb-mosaic figure')).toHaveLength(6);
  expect(doc.querySelector('form')).toBeNull();
  expect(doc.querySelector('fieldset')?.disabled).toBe(true);
  expect(doc.querySelectorAll('#funnel-checkout')).toHaveLength(1);
  expect(doc.querySelector('.eb-demo-note')?.textContent).toContain('Sample data — checkout disabled');
  expect(doc.querySelector('.eb-reviews header')?.textContent).toContain('Sample reviews only');
  expect(doc.querySelector('[role=timer]')).toBeNull();
  expect(doc.querySelector('.eb-footer address a')?.getAttribute('href')).toBe('mailto:store@example.test');
  expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('noindex,nofollow');
});

it('uses Arabic direction and rejects unmarked or unrelated template previews', () => {
  state.key = 'electric-biker-ar';
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<ElectricTemplatePreview />), 'text/html');
  expect(doc.querySelector('.eb-root')?.getAttribute('dir')).toBe('rtl');
  expect(doc.querySelector('.eb-demo-note')?.textContent).toContain('الشراء معطّل');
  state.preview = false; expect(renderToStaticMarkup(<ElectricTemplatePreview />)).toContain('Missing preview');
  state.preview = true; state.key = 'hair-revive-en'; expect(renderToStaticMarkup(<ElectricTemplatePreview />)).toContain('Missing preview');
});

it('keeps accordions independent and synchronizes the gallery image with its chosen thumbnail', async () => {
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element);
  await act(async () => root.render(<ElectricTemplatePreview />));
  const questions = element.querySelectorAll<HTMLButtonElement>('.eb-faq button');
  await act(async () => questions[0]!.click()); expect(questions[0]!.getAttribute('aria-expanded')).toBe('true');
  await act(async () => questions[1]!.click()); expect(questions[0]!.getAttribute('aria-expanded')).toBe('false'); expect(questions[1]!.getAttribute('aria-expanded')).toBe('true');
  const thumbnails = element.querySelectorAll<HTMLButtonElement>('.eb-gallery-rail button');
  await act(async () => thumbnails[1]!.click());
  expect(thumbnails[1]!.getAttribute('aria-pressed')).toBe('true');
  expect(element.querySelector('.eb-gallery-main')?.getAttribute('src')).toContain('electric-biker-detail');
  await act(async () => root.unmount()); element.remove();
});
