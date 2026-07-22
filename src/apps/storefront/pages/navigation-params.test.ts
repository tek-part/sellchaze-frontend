/**
 * Session params must survive in-app navigation. The failure mode is silent and delayed: the click
 * looks fine because the app is already running, and only a refresh or a shared link reveals that
 * the theme/preview context was dropped. Pinned here so it cannot regress unnoticed.
 */
import { describe, expect, it } from 'vitest';
import { withSessionParams } from './NavigationInterceptor';

describe('withSessionParams', () => {
  it('carries the session params onto a bare path', () => {
    expect(withSessionParams('/blog', '?theme=rouge&preview=1')).toBe('/blog?theme=rouge&preview=1');
  });

  it('returns the href untouched when there is no session to carry', () => {
    expect(withSessionParams('/blog', '')).toBe('/blog');
    expect(withSessionParams('/blog?tag=care', '')).toBe('/blog?tag=care');
  });

  it('preserves the destination’s own params alongside the session', () => {
    const out = new URLSearchParams(withSessionParams('/blog?tag=care', '?theme=rouge&preview=1').split('?')[1]);
    expect(out.get('tag')).toBe('care');
    expect(out.get('theme')).toBe('rouge');
    expect(out.get('preview')).toBe('1');
  });

  it('never overrides a param the destination sets explicitly', () => {
    expect(withSessionParams('/blog?theme=voltage', '?theme=rouge')).toBe('/blog?theme=voltage');
  });

  it('carries scheme and settings, not unrelated params', () => {
    const out = withSessionParams('/cart', '?theme=rouge&scheme=dark&settings=abc&page=3&sort=price-asc');
    const params = new URLSearchParams(out.split('?')[1]);
    expect(params.get('theme')).toBe('rouge');
    expect(params.get('scheme')).toBe('dark');
    expect(params.get('settings')).toBe('abc');
    // `page` and `sort` belong to the page being left, not the session.
    expect(params.get('page')).toBeNull();
    expect(params.get('sort')).toBeNull();
  });

  it('handles a preview session with no theme override', () => {
    expect(withSessionParams('/about', '?preview=1')).toBe('/about?preview=1');
  });

  it('leaves the root path valid', () => {
    expect(withSessionParams('/', '?theme=hearth&preview=1')).toBe('/?theme=hearth&preview=1');
  });
});
