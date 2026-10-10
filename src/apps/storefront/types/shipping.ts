export interface ShippingSelection { shipping_region_id?: string; shipping_option_id?: string }
export interface DeliveryRegion {
  id: string; name: { ar: string; en: string }; country: string; rate: string; enabled: boolean; position: number;
}
export interface DeliveryOption {
  id: string; name: { ar: string; en: string }; description: { ar: string; en: string };
  rate: string; enabled: boolean; is_default: boolean; priority: number; icon_url?: string | null;
}
export interface ShippingConfiguration {
  enabled: boolean; regions_enabled: boolean; auto_select_region: boolean;
  currency: string; flat_rate: string; free_over: string | null;
  regions: DeliveryRegion[]; options: DeliveryOption[];
}
