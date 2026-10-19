// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { toProductDetail } from '../apps/storefront/api/mappers';
import type { ApiProduct } from '../apps/storefront/api/types';

it.each(['description', 'long_description'] as const)('preserves bounded product formatting from %s in the public mapper', (key) => {
    const product = { id: 7, name: 'Own product', price: 1, [key]: '<h2 style="text-align:right">تفاصيل</h2><p><span style="color:rgb(17,34,51);background-color:#abc">Own copy</span></p>' } as ApiProduct;
    const result = new DOMParser().parseFromString(toProductDetail(product, 'USD').descriptionHtml || '', 'text/html');
    expect(result.querySelector('h2')?.style.textAlign).toBe('right');
    expect(result.querySelector('span')?.style.color).toBe('rgb(17, 34, 51)');
    expect(result.querySelector('span')?.style.backgroundColor).toBe('rgb(170, 187, 204)');
});

it('retains product color while rejecting overlays, external CSS, handlers and executable URLs', () => {
    const product = { id: 7, name: 'Own product', price: 1, description: '<p onclick="bad()" style="color:#123456;position:fixed;background-image:url(https://untrusted.test);z-index:99999">Safe<a href="javascript:bad()">link</a><img src="/own.jpg" onerror="bad()"></p><script>bad()</script>' } as ApiProduct;
    const html = toProductDetail(product, 'USD').descriptionHtml || '';
    expect(html).toContain('color:#123456');
    expect(html).not.toMatch(/position|background-image|z-index|onclick|onerror|javascript:|<script|untrusted/);
    expect(html).toContain('/own.jpg');
});
