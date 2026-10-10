import { describe, expect, it } from 'vitest';
import { identityFontStylesheet, identityForeground, identitySettings, identityTokens } from './store-identity';
import { naseemTheme } from './themes/naseem';
import { bazaarTheme } from './themes/bazaar';
import { sahraTheme } from './themes/sahra';
import { freshTheme } from './themes/fresh';
import { technoTheme } from './themes/techno';
import { defaultSettings } from './theme-engine/settings';
import { flattenTokens } from './theme-engine/applyTokens';

describe('store identity across the five themes', () => {
  for (const theme of [naseemTheme, bazaarTheme, sahraTheme, freshTheme, technoTheme]) {
    it(`${theme.manifest.id} retains defaults when unset and applies general identity to both schemes`, () => {
      const settings = defaultSettings(theme.manifest.settingsSchema);
      const original = theme.createTokens(settings);
      expect(identityTokens(original, {})).toBe(original);
      expect(identitySettings(settings, { header_mode: 'theme' })).toBe(settings);
      const tokens = identityTokens(original, { primary_color: '#4bde1c', font_family: 'Almarai' });
      for (const scheme of ['light', 'dark'] as const) {
        const vars = flattenTokens(tokens, scheme);
        expect(vars['--primary']).toBe('#4bde1c');
        expect(vars['--on-primary']).toBe('#000000');
        expect(vars['--font']).toMatch(/^'Almarai'/);
        expect(vars['--heading']).toMatch(/^'Almarai'/);
        expect(vars['--font-ar']).toMatch(/^'Almarai'/);
      }
      expect(original.color.light.primary).not.toBe('#4bde1c');
    });
  }
  it('overrides existing theme announcement visibility and URL, including deliberate blank', () => {
    const settings = { announcement_text: 'Old text', announcement_url: 'https://old.example.com', show_announcement: false, show_top_bar: false };
    expect(identitySettings(settings, { header_mode: 'custom', header_text: 'New text' })).toEqual({ ...settings, announcement_text: 'New text', announcement_url: '', show_announcement: true, show_top_bar: true });
    for (const identity of [{ header_mode: 'hidden' as const }, { header_mode: 'custom' as const, header_text: '' }]) {
      expect(identitySettings(settings, identity)).toMatchObject({ announcement_text: '', show_announcement: false, show_top_bar: false });
    }
  });
  it('uses supported weights and a fixed origin for all selected catalog fonts', () => {
    expect(identityFontStylesheet('Almarai')).toBe('https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap');
    expect(identityFontStylesheet('Inter')).toContain('family=Cairo:wght@400;500;700');
    expect(identityFontStylesheet('Readex Pro')).toContain('family=Readex+Pro');
    expect(identityFontStylesheet('Molle')).toContain('family=Molle:ital,wght@1,400');
    expect(identityFontStylesheet("Cairo';color:red")).toBeUndefined();
    expect(identityFontStylesheet('https://evil.example.com')).toBeUndefined();
    expect(identityFontStylesheet('system')).toBeUndefined();
  });
  it('chooses readable action text even for colors the theme luminance shortcut misclassifies', () => {
    expect(identityForeground('#777777')).toBe('#000000');
    expect(identityForeground('#000000')).toBe('#FFFFFF');
    expect(identityForeground('#ffffff')).toBe('#000000');
  });
});
