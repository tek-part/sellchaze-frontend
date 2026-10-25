import { describe, expect, it } from 'vitest';
import { articleForm, articlePayload, articleTitle, fieldErrors, slugify, validSlug } from './storeArticles';

describe('store article helpers', () => {
    it('builds slugs the backend accepts, including Arabic titles', () => {
        expect(slugify('  Summer Sale: 50% OFF!! ')).toBe('summer-sale-50-off');
        expect(slugify('عروض الصيف الجديدة')).toBe('عروض-الصيف-الجديدة');
        expect(slugify('مَقالٌ')).toBe('مقال');
        expect(slugify('x'.repeat(300))).toHaveLength(180);
        for (const slug of ['summer-sale-50-off', 'عروض-الصيف', 'a_b']) expect(validSlug(slug)).toBe(true);
        for (const slug of ['', '-a', 'a--b', 'a b', 'a/b']) expect(validSlug(slug)).toBe(false);
    });
    it('keeps every supported locale and sends empty fields as null', () => {
        const form = articleForm({ slug: 'hello', draft: { en: { title: 'Hello', body: '<p>Hi</p>' } } }, ['ar', 'en']);
        expect(Object.keys(form.draft)).toEqual(['ar', 'en']);
        expect(form.draft.ar.title).toBe('');
        const payload = articlePayload(form, 4);
        expect(payload).toMatchObject({ slug: 'hello', version: 4 });
        expect(payload.draft.en).toEqual({ title: 'Hello', excerpt: null, body: '<p>Hi</p>', image: null, seo_title: null, seo_description: null, date: null });
        expect(articlePayload(form).version).toBeUndefined();
    });
    it('picks the title from the preferred locale and maps validation errors to fields', () => {
        expect(articleTitle({ draft: { en: { title: 'Hello' }, ar: { title: '' } } }, ['ar', 'en'])).toBe('Hello');
        expect(fieldErrors({ slug: ['Taken'], 'draft.ar.title': ['Too long'], draft: ['Bad locale'] })).toEqual({ fields: { slug: 'Taken', 'draft.ar.title': 'Too long' }, general: 'Bad locale' });
    });
});
