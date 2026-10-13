// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SectionRenderProps } from '../../theme-engine/rendering';

const fixture = vi.hoisted(() => ({ customer: null as { id: string; name: string; email: string } | null, reviews: vi.fn(), submit: vi.fn() }));
vi.mock('../../state/auth-context', () => ({ useOptionalAuth: () => ({ customer: fixture.customer }) }));
vi.mock('../../state/store-context', () => ({ useStore: () => ({ store: { id: '1', name: 'Test', defaultLocale: 'en', currency: 'EGP', currencyMultipliers: { EGP: 1 } }, apiOk: true }) }));
vi.mock('../../sections-lib/i18n', () => ({ useLocaleCode: () => 'en', useLibT: () => (key: string) => key }));
vi.mock('../../foundation/sections/ProductDetailsSection', () => ({ ProductDetailsSection: () => null }));
vi.mock('../../foundation/components/Modal', () => ({ Modal: ({ children, title }: { children: ReactNode; title: string }) => createElement('section', { role: 'dialog', 'aria-label': title }, children) }));
vi.mock('../../foundation/components/Reviews', () => ({ ReviewList: () => null, ReviewSummary: () => null }));
vi.mock('../../api/storefront', () => ({ getProductReviews: fixture.reviews, submitProductReview: fixture.submit }));
import { KidsProduct } from './sections';
import { ApiError } from '../../api/client';

const props = { instance: { id: 'product', type: 'product-details' }, settings: {}, context: { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { product: { id: '1', handle: 'shirt', title: 'Shirt', url: '/products/shirt', price: 100, currency: 'EGP', images: [] }, reviews: [] } } } as SectionRenderProps;
let root: Root; let container: HTMLDivElement;
async function render(): Promise<void> { await act(async () => { root.render(createElement(KidsProduct, props)); }); }
function button(text: string): HTMLButtonElement { const result = Array.from(document.querySelectorAll('button')).find(node => node.textContent?.trim() === text); if (!result) throw new Error(`Missing button ${text}`); return result; }
async function click(text: string): Promise<void> { await act(async () => { button(text).click(); }); }
beforeEach(() => {
  (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
  fixture.customer = null; fixture.submit.mockReset(); fixture.reviews.mockReset().mockResolvedValue({ data: [], meta: { total: 0, current_page: 1, last_page: 1, per_page: 10 }, summary: { count: 0, average: null } });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe('Nature Kids review flow', () => {
  it('guides guests to a product return link and never submits without customer authentication', async () => {
    await render(); await click('Share your review');
    const link = document.querySelector('[role="dialog"] a')!;
    expect(link.getAttribute('href')).toBe('/login?next=%2Fproducts%2Fshirt%23reviews'); expect(fixture.submit).not.toHaveBeenCalled();
  });
  it('submits only review fields and displays actual validation failures', async () => {
    fixture.customer = { id: 'a', name: 'Local A', email: 'local-a@example.test' }; fixture.submit.mockRejectedValue(new ApiError(422, 'Invalid', { errors: { rating: ['Already reviewed.'] } }));
    await render(); await click('Share your review'); await act(async () => { document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(fixture.submit).toHaveBeenCalledWith('shirt', { rating: 5, title: '', body: '' });
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('Already reviewed.'); expect(container.textContent).not.toContain('Your review was submitted.');
  });
  it('does not close or mark the next customer dialog successful after an earlier customer response', async () => {
    let finish!: (value: unknown) => void; fixture.submit.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    fixture.customer = { id: 'a', name: 'Local A', email: 'local-a@example.test' }; await render(); await click('Share your review');
    await act(async () => { document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    fixture.customer = { id: 'b', name: 'Local B', email: 'local-b@example.test' }; await render(); await click('Share your review');
    await act(async () => { finish({ data: { id: 1, rating: 5 } }); });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull(); expect(document.querySelector('button[type="submit"]')?.getAttribute('disabled')).toBeNull(); expect(container.textContent).not.toContain('Your review was submitted.');
  });
});
