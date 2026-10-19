import { describe, expect, it } from 'vitest';
import { nativeCatalogKey } from './native-catalog';

describe('public native catalog warmup boundary', () => {
  it('recognizes both localized catalog previews', () => {
    expect(nativeCatalogKey({pathname:'/funnel-templates/litter-robot-ar',search:'?preview=1&lang=ar'})).toBe('litter-robot-ar');
    expect(nativeCatalogKey({pathname:'/funnel-templates/glasses-en/',search:'?preview=1'})).toBe('glasses-en');
    for (const locale of ['ar','en']) expect(nativeCatalogKey({pathname:`/funnel-templates/hair-care-${locale}`,search:`?preview=1&lang=${locale}`})).toBe(`hair-care-${locale}`);
    for (const locale of ['ar','en']) expect(nativeCatalogKey({pathname:`/funnel-templates/habit-${locale}`,search:`?preview=1&lang=${locale}`})).toBe(`habit-${locale}`);
  });
  it('does not warm demo content for live, unknown or private preview routes', () => {
    for (const [pathname, search] of [['/funnels/litter-robot-ar','?preview=1'],['/funnel-templates/litter-robot-ar',''],['/funnel-templates/unknown','?preview=1'],['/funnel-templates/litter-robot-ar','?preview=1&__preview=private'],['/funnel-templates/litter-robot-ar','?preview=1&customize=1']]) expect(nativeCatalogKey({pathname:pathname!,search:search!})).toBeNull();
  });
});
