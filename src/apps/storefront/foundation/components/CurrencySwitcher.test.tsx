// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  store: { currency: 'EGP', supportedCurrencies: ['EGP', 'USD', 'SAR'] as ReadonlyArray<string> },
  locale: 'en' as 'en' | 'ar',
  setCurrency: vi.fn(),
}));
vi.mock('../../state/store-context', () => ({ useStore: () => ({ store: state.store, setCurrency: state.setCurrency }) }));
vi.mock('../../i18n/useLocale', () => ({ useLocale: () => ({ locale: state.locale }) }));

import { CurrencySwitcher, currencyNames } from './CurrencySwitcher';

let container: HTMLDivElement;
let root: Root;
const key = (target: Element, name: string): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
};
const render = async (variant?: 'header' | 'drawer'): Promise<void> => {
  await act(async () => root.render(createElement(CurrencySwitcher, variant ? { variant } : {})));
};
const button = (): HTMLButtonElement => container.querySelector<HTMLButtonElement>('.sf-currency__btn')!;
const list = (): HTMLElement | null => container.querySelector<HTMLElement>('[role=listbox]');

beforeEach(() => {
  (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
  state.store = { currency: 'EGP', supportedCurrencies: ['EGP', 'USD', 'SAR'] };
  state.locale = 'en';
  state.setCurrency.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('CurrencySwitcher', () => {
  it('renders nothing when the store sells in a single currency', async () => {
    state.store = { currency: 'EGP', supportedCurrencies: ['EGP'] };
    await render();
    expect(container.innerHTML).toBe('');
  });

  it('shows the active code and lists localized currency names with their codes', async () => {
    state.locale = 'ar';
    await render();
    expect(button().textContent).toBe('EGP');
    expect(button().getAttribute('aria-expanded')).toBe('false');
    await act(async () => button().click());
    const options = [...list()!.querySelectorAll('[role=option]')].map((option) => option.textContent);
    const names = currencyNames('ar', ['EGP', 'USD', 'SAR']);
    expect(options).toEqual([`${names['EGP']} — EGP`, `${names['USD']} — USD`, `${names['SAR']} — SAR`]);
    // The runtime ships ICU data, so the names are real Arabic labels rather than bare codes.
    expect(names['EGP']).not.toBe('EGP');
    expect(list()!.querySelector('[aria-selected=true]')!.textContent).toContain('EGP');
    expect(document.activeElement).toBe(list());
  });

  it('calls setCurrency on click and returns focus to the pill', async () => {
    await render();
    await act(async () => button().click());
    const usd = [...list()!.querySelectorAll<HTMLElement>('[role=option]')].find((option) => option.textContent?.endsWith('USD'))!;
    await act(async () => usd.click());
    expect(state.setCurrency).toHaveBeenCalledWith('USD');
    expect(list()).toBeNull();
    expect(document.activeElement).toBe(button());
  });

  it('supports arrow keys and Enter to choose a currency', async () => {
    await render();
    await act(async () => key(button(), 'ArrowDown'));
    expect(list()!.getAttribute('aria-activedescendant')).toBe(list()!.querySelectorAll('[role=option]')[0]!.id);
    await act(async () => key(list()!, 'ArrowDown'));
    await act(async () => key(list()!, 'ArrowDown'));
    await act(async () => key(list()!, 'Enter'));
    expect(state.setCurrency).toHaveBeenCalledWith('SAR');
  });

  it('closes on Escape without selecting and without letting the key reach an enclosing drawer', async () => {
    const outer = vi.fn();
    document.addEventListener('keydown', outer);
    try {
      await render('drawer');
      expect(container.querySelector('.sf-currency__label')!.textContent).toBe('Currency');
      await act(async () => button().click());
      expect(button().getAttribute('aria-expanded')).toBe('true');
      await act(async () => key(list()!, 'Escape'));
      expect(list()).toBeNull();
      expect(button().getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(button());
      expect(state.setCurrency).not.toHaveBeenCalled();
      expect(outer).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', outer);
    }
  });
});
