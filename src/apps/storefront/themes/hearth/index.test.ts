import { describe, expect, it } from 'vitest';
import { validateTheme, checkThemeCompatibility } from '../../theme-engine';
import { hearthTheme } from './index';

describe('hearth theme module — engine validity', () => {
  it('is a valid theme module (no validation errors)', () => {
    const report = validateTheme(hearthTheme);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it('is compatible with the current engine', () => {
    expect(checkThemeCompatibility(hearthTheme.manifest).compatible).toBe(true);
  });

  it('declares the required templates', () => {
    const templates = hearthTheme.templates ?? {};
    for (const name of ['home', 'product', 'category']) {
      expect(templates[name]).toBeDefined();
    }
  });

  it('every template section type is registered in the section map', () => {
    const sections = hearthTheme.sections ?? {};
    for (const page of Object.values(hearthTheme.templates ?? {})) {
      for (const instance of page.sections) {
        expect(sections[instance.type], `section "${instance.type}"`).toBeDefined();
      }
    }
  });

  it('createTokens folds merchant settings (colour + corners + container)', () => {
    const tokens = hearthTheme.createTokens({
      ...hearthTheme.defaultSettings,
      primary_color: '#123456',
      corner_style: 'sharp',
      container_width: 1500,
    });
    expect(tokens.color.light.primary).toBe('#123456');
    expect(tokens.radius.base).toBe('8px');
    expect(tokens.spacing.container).toBe('1500px');
  });

  it('warm-light identity: default light background is oat, dark is cocoa', () => {
    expect(hearthTheme.tokens.color.light.bg.toUpperCase()).toBe('#F3EBDE');
    expect(hearthTheme.tokens.color.dark.bg.toUpperCase()).toBe('#221B14');
  });
});
