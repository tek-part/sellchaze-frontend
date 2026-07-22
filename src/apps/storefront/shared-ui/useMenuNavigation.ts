/**
 * Mega-menu behaviour — one implementation, four skins.
 *
 * Keyboard and pointer semantics follow the WAI-ARIA disclosure-navigation pattern rather than the
 * menubar pattern: the triggers are ordinary links with an expandable panel, which is what a
 * storefront nav actually is. That means Tab moves through links normally (a menubar would trap it
 * into arrow-key-only navigation, which shoppers do not expect on a website).
 *
 * Provides: hover-intent open with a close delay so a diagonal mouse path to the panel does not
 * dismiss it, Escape to close and restore focus to the trigger, click-outside, focus-leave, and
 * automatic close on route change.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Grace period before a pointer-out closes the panel, so diagonal travel to it survives. */
const CLOSE_DELAY_MS = 120;

export interface MenuNavigation {
  /** Label of the currently open panel, or null. */
  openKey: string | null;
  isOpen: (key: string) => boolean;
  open: (key: string) => void;
  close: () => void;
  toggle: (key: string) => void;
  /** Pointer handlers with hover intent. Spread onto the item wrapper. */
  hoverProps: (key: string) => { onPointerEnter: () => void; onPointerLeave: () => void };
  /** Keyboard handler for a trigger. Enter/Space/ArrowDown open; Escape closes. */
  triggerKeyDown: (key: string, event: React.KeyboardEvent) => void;
  /** Ref for the nav element — used for click-outside and focus-leave detection. */
  containerRef: React.RefObject<HTMLElement | null>;
}

export function useMenuNavigation(routeKey?: string): MenuNavigation {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const clearTimer = useCallback((): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const close = useCallback((): void => {
    clearTimer();
    setOpenKey(null);
  }, [clearTimer]);

  const open = useCallback(
    (key: string): void => {
      clearTimer();
      setOpenKey(key);
    },
    [clearTimer],
  );

  const toggle = useCallback(
    (key: string): void => {
      clearTimer();
      setOpenKey((current) => (current === key ? null : key));
    },
    [clearTimer],
  );

  // Navigating away must not leave a panel hanging over the new page.
  useEffect(() => {
    setOpenKey(null);
  }, [routeKey]);

  useEffect(() => clearTimer, [clearTimer]);

  // Click outside and focus leaving the nav both close the panel. Focus-leave matters for keyboard
  // users: tabbing past the last link in a panel should dismiss it, not strand it open.
  useEffect(() => {
    if (openKey === null) return undefined;

    const onPointerDown = (event: PointerEvent): void => {
      const node = containerRef.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) setOpenKey(null);
    };
    const onFocusIn = (event: FocusEvent): void => {
      const node = containerRef.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) setOpenKey(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [openKey]);

  const hoverProps = useCallback(
    (key: string) => ({
      onPointerEnter: (): void => open(key),
      onPointerLeave: (): void => {
        clearTimer();
        closeTimer.current = setTimeout(() => setOpenKey(null), CLOSE_DELAY_MS);
      },
    }),
    [open, clearTimer],
  );

  const triggerKeyDown = useCallback(
    (key: string, event: React.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        lastTrigger.current?.focus();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        lastTrigger.current = event.currentTarget as HTMLElement;
        open(key);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        // Only intercept for items that own a panel; plain links keep their default activation.
        event.preventDefault();
        lastTrigger.current = event.currentTarget as HTMLElement;
        toggle(key);
      }
    },
    [close, open, toggle],
  );

  return {
    openKey,
    isOpen: (key: string) => openKey === key,
    open,
    close,
    toggle,
    hoverProps,
    triggerKeyDown,
    containerRef,
  };
}

/**
 * Active-route matching for nav highlighting. `/` matches only itself — every path starts with it,
 * so a prefix test would light up Home on every page. Everything else matches its own path and any
 * descendant, so `/collections/outerwear` keeps Shop marked current.
 */
export function isActiveRoute(pathname: string, url: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  const target = url.split('?')[0]?.replace(/\/+$/, '') || '/';
  if (target === '/') return path === '/';
  return path === target || path.startsWith(`${target}/`);
}

/** True when an item or any of its descendants matches the current route. */
export function isBranchActive(
  pathname: string,
  item: { url: string; children?: ReadonlyArray<{ url: string }>; columns?: ReadonlyArray<{ items: ReadonlyArray<{ url: string }> }> },
): boolean {
  if (isActiveRoute(pathname, item.url)) return true;
  if (item.children?.some((c) => isActiveRoute(pathname, c.url))) return true;
  return item.columns?.some((col) => col.items.some((c) => isActiveRoute(pathname, c.url))) ?? false;
}
