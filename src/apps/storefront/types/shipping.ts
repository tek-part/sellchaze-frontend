export interface ShippingSelection { shipping_region_id?: string; shipping_option_id?: string; shipping_rate_id?: string; shipping_country?: string }
export interface ShippingOffer { enabled: boolean; currency: string; free_over: string | null }
export interface DeliveryRegion {
  id: string; name: { ar: string; en: string }; country: string; rate: string; enabled: boolean; position: number;
}
export interface DeliveryOption {
  id: string; name: { ar: string; en: string }; description: { ar: string; en: string };
  rate: string; enabled: boolean; is_default: boolean; priority: number; icon_url?: string | null;
}
/** A governorate/city inside a shipping zone. */
export interface ZoneRegion { id: string; name: { ar: string; en: string }; country: string }
/** A zone rate; `amount` is what the shopper pays for it (0.00 when free for this order). */
export interface ZoneRate {
  id: string; name: { ar: string; en: string }; type: 'flat' | 'price' | 'weight';
  price: string; amount: string; free_over: string | null; cod_fee: string | null;
  delivery_time: { ar: string; en: string };
  min_subtotal?: string | null; max_subtotal?: string | null; min_weight_grams?: number | null; max_weight_grams?: number | null;
}
export interface ShippingCountry { code: string; region_required: boolean }
export interface ShippingConfiguration {
  enabled: boolean; regions_enabled: boolean; auto_select_region: boolean;
  currency: string; flat_rate: string; free_over: string | null;
  regions: DeliveryRegion[]; options: DeliveryOption[];
  /** Zones replace regions/options once the store has an enabled zone (absent on older APIs). */
  zones_enabled?: boolean; countries?: ShippingCountry[]; zone_regions?: ZoneRegion[];
  zone?: { id: string; name: { ar: string; en: string } } | null; rates?: ZoneRate[];
}
/** The tax rule a quote applied: store-wide or a country/region override. */
export interface TaxRule { name: { ar: string; en: string } | null; rate: string; included: boolean; shipping: boolean; source?: 'store' | 'override'; amount: string }
export interface QuoteShipping { mode: string; zone: { id: string; name: { ar: string; en: string } } | null; rate_id: string | null; rates: ZoneRate[]; free_shipping_applied: boolean; cod_fee: string; weight_grams?: number | null }
