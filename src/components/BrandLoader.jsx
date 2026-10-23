import { useTranslation } from 'react-i18next';

/** Loading state with the Sellchaze mark (the tag), used while the app or a page is loading. */
export default function BrandLoader({ fullScreen = false }) {
    const { t } = useTranslation();
    return (
        <div
            role="status"
            className={`sc-brand-loader flex items-center justify-center ${fullScreen ? 'h-dvh bg-surface' : 'min-h-[40vh]'}`}
        >
            <img src="/favicon.svg" alt="" width="56" height="56" className="sc-brand-loader__mark" />
            <span className="sr-only">{t('loading', 'Loading…')}</span>
        </div>
    );
}
