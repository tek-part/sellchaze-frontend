/** Packaged preview media follows the deployed script origin, including on merchant domains. */
export function funnelCatalogAsset(value: string, moduleUrl = import.meta.url): string {
  if (!value.startsWith('/media/funnel-campaigns/')) return value;
  const base = new URL(moduleUrl);
  return /^https?:$/.test(base.protocol) ? new URL(value, base).href : value;
}
