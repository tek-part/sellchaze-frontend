import type { ShippingConfiguration, ShippingSelection } from '../types/shipping';
import type { CartLine } from '../types/cart';

/** Presentation only; server checkout independently resolves every catalog product. */
export function cartRequiresShipping(lines: ReadonlyArray<Pick<CartLine, 'digitalType'>>): boolean {
  return lines.some((line) => !line.digitalType || line.digitalType === 'physical');
}

/** Defaults come from the current store; removed or disabled selections cannot reach checkout. */
export function resolveShipping(config: ShippingConfiguration | undefined, chosen: ShippingSelection) {
  if (!config?.enabled) return { selection: {} as ShippingSelection, ready: !!config };
  const regions = config.regions_enabled ? config.regions.filter((row) => row.enabled).sort((a, b) => a.position - b.position) : [];
  const options = config.options.filter((row) => row.enabled).sort((a, b) => b.priority - a.priority);
  const region = regions.find((row) => row.id === chosen.shipping_region_id) ?? (config.auto_select_region ? regions[0] : undefined);
  const option = options.find((row) => row.id === chosen.shipping_option_id) ?? options.find((row) => row.is_default);
  const selection: ShippingSelection = { ...(region ? { shipping_region_id: region.id } : {}), ...(option ? { shipping_option_id: option.id } : {}) };
  return { selection, ready: (!config.regions_enabled || !!region) && (!options.length || !!option) };
}
