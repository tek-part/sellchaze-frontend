import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutFieldsForm, type useCheckoutFields } from './CheckoutFields';
import type { QuoteShipping, ShippingConfiguration, ZoneRate } from '../types/shipping';

vi.mock('./CheckoutPhoneVerification', () => ({ CheckoutPhoneVerification: () => null }));
vi.mock('./CheckoutBotProtection', () => ({ CheckoutBotProtection: () => null }));
vi.mock('../foundation/components', () => ({
  Button: ({ children }: { children?: ReactNode }) => createElement('button', null, children),
  Spinner: ({ label }: { label: string }) => createElement('p', null, label),
  Input: ({ label }: { label: string }) => createElement('label', null, label),
  Select: ({ label, options }: { label: string; options: Array<{ value: string; label: string }> }) => createElement('label', { 'data-select': label }, label, ...options.map((row) => createElement('option', { key: row.value, value: row.value }, row.label))),
}));

const rate = (id: string, en: string, amount: string, extra: Partial<ZoneRate> = {}): ZoneRate => ({ id, name: { ar: en, en }, type: 'flat', price: amount, amount, free_over: null, cod_fee: null, delivery_time: { ar: '', en: '' }, ...extra });
const shipping: ShippingConfiguration = { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'EGP', flat_rate: '0.00', free_over: null, regions: [], options: [], zones_enabled: true,
  countries: [{ code: 'EG', region_required: false }, { code: 'SA', region_required: false }], zone_regions: [{ id: 'cairo', name: { ar: 'القاهرة', en: 'Cairo' }, country: 'EG' }] };
const field = (key: string) => ({ key, label: { ar: key, en: key }, hint: { ar: '', en: '' }, enabled: true, required: true, position: 0 });

function model(paymentMethod = 'cod', addressRates: ZoneRate[] = [rate('std', 'Standard', '50.00'), rate('exp', 'Express', '90.00')]): ReturnType<typeof useCheckoutFields> {
  return { fields: [field('country'), field('address')], ready: true, query: { loading: false, error: null, reload: () => undefined, data: null }, values: { country: 'EG' }, setValues: () => undefined, locale: 'en', shipping,
    phoneVerification: {}, botProtection: {}, paymentMethod, zonesEnabled: true, zone: { selection: { shipping_country: 'EG' }, ready: true, regions: shipping.zone_regions ?? [], regionRequired: false },
    addressShipping: { ...shipping, zone: { id: 'z-eg', name: { ar: 'مصر', en: 'Egypt' } }, rates: addressRates }, addressLoading: false, resetRate: () => undefined,
    requiresShipping: true, hasDigital: false, shippingReady: true, shippingSelection: { shipping_country: 'EG' }, shippingStale: false, setChosenShipping: () => undefined, resetShipping: () => undefined, payload: () => ({}) } as unknown as ReturnType<typeof useCheckoutFields>;
}

describe('zone checkout fields', () => {
  it('limits countries to the served ones, offers the country\'s regions and lists the address rates as cards', () => {
    const html = renderToStaticMarkup(createElement(CheckoutFieldsForm, { model: model() }));
    expect(html).toContain('Region / governorate');
    expect(html).toContain('Other areas');
    expect(html).toContain('Cairo');
    expect(html).toContain('Saudi Arabia');
    expect(html).not.toContain('United States');
    expect(html.match(/class="sf-co-choice /g)).toHaveLength(2);
    expect(html).toContain('Standard');
    expect(html).toContain('data-shipping-zone="z-eg"');
  });
  it('prefers the quote\'s eligible rates, marks the applied one and shows free rates and COD fees', () => {
    const quote: QuoteShipping = { mode: 'zone', zone: { id: 'z-eg', name: { ar: 'مصر', en: 'Egypt' } }, rate_id: 'heavy', free_shipping_applied: false, cod_fee: '15.00',
      rates: [rate('heavy', 'Heavy parcels', '0.00', { price: '120.00', cod_fee: '15.00', delivery_time: { ar: '', en: '3-5 days' } })] };
    const html = renderToStaticMarkup(createElement(CheckoutFieldsForm, { model: model(), quote: { shipping: quote } }));
    expect(html.match(/class="sf-co-choice /g)).toHaveLength(1);
    expect(html).toContain('sf-co-choice is-selected');
    expect(html).toContain('Heavy parcels');
    expect(html).toContain('3-5 days');
    expect(html).toContain('Free');
    expect(html).toContain('Cash on delivery fee: ');
    expect(renderToStaticMarkup(createElement(CheckoutFieldsForm, { model: model('card'), quote: { shipping: quote } }))).not.toContain('Cash on delivery fee');
  });
});
