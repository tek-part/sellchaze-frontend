import { describe, expect, it } from 'vitest';
import { isAnySection, isSection } from './activeSection';

describe('isSection', () => {
    it('matches the section root itself', () => {
        expect(isSection('/products', '/products')).toBe(true);
        expect(isSection('/community', '/community')).toBe(true);
    });

    it('matches anything nested under the section', () => {
        expect(isSection('/orders/in', '/orders')).toBe(true);
        expect(isSection('/orders/123/edit', '/orders')).toBe(true);
        expect(isSection('/community/groups/7', '/community')).toBe(true);
    });

    it('does not match a sibling that shares a prefix', () => {
        expect(isSection('/products-import', '/products')).toBe(false);
        expect(isSection('/communityx', '/community')).toBe(false);
    });

    it('does not match an unrelated section', () => {
        expect(isSection('/dashboard', '/orders')).toBe(false);
        expect(isSection('/reels', '/community')).toBe(false);
    });

    it('ignores a trailing slash on either side', () => {
        expect(isSection('/orders/', '/orders')).toBe(true);
        expect(isSection('/orders/in/', '/orders/')).toBe(true);
    });

    it('treats the root path exactly', () => {
        expect(isSection('/', '/')).toBe(true);
        expect(isSection('/dashboard', '/')).toBe(false);
    });

    it('rejects malformed input rather than guessing', () => {
        expect(isSection(undefined, '/orders')).toBe(false);
        expect(isSection('/orders', '')).toBe(false);
    });
});

describe('isAnySection', () => {
    // The Community header item covers the community pages, the reels viewer
    // and the legacy /feed URL that now redirects.
    const COMMUNITY = ['/community', '/reels', '/feed'];

    it('lights up across every route the destination owns', () => {
        expect(isAnySection('/community', COMMUNITY)).toBe(true);
        expect(isAnySection('/community/saved', COMMUNITY)).toBe(true);
        expect(isAnySection('/reels', COMMUNITY)).toBe(true);
        expect(isAnySection('/feed', COMMUNITY)).toBe(true);
    });

    it('stays dark elsewhere', () => {
        expect(isAnySection('/dashboard', COMMUNITY)).toBe(false);
        expect(isAnySection('/products', COMMUNITY)).toBe(false);
    });
});
