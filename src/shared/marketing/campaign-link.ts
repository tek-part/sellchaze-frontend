import { cleanCampaign } from './campaign';

export function buildCampaignUrl(address: string, source: string, campaign: string): string | undefined {
  const attribution = cleanCampaign({ source, campaign });
  if (!attribution || address.length > 2048) return undefined;
  try {
    const url = new URL(address.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
    url.searchParams.set('utm_source', attribution.source);
    url.searchParams.set('utm_campaign', attribution.campaign);
    return url.toString();
  } catch { return undefined; }
}
