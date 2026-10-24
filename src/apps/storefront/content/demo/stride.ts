/**
 * Stride demo catalogue — the Voltage products (the shipped catalogue the brief assigns), with a
 * stock count on two items so the preview can show Stride's low-stock badge. No new products,
 * titles or imagery are invented here; the Arabic overlay is Voltage's own (ids are unchanged).
 *
 * Known mismatch: Voltage is an electronics catalogue, so a Stride preview shows keyboards and
 * monitors in a sports layout until a sports catalogue is added.
 */
import type { DemoCatalog } from './types';
import { VOLTAGE_CATALOG } from './voltage';

const STOCK: Readonly<Record<string, number>> = { p3: 3, p10: 2 };

export const STRIDE_CATALOG: DemoCatalog = {
  ...VOLTAGE_CATALOG,
  products: VOLTAGE_CATALOG.products.map((p) => (p.id in STOCK ? { ...p, availableStock: STOCK[p.id] } : p)),
};
