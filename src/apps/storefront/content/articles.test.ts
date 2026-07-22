/**
 * Editorial content is shipped data, so the invariants the blog pages rely on are pinned here —
 * particularly the relations (related/prev/next), which silently degrade into a broken reading
 * experience rather than throwing when they are wrong.
 */
import { describe, expect, it } from 'vitest';
import {
  ARTICLES,
  ARTICLES_BY_DATE,
  articleCategories,
  articleNeighbours,
  articleTags,
  formatArticleDate,
  getArticle,
  relatedArticles,
} from './articles';

describe('article data integrity', () => {
  it('has unique slugs', () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses url-safe slugs', () => {
    for (const a of ARTICLES) expect(a.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has an ISO date, a cover, alt text and a body for every article', () => {
    for (const a of ARTICLES) {
      expect(a.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.cover).toMatch(/^https:\/\//);
      expect(a.coverAlt.length).toBeGreaterThan(0);
      expect(a.body.length).toBeGreaterThan(0);
      expect(a.readingMinutes).toBeGreaterThan(0);
    }
  });

  it('gives every image block alt text', () => {
    for (const a of ARTICLES) {
      for (const block of a.body) {
        if (block.kind === 'image') expect(block.alt.length).toBeGreaterThan(0);
      }
    }
  });

  it('contains no placeholder copy', () => {
    const text = JSON.stringify(ARTICLES).toLowerCase();
    expect(text).not.toContain('lorem');
    expect(text).not.toContain('ipsum');
    expect(text).not.toContain('todo');
    expect(text).not.toContain('placeholder');
  });
});

describe('ordering and lookup', () => {
  it('sorts newest first', () => {
    const dates = ARTICLES_BY_DATE.map((a) => a.published);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it('looks up by slug and returns undefined for unknown', () => {
    expect(getArticle(ARTICLES[0]!.slug)?.slug).toBe(ARTICLES[0]!.slug);
    expect(getArticle('no-such-article')).toBeUndefined();
  });

  it('tallies categories and tags without duplicates', () => {
    const cats = articleCategories();
    expect(new Set(cats.map((c) => c.name)).size).toBe(cats.length);
    expect(cats.reduce((n, c) => n + c.count, 0)).toBe(ARTICLES.length);
    const tags = articleTags();
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe('relatedArticles', () => {
  it('never includes the article itself', () => {
    for (const a of ARTICLES) {
      expect(relatedArticles(a.slug).some((r) => r.slug === a.slug)).toBe(false);
    }
  });

  it('respects the limit and degrades for an unknown slug', () => {
    expect(relatedArticles(ARTICLES[0]!.slug, 2)).toHaveLength(2);
    expect(relatedArticles('unknown', 3)).toHaveLength(3);
  });

  it('prefers the same category', () => {
    const target = ARTICLES.find((a) => ARTICLES.filter((x) => x.category === a.category).length > 1);
    if (target) {
      expect(relatedArticles(target.slug, 1)[0]?.category).toBe(target.category);
    }
  });
});

describe('articleNeighbours', () => {
  it('has no previous on the newest and no next on the oldest', () => {
    const newest = ARTICLES_BY_DATE[0]!;
    const oldest = ARTICLES_BY_DATE[ARTICLES_BY_DATE.length - 1]!;
    expect(articleNeighbours(newest.slug).next).toBeUndefined();
    expect(articleNeighbours(oldest.slug).prev).toBeUndefined();
  });

  it('links neighbours consistently in both directions', () => {
    for (let i = 1; i < ARTICLES_BY_DATE.length; i++) {
      const current = ARTICLES_BY_DATE[i]!;
      const newer = ARTICLES_BY_DATE[i - 1]!;
      expect(articleNeighbours(current.slug).next?.slug).toBe(newer.slug);
      expect(articleNeighbours(newer.slug).prev?.slug).toBe(current.slug);
    }
  });

  it('returns nothing for an unknown slug', () => {
    expect(articleNeighbours('unknown')).toEqual({});
  });
});

describe('formatArticleDate', () => {
  it('formats an ISO date readably', () => {
    expect(formatArticleDate('2026-06-18')).toBe('18 June 2026');
    expect(formatArticleDate('2026-01-01')).toBe('1 January 2026');
  });

  it('returns the input unchanged when it is not a date', () => {
    expect(formatArticleDate('not-a-date')).toBe('not-a-date');
  });
});
