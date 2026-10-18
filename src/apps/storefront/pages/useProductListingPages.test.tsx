// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProductListingPages } from './useProductListingPages';
let container: HTMLDivElement; let root: Root;
beforeEach(() => { (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
function renderHook<P, R>(hook: (props: P) => R, options: { initialProps: P }): { result: { current: R }; rerender: (props: P) => void } {
  const result = {} as { current: R };
  function Probe({ value }: { value: P }) { result.current = hook(value); return null; }
  act(() => root.render(createElement(Probe, { value: options.initialProps })));
  return { result, rerender: value => { root.render(createElement(Probe, { value })); } };
}
describe('Accumulated storefront listing pages', () => {
  it('keeps previous products during load, appends new rows and deduplicates changed products', () => {
    const first = [{ id: 1, price: 10 }, { id: 2, price: 20 }];
    const { result, rerender } = renderHook(({ page, data }) => useProductListingPages(true, 'store:1:all:en:rating', page, data), { initialProps: { page: 1, data: first as typeof first | undefined } });
    expect(result.current.map(p => p.id)).toEqual([1, 2]);
    act(() => rerender({ page: 2, data: undefined }));
    expect(result.current.map(p => p.id)).toEqual([1, 2]);
    act(() => rerender({ page: 2, data: [{ id: 2, price: 25 }, { id: 3, price: 30 }] }));
    expect(result.current).toEqual([{ id: 1, price: 10 }, { id: 2, price: 25 }, { id: 3, price: 30 }]);
  });
  it('does not leak old categories, locales, stores or sort order while a new scope loads', () => {
    const first = [{ id: 1 }];
    const { result, rerender } = renderHook(({ scope, data }) => useProductListingPages(true, scope, 1, data), { initialProps: { scope: 'store:1:bags:en:rating', data: first as typeof first | undefined } });
    for (const scope of ['store:1:wallets:en:rating', 'store:1:wallets:ar:rating', 'store:2:wallets:ar:rating', 'store:2:wallets:ar:price_asc']) {
      act(() => rerender({ scope, data: undefined })); expect(result.current).toEqual([]);
      act(() => rerender({ scope, data: [{ id: 2 }] })); expect(result.current).toEqual([{ id: 2 }]);
    }
  });
  it('refreshing the first page invalidates older appended pages and history back hides later pages', () => {
    const first = [{ id: 1 }];
    const { result, rerender } = renderHook(({ page, data }) => useProductListingPages(true, 'store:1', page, data), { initialProps: { page: 1, data: first } });
    act(() => rerender({ page: 2, data: [{ id: 2 }] })); expect(result.current).toHaveLength(2);
    act(() => rerender({ page: 1, data: [{ id: 3 }] })); expect(result.current).toEqual([{ id: 3 }]);
    act(() => rerender({ page: 2, data: [{ id: 4 }] })); expect(result.current).toEqual([{ id: 3 }, { id: 4 }]);
  });
});
