import type { CartLine } from '../types/cart';

export type CartAddition = Omit<CartLine, 'quantity'> & { quantity?: number };
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
  const quantity = boundedQuantity((existing?.quantity ?? 0) + requested, line.maxQuantity);
  if (quantity === 0) return lines.filter((item) => item.id !== line.id);
  // The latest catalog observation refreshes price and stock, including switching to untracked.
  const next: CartLine = { ...line, quantity };
  return existing ? lines.map((item) => item.id === line.id ? next : item) : [...lines, next];
}
export function changeCartQuantity(lines: ReadonlyArray<CartLine>, id: string, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity)) return [...lines];
  return lines.flatMap((line) => {
    if (line.id !== id) return [line];
    const next = boundedQuantity(quantity, line.maxQuantity);
    return next > 0 ? [{ ...line, quantity: next }] : [];
  });
}
