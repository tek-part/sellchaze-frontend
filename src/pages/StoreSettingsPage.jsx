import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import CustomDomainsPanel from '../components/domains/CustomDomainsPanel';
import SearchableSelect from '../components/ui/SearchableSelect';

const CURRENCIES = ['USD', 'SAR', 'AED', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR', 'EUR'];

/**
 * Store branding + status/currency. Logo/banner are uploaded via multipart,
 * so we POST with method spoofing (_method=PUT) to the update route.
 */
export default function StoreSettingsPage() {
    const { id, apiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [store, setStore] = useState(null);
    const [status, setStatus] = useState('draft');
    const [currency, setCurrency] = useState('USD');
    const [defaultLocale, setDefaultLocale] = useState('en');
    const [supportedCurrencies, setSupportedCurrencies] = useState(['USD']);
    const [supportedLocales, setSupportedLocales] = useState(['ar', 'en']);
    const [timezone, setTimezone] = useState('UTC');
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxRate, setTaxRate] = useState('0');
    const [taxIncluded, setTaxIncluded] = useState(false);
    const [shippingEnabled, setShippingEnabled] = useState(false);
    const [shippingRate, setShippingRate] = useState('0');
    const [shippingFreeOver, setShippingFreeOver] = useState('');
    const [description, setDescription] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [copied, setCopied] = useState(false);

    const copySubdomain = async () => {
        if (!store?.subdomain_host) return;
        try {
            await navigator.clipboard.writeText(store.subdomain_host);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };

    useEffect(() => {
        if (id && !permissions.includes('stores-list')) return;
        setErr('');
        api.get(`${apiBase}`)
            .then(({ data }) => {
                const s = data.data;
                setStore(s);
                setStatus(s.status ?? 'draft');
                setCurrency(s.currency ?? 'USD');
                setDefaultLocale(s.default_locale ?? 'en');
                setSupportedCurrencies(s.supported_currencies?.length ? s.supported_currencies : [s.currency ?? 'USD']);
                setSupportedLocales(s.supported_locales?.length ? s.supported_locales : ['ar', 'en']);
                setTimezone(s.timezone ?? 'UTC');
                setTaxEnabled(Boolean(s.tax?.enabled));
                setTaxRate(s.tax?.rate ?? '0');
                setTaxIncluded(Boolean(s.tax?.prices_include_tax));
                setShippingEnabled(Boolean(s.shipping?.enabled));
                setShippingRate(s.shipping?.flat_rate ?? '0');
                setShippingFreeOver(s.shipping?.free_over ?? '');
                setDescription(s.description ?? '');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [apiBase, id, permissions]);

    if (id && !can('stores-edit')) {
        return <Navigate to="/stores" replace />;
    }

    async function submit(e) {
        e.preventDefault();
        const publishing = e.nativeEvent?.submitter?.value === 'publish';
        setLoading(true);
        setErr('');
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            // Read the actual submitter instead of relying on an asynchronous
            // state update from the Publish button's click handler.
            fd.append('status', publishing ? 'active' : status);
            fd.append('currency', currency);
            fd.append('default_locale', defaultLocale);
            [...new Set([...supportedLocales, defaultLocale])].forEach((locale) => fd.append('supported_locales[]', locale));
            [...new Set([...supportedCurrencies, currency])].forEach((code) => fd.append('supported_currencies[]', code));
            fd.append('timezone', timezone);
            fd.append('tax_enabled', taxEnabled ? '1' : '0');
            fd.append('tax_rate', taxRate || '0');
            fd.append('tax_prices_include', taxIncluded ? '1' : '0');
            fd.append('shipping_enabled', shippingEnabled ? '1' : '0');
            fd.append('shipping_flat_rate', shippingRate || '0');
            if (shippingFreeOver !== '') fd.append('shipping_free_over', shippingFreeOver);
            fd.append('description', description ?? '');
            if (logoFile) fd.append('logo', logoFile);
            if (bannerFile) fd.append('banner', bannerFile);
            const { data } = await api.post(`${apiBase}`, fd);
            setStore(data.data);
            setStatus(data.data?.status ?? status);
            setLogoFile(null);
            setBannerFile(null);
            toast.success(t('action_edit'));
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';
    const label = 'mb-1 block text-sm font-medium text-slate-700';

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('store_settings_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {store ? store.name : ''} — {t('store_settings_subtitle')}
                </p>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <div className="grid gap-5 lg:grid-cols-3">
            <form
                onSubmit={submit}
                className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card lg:col-span-2"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>{t('store_status')}</label>
                        <SearchableSelect value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                            <option value="draft">{t('store_status_draft')}</option>
                            <option value="active">{t('store_status_active')}</option>
                            <option value="suspended">{t('store_status_suspended')}</option>
                        </SearchableSelect>
                    </div>
                    <div>
                        <label className={label}>{t('store_currency')}</label>
                        <SearchableSelect value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full">
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </SearchableSelect>
                    </div>
                    <fieldset className="sm:col-span-2">
                        <legend className={label}>{t('store_supported_currencies', 'Currencies available to shoppers')}</legend>
                        <div className="flex flex-wrap gap-3">{CURRENCIES.map((code) => <label key={code} className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={supportedCurrencies.includes(code)} disabled={code === currency} onChange={(e) => setSupportedCurrencies((rows) => e.target.checked ? [...new Set([...rows, code])] : rows.filter((value) => value !== code))} />{code}</label>)}</div>
                    </fieldset>
                </div>

                <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>{t('store_default_locale', 'Default language')}</label>
                        <SearchableSelect value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)} className="w-full">
                            <option value="ar">العربية</option><option value="en">English</option>
                        </SearchableSelect>
                        <div className="mt-2 flex gap-3">{['ar', 'en'].map((locale) => <label key={locale} className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={supportedLocales.includes(locale)} disabled={locale === defaultLocale} onChange={(e) => setSupportedLocales((rows) => e.target.checked ? [...new Set([...rows, locale])] : rows.filter((value) => value !== locale))} />{locale.toUpperCase()}</label>)}</div>
                    </div>
                    <div>
                        <label className={label}>{t('store_timezone', 'Timezone')}</label>
                        <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={field} placeholder="Africa/Cairo" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} /> {t('store_tax_enabled', 'Apply tax')}</label>
                    <div><label className={label}>{t('store_tax_rate', 'Tax rate %')}</label><input type="number" min="0" max="100" step="0.001" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={field} /></div>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={taxIncluded} onChange={(e) => setTaxIncluded(e.target.checked)} /> {t('store_tax_included', 'Prices include tax')}</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={shippingEnabled} onChange={(e) => setShippingEnabled(e.target.checked)} /> {t('store_shipping_enabled', 'Apply shipping')}</label>
                    <div><label className={label}>{t('store_shipping_rate', 'Flat shipping rate')}</label><input type="number" min="0" step="0.01" value={shippingRate} onChange={(e) => setShippingRate(e.target.value)} className={field} /></div>
                    <div><label className={label}>{t('store_shipping_free_over', 'Free shipping over')}</label><input type="number" min="0" step="0.01" value={shippingFreeOver} onChange={(e) => setShippingFreeOver(e.target.value)} className={field} placeholder={t('optional', 'Optional')} /></div>
                </div>

                {/* Company description — shown on the storefront and used as its
                    meta description, so it is worth writing properly. */}
                <div>
                    <label className={label}>{t('store_description', 'Company description')}</label>
                    <textarea
                        rows={4}
                        value={description}
                        maxLength={1000}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('store_description_ph', 'What does your company make, and who do you serve?')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                        {t('store_description_hint', 'Appears on your site and in search results.')}
                    </p>
                </div>

                {status !== 'active' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                        <p className="text-sm text-emerald-800">
                            {t('store_publish_hint', 'Your site is not public yet. Publish it to make it live.')}
                        </p>
                        <button
                            type="submit"
                            name="intent"
                            value="publish"
                            disabled={loading}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {t('store_publish', 'Publish site')}
                        </button>
                    </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>{t('store_logo')}</label>
                        {store?.logo_url ? (
                            <img
                                src={store.logo_url}
                                alt="logo"
                                className="mb-2 h-16 w-16 rounded-lg border border-slate-200 object-cover"
                            />
                        ) : null}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:text-brand"
                        />
                    </div>
                    <div>
                        <label className={label}>{t('store_banner')}</label>
                        {store?.banner_url ? (
                            <img
                                src={store.banner_url}
                                alt="banner"
                                className="mb-2 h-16 w-full rounded-lg border border-slate-200 object-cover"
                            />
                        ) : null}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:text-brand"
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {t('product_form_save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(id ? '/stores' : '/store')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>

            {/* Phase 2: Domain settings — generated subdomain (custom domains come later). */}
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{t('domain_settings_title')}</h2>
                    <p className="mt-0.5 text-sm text-slate-500">{t('domain_settings_subtitle')}</p>
                </div>
                <div className="grid gap-4">
                    <div>
                        <label className={label}>{t('store_slug')}</label>
                        <input value={store?.slug ?? ''} readOnly className={`${field} bg-slate-50 text-slate-500`} />
                    </div>
                    <div>
                        <label className={label}>{t('store_generated_subdomain')}</label>
                        <div className="flex items-stretch gap-2">
                            <input
                                value={store?.subdomain_host ?? ''}
                                readOnly
                                dir="ltr"
                                className={`${field} bg-slate-50 font-mono text-slate-700`}
                            />
                            <button
                                type="button"
                                onClick={copySubdomain}
                                className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {copied ? t('action_copied') : t('action_copy')}
                            </button>
                        </div>
                        <a
                            href={store?.subdomain_host ? `https://${store.subdomain_host}` : undefined}
                            target="_blank"
                            rel="noreferrer"
                            dir="ltr"
                            className="mt-1 inline-block text-xs text-brand hover:underline"
                        >
                            https://{store?.subdomain_host}
                        </a>
                    </div>
                </div>
            </div>
            </div>

            {/* Custom domains: connect, verify, SSL, health and audit history. */}
            <CustomDomainsPanel apiBase={apiBase} />
        </div>
    );
}
