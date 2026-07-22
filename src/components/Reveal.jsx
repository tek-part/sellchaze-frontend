/**
 * Reveal — staggered entrance animation shared with the public landing page.
 *
 * Uses the exact same CSS system as the marketing site (`.sc-anim-*` keyframes in
 * `src/index.css`): each element starts at opacity:0 and fades/slides in once, with an
 * `animation-delay` so siblings appear one after another. `prefers-reduced-motion` is
 * already honored by those CSS classes (they collapse to no animation).
 *
 * Usage:
 *   <Reveal index={0}><Header/></Reveal>
 *   <Reveal as="section" index={1}>…</Reveal>
 *   {items.map((it, i) => <Reveal key={it.id} index={i}>…</Reveal>)}
 *
 * Cascade timing = `baseDelay + index * step` (ms). Pass an explicit `delay` to override.
 */
const VARIANT_CLASS = {
    'fade-up': 'sc-anim-fade-up',
    fade: 'sc-anim-fade',
    left: 'sc-anim-fade-left',
    right: 'sc-anim-fade-right',
    pop: 'sc-anim-pop',
};

export default function Reveal({
    as: Tag = 'div',
    variant = 'fade-up',
    index = 0,
    delay,
    step = 90,
    baseDelay = 60,
    className = '',
    style,
    children,
    ...rest
}) {
    const ms = delay != null ? delay : baseDelay + index * step;
    const animClass = VARIANT_CLASS[variant] || VARIANT_CLASS['fade-up'];
    return (
        <Tag
            className={className ? `${animClass} ${className}` : animClass}
            style={{ animationDelay: `${ms}ms`, ...style }}
            {...rest}
        >
            {children}
        </Tag>
    );
}
