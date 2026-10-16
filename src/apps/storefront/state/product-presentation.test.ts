// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProductHeaderChrome, ProductPresentationProvider, useProductPresentation } from './product-presentation';

function Page({ id, hidden }: { id?: string; hidden?: boolean }) { useProductPresentation(id, { is_header_hidden: hidden }); return h('main', null, 'Product'); }
describe('product-scoped chrome', () => {
  it('hides the header only for the current product and restores it on leaving', async () => {
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
    const view = (id?: string, hidden?: boolean) => h(MemoryRouter, null, h(ProductPresentationProvider, null, h(ProductHeaderChrome, null, h('header', null, 'Shop')), h(Page, { id, hidden })));
    try {
      await act(async () => root.render(view('3', true))); expect(host.querySelector('header')).toBeNull();
      await act(async () => root.render(view('4', false))); expect(host.querySelector('header')?.textContent).toBe('Shop');
      await act(async () => root.render(view('3', true))); expect(host.querySelector('header')).toBeNull();
      await act(async () => root.render(view())); expect(host.querySelector('header')?.textContent).toBe('Shop');
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
});
