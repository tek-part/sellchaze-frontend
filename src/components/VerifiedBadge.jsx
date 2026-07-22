import { HiCheckBadge } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

/**
 * Small blue check-badge shown next to a verified account's name.
 */
export default function VerifiedBadge({ size = 'md', className = '' }) {
    const { t } = useTranslation();
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';
    return (
        <HiCheckBadge
            className={`${sizeClass} text-blue-500 ${className}`}
            aria-label={t('verified_account')}
            title={t('verified_account')}
        />
    );
}
