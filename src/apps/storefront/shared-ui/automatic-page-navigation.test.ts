import { describe, expect, it } from 'vitest';
import { appendFooterPages, appendHeaderPages } from './automatic-page-navigation';

describe('automatic page links preserve existing navigation', () => {
  it('retains generated or merchant header items and appends pages in server order', () => {
    const base = [{ label: 'Shop', url: '/products' }];
    const pages = [{ label: 'First', url: '/pages/first' }, { label: 'Last', url: '/pages/last' }];
    expect(appendHeaderPages(base, pages)).toEqual([...base, ...pages]);
    expect(base).toHaveLength(1);
  });
  it('does not duplicate nested links, columns or a repeated automatic page', () => {
    const base = [{ label: 'Info', url: '/about', children: [{ label: 'Manual', url: '/pages/first/?lang=en' }], columns: [{ title: 'More', items: [{ label: 'Second', url: '/pages/second' }] }] }];
    expect(appendHeaderPages(base, [{ label: 'Auto', url: '/pages/first' }, { label: 'Auto2', url: '/pages/second' }, { label: 'Third', url: '/pages/third' }, { label: 'Duplicate', url: '/pages/third' }])).toEqual([...base, { label: 'Third', url: '/pages/third' }]);
  });
  it('retains all footer groups and adds only missing pages without an empty column', () => {
    const base = [{ title: 'Help', links: [{ label: 'Shipping', url: '/pages/shipping' }] }];
    expect(appendFooterPages(base, [{ label: 'Shipping', url: '/pages/shipping' }], 'Pages')).toEqual(base);
    expect(appendFooterPages(base, [{ label: 'Policy', url: '/pages/policy' }], 'Pages')).toEqual([...base, { title: 'Pages', links: [{ label: 'Policy', url: '/pages/policy' }] }]);
  });
});
