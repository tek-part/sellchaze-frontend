/**
 * Small inline SVG icons for the public feature cards.
 * Keyed to the same i18n keys used on LandingPage + FeaturesPage so both stay in sync.
 */

const base = 'h-5 w-5';

export const FeatureIcons = {
    landing_feature_orders: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base}>
            <path d="M3 7l9-4 9 4" />
            <path d="M21 7v10l-9 4-9-4V7" />
            <path d="M3 7l9 4 9-4" />
            <path d="M12 11v10" />
        </svg>
    ),
    landing_feature_quotations: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base}>
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6" />
            <path d="M9 14l2 2 4-4" />
        </svg>
    ),
    landing_feature_partners: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base}>
            <circle cx="8" cy="8" r="3" />
            <circle cx="17" cy="10" r="3" />
            <path d="M2 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
            <path d="M14 21v-1a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v1" />
        </svg>
    ),
    landing_feature_ledger: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base}>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M8 4v16" />
            <path d="M12 10h5" />
            <path d="M12 14h5" />
        </svg>
    ),
    landing_feature_verification: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base}>
            <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
    landing_feature_catalog: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
};

export const featureIconTone = [
    'bg-brand/10 text-brand',
    'bg-accent/10 text-accent',
    'bg-slate-800/10 text-slate-800',
    'bg-brand/10 text-brand',
    'bg-accent/10 text-accent',
    'bg-slate-800/10 text-slate-800',
];
