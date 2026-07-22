import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const lng = i18n.language?.startsWith('ar') ? 'ar' : 'en';

    const toggle = () => {
        const next = lng === 'en' ? 'ar' : 'en';
        i18n.changeLanguage(next);
        localStorage.setItem('sellchase_locale', next);
        document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', next);
    };

    return (
        <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-xs hover:bg-gray-50"
            title={lng === 'en' ? 'العربية' : 'English'}
        >
            {lng === 'en' ? (
                <span>
                    <span className="me-1" aria-hidden>
                        🇸🇦
                    </span>
                    العربية
                </span>
            ) : (
                <span>
                    <span className="me-1" aria-hidden>
                        🇬🇧
                    </span>
                    English
                </span>
            )}
        </button>
    );
}
