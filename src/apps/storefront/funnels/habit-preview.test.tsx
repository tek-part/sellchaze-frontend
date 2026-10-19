// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { HabitTemplatePreview } from './HabitFunnel';
const state = vi.hoisted(() => ({ key: 'habit-en', preview: true }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ key: state.key }) }));
vi.mock('../preview', () => ({ isPreview: () => state.preview }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { name: 'Demo store', baseCurrency: 'USD', identity: { social: [] } }, navigation: { footer: [] } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../customize/customizer-state', () => ({ useCustomizerState: () => ({ active: false, selectedId: null }) }));
vi.mock('../pages/FunnelCheckout', () => ({ FunnelCheckout: () => { throw new Error('Catalog cannot initialize checkout'); } }));
vi.mock('../api/storefront', () => ({ getProduct: () => { throw new Error('No catalog product request'); }, getProductReviews: () => { throw new Error('No merchant reviews in catalog'); } }));
vi.mock('../shared-ui/PaymentMarks', () => ({ StorePaymentMarks: () => null }));
vi.mock('../seo/Seo', () => ({ Seo: ({ noindex }: { noindex?: boolean }) => <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} /> }));
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <p>Missing preview</p> }));
beforeEach(() => { state.key = 'habit-en'; state.preview = true; window.matchMedia = vi.fn().mockReturnValue({ matches: true }); });

it('renders the independent violet composition without a commerce engine or invented merchant evidence', () => {
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<HabitTemplatePreview />), 'text/html');
  expect(doc.querySelectorAll('.hbt-section')).toHaveLength(10);
  expect(doc.querySelectorAll('.hbt-feature-column article')).toHaveLength(4);
  expect(doc.querySelector('.hbt-story-grid')).toBeNull();
  expect(doc.querySelectorAll('.hbt-marquee')).toHaveLength(3);
  expect(doc.querySelectorAll('.hbt-review-list article')).toHaveLength(4);
  expect(doc.querySelectorAll('.hbt-faq button')).toHaveLength(6);
  expect(doc.querySelector('form')).toBeNull();
  expect(doc.querySelector('fieldset')?.disabled).toBe(true);
  expect(doc.querySelectorAll('#funnel-checkout')).toHaveLength(1);
  expect(doc.querySelector('[role=timer]')).toBeNull();
  expect(doc.querySelector('.hbt-demo-note')?.textContent).toContain('checkout disabled');
  expect(doc.querySelector('.hbt-reviews header')?.textContent).toContain('Sample reviews only');
  expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('noindex,nofollow');
});

it('selects Arabic without exposing unmarked or unrelated previews', () => {
  state.key = 'habit-ar';
  const doc = new DOMParser().parseFromString(renderToStaticMarkup(<HabitTemplatePreview />), 'text/html');
  expect(doc.querySelector('.hbt-root')?.getAttribute('dir')).toBe('rtl');
  expect(doc.querySelectorAll('.hbt-section')).toHaveLength(12);
  expect(doc.querySelector('.hbt-demo-note')?.textContent).toContain('الشراء معطّل');
  state.preview = false; expect(renderToStaticMarkup(<HabitTemplatePreview />)).toContain('Missing preview');
  state.preview = true; state.key = 'skin-care-en'; expect(renderToStaticMarkup(<HabitTemplatePreview />)).toContain('Missing preview');
});

it('keeps FAQ targets unique and the inline mobile menu and product gallery functional', async () => {
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element);
  await act(async () => root.render(<HabitTemplatePreview />));
  const menu = element.querySelector<HTMLButtonElement>('.hbt-menu-toggle')!;
  await act(async () => menu.click()); expect(menu.getAttribute('aria-expanded')).toBe('true');
  expect(element.querySelector('.hbt-mobile-nav')?.hasAttribute('inert')).toBe(false);
  const questions = element.querySelectorAll<HTMLButtonElement>('.hbt-faq button');
  await act(async () => questions[0]!.click()); await act(async () => questions[1]!.click());
  expect(questions[0]!.getAttribute('aria-expanded')).toBe('false'); expect(questions[1]!.getAttribute('aria-expanded')).toBe('true');
  const targets = Array.from(element.querySelectorAll('[aria-controls]')).map(e => e.getAttribute('aria-controls'));
  expect(new Set(targets).size).toBe(targets.length);
  const thumbnails = element.querySelectorAll<HTMLButtonElement>('.hbt-gallery-rail button');
  await act(async () => thumbnails[1]!.click());
  expect(thumbnails[1]!.getAttribute('aria-pressed')).toBe('true');
  expect(element.querySelector('.hbt-gallery-main')?.getAttribute('src')).toContain('habit-detail-');
  await act(async () => root.unmount()); element.remove();
});
