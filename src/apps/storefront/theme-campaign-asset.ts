/** Packaged campaign images live beside the deployed JS, rather than on a tenant's API host. */
export function themeCampaignAsset(value: string | undefined, moduleUrl = import.meta.url): string | undefined {
  if (!value?.startsWith('/media/theme-campaigns/')) return value;
  const base = new URL(moduleUrl);
  return base.protocol === 'https:' || base.protocol === 'http:' ? new URL(value, base).href : value;
}
