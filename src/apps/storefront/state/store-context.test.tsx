// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StoreProvider, useStore } from './store-context';
import type { ApiStorefrontBootstrap } from '../api/storefront';

let host: HTMLDivElement;
let root: Root;
const data = (id = 1, changes: Partial<ApiStorefrontBootstrap['store']> = {}): ApiStorefrontBootstrap => ({
  store: { id, name: 'Own store', slug: `store-${id}`, currency: 'USD', supported_currencies: ['USD', 'EUR'], auto_currency_by_country: true, visitor_currency: 'EUR', payment_methods: ['cod'], ...changes },
});
function Consumer() {
  const { store, setCurrency } = useStore();
  return <><output>{store.currency}</output><span>{store.paymentMethods?.join(',')}</span><button onClick={() => setCurrency('USD')}>USD</button><button onClick={() => setCurrency('EUR')}>EUR</button><button onClick={() => setCurrency('JPY')}>JPY</button></>;
}
const render = async (initialData = data(), key = 'initial') => act(async () => root.render(<StoreProvider key={key} initialData={initialData}><Consumer /></StoreProvider>));
const choose = async (code: string) => act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === code)!.click());
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

it('uses the supported country default without saving it as a manual choice', async () => {
  await render();
  expect(host.querySelector('output')?.textContent).toBe('EUR');
  expect(host.querySelector('span')?.textContent).toBe('cod');
  expect(window.localStorage.getItem('sf:currency:manual:1')).toBeNull();
});
it('keeps explicit choices across visits without leaking them to another store', async () => {
  await render(); await choose('USD');
  expect(window.localStorage.getItem('sf:currency:manual:1')).toBe('USD');
  await render(data(), 'return'); expect(host.querySelector('output')?.textContent).toBe('USD');
  await render(data(2), 'other'); expect(host.querySelector('output')?.textContent).toBe('EUR');
});
it('ignores unsupported visitor and manual currencies, including the old global preference', async () => {
  window.localStorage.setItem('sf:currency:manual:1', 'JPY');
  window.localStorage.setItem('sf:currency', 'EUR');
  await render(data(1, { visitor_currency: 'AED' }));
  expect(host.querySelector('output')?.textContent).toBe('USD');
  await choose('JPY'); expect(host.querySelector('output')?.textContent).toBe('USD');
  await render(data(1, { auto_currency_by_country: false }), 'disabled');
  expect(host.querySelector('output')?.textContent).toBe('USD');
});
it('renders and accepts manual selection when browser storage is unavailable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  await render(); await choose('USD');
  expect(host.querySelector('output')?.textContent).toBe('USD');
});
