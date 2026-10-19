// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { SkinCareTemplatePreview } from './SkinCareFunnel';
const state = vi.hoisted(() => ({ key: 'skin-care-en', preview: true }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ key: state.key }) }));
vi.mock('../preview', () => ({ isPreview: () => state.preview }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { name: 'Demo store', baseCurrency: 'USD', email: 'store@example.test', phone: '+20 100 000 0000', identity: { social: [] } }, navigation: { footer: [] } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../customize/customizer-state', () => ({ useCustomizerState: () => ({ active: false, selectedId: null }) }));
vi.mock('../pages/FunnelCheckout', () => ({ FunnelCheckout: () => { throw new Error('Catalog cannot initialize checkout'); } }));
vi.mock('../api/storefront', () => ({ getProduct: () => { throw new Error('No product requests in catalog'); }, getProductReviews: () => { throw new Error('No merchant reviews in catalog'); } }));
vi.mock('../shared-ui/PaymentMarks', () => ({ StorePaymentMarks: () => null }));
vi.mock('../seo/Seo', () => ({ Seo: ({ noindex }: { noindex?: boolean }) => <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} /> }));
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <p>Missing preview</p> }));
beforeEach(() => { state.key = 'skin-care-en'; state.preview = true; window.matchMedia = vi.fn().mockReturnValue({ matches: true }); });

it('renders the distinct English editorial sequence without a commerce engine or merchant proof', () => {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<SkinCareTemplatePreview />), 'text/html');
  expect(doc.querySelectorAll('.skc-section')).toHaveLength(14);
  expect(doc.querySelectorAll('.skc-specs')).toHaveLength(1);
  expect(doc.querySelectorAll('.skc-policies button')).toHaveLength(3);
  expect(doc.querySelectorAll('.skc-feature-cover')).toHaveLength(2);
  expect(doc.querySelectorAll('.skc-feature-lines h2')).toHaveLength(10);
  expect(doc.querySelectorAll('.skc-quote blockquote')).toHaveLength(2);
  expect(doc.querySelectorAll('.skc-mosaic')).toHaveLength(1);
  expect(doc.querySelectorAll('.skc-marquee')).toHaveLength(2);
  expect(doc.querySelectorAll('.skc-review-list article')).toHaveLength(4);
  expect(doc.querySelector('form')).toBeNull();
  expect(doc.querySelector('fieldset')?.disabled).toBe(true);
  expect(doc.querySelectorAll('#funnel-checkout')).toHaveLength(1);
  expect(doc.querySelector('.skc-demo-note')?.textContent).toContain('Sample data — checkout disabled');
  expect(doc.querySelector('.skc-reviews header')?.textContent).toContain('Sample reviews only');
  expect(doc.querySelector('[role=timer]')).toBeNull();
  expect(doc.querySelector('.skc-footer address a')?.getAttribute('href')).toBe('mailto:store@example.test');
  expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('noindex,nofollow');
});

it('uses the Arabic sequence and rejects unrelated or unmarked catalog routes', () => {
  state.key = 'skin-care-ar';
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<SkinCareTemplatePreview />), 'text/html');
  expect(doc.querySelector('.skc-root')?.getAttribute('dir')).toBe('rtl');
  expect(doc.querySelectorAll('.skc-section')).toHaveLength(12);
  expect(doc.querySelectorAll('.skc-feature-cover')).toHaveLength(1);
  expect(doc.querySelectorAll('.skc-quote')).toHaveLength(1);
  expect(doc.querySelector('.skc-demo-note')?.textContent).toContain('الشراء معطّل');
  state.preview = false; expect(renderToStaticMarkup(<SkinCareTemplatePreview />)).toContain('Missing preview');
  state.preview = true; state.key = 'hair-care-en'; expect(renderToStaticMarkup(<SkinCareTemplatePreview />)).toContain('Missing preview');
});

it('keeps policy and FAQ state independent, with unique targets and a working image gallery', async () => {
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element);
  await act(async () => root.render(<SkinCareTemplatePreview />));
  const policies = element.querySelectorAll<HTMLButtonElement>('.skc-policies button');
  const questions = element.querySelectorAll<HTMLButtonElement>('.skc-faq button');
  await act(async () => policies[0]!.click());
  await act(async () => questions[0]!.click());
  expect(policies[0]!.getAttribute('aria-expanded')).toBe('true');
  expect(questions[0]!.getAttribute('aria-expanded')).toBe('true');
  expect(policies[0]!.getAttribute('aria-controls')).not.toBe(questions[0]!.getAttribute('aria-controls'));
  await act(async () => questions[1]!.click());
  expect(questions[0]!.getAttribute('aria-expanded')).toBe('false');
  expect(questions[1]!.getAttribute('aria-expanded')).toBe('true');
  const targets = Array.from(element.querySelectorAll('[aria-controls]')).map(e => e.getAttribute('aria-controls'));
  expect(new Set(targets).size).toBe(targets.length);
  const thumbnails = element.querySelectorAll<HTMLButtonElement>('.skc-gallery-rail button');
  await act(async () => thumbnails[1]!.click());
  expect(thumbnails[1]!.getAttribute('aria-pressed')).toBe('true');
  expect(element.querySelector('.skc-gallery-main')?.getAttribute('src')).toContain('skin-care-portrait');
  await act(async () => root.unmount()); element.remove();
});
