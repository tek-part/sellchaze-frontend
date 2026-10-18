// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { GlassesTemplatePreview } from './GlassesFunnel';
const state = vi.hoisted(() => ({ key: 'glasses-en', preview: true }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ key: state.key }) }));
vi.mock('../preview', () => ({ isPreview: () => state.preview }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { name: 'Demo store', baseCurrency: 'USD' }, navigation: { footer: [] } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../customize/customizer-state', () => ({ useCustomizerState: () => ({ active: false, selectedId: null }) }));
vi.mock('../pages/FunnelCheckout', () => ({ FunnelCheckout: () => { throw new Error('A display-only template must not initialize real checkout.'); } }));
vi.mock('../shared-ui/PaymentMarks', () => ({ StorePaymentMarks: () => null }));
vi.mock('../seo/Seo', () => ({ Seo: ({ noindex }: { noindex?: boolean }) => <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} /> }));
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <p>Missing preview</p> }));
beforeEach(() => { state.key = 'glasses-en'; state.preview = true; });

it('renders the complete sample composition with inert checkout and an explicit demo notice', () => {
  const html = renderToStaticMarkup(<GlassesTemplatePreview />); const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('form')).toBeNull();
  expect(doc.querySelector('fieldset')?.disabled).toBe(true);
  expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow');
  expect(doc.querySelectorAll('#funnel-checkout')).toHaveLength(1);
  expect(doc.querySelector('.gf-demo-note')?.textContent).toContain('Sample data — checkout disabled');
  expect(doc.querySelectorAll('.gf-feature')).toHaveLength(3);
  expect(doc.querySelectorAll('.gf-faq details')).toHaveLength(2);
});

it('does not render an unknown template or an unmarked customer-facing demo', () => {
  state.key = 'unknown'; expect(renderToStaticMarkup(<GlassesTemplatePreview />)).toContain('Missing preview');
  state.key = 'glasses-ar'; state.preview = false; expect(renderToStaticMarkup(<GlassesTemplatePreview />)).toContain('Missing preview');
});

it('uses an independent Arabic composition for the Arabic template', () => {
  state.key = 'glasses-ar'; const doc = new DOMParser().parseFromString(renderToStaticMarkup(<GlassesTemplatePreview />), 'text/html');
  expect(doc.querySelector('.gf-root')?.getAttribute('dir')).toBe('rtl');
  expect(doc.querySelector('h1')?.textContent).toBe('أسلوبك، من زاوية جديدة.');
  expect(doc.querySelector('.gf-demo-note')?.textContent).toContain('الشراء معطّل');
});
