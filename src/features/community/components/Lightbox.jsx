import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineXMark } from 'react-icons/hi2';

/**
 * The image viewer a post's photos open into: a full-screen black stage with
 * the photo centred, arrows and arrow keys to move, a counter, a thumbnail
 * rail to jump, and Escape / backdrop / ✕ to leave. Rendered through a portal
 * so no card transform or overflow can clip it.
 */
export default function Lightbox({ images, index = 0, onClose }) {
    const { t } = useTranslation();
    const [current, setCurrent] = useState(index);

    const count = images.length;
    const goTo = useCallback((next) => setCurrent(((next % count) + count) % count), [count]);

    // Keyboard: arrows navigate, Escape closes. Arrows follow reading
    // direction so "next" is always the arrow pointing deeper into the album.
    useEffect(() => {
        const rtl = document.documentElement.dir === 'rtl';
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.();
            else if (event.key === 'ArrowRight') goTo(current + (rtl ? -1 : 1));
            else if (event.key === 'ArrowLeft') goTo(current + (rtl ? 1 : -1));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [current, goTo, onClose]);

    // The page must not scroll behind the stage.
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    if (!count) return null;
    const active = images[current];

    return createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true">
            {/* Chrome row */}
            <div className="flex items-center justify-between p-3 sm:p-4">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
                    {current + 1}/{count}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('cancel', 'Close')}
                    className="sc-press flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
                >
                    <HiOutlineXMark className="h-6 w-6" aria-hidden />
                </button>
            </div>

            {/* Stage — clicking the empty space closes, clicking the photo doesn't. */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-3" onClick={onClose}>
                <img
                    key={active.id ?? current}
                    src={active.url}
                    alt={active.alt_text || ''}
                    onClick={(event) => event.stopPropagation()}
                    className="sc-pop max-h-full max-w-full select-none object-contain"
                    draggable={false}
                />

                {count > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); goTo(current - 1); }}
                            aria-label={t('reels_previous', 'Previous')}
                            className="sc-press absolute start-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
                        >
                            <HiOutlineChevronLeft className="h-6 w-6 rtl:rotate-180" aria-hidden />
                        </button>
                        <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); goTo(current + 1); }}
                            aria-label={t('reels_next', 'Next')}
                            className="sc-press absolute end-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
                        >
                            <HiOutlineChevronRight className="h-6 w-6 rtl:rotate-180" aria-hidden />
                        </button>
                    </>
                ) : null}
            </div>

            {/* Thumbnail rail */}
            {count > 1 ? (
                <div className="sc-rail flex justify-center gap-2 overflow-x-auto p-3 sm:p-4">
                    {images.map((image, i) => (
                        <button
                            key={image.id ?? i}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={`${i + 1}/${count}`}
                            aria-current={i === current}
                            className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg transition ${
                                i === current ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'
                            }`}
                        >
                            <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>,
        document.body,
    );
}
