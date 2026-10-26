import { describe, expect, it } from 'vitest';
import { countryAccepted, countryPolicyText } from './country-restriction';

describe('checkout country restriction', () => {
  const allow = { mode: 'allow' as const, countries: ['EG', 'SA'], message: 'No delivery there.' };
  const block = { mode: 'block' as const, countries: ['US'], message: 'No delivery there.' };

  it('accepts listed countries for an allow-list and refuses them for a block-list', () => {
    expect(countryAccepted(allow, 'eg')).toBe(true);
    expect(countryAccepted(allow, 'US')).toBe(false);
    expect(countryAccepted(block, 'US')).toBe(false);
    expect(countryAccepted(block, 'EG')).toBe(true);
    expect(countryAccepted(allow, undefined)).toBe(true);
    expect(countryAccepted(null, 'US')).toBe(true);
  });

  it('explains the policy with localized country names', () => {
    expect(countryPolicyText(allow, 'en')).toBe('This store delivers to: Egypt, Saudi Arabia.');
    expect(countryPolicyText(block, 'en')).toBe('This store does not deliver to: United States.');
    expect(countryPolicyText(allow, 'ar')).toContain('مصر');
  });
});
