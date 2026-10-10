import type { CartLine } from '../types/cart';
import { normalizeCartLines } from './cart-quantity';

export const cartStorageKey = (storeId: string, currency: string): string =>
  `sf-cart-v2:${encodeURIComponent(storeId)}:${encodeURIComponent(currency)}`;

function validLine(value: unknown, currency: string): value is CartLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Partial<CartLine>;
  const safeUrl = (url: unknown): boolean => typeof url === 'string' && /^(https?:\/\/|\/(?!\/))/i.test(url);
  return typeof line.id === 'string' && line.id.length > 0 &&
    typeof line.productId === 'string' && line.productId.length > 0 &&
    (line.variantId === undefined || typeof line.variantId === 'string') &&
    typeof line.title === 'string' && typeof line.url === 'string' && /^\/products\/[a-z0-9-]+$/.test(line.url) &&
    (line.image === undefined || safeUrl(line.image)) &&
    (line.attributes === undefined || typeof line.attributes === 'string') &&
    line.currency === currency && typeof line.price === 'number' && Number.isFinite(line.price) && line.price >= 0 &&
    typeof line.quantity === 'number' && Number.isFinite(line.quantity) &&
    (line.personalization === undefined || (line.personalization !== null && typeof line.personalization === 'object' && !Array.isArray(line.personalization) && Object.values(line.personalization).every((item) => typeof item === 'string'))) &&
    (line.personalizationEntries === undefined || (Array.isArray(line.personalizationEntries) && line.personalizationEntries.every((entry) => entry && typeof entry.key === 'string' && typeof entry.label === 'string' && ['text', 'image'].includes(entry.type) && (entry.value === undefined || typeof entry.value === 'string') && (entry.filename === undefined || typeof entry.filename === 'string') && (entry.url == null || safeUrl(entry.url)))));
}

/** Unscoped v1 arrays cannot prove their store of origin and are deliberately not imported. */
export function decodeCart(raw: string | null, storeId: string, currency: string): CartLine[] | null {
  if (raw === null) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const envelope = data as { version?: unknown; storeId?: unknown; currency?: unknown; lines?: unknown };
    if (envelope.version !== 2 || envelope.storeId !== storeId || envelope.currency !== currency || !Array.isArray(envelope.lines)) return null;
    return normalizeCartLines(envelope.lines.filter((line) => validLine(line, currency)));
  } catch { return null; }
}

export function encodeCart(lines: ReadonlyArray<CartLine>, storeId: string, currency: string): string {
  return JSON.stringify({ version: 2, storeId, currency, lines });
}

export function loadCart(storage: Pick<Storage, 'getItem'> | undefined, storeId: string, currency: string): CartLine[] {
  if (!storage || !storeId) return [];
  try { return decodeCart(storage.getItem(cartStorageKey(storeId, currency)), storeId, currency) ?? []; }
  catch { return []; }
}
