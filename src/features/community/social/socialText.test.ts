import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain JS module without type declarations
import { decorateSocialHtml, extractHashtags } from './socialText';

describe('extractHashtags', () => {
    it('finds latin and arabic hashtags', () => {
        expect(extractHashtags('<p>عرض #توريد جديد #steel اليوم</p>')).toEqual(['توريد', 'steel']);
    });

    it('deduplicates case-insensitively and caps at 10', () => {
        expect(extractHashtags('#Steel #steel #STEEL')).toEqual(['steel']);
        const many = Array.from({ length: 15 }, (_, i) => `#tag${i}`).join(' ');
        expect(extractHashtags(many)).toHaveLength(10);
    });

    it('ignores mid-word hashes and too-short tags', () => {
        expect(extractHashtags('price#7 and #a')).toEqual([]);
    });
});

describe('decorateSocialHtml', () => {
    it('linkifies hashtags to the tag page', () => {
        const out = decorateSocialHtml('<p>فرصة #تصدير</p>');
        expect(out).toContain('href="/community/tag/%D8%AA%D8%B5%D8%AF%D9%8A%D8%B1"');
        expect(out).toContain('class="sc-hashtag"');
    });

    it('styles stored mention anchors without duplicating classes', () => {
        const once = decorateSocialHtml('<p><a data-mention href="/u/acme">@Acme</a></p>');
        expect(once).toContain('class="sc-mention"');
        expect(decorateSocialHtml(once)).toBe(once);
    });

    it('leaves normal markup alone', () => {
        const html = '<p><strong>bold</strong> and <a href="/x">link</a></p>';
        expect(decorateSocialHtml(html)).toBe(html);
    });
});
