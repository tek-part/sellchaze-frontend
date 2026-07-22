/**
 * Active-route matching drives nav highlighting in all four themes. The `/` case is the one that
 * bites: every path starts with it, so a naive prefix test lights up Home on every page.
 */
import { describe, expect, it } from 'vitest';
import { isActiveRoute, isBranchActive } from './useMenuNavigation';

describe('isActiveRoute', () => {
  it('matches Home only on the root path', () => {
    expect(isActiveRoute('/', '/')).toBe(true);
    expect(isActiveRoute('/about', '/')).toBe(false);
    expect(isActiveRoute('/collections/all', '/')).toBe(false);
  });

  it('matches an exact path', () => {
    expect(isActiveRoute('/about', '/about')).toBe(true);
    expect(isActiveRoute('/brands', '/brands')).toBe(true);
  });

  it('matches descendants so a parent stays current', () => {
    expect(isActiveRoute('/collections/outerwear', '/collections')).toBe(true);
    expect(isActiveRoute('/account/orders/1234', '/account')).toBe(true);
  });

  it('does not match a sibling that merely shares a prefix', () => {
    expect(isActiveRoute('/blogging', '/blog')).toBe(false);
    expect(isActiveRoute('/brands-x', '/brands')).toBe(false);
  });

  it('ignores trailing slashes and query strings', () => {
    expect(isActiveRoute('/about/', '/about')).toBe(true);
    expect(isActiveRoute('/search', '/search?q=coat')).toBe(true);
  });
});

describe('isBranchActive', () => {
  const shop = {
    url: '/collections/all',
    children: [
      { url: '/collections/all' },
      { url: '/brands' },
    ],
    columns: [{ items: [{ url: '/collections/outerwear' }] }],
  };

  it('is active for its own url', () => {
    expect(isBranchActive('/collections/all', shop)).toBe(true);
  });

  it('is active when a child route is current', () => {
    expect(isBranchActive('/brands', shop)).toBe(true);
  });

  it('is active when a mega-menu column item is current', () => {
    expect(isBranchActive('/collections/outerwear', shop)).toBe(true);
  });

  it('is inactive elsewhere', () => {
    expect(isBranchActive('/about', shop)).toBe(false);
    expect(isBranchActive('/', shop)).toBe(false);
  });

  it('handles an item with no children or columns', () => {
    expect(isBranchActive('/about', { url: '/about' })).toBe(true);
    expect(isBranchActive('/blog', { url: '/about' })).toBe(false);
  });
});
