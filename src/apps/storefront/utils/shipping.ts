import type { ShippingConfiguration, ShippingSelection, TaxRule, ZoneRegion } from '../types/shipping';
import type { CartLine } from '../types/cart';

/** The offer uses base currency; apply the same display conversion as catalog prices. */
export function shippingThreshold(offer: import('../types/shipping').ShippingOffer | undefined, currency: string, multipliers: Readonly<Record<string, number>>): number | undefined {
  if (!offer?.enabled || offer.free_over === null || !/^\d+(?:\.\d{1,2})?$/.test(offer.free_over)) return undefined;
  const rate = currency === offer.currency ? 1 : multipliers[currency];
  const amount = Number(offer.free_over);
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || !rate || rate < 0) return undefined;
  const threshold = Math.round(amount * rate * 100) / 100;
  return Number.isFinite(threshold) ? threshold : undefined;
}

/** Presentation only; server checkout independently resolves every catalog product. */
export function cartRequiresShipping(lines: ReadonlyArray<Pick<CartLine, 'digitalType'>>): boolean {
  return lines.some((line) => !line.digitalType || line.digitalType === 'physical');
}

export function cartHasFreeShippingOffer(lines: ReadonlyArray<Pick<CartLine, 'digitalType' | 'quantityOffer'>>): boolean {
  return lines.some((line) => (!line.digitalType || line.digitalType === 'physical') && line.quantityOffer?.freeShipping === true);
}

/** Defaults come from the current store; removed or disabled selections cannot reach checkout. */
export function resolveShipping(config: ShippingConfiguration | undefined, chosen: ShippingSelection): { selection: ShippingSelection; ready: boolean; stale?: boolean } {
  if (!config?.enabled) return { selection: {} as ShippingSelection, ready: !!config };
  const regions = config.regions_enabled ? config.regions.filter((row) => row.enabled).sort((a, b) => a.position - b.position) : [];
  const options = config.options.filter((row) => row.enabled).sort((a, b) => b.priority - a.priority);
  const region = chosen.shipping_region_id !== undefined ? regions.find((row) => row.id === chosen.shipping_region_id) : (config.auto_select_region ? regions[0] : undefined);
  const option = chosen.shipping_option_id !== undefined ? options.find((row) => row.id === chosen.shipping_option_id) : options.find((row) => row.is_default);
  // A default is for an untouched form. Never replace an explicit destination or delivery method.
  const stale = Boolean((chosen.shipping_region_id && !region) || (chosen.shipping_option_id && !option));
  const selection: ShippingSelection = { ...(region ? { shipping_region_id: region.id } : {}), ...(option ? { shipping_option_id: option.id } : {}) };
  return { selection, ready: !stale && (!config.regions_enabled || !!region) && (!options.length || !!option), ...(stale ? { stale: true } : {}) };
}

/**
 * Zones: the address (country, then region) picks the zone on the server. The form is ready once a
 * served country is chosen and, where the zone only covers named regions, a region. The rate is
 * optional: the server applies the cheapest eligible rate until the shopper picks another.
 */
export function resolveZoneShipping(config: ShippingConfiguration | undefined, chosen: ShippingSelection, country: string): { selection: ShippingSelection; ready: boolean; stale?: boolean; unsupported?: boolean; regions: ZoneRegion[]; regionRequired: boolean } {
  const code = country.trim().toUpperCase();
  const served = config?.countries?.find((row) => row.code === code);
  const regions = code ? (config?.zone_regions ?? []).filter((row) => row.country === code) : [];
  const region = chosen.shipping_region_id ? regions.find((row) => row.id === chosen.shipping_region_id) : undefined;
  const stale = Boolean(chosen.shipping_region_id && !region);
  const selection: ShippingSelection = { ...(code ? { shipping_country: code } : {}), ...(region ? { shipping_region_id: region.id } : {}), ...(chosen.shipping_rate_id ? { shipping_rate_id: chosen.shipping_rate_id } : {}) };
  const regionRequired = served?.region_required ?? false;
  return { selection, ready: !!served && !stale && (!regionRequired || !!region), regions, regionRequired, ...(stale ? { stale: true } : {}), ...(code && !served ? { unsupported: true } : {}) };
}

/** "VAT 14% (included)": the merchant's name, the rate unless the name already states it, and whether prices include it. */
export function taxLineLabel(tax: TaxRule | null | undefined, locale: string): string {
  const ar = locale === 'ar';
  const fallback = ar ? 'الضريبة' : 'Tax';
  if (!tax) return fallback;
  const name = (tax.name?.[ar ? 'ar' : 'en'] || tax.name?.en || '').trim() || fallback;
  const rate = Number(tax.rate);
  const percent = Number.isFinite(rate) ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(rate)}%` : '';
  const withRate = name.includes('%') || name.includes('٪') || !percent ? name : `${name} ${percent}`;
  return tax.included ? `${withRate} ${ar ? '(شاملة)' : '(included)'}` : withRate;
}
