/**
 * Locale state — language, direction and persistence in one place.
 *
 * Direction is NOT tracked separately from language. Arabic is RTL and English is LTR, so deriving
 * one from the other removes a whole class of bug where the two drift apart (a language switch that
 * leaves the layout mirrored the wrong way). The theme engine still owns applying `dir` to the DOM;
 * this hook just tells it what the language implies.
 *
 * `<html lang>` is set here too, because it is a document-level concern the theme layer does not
 * own — and without it screen readers announce Arabic with an English voice.
 */
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme-engine';
import { DEFAULT_LOCALE, LOCALE_META, directionFor, isLocale, persistLocale, type Locale } from './index';

export interface LocaleState {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  /** BCP-47 tag for `<html lang>` and `Intl` formatting. */
  htmlLang: string;
}

export function useLocale(): LocaleState {
  const { i18n } = useTranslation();
  const theme = useTheme();

  const current: Locale = isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
  const dir = directionFor(current);

  // Keep the engine's direction and the document language aligned with the active locale. Running
  // on every locale change (rather than only in the setter) also covers the initial mount, where
  // the language came from storage or the URL rather than a click.
  useEffect(() => {
    if (theme.direction !== dir) theme.setDirection(dir);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = LOCALE_META[current].htmlLang;
    }
  }, [current, dir, theme]);

  const setLocale = useCallback(
    (next: Locale): void => {
      if (next === current) return;
      void i18n.changeLanguage(next);
      persistLocale(next);
    },
    [current, i18n],
  );

  return { locale: current, setLocale, dir, isRtl: dir === 'rtl', htmlLang: LOCALE_META[current].htmlLang };
}
