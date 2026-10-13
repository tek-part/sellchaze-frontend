import { describe, expect, it } from 'vitest';
import { readPreviewSettings } from './preview-settings';

describe('lazy preview settings', () => {
  const encode = (value: unknown) => btoa(encodeURIComponent(JSON.stringify(value)));
  it('preserves scalar settings and locale fallback', () => {
    expect(readPreviewSettings(encode({ title: { ar: 'العنوان', en: 'Title' }, enabled: true, spacing: 12, ignored: [1] }), 'ar')).toEqual({ title: 'العنوان', enabled: true, spacing: 12 });
  });
  it.each(['bad base64', encode([]), encode(null)])('fails safely for malformed settings %s', (value) => {
    expect(readPreviewSettings(value, 'ar')).toBeUndefined();
  });
});
