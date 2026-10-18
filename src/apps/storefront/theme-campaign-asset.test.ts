import { expect, it } from 'vitest';
import { themeCampaignAsset } from './theme-campaign-asset';
it('resolves packaged desktop and phone campaigns from the script origin on any tenant host', () => {
 const base = 'https://static.example.test/assets/theme-hashed.js';
 expect(themeCampaignAsset('/media/theme-campaigns/blast-pets-cat-v1.png', base)).toBe('https://static.example.test/media/theme-campaigns/blast-pets-cat-v1.png');
 expect(themeCampaignAsset('/media/theme-campaigns/nature-pets-cat-mobile-v1.png', base)).toBe('https://static.example.test/media/theme-campaigns/nature-pets-cat-mobile-v1.png');
 expect(themeCampaignAsset('/media/theme-campaigns/nature-kids-pink-desktop-v1.png', 'http://preview.localhost:5247/src/theme.ts')).toBe('http://preview.localhost:5247/media/theme-campaigns/nature-kids-pink-desktop-v1.png');
});
it('preserves merchant uploads, remote media, links and an absent image', () => {
 for (const value of ['/storage/stores/12/cat.png','https://merchant.example/cat.png','/collections/cat','/media/merchant-image.png',undefined]) expect(themeCampaignAsset(value)).toBe(value);
 expect(themeCampaignAsset('/media/theme-campaigns/cat.png', 'file:///repo/theme.ts')).toBe('/media/theme-campaigns/cat.png');
});
