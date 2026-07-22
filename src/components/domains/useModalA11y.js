import { useEffect, useRef } from 'react';

/**
 * Modal accessibility: focus trap, Escape to close, and focus restoration.
 *
 * `role="dialog" aria-modal="true"` tells assistive tech a dialog is open, but
 * it does not stop Tab from walking into the page behind it, and it does not
 * make Escape work. Without those, a keyboard or screen-reader user can get
 * stranded outside a modal that is still visually covering the page.
 *
 * Returns a ref to attach to the dialog container.
 */
export default function useModalA11y(onClose) {
    const containerRef = useRef(null);
    const previouslyFocused = useRef(null);

    useEffect(() => {
        previouslyFocused.current = document.activeElement;

        const container = containerRef.current;
        if (!container) return undefined;

        const focusable = () =>
            Array.from(
                container.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((el) => el.offsetParent !== null);

        // Move focus into the dialog so the next Tab starts inside it.
        const initial = focusable()[0];
        initial?.focus();

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose?.();
                return;
            }

            if (event.key !== 'Tab') return;

            const items = focusable();
            if (items.length === 0) {
                event.preventDefault();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];

            // Wrap at both ends so focus never escapes the dialog.
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        container.addEventListener('keydown', onKeyDown);

        // The page behind a modal must not scroll under it.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            container.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;

            // Return focus to whatever opened the dialog.
            const restore = previouslyFocused.current;
            if (restore && typeof restore.focus === 'function') {
                restore.focus();
            }
        };
    }, [onClose]);

    return containerRef;
}
