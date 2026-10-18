// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { HairTemplatePreview } from './HairReviveFunnel';
const state = vi.hoisted(() => ({ key: 'hair-revive-en', preview: true }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ key: state.key }) }));
vi.mock('../preview', () => ({ isPreview: () => state.preview }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { name: 'Demo store', baseCurrency: 'USD' }, navigation: { footer: [] } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../customize/customizer-state', () => ({ useCustomizerState: () => ({ active: false, selectedId: null }) }));
vi.mock('../pages/FunnelCheckout', () => ({ FunnelCheckout: () => { throw new Error('Display-only templates cannot initialize checkout.'); } }));
vi.mock('../api/storefront', () => ({ getProduct: () => { throw new Error('No commerce requests in public demo'); }, getProductReviews: () => { throw new Error('No commerce requests in public demo'); } }));
vi.mock('../shared-ui/PaymentMarks', () => ({ StorePaymentMarks: () => null }));
vi.mock('../seo/Seo', () => ({ Seo: ({ noindex }: { noindex?: boolean }) => <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} /> }));
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <p>Missing preview</p> }));
beforeEach(() => { state.key = 'hair-revive-en'; state.preview = true; window.matchMedia = vi.fn().mockReturnValue({ matches: true }); });

it('renders all fifteen sections with an inert checkout and clearly identified sample reviews', () => {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<HairTemplatePreview />), 'text/html');
  expect(doc.querySelectorAll('.hr-section')).toHaveLength(15);
  expect(doc.querySelectorAll('.hr-statement')).toHaveLength(5);
  expect(doc.querySelectorAll('.hr-question')).toHaveLength(6);
  expect(doc.querySelector('form')).toBeNull();
  expect(doc.querySelector('fieldset')?.disabled).toBe(true);
  expect(doc.querySelectorAll('#funnel-checkout')).toHaveLength(1);
  expect(doc.querySelector('.hr-demo-note')?.textContent).toContain('Sample data — checkout disabled');
  expect(doc.querySelector('.hr-reviews-heading')?.textContent).toContain('3 sample reviews');
  expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow');
});

it('uses a distinct Arabic composition and rejects unknown or unmarked previews', () => {
  state.key = 'hair-revive-ar';
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<HairTemplatePreview />), 'text/html');
  expect(doc.querySelector('.hr-root')?.getAttribute('dir')).toBe('rtl');
  expect(doc.querySelector('.hr-demo-note')?.textContent).toContain('الشراء معطّل');
  state.preview = false; expect(renderToStaticMarkup(<HairTemplatePreview />)).toContain('Missing preview');
  state.preview = true; state.key = 'glasses-ar'; expect(renderToStaticMarkup(<HairTemplatePreview />)).toContain('Missing preview');
});

it('keeps only one FAQ answer open and updates the selected product detail', async () => {
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element);
  await act(async () => root.render(<HairTemplatePreview />));
  const questions = element.querySelectorAll<HTMLButtonElement>('.hr-question button');
  await act(async () => questions[0]!.click()); expect(questions[0]!.getAttribute('aria-expanded')).toBe('true');
  await act(async () => questions[1]!.click()); expect(questions[0]!.getAttribute('aria-expanded')).toBe('false'); expect(questions[1]!.getAttribute('aria-expanded')).toBe('true');
  const details = element.querySelectorAll<HTMLButtonElement>('.hr-factor-list button');
  await act(async () => details[2]!.click()); expect(details[2]!.getAttribute('aria-pressed')).toBe('true'); expect(details[0]!.getAttribute('aria-pressed')).toBe('false');
  await act(async () => root.unmount()); element.remove();
});
