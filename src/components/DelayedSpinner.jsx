import { useEffect, useState } from 'react';

/**
 * A spinner that only appears after `delay` ms — so fast loads (the common case) finish
 * first and never flash a spinner. Pairs with the page container cascade: the container
 * reveals, and data simply appears when ready. Only slow loads surface the spinner, and
 * it fades in softly (`.sc-anim-fade`). Reduced-motion is honored by that CSS class.
 */
export default function DelayedSpinner({ delay = 400, className = '', size = 'h-8 w-8' }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const id = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(id);
    }, [delay]);

    if (!visible) {
        return null;
    }

    return (
        <div
            className={`sc-anim-fade flex items-center justify-center ${className}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div
                className={`${size} animate-spin rounded-full border-2 border-brand border-t-transparent`}
                aria-hidden
            />
        </div>
    );
}
