import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

/**
 * The swipeable album a carousel post renders as: one image per viewport,
 * scroll-snapped for touch, arrow buttons for pointers, and a dot rail that
 * doubles as a position indicator. Index tracking runs off the scroll
 * position itself so touch swipes and button steps stay in sync.
 */
export default function MediaCarousel({ media, onOpen }) {
    const { t } = useTranslation();
    const railRef = useRef(null);
    const [index, setIndex] = useState(0);

    const items = media.filter((item) => item.kind === 'image');
    if (items.length < 2) return null;

    const goTo = (next) => {
        const rail = railRef.current;
        if (!rail) return;
        const clamped = Math.max(0, Math.min(next, items.length - 1));
        rail.scrollTo({ left: rail.clientWidth * clamped * (document.documentElement.dir === 'rtl' ? -1 : 1), behavior: 'smooth' });
    };

    const onScroll = () => {
        const rail = railRef.current;
        if (!rail) return;
        setIndex(Math.round(Math.abs(rail.scrollLeft) / Math.max(1, rail.clientWidth)));
    };

    return (
        <div className="group relative">
            <div
                ref={railRef}
                onScroll={onScroll}
                className="sc-rail flex snap-x snap-mandatory overflow-x-auto bg-slate-950"
            >
                {items.map((item, i) => (
                    <img
                        key={item.id}
                        src={item.url}
                        alt={item.alt_text || ''}
                        loading="lazy"
                        decoding="async"
                        onClick={() => onOpen?.(i)}
                        className={`aspect-[4/3] max-h-[420px] w-full shrink-0 snap-center object-cover ${onOpen ? 'cursor-zoom-in' : ''}`}
                    />
                ))}
            </div>

            {/* Step arrows — pointer devices only; swipe handles touch. */}
            {index > 0 ? (
                <button
                    type="button"
                    onClick={() => goTo(index - 1)}
                    aria-label={t('reels_previous', 'Previous')}
                    className="sc-press absolute start-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur transition group-hover:flex"
                >
                    <HiOutlineChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
                </button>
            ) : null}
            {index < items.length - 1 ? (
                <button
                    type="button"
                    onClick={() => goTo(index + 1)}
                    aria-label={t('reels_next', 'Next')}
                    className="sc-press absolute end-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur transition group-hover:flex"
                >
                    <HiOutlineChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
                </button>
            ) : null}

            {/* Counter chip + dot rail */}
            <span className="absolute end-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                {index + 1}/{items.length}
            </span>
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
                {items.map((item, dot) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => goTo(dot)}
                        aria-label={`${dot + 1}/${items.length}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${dot === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`}
                    />
                ))}
            </div>
        </div>
    );
}
