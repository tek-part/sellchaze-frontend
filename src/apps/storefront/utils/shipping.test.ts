import { describe, expect, it } from 'vitest';
import { resolveShipping } from './shipping';
import type { ShippingConfiguration } from '../types/shipping';

const config = (): ShippingConfiguration => ({ enabled: true, regions_enabled: true, auto_select_region: true, currency: 'EGP', flat_rate: '25', free_over: null,
  regions: [{ id: 'alex', name: { ar: 'الإسكندرية', en: 'Alexandria' }, country: 'EG', rate: '60', enabled: true, position: 2 }, { id: 'cairo', name: { ar: 'القاهرة', en: 'Cairo' }, country: 'EG', rate: '40', enabled: true, position: 1 }],
  options: [{ id: 'express', name: { ar: 'سريع', en: 'Express' }, description: { ar: '', en: '' }, enabled: true, is_default: true, priority: 1, rate: '85' }] });

describe('delivery selection', () => {
  it('uses ordered regions and the merchant default, preserving valid buyer choices', () => {
    expect(resolveShipping(config(), {})).toEqual({ ready: true, selection: { shipping_region_id: 'cairo', shipping_option_id: 'express' } });
    expect(resolveShipping(config(), { shipping_region_id: 'alex' }).selection.shipping_region_id).toBe('alex');
  });
  it('requires an explicit choice when automatic selection is disabled', () => {
    const data = config(); data.auto_select_region = false; data.options = data.options.map((row) => ({ ...row, is_default: false }));
    expect(resolveShipping(data, {})).toEqual({ ready: false, selection: {} });
    expect(resolveShipping(data, { shipping_region_id: 'cairo', shipping_option_id: 'express' }).ready).toBe(true);
  });
  it('discards stale and disabled IDs after settings refresh', () => {
    const data = config(); data.regions = data.regions.map((row) => ({ ...row, enabled: row.id !== 'cairo' })); data.options = data.options.map((row) => ({ ...row, enabled: false }));
    expect(resolveShipping(data, { shipping_region_id: 'cairo', shipping_option_id: 'express' })).toEqual({ ready: true, selection: { shipping_region_id: 'alex' } });
    data.auto_select_region = false;
    expect(resolveShipping(data, { shipping_region_id: 'deleted' }).ready).toBe(false);
  });
  it('does not quote before configuration loads and drops selections when shipping is disabled', () => {
    expect(resolveShipping(undefined, {}).ready).toBe(false);
    const data = config(); data.enabled = false;
    expect(resolveShipping(data, { shipping_region_id: 'alex' })).toEqual({ ready: true, selection: {} });
    data.enabled = true; data.regions_enabled = false; data.options = [];
    expect(resolveShipping(data, { shipping_region_id: 'alex' })).toEqual({ ready: true, selection: {} });
  });
});
