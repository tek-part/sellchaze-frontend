import { describe, expect, it } from 'vitest';
import { campaignFromSearch, cleanCampaign } from './campaign';
import { buildCampaignUrl } from './campaign-link';

describe('campaign links and attribution', () => {
  it('preserves product selections and fragments while replacing duplicate tracking labels in the actual query', () => {
    const result = buildCampaignUrl('https://shop.example.com/products/bag?variant=12&utm_source=old&utm_source=duplicate&keep=1#details', 'meta social', 'ساعات & عروض');
    expect(result).toBeDefined(); const url = new URL(result!);
    expect(url.searchParams.get('variant')).toBe('12'); expect(url.searchParams.get('keep')).toBe('1'); expect(url.hash).toBe('#details');
    expect(url.searchParams.getAll('utm_source')).toEqual(['meta social']);
    expect(url.searchParams.get('utm_campaign')).toBe('ساعات & عروض');
    expect(campaignFromSearch(url.search)).toEqual({ source: 'meta social', campaign: 'ساعات & عروض' });
  });
  it('rejects unsafe destinations, credentials and unbounded or malformed campaign labels', () => {
    for (const address of ['javascript:alert(1)', 'mailto:a@example.com', 'data:text/plain,a', 'https://user:secret@shop.example.com', 'not a URL']) expect(buildCampaignUrl(address, 'meta', 'test')).toBeUndefined();
    for (const source of ['', ' '.repeat(4), 'a'.repeat(101), '<script>', 'meta\nprivate', 'meta\u200b']) expect(cleanCampaign({ source, campaign: 'test' })).toBeUndefined();
    expect(cleanCampaign({ source: 'meta', campaign: 'a'.repeat(201) })).toBeUndefined();
    expect(campaignFromSearch('?utm_source=a&utm_source=b&utm_campaign=test')).toBeUndefined();
    expect(campaignFromSearch('?utm_source=meta')).toBeUndefined();
  });
  it('keeps only the normalized source and name and excludes unrelated private query fields', () => {
    expect(cleanCampaign({ source: '  meta   social ', campaign: '\u00a0Spring  sale\u00a0', privateContact: 'NEVER-KEEP', url: 'https://private' })).toEqual({ source: 'meta social', campaign: 'Spring sale' });
    expect(campaignFromSearch('?utm_source=meta&utm_campaign=test&email=PRIVATE&token=PRIVATE&fbclid=PRIVATE')).toEqual({ source: 'meta', campaign: 'test' });
  });
});
