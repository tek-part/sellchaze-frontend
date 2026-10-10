import { describe, expect, it } from 'vitest';
import { cartRequiresShipping, resolveShipping, shippingThreshold } from './shipping';
import type { ShippingConfiguration } from '../types/shipping';

const config = (): ShippingConfiguration => ({ enabled: true, regions_enabled: true, auto_select_region: true, currency: 'EGP', flat_rate: '25', free_over: null,
  regions: [{ id: 'alex', name: { ar: 'الإسكندرية', en: 'Alexandria' }, country: 'EG', rate: '60', enabled: true, position: 2 }, { id: 'cairo', name: { ar: 'القاهرة', en: 'Cairo' }, country: 'EG', rate: '40', enabled: true, position: 1 }],
  options: [{ id: 'express', name: { ar: 'سريع', en: 'Express' }, description: { ar: '', en: '' }, enabled: true, is_default: true, priority: 1, rate: '85' }] });

describe('delivery selection', () => {
  it('uses the configured offer in the displayed currency, including zero thresholds', () => {
    const offer = { enabled: true, currency: 'EGP', free_over: '500.00' };
    expect(shippingThreshold(offer, 'EGP', {})).toBe(500);
    expect(shippingThreshold(offer, 'USD', { USD: 0.02 })).toBe(10);
    expect(shippingThreshold({ ...offer, free_over: '0.00' }, 'EGP', {})).toBe(0);
    expect(shippingThreshold({ ...offer, free_over: '10.25' }, 'USD', { USD: 0.333 })).toBe(3.41);
  });
  it('does not fabricate an offer when disabled, unset, malformed or missing a conversion rate', () => {
    const offer = { enabled: true, currency: 'EGP', free_over: '500.00' };
    expect(shippingThreshold(undefined, 'EGP', {})).toBeUndefined();
    expect(shippingThreshold({ ...offer, enabled: false }, 'EGP', {})).toBeUndefined();
    for (const free_over of [null, '', '-1', '500oops', '1e2']) expect(shippingThreshold({ ...offer, free_over }, 'EGP', {})).toBeUndefined();
    const conversions: ReadonlyArray<Readonly<Record<string, number>>> = [{}, { USD: 0 }, { USD: -1 }, { USD: Infinity }];
    for (const rates of conversions) expect(shippingThreshold(offer, 'USD', rates)).toBeUndefined();
  });
  it('hides shipping presentation for digital-only bags and retains it for mixed and legacy bags', () => {
    expect(cartRequiresShipping([{ digitalType: 'link' }, { digitalType: 'codes' }])).toBe(false);
    expect(cartRequiresShipping([{ digitalType: 'codes' }, { digitalType: 'physical' }])).toBe(true);
    expect(cartRequiresShipping([{}])).toBe(true);
  });
  it('uses ordered regions and the merchant default, preserving valid buyer choices', () => {
    expect(resolveShipping(config(), {})).toEqual({ ready: true, selection: { shipping_region_id: 'cairo', shipping_option_id: 'express' } });
    expect(resolveShipping(config(), { shipping_region_id: 'alex' }).selection.shipping_region_id).toBe('alex');
  });
  it('requires an explicit choice when automatic selection is disabled', () => {
    const data = config(); data.auto_select_region = false; data.options = data.options.map((row) => ({ ...row, is_default: false }));
    expect(resolveShipping(data, {})).toEqual({ ready: false, selection: {} });
    expect(resolveShipping(data, { shipping_region_id: 'cairo', shipping_option_id: 'express' }).ready).toBe(true);
  });
  it('blocks removed or disabled explicit IDs instead of buying another destination or method', () => {
    const data = config(); data.regions = data.regions.map((row) => ({ ...row, enabled: row.id !== 'cairo' })); data.options = data.options.map((row) => ({ ...row, enabled: false }));
    expect(resolveShipping(data, { shipping_region_id: 'cairo', shipping_option_id: 'express' })).toEqual({ ready: false, selection: {}, stale: true });
    expect(resolveShipping(data, { shipping_region_id: 'alex', shipping_option_id: 'express' })).toEqual({ ready: false, selection: { shipping_region_id: 'alex' }, stale: true });
    expect(resolveShipping(data, {})).toEqual({ ready: true, selection: { shipping_region_id: 'alex' } });
    data.auto_select_region = false;
    expect(resolveShipping(data, { shipping_region_id: 'deleted' })).toEqual({ ready: false, selection: {}, stale: true });
    expect(resolveShipping(data, {})).toEqual({ ready: false, selection: {} });
  });
  it('retains deliberate blank and valid choices when defaults or the automatic policy change', () => {
    const data = config();
    expect(resolveShipping(data, { shipping_region_id: '', shipping_option_id: '' })).toEqual({ ready: false, selection: {} });
    data.auto_select_region = false;
    expect(resolveShipping(data, { shipping_region_id: 'alex' })).toEqual({ ready: true, selection: { shipping_region_id: 'alex', shipping_option_id: 'express' } });
    data.auto_select_region = true; data.regions.reverse();
    expect(resolveShipping(data, { shipping_region_id: 'alex' }).selection.shipping_region_id).toBe('alex');
    const express = data.options[0];
    if (!express) throw new Error('Review configuration requires an express option');
    data.options = [...data.options.map((row) => ({ ...row, is_default: false })), { ...express, id: 'standard', is_default: true, priority: 10 }];
    expect(resolveShipping(data, { shipping_region_id: 'alex', shipping_option_id: 'express' }).selection.shipping_option_id).toBe('express');
    expect(resolveShipping(data, { shipping_region_id: 'alex', shipping_option_id: 'deleted' })).toEqual({ ready: false, selection: { shipping_region_id: 'alex' }, stale: true });
  });
  it('does not quote before configuration loads and drops selections when shipping is disabled', () => {
    expect(resolveShipping(undefined, {}).ready).toBe(false);
    const data = config(); data.enabled = false;
    expect(resolveShipping(data, { shipping_region_id: 'alex' })).toEqual({ ready: true, selection: {} });
    data.enabled = true; data.regions_enabled = false; data.options = [];
    expect(resolveShipping(data, { shipping_region_id: 'alex' })).toEqual({ ready: false, selection: {}, stale: true });
    expect(resolveShipping(data, {})).toEqual({ ready: true, selection: {} });
  });
});
