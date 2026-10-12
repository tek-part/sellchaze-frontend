export interface CampaignAttribution { source: string; campaign: string }

/** Only the two campaign labels are retained; arbitrary query/contact/click fields are excluded. */
export function cleanCampaign(value: unknown): CampaignAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Partial<CampaignAttribution>;
  const clean = (text: unknown, max: number): string | undefined => {
    if (typeof text !== 'string' || /[<>\p{C}\uFFFD]/u.test(text) || [...text].length > max) return undefined;
    const result = text.trim().replace(/\s+/gu, ' ');
    return result || undefined;
  };
  const source = clean(row.source, 100); const campaign = clean(row.campaign, 200);
  return source && campaign ? { source, campaign } : undefined;
}

export function campaignFromSearch(search: string): CampaignAttribution | undefined {
  const params = new URLSearchParams(search);
  if (params.getAll('utm_source').length !== 1 || params.getAll('utm_campaign').length !== 1) return undefined;
  return cleanCampaign({ source: params.get('utm_source'), campaign: params.get('utm_campaign') });
}

