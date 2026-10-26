import { describe, expect, it } from 'vitest';
import en from '../i18n/en';
import ar from '../i18n/ar';
import i18n, { i18nReady } from '../i18n';

function keyPaths(dict, prefix = '') {
    return Object.entries(dict).flatMap(([key, value]) => (
        value && typeof value === 'object' ? keyPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`]
    ));
}

describe('dashboard translations', () => {
    // Arabic sessions load only the Arabic bundle (no English fallback download), so a key that
    // exists only in English would surface as a raw key for Arabic users.
    it('has an Arabic string for every English key', () => {
        const arabic = new Set(keyPaths(ar));
        expect(keyPaths(en).filter((key) => !arabic.has(key))).toEqual([]);
    });

    it('loads the active language before resolving and fetches another on demand', async () => {
        await i18nReady;
        expect(i18n.t('app_name')).toBe(en.app_name);
        await i18n.changeLanguage('ar');
        expect(i18n.t('app_name')).toBe(ar.app_name);
        await i18n.changeLanguage('en');
    });
});
