import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { marketingUrl } from '../config/marketing';

/**
 * Old public URLs (/features, /suppliers/…, /blog/…, /u/:username …) now belong to the marketing
 * site. Old links and bookmarks keep working: send the visitor to the same path there.
 */
export default function MarketingRedirect() {
    const { pathname, search } = useLocation();
    const { i18n } = useTranslation();
    const target = `${marketingUrl(pathname, i18n.language === 'ar' ? 'ar' : 'en')}${search}`;

    useEffect(() => {
        window.location.replace(target);
    }, [target]);

    return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
            <a href={target}>{target}</a>
        </div>
    );
}
