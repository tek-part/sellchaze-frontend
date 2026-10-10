import type { CartLine } from '../types/cart';

export type CartAddition = Omit<CartLine, 'quantity'> & { quantity?: number };
export function sameSku(a: Pick<CartLine, 'productId' | 'variantId'>, b: Pick<CartLine, 'productId' | 'variantId'>): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}
export function skuQuantity(lines: ReadonlyArray<CartLine>, selection: Pick<CartLine, 'productId' | 'variantId'>): number {
  return lines.filter((line) => sameSku(line, selection)).reduce((sum, line) => sum + line.quantity, 0);
}
export function cartLineLimit(lines: ReadonlyArray<CartLine>, line: CartLine): number {
  return Math.max(0, stockCap(line.maxQuantity) - skuQuantity(lines.filter((item) => item.id !== line.id), line));
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
  let remaining = stockCap(line.maxQuantity);
  return candidates.flatMap((item) => {
    if (!sameSku(item, line)) return [item];
    const count = boundedQuantity(item.quantity, remaining);
    remaining -= count;
    const { maxQuantity: _oldCap, ...rest } = item;
    return count > 0 ? [{ ...rest, ...(line.maxQuantity !== undefined ? { maxQuantity: line.maxQuantity } : {}), quantity: count }] : [];
  });
}
export function changeCartQuantity(lines: ReadonlyArray<CartLine>, id: string, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity)) return [...lines];
  return lines.flatMap((line) => {
    if (line.id !== id) return [line];
    const next = boundedQuantity(quantity, cartLineLimit(lines, line));
    return next > 0 ? [{ ...line, quantity: next }] : [];
  });
}
