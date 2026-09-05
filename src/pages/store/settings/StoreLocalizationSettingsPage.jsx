import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import FormField from '../../../components/ui/FormField';
import SaveBar from '../../../components/ui/SaveBar';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import SettingsCard from '../../../components/ui/SettingsCard';
import useStoreContext from '../../../hooks/useStoreContext';
import useStoreSettings, { useDirty } from '../../../hooks/useStoreSettings';
import { clearStoreLocalesCache } from '../../../hooks/useStoreLocales';

const LOCALES = [
    { code: 'ar', label: 'العربية', dir: 'rtl' },
    { code: 'en', label: 'English', dir: 'ltr' },
];

function timezoneOptions() {
    try {
        if (typeof Intl.supportedValuesOf === 'function') return Intl.supportedValuesOf('timeZone');
    } catch {
        /* older engines */
    }
    return ['UTC', 'Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Bahrain', 'Asia/Muscat', 'Europe/London', 'America/New_York'];
}

function fromStore(store) {
    const currency = store?.currency || 'USD';
    const defaultLocale = store?.default_locale || 'en';
    return {
        default_locale: defaultLocale,
        supported_locales: [...new Set([defaultLocale, ...(store?.supported_locales || [])])],
        currency,
        supported_currencies: [...new Set([currency, ...(store?.supported_currencies || [])])],
        timezone: store?.timezone || 'UTC',
    };
}

/** A pill-style multi-select; the locked code (default) cannot be removed. */
function ChipToggleGroup({ options, selected, locked, onToggle, renderLabel }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((code) => {
                const active = selected.includes(code);
                const isLocked = code === locked;
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={() => !isLocked && onToggle(code)}
                        aria-pressed={active}
                        disabled={isLocked}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                            active
                                ? 'bg-brand text-white ring-brand'
                                : 'bg-white text-slate-600 ring-slate-200 hover:bg-brand-light/70 hover:text-brand-dark'
                        } ${isLocked ? 'cursor-default opacity-90' : ''}`}
                    >
                        {renderLabel ? renderLabel(code) : code}
                    </button>
                );
            })}
        </div>
    );
}

export default function StoreLocalizationSettingsPage() {
    const { t } = useTranslation();
    const { store, apiBase } = useStoreContext();
    const { save, saving, errors, clearErrors } = useStoreSettings();
    const initial = useMemo(() => fromStore(store), [store]);
    const [values, setValues] = useState(initial);
    const [currencies, setCurrencies] = useState([]);
    const [currenciesError, setCurrenciesError] = useState('');
    const timezones = useMemo(timezoneOptions, []);

    useEffect(() => { setValues(initial); }, [initial]);

    useEffect(() => {
        let cancelled = false;
        api.get(`${apiBase}/currencies`)
            .then(({ data }) => {
                if (cancelled) return;
                const list = Array.isArray(data?.data) ? data.data : [];
                setCurrencies(list.map((c) => String(c).toUpperCase()));
                setCurrenciesError('');
            })
            .catch((e) => {
                if (cancelled) return;
                setCurrencies([]);
                setCurrenciesError(e.response?.data?.message || e.message);
            });
        return () => { cancelled = true; };
    }, [apiBase]);

    // Always offer what the store already uses so nothing disappears if the list is short.
    const currencyOptions = useMemo(
        () => [...new Set([...currencies, ...(initial.supported_currencies || []), initial.currency])].filter(Boolean).sort(),
        [currencies, initial],
    );

    const dirty = useDirty(initial, values);
    const err = (key) => errors?.[key] || errors?.[`${key}.0`];

    const setDefaultLocale = (code) => setValues((v) => ({
        ...v,
        default_locale: code,
        supported_locales: [...new Set([code, ...v.supported_locales])],
    }));
    const toggleLocale = (code) => setValues((v) => ({
        ...v,
        supported_locales: v.supported_locales.includes(code)
            ? v.supported_locales.filter((c) => c !== code)
            : [...v.supported_locales, code],
    }));
    const setCurrency = (code) => setValues((v) => ({
        ...v,
        currency: code,
        supported_currencies: [...new Set([code, ...v.supported_currencies])],
    }));
    const toggleCurrency = (code) => setValues((v) => ({
        ...v,
        supported_currencies: v.supported_currencies.includes(code)
            ? v.supported_currencies.filter((c) => c !== code)
            : [...v.supported_currencies, code],
    }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            await save({
                default_locale: values.default_locale,
                supported_locales: [...new Set([values.default_locale, ...values.supported_locales])],
                currency: values.currency,
                supported_currencies: [...new Set([values.currency, ...values.supported_currencies])],
                timezone: values.timezone,
            });
            clearStoreLocalesCache(apiBase);
        } catch {
            /* surfaced by the hook */
        }
    };

    return (
        <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
            <PageHeader
                title={t('store_locale_title', 'Language & currency')}
                subtitle={t('store_locale_subtitle', 'What your storefront speaks, prices in and which clock it follows.')}
            />

            <SettingsCard title={t('store_locale_languages', 'Languages')} description={t('store_locale_languages_hint', 'Content editors offer a tab for every enabled language; the default is required.')}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label={t('store_default_locale', 'Default language')} htmlFor="store-default-locale" error={err('default_locale')}>
                        <SearchableSelect
                            id="store-default-locale"
                            value={values.default_locale}
                            onChange={(e) => setDefaultLocale(e.target.value)}
                            options={LOCALES.map((l) => ({ value: l.code, label: l.label }))}
                            className="w-full"
                        />
                    </FormField>
                    <FormField label={t('store_locale_supported', 'Enabled languages')} error={err('supported_locales')} hint={t('store_locale_supported_hint', 'The default language stays enabled.')}>
                        <ChipToggleGroup
                            options={LOCALES.map((l) => l.code)}
                            selected={values.supported_locales}
                            locked={values.default_locale}
                            onToggle={toggleLocale}
                            renderLabel={(code) => LOCALES.find((l) => l.code === code)?.label || code}
                        />
                    </FormField>
                </div>
            </SettingsCard>

            <SettingsCard title={t('store_locale_currencies', 'Currencies')} description={t('store_locale_currencies_hint', 'Prices are stored in the base currency; shoppers can switch between the enabled ones.')}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label={t('store_currency', 'Base currency')} htmlFor="store-currency" error={err('currency')}>
                        <SearchableSelect
                            id="store-currency"
                            value={values.currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            options={currencyOptions.map((code) => ({ value: code, label: code }))}
                            className="w-full"
                        />
                    </FormField>
                    <FormField
                        label={t('store_supported_currencies', 'Currencies available to shoppers')}
                        error={err('supported_currencies')}
                        hint={currenciesError
                            ? t('store_locale_currencies_unavailable', 'The currency list could not be loaded; showing the ones already enabled.')
                            : t('store_locale_currencies_pick_hint', 'Up to 12. The base currency stays enabled.')}
                    >
                        <ChipToggleGroup
                            options={currencyOptions}
                            selected={values.supported_currencies}
                            locked={values.currency}
                            onToggle={toggleCurrency}
                        />
                    </FormField>
                </div>
            </SettingsCard>

            <SettingsCard title={t('store_timezone', 'Timezone')} description={t('store_locale_timezone_hint', 'Order timestamps, scheduled pages and reports use this timezone.')}>
                <FormField htmlFor="store-timezone" error={err('timezone')} className="max-w-md">
                    <SearchableSelect
                        id="store-timezone"
                        value={values.timezone}
                        onChange={(e) => setValues((v) => ({ ...v, timezone: e.target.value }))}
                        options={timezones.map((tz) => ({ value: tz, label: tz }))}
                        className="w-full"
                    />
                </FormField>
            </SettingsCard>

            <SaveBar dirty={dirty} saving={saving} onReset={() => { setValues(initial); clearErrors(); }} />
        </form>
    );
}
