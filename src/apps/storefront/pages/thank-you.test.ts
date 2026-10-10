import { describe, expect, it } from 'vitest';
import { currentThankYou, type ThankYouPageData } from './thank-you';

const page: ThankYouPageData = { enabled: true, content_html: '<p>Thank you</p>', show_home_button: false, category: null, products: [] };
const ready = { data: { locale: 'en', data: page }, loading: false, error: null };

describe('current thank-you presentation', () => {
  it('never displays retained content while language refetch or failed refresh is unresolved', () => {
    expect(currentThankYou({ ...ready, loading: true }, 'en')).toBeNull();
    expect(currentThankYou(ready, 'ar')).toBeNull();
    expect(currentThankYou({ ...ready, error: new Error('Network unavailable') }, 'en')).toBeNull();
  });
  it('preserves disabled and older API fallback rather than publishing the stored draft', () => {
    expect(currentThankYou({ ...ready, data: { locale: 'en', data: { ...page, enabled: false } } }, 'en')).toBeNull();
    expect(currentThankYou({ data: null, loading: false, error: null }, 'en')).toBeNull();
  });
  it('retains deliberate blank content and hidden home button for an enabled page', () => {
    const blank = { ...page, content_html: '' };
    expect(currentThankYou({ ...ready, data: { locale: 'en', data: blank } }, 'en')).toEqual(blank);
  });
});
