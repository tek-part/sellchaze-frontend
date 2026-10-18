import type { ApiProduct } from '../api/types';

/** Only public HTTP images or same-origin absolute paths are usable in campaign content. */
export function campaignUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || Array.from(value).some(char => char.charCodeAt(0) <= 32 || char === '\\')) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}

/** Require an explicit offset: an expiry must not change with a visitor's timezone. */
export function offerRemaining(expiry: unknown, now: number): number | null {
  if (typeof expiry !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(expiry)) return null;
  const time = Date.parse(expiry);
  return Number.isFinite(time) ? Math.max(0, Math.floor((time - now) / 1000)) : null;
}

export function productPictures(product: ApiProduct | null, selected?: string | null): string[] {
  return [...new Set([selected, product?.image_url, product?.image, ...(product?.images ?? []), ...(product?.media ?? []).filter(item => item.type === 'image').map(item => item.url)].map(campaignUrl).filter((url): url is string => !!url))];
}

export function specificationRows(product: ApiProduct | null): Array<{ label: string; value: string }> {
  const specs = product?.specifications;
  const scalar = (value: unknown): value is string | number => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
  if (Array.isArray(specs)) return specs.flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>; const label = item['label'] ?? item['name']; const value = item['value'];
    return scalar(label) && scalar(value) ? [{ label: String(label), value: String(value) }] : [];
  });
  return specs && typeof specs === 'object' ? Object.entries(specs).flatMap(([label, value]) => scalar(value) ? [{ label, value: String(value) }] : []) : [];
}
