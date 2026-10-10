import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PersonalizationSummary } from './PersonalizationSummary';

describe('order personalization summary', () => {
  it('renders ordinary and legacy lines without personalization', () => {
    for (const entries of [undefined, null, []]) {
      expect(renderToStaticMarkup(createElement(PersonalizationSummary, { entries }))).toBe('');
    }
  });
  it('escapes customer text and retains valid image links', () => {
    const markup = renderToStaticMarkup(createElement(PersonalizationSummary, { entries: [
      { key: 'name', type: 'text', label: 'Name', value: '<script>customer</script>' },
      { key: 'photo', type: 'image', label: 'Photo', filename: 'photo.png', url: '/uploads/photo.png' },
    ] }));
    expect(markup).toContain('&lt;script&gt;customer&lt;/script&gt;');
    expect(markup).toContain('href="/uploads/photo.png"');
    expect(markup).not.toContain('<script>');
  });
});
