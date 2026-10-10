import type { CartLine } from '../types/cart';

export type CartAddition = Omit<CartLine, 'quantity'> & { quantity?: number };
export function sameSku(a: Pick<CartLine, 'productId' | 'variantId'>, b: Pick<CartLine, 'productId' | 'variantId'>): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}
export function skuQuantity(lines: ReadonlyArray<CartLine>, selection: Pick<CartLine, 'productId' | 'variantId'>): number {
  return lines.filter((line) => sameSku(line, selection)).reduce((sum, line) => sum + line.quantity, 0);
}
export function cartLineLimit(lines: ReadonlyArray<CartLine>, line: CartLine): number {
  return cartAdditionLimit(lines.filter((item) => item.id !== line.id), line);
}
export function cartAdditionLimit(lines: ReadonlyArray<CartLine>, line: Pick<CartLine, 'productId' | 'variantId' | 'digitalType' | 'maxQuantity' | 'sharedMaxQuantity' | 'orderMaxQuantity'>): number {
  const skuRemaining = stockCap(line.maxQuantity) - skuQuantity(lines, line);
  const productLines = lines.filter((item) => item.productId === line.productId);
  const sharedCaps = [line, ...productLines].filter((item) => item.digitalType === 'codes' && item.sharedMaxQuantity !== undefined).map((item) => stockCap(item.sharedMaxQuantity));
  const sharedCap = line.digitalType === 'codes' && line.sharedMaxQuantity !== undefined ? stockCap(line.sharedMaxQuantity) : sharedCaps.length ? Math.min(...sharedCaps) : Number.MAX_SAFE_INTEGER;
  const poolRemaining = sharedCap - productLines.reduce((sum, item) => sum + item.quantity, 0);
  const orderCaps = [line, ...productLines].filter((item) => item.orderMaxQuantity !== undefined).map((item) => stockCap(item.orderMaxQuantity));
  const orderCap = line.orderMaxQuantity !== undefined ? stockCap(line.orderMaxQuantity) : orderCaps.length ? Math.min(...orderCaps) : Number.MAX_SAFE_INTEGER;
  const orderRemaining = orderCap - productLines.reduce((sum, item) => sum + item.quantity, 0);
  return Math.max(0, Math.min(skuRemaining, poolRemaining, orderRemaining));
}
/** Restore saved limits as aggregate constraints, keeping earlier buyer selections first. */
export function normalizeCartLines(lines: ReadonlyArray<CartLine>): CartLine[] {
  const accepted: CartLine[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (seen.has(line.id)) continue;
    seen.add(line.id);
    // Every line sees the strictest recorded shared cap, including a later saved observation.
    const sharedCaps = lines.filter((item) => item.productId === line.productId && item.digitalType === 'codes' && item.sharedMaxQuantity !== undefined).map((item) => stockCap(item.sharedMaxQuantity));
    const skuCaps = lines.filter((item) => sameSku(item, line) && item.maxQuantity !== undefined).map((item) => stockCap(item.maxQuantity));
    const orderCaps = lines.filter((item) => item.productId === line.productId && item.orderMaxQuantity !== undefined).map((item) => stockCap(item.orderMaxQuantity));
    const candidate = { ...line, ...(orderCaps.length ? { orderMaxQuantity: Math.min(...orderCaps) } : {}), ...(skuCaps.length ? { maxQuantity: Math.min(...skuCaps) } : {}), ...(sharedCaps.length ? { digitalType: 'codes' as const, sharedMaxQuantity: Math.min(...sharedCaps) } : {}) };
    const quantity = boundedQuantity(candidate.quantity, cartAdditionLimit(accepted, candidate));
    if (quantity > 0) accepted.push({ ...candidate, quantity });
  }
  return accepted;
}
export function stockCap(max?: number): number {
  return max === undefined ? Number.MAX_SAFE_INTEGER : Number.isFinite(max) ? Math.max(0, Math.floor(max)) : 0;
}
export function boundedQuantity(quantity: number, max?: number): number {
  return Number.isFinite(quantity) ? Math.min(stockCap(max), Math.max(0, Math.floor(quantity))) : 0;
}
export function addCartLine(lines: ReadonlyArray<CartLine>, line: CartAddition): CartLine[] {
  const requested = boundedQuantity(line.quantity ?? 1);
  if (requested === 0) return [...lines];
  const existing = lines.find((item) => item.id === line.id);
  const quantity = (existing?.quantity ?? 0) + requested;
  // The latest catalog observation refreshes price and stock, including switching to untracked.
  const next: CartLine = { ...line, quantity };
  const candidates = existing ? lines.map((item) => item.id === line.id ? next : item) : [...lines, next];
  return normalizeCartLines(candidates.map((item) => {
    let updated = item;
    if (sameSku(item, line)) {
      const { maxQuantity: _oldCap, ...rest } = item;
      updated = { ...rest, ...(line.maxQuantity !== undefined ? { maxQuantity: line.maxQuantity } : {}) };
    }
    if (item.productId === line.productId && line.digitalType === 'codes') {
      updated = { ...updated, digitalType: 'codes', ...(line.sharedMaxQuantity !== undefined ? { sharedMaxQuantity: line.sharedMaxQuantity } : {}) };
    }
    if (item.productId === line.productId) {
      const { orderMaxQuantity: _oldOrderCap, ...rest } = updated;
      updated = { ...rest, ...(line.orderMaxQuantity !== undefined ? { orderMaxQuantity: line.orderMaxQuantity } : {}) };
    }
    return updated;
  }));
}
export function changeCartQuantity(lines: ReadonlyArray<CartLine>, id: string, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity)) return [...lines];
  return lines.flatMap((line) => {
    if (line.id !== id) return [line];
    const next = boundedQuantity(quantity, cartLineLimit(lines, line));
    return next > 0 ? [{ ...line, quantity: next }] : [];
  });
}
