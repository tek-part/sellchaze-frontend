import { describe, it, expect } from 'vitest';
import { applyProductAiDraft, productAiDescription } from './product-ai-draft';

const copy = { name: 'Generated', description: ['Cotton <script>alert(1)</script>'], features: ['A & B'], faqs: [{ question: 'Washable?', answer: 'Yes.' }], reviews: ['Comfortable handles.'] };
const draft = { name: 'Original', description: '<p>Original</p>', price: '40', seo_title: 'Keep SEO', product_preferences: { is_skip_cart: true }, preferences_version: 'v1', translations: { name: { en: 'Original', ar: 'قديم' }, description: { ar: '<p>قديم</p>' } } };
describe('product AI draft application', () => {
    it('escapes generated copy and uses application-owned headings and feedback provenance', () => {
        const html = productAiDescription(copy, ['description', 'features', 'faqs', 'reviews'], 'en');
        expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>'); expect(html).toContain('A &amp; B');
        expect(html).toContain('AI-assisted summaries of feedback supplied by the merchant.'); expect(html).not.toContain('rating');
    });
    it('changes only selected localized fields while preserving base content, other locales and settings', () => {
        const next = applyProductAiDraft(draft, { copy, parts: ['name', 'description'], locale: 'ar' }, 'en');
        expect(next.name).toBe('Original'); expect(next.description).toBe('<p>Original</p>');
        expect(next.translations.name).toEqual({ en: 'Original', ar: 'Generated' }); expect(next.translations.description.ar).toContain('Cotton');
        expect(next.preferences_version).toBe('v1'); expect(next.product_preferences).toEqual(draft.product_preferences); expect(next.price).toBe('40');
        expect(draft.translations.name.ar).toBe('قديم');
    });
    it('updates the base and its translation together and appends requested sections without replacing unselected copy', () => {
        const next = applyProductAiDraft(draft, { copy, parts: ['name', 'features'], locale: 'en' }, 'en');
        expect(next.name).toBe('Generated'); expect(next.translations.name.en).toBe('Generated');
        expect(next.description).toBe('<p>Original</p><h2>Features</h2><ul><li>A &amp; B</li></ul>');
        expect(next.seo_title).toBe('Keep SEO');
    });
    it('does not alter a description for empty additional sections and rejects combined content over the existing save limit', () => {
        const empty = { ...copy, reviews: [] };
        expect(applyProductAiDraft(draft, { copy: empty, parts: ['reviews'], locale: 'en' }, 'en')).toEqual(draft);
        expect(applyProductAiDraft(draft, { copy: { ...empty, description: [] }, parts: ['description'], locale: 'en' }, 'en')).toEqual(draft);
        expect(() => applyProductAiDraft({ ...draft, description: 'x'.repeat(20000) }, { copy, parts: ['features'], locale: 'en' }, 'en')).toThrow('description_limit');
    });
});
