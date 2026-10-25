/**
 * CurrencySwitcher — the header/drawer display-currency picker (Shopify-style "EGP ▾" pill).
 *
 * Renders nothing unless the store sells in more than one currency. The pill shows the active code
 * and inherits `currentColor` and the surrounding font, so it sits on light and dark headers alike;
 * themes only tune spacing/size through their own class. The list is a single-select listbox using
 * `aria-activedescendant` (focus stays on the list, arrows move the active option, Enter/Space pick,
 * Escape/Tab close and focus returns to the pill). Options are labelled with the localized currency
 * name from `Intl.DisplayNames` plus the ISO code ("جنيه مصري — EGP").
 *
 * `variant="drawer"` renders a full-width labelled row whose list opens inline (no floating panel
 * to clip inside a scrolling drawer). Selecting only calls `setCurrency` — no reload, no navigation.
 * Deliberately dependency-free: it ships in theme chrome, close to the storefront entry budget.
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { cn } from '../../../../shared/utils/cn';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';

export interface CurrencySwitcherProps {
  /** `header` (default): compact pill with a floating list. `drawer`: full-width labelled row. */
  variant?: 'header' | 'drawer';
  className?: string;
}

/**
 * A currency change re-keys the cart provider, which remounts the theme layout (and this pill with
 * it). The pick is remembered here for a moment so the remounted pill can take focus back instead
 * of leaving keyboard users on <body>.
 */
let pendingFocus: { variant: 'header' | 'drawer'; at: number } | null = null;

/**
 * True right after a pick from a drawer switcher. Themes whose menu-open state lives inside the
 * remounted subtree seed it from this (`useState(currencyDrawerPicked)`) so the drawer reopens
 * where the shopper was, and the pill inside it gets focus back.
 */
export function currencyDrawerPicked(): boolean {
  return pendingFocus?.variant === 'drawer' && Date.now() - pendingFocus.at <= 1500;
}

/** Localized currency names, falling back to the bare code where `Intl.DisplayNames` is missing. */
export function currencyNames(locale: string, codes: ReadonlyArray<string>): Record<string, string> {
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames([locale], { type: 'currency' }); } catch { names = null; }
  const out: Record<string, string> = {};
  for (const code of codes) {
    let name: string | undefined;
    try { name = names?.of(code); } catch { name = undefined; }
    out[code] = name && name !== code ? name : code;
  }
  return out;
}

export function CurrencySwitcher(props: CurrencySwitcherProps): ReactElement | null {
  const { variant = 'header', className } = props;
  const { store, setCurrency } = useStore();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const codes = store.supportedCurrencies;
  const current = store.currency;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const names = useMemo(() => currencyNames(locale, codes), [locale, codes]);

  // Outside pointer closes without stealing focus (the user is moving somewhere else).
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!pendingFocus || pendingFocus.variant !== variant || Date.now() - pendingFocus.at > 1500) return;
    const button = buttonRef.current;
    if (!button) return;
    // Cleared only once focus really moves (StrictMode re-runs effects and cancels the first frame).
    // A copy hidden at this breakpoint (no client rects) leaves the pick for the visible one.
    const focus = (): void => {
      if (button.getClientRects().length === 0) return;
      pendingFocus = null;
      button.focus({ preventScroll: true });
    };
    if (!button.closest('[role="dialog"]')) { focus(); return; }
    // Inside a drawer the overlay's focus trap moves focus in two frames after (re)mounting; land after it.
    const timer = setTimeout(focus, 120);
    return () => clearTimeout(timer);
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"], [data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  if (codes.length < 2) return null;

  const label = ar ? 'العملة' : 'Currency';
  const listId = `${id}-list`;
  const optionId = (index: number): string => `${id}-opt-${index}`;
  const currentIndex = Math.max(0, codes.indexOf(current));

  const show = (index = currentIndex): void => { setActive(index); setOpen(true); };
  const close = (focusButton: boolean): void => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };
  const choose = (code: string): void => {
    close(true);
    if (code === current) return;
    pendingFocus = { variant, at: Date.now() };
    setCurrency(code);
  };

  const onButtonKey = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      show(event.key === 'ArrowUp' && !open ? codes.length - 1 : currentIndex);
    }
  };

  const onListKey = (event: KeyboardEvent<HTMLUListElement>): void => {
    const last = codes.length - 1;
    const move = (next: number): void => { event.preventDefault(); setActive(next); };
    switch (event.key) {
      case 'ArrowDown': move(active >= last ? 0 : active + 1); break;
      case 'ArrowUp': move(active <= 0 ? last : active - 1); break;
      case 'Home': move(0); break;
      case 'End': move(last); break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(codes[active] ?? current);
        break;
      case 'Escape':
        // Keep the Escape here: a surrounding drawer must not close along with the list.
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default: {
        // Typeahead on the first letter of the code.
        const key = event.key.length === 1 ? event.key.toUpperCase() : '';
        if (!key) return;
        const hit = codes.findIndex((code, index) => index > active && code.startsWith(key));
        const wrap = hit >= 0 ? hit : codes.findIndex((code) => code.startsWith(key));
        if (wrap >= 0) move(wrap);
      }
    }
  };

  return (
    <div ref={rootRef} className={cn('sf-currency', `sf-currency--${variant}`, open && 'is-open', className)}>
      {variant === 'drawer' ? <span className="sf-currency__label" id={`${id}-label`}>{label}</span> : null}
      <button
        ref={buttonRef}
        type="button"
        className="sf-currency__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${names[current] ?? current}`}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={onButtonKey}
      >
        <span className="sf-currency__code" translate="no">{current}</span>
        <svg className="sf-currency__chev" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true" focusable="false">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="sf-currency__list"
          aria-label={label}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKey}
          onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false); }}
        >
          {codes.map((code, index) => (
            <li
              key={code}
              id={optionId(index)}
              role="option"
              aria-selected={code === current}
              data-active={index === active ? 'true' : undefined}
              className="sf-currency__opt"
              onPointerMove={() => setActive(index)}
              onClick={() => choose(code)}
            >
              {names[code] !== code ? <><span className="sf-currency__name">{names[code]}</span><span className="sf-currency__sep" aria-hidden="true"> — </span></> : null}
              <span className="sf-currency__iso" translate="no">{code}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
