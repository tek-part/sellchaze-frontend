import { describe, expect, it } from 'vitest';
import { currentPublishedPage } from './published-page';

const page = { title: 'Policy', slug: 'policy', template: 'simple', sections: [], content_html: '<p>Published</p>' };
const ready = { loading: false, error: null, data: { locale: 'en', data: { data: page } } };

describe('published page response ownership', () => {
  it('selects only the requested URL and language', () => {
    expect(currentPublishedPage(ready, 'policy', 'en')).toEqual(page);
    expect(currentPublishedPage(ready, 'another', 'en')).toBeNull();
    expect(currentPublishedPage(ready, 'policy', 'ar')).toBeNull();
  });
  it('does not show retained publication while a refresh is pending or failed', () => {
    expect(currentPublishedPage({ ...ready, loading: true }, 'policy', 'en')).toBeNull();
    expect(currentPublishedPage({ ...ready, error: new Error('Unavailable') }, 'policy', 'en')).toBeNull();
    expect(currentPublishedPage({ ...ready, data: null }, 'policy', 'en')).toBeNull();
  });
  it('preserves an intentionally blank body on a published simple page', () => {
    const blank = { ...page, content_html: '' };
    expect(currentPublishedPage({ ...ready, data: { locale: 'en', data: { data: blank } } }, 'policy', 'en')).toEqual(blank);
  });
});
