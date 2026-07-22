/**
 * Language switcher.
 *
 * A two-option segmented control rather than a dropdown: with exactly two languages a menu costs an
 * extra interaction and hides the alternative. Each option is labelled in its OWN language
 * ("English", "العربية") — a reader looking for Arabic is scanning for Arabic script, not for the
 * word "Arabic" written in English.
 *
 * Switching preserves everything, because it changes only the i18n language: the URL, filters,
 * search, cart, wishlist and form state are all untouched. Nothing navigates and nothing remounts.
 *
 * Themes style `${ns}-lang` and its elements.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../shared/utils/cn';
import { block, el, DEFAULT_NS, type ClassNamespace } from './ns';
import { LOCALE_META, SUPPORTED_LOCALES, type Locale } from '../i18n';

export interface LanguageSwitcherProps {
  locale: Locale;
  onChange: (next: Locale) => void;
  /** Accessible group label, supplied translated by the caller. */
  label: string;
  ns?: ClassNamespace;
  className?: string;
}

export function LanguageSwitcher(props: LanguageSwitcherProps): ReactElement {
  const { locale, onChange, label, ns = DEFAULT_NS, className } = props;

  return (
    <div className={cn(block('lang', ns), className)} role="group" aria-label={label}>
      {SUPPORTED_LOCALES.map((code) => {
        const meta = LOCALE_META[code];
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            className={el('lang', 'btn', ns)}
            // aria-pressed rather than aria-current: this is a toggle between two states, not a
            // location in a set of pages.
            aria-pressed={active}
            // The label is in the target language, so it must carry that language's tag or a
            // screen reader will read Arabic with an English voice.
            lang={meta.htmlLang}
            onClick={() => onChange(code)}
          >
            {meta.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
