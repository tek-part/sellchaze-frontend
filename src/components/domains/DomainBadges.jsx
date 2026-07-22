import { useTranslation } from 'react-i18next';

/**
 * Status chips shared by the domain list, wizard and health panel.
 *
 * Colour is never the only signal — each badge also carries a text label and a
 * title, so the state is legible to screen readers and to anyone who cannot
 * distinguish the palette.
 */

const TONES = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    brand: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

export function Badge({ tone = 'slate', children, title, dot = true }) {
    return (
        <span
            title={title}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone] ?? TONES.slate}`}
        >
            {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
            {children}
        </span>
    );
}

export function VerificationBadge({ status, isLocked }) {
    const { t } = useTranslation();

    if (isLocked) {
        return <Badge tone="red">{t('domain_status_locked')}</Badge>;
    }

    const map = {
        verified: ['green', t('domain_status_verified')],
        pending: ['amber', t('domain_status_pending')],
        rejected: ['red', t('domain_status_rejected')],
        disabled: ['slate', t('domain_status_disabled')],
    };
    const [tone, label] = map[status] ?? ['slate', status];

    return <Badge tone={tone}>{label}</Badge>;
}

export function SslBadge({ ssl }) {
    const { t } = useTranslation();
    const status = ssl?.status ?? 'none';
    const days = ssl?.days_remaining;

    // An active certificate close to expiry is a warning, not a success.
    if (status === 'active' && typeof days === 'number' && days <= 0) {
        return <Badge tone="red">{t('domain_ssl_expired')}</Badge>;
    }
    if (status === 'active' && typeof days === 'number' && days <= 15) {
        return <Badge tone="amber">{t('domain_ssl_expiring_days', { days })}</Badge>;
    }

    const map = {
        active: ['green', t('domain_ssl_active')],
        pending: ['amber', t('domain_ssl_pending')],
        failed: ['red', t('domain_ssl_failed')],
        none: ['slate', t('domain_ssl_none')],
    };
    const [tone, label] = map[status] ?? ['slate', status];

    return <Badge tone={tone} title={ssl?.issuer ?? undefined}>{label}</Badge>;
}

export function PrimaryBadge() {
    const { t } = useTranslation();

    return <Badge tone="brand">{t('domain_primary')}</Badge>;
}

export function DnsBadge({ dns }) {
    const { t } = useTranslation();

    if (dns?.txt_ok && dns?.target_ok) {
        return <Badge tone="green">{t('domain_dns_ok')}</Badge>;
    }
    if (dns?.target_ok) {
        return <Badge tone="amber">{t('domain_dns_partial')}</Badge>;
    }

    return <Badge tone="red">{t('domain_dns_missing')}</Badge>;
}

/** 0–100 health score with an accessible progress role. */
export function HealthScore({ score }) {
    const { t } = useTranslation();
    const value = Number.isFinite(score) ? score : 0;
    const tone = value >= 100 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="flex items-center gap-2" title={t('domain_health_score')}>
            <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('domain_health_score')}
                className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"
            >
                <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-xs font-medium tabular-nums text-slate-600">{value}</span>
        </div>
    );
}

export default Badge;
