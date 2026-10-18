import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { resolveSectionSettings } from '../../sections-lib/schema';
import { walletTheme } from './index';
import { fashionTheme } from '../hype-fashion';
import { walletCampaignSchema, walletLookSchema } from './sections';
import { WALLET_CATALOG } from '../../content/demo/elite-wallets';
import { sampleProductDetail, sampleNewest } from '../../dev/sampleData';
describe('Native Elite Wallets package', () => {
  it('preserves the sample catalog item when opening its product page in either language', () => {
    for (const locale of ['en', 'ar']) for (const card of sampleNewest('elite-wallets', locale)) {
      const detail = sampleProductDetail(card.handle!, 'elite-wallets', locale);
      expect(detail.id).toBe(card.id); expect(detail.title).toBe(card.title);
      expect(detail.price).toBe(card.price); expect(detail.currency).toBe(card.currency);
      expect(detail.images).toEqual([card.image]); expect(detail.variants ?? []).toEqual([]);
      expect(detail.descriptionHtml).not.toMatch(/cashmere|wardrobe|Small|Medium/);
    }
  });
  it('loads independent chrome and exports all ten editable home sections and real commerce pages', async () => {
    const entry = getCatalogEntry('elite-wallets')!; expect(await entry.load()).toBe(walletTheme);
    expect(walletTheme.layouts?.['default']).not.toBe(fashionTheme.layouts?.['default']);
    const manifest = buildBackendManifest(walletTheme, entry);
    expect(manifest.bundle_url).toBe('builtin:elite-wallets@1.0.0');
    expect(manifest.templates['home']?.sections.map(section => section.type)).toEqual(['wallet-campaign', 'wallet-categories', 'wallet-shelf', 'wallet-comparison', 'wallet-shelf', 'wallet-linked-look', 'wallet-shelf', 'wallet-editorial', 'wallet-shelf', 'wallet-newsletter']);
    for (const page of Object.values(manifest.templates)) for (const section of page.sections) {
      expect(walletTheme.sections?.[section.type]).toBeDefined(); expect(manifest.sections_schema[section.type]).toBeDefined();
    }
    expect(manifest.sections_schema['wallet-linked-look']?.settings.find(field => field.id === 'products')?.type).toBe('list');
  });
  it('does not publish another merchant’s offers, reviews or product fixtures as default content', () => {
    expect(JSON.stringify(walletTheme.defaultSettings)).not.toMatch(/free shipping|5k|MOMENTO/i);
    const campaign = resolveSectionSettings(walletCampaignSchema, {}, 'en');
    expect(JSON.stringify(campaign)).not.toMatch(/free shipping|5k|MOMENTO/i);
    expect(resolveSectionSettings(walletLookSchema, {}, 'en')['products']).toEqual([]);
    expect(WALLET_CATALOG.testimonials).toEqual([]);
    expect(WALLET_CATALOG.products.every(product => product.badge === 'Sample' && !product.reviewCount && !product.rating)).toBe(true);
  });
});
