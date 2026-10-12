export interface ReferralAttribution { code: string; product_id: number }

export function cleanReferralCode(value: unknown): string | undefined {
  return typeof value === 'string' && [...value].length <= 100 && /^[\p{L}\p{N}_.-]+$/u.test(value) ? value : undefined;
}
export function cleanReferral(value: unknown): ReferralAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Partial<ReferralAttribution>; const code = cleanReferralCode(row.code);
  return code && Number.isSafeInteger(row.product_id) && row.product_id! > 0 ? { code, product_id: row.product_id! } : undefined;
}
export function referralFromSearch(search: string, productId: number): ReferralAttribution | undefined {
  const params = new URLSearchParams(search);
  return params.getAll('ref').length === 1 ? cleanReferral({ code: params.get('ref'), product_id: productId }) : undefined;
}

export function buildReferralUrl(origin: string, productId: number, code: string): string | undefined {
  if (!cleanReferral({ code, product_id: productId })) return undefined;
  try {
    const url = new URL(origin);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
    url.pathname = `/products/${productId}/ref/${encodeURIComponent(code)}`; url.search = ''; url.hash = '';
    return url.href;
  } catch { return undefined; }
}
