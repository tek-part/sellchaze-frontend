import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePhoto, HiOutlineXMark } from 'react-icons/hi2';
import PageHeader from '../../../components/PageHeader';
import FormField, { INPUT_CLASS, INPUT_ERROR_CLASS } from '../../../components/ui/FormField';
import SaveBar from '../../../components/ui/SaveBar';
import SettingsCard from '../../../components/ui/SettingsCard';
import StoreStatusPill from '../../../components/store/StoreStatusPill';
import useStoreContext from '../../../hooks/useStoreContext';
import useStoreSettings, { useDirty } from '../../../hooks/useStoreSettings';

function fromStore(store) {
    return {
        name: store?.name ?? '',
        slug: store?.slug ?? '',
        description: store?.description ?? '',
        email: store?.email ?? '',
        phone: store?.phone ?? '',
    };
}

/** Image field with a live preview, a file picker and a "remove selection" action. */
function ImageField({ label, hint, current, file, onChange, aspect = 'square', accept = 'image/png,image/jpeg,image/webp' }) {
    const { t } = useTranslation();
    const inputRef = useRef(null);
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    const src = preview || current;
    const frame = aspect === 'wide' ? 'h-28 w-full' : 'h-24 w-24';

    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
            <div className={`flex ${aspect === 'wide' ? 'flex-col' : 'items-start'} gap-3`}>
                <div className={`${frame} relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50`}>
                    {src ? (
                        <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-slate-300">
                            <HiOutlinePhoto className="h-8 w-8" aria-hidden />
                        </span>
                    )}
                    {file ? (
                        <button
                            type="button"
                            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
                            className="absolute end-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow-sm hover:text-red-600"
                            aria-label={t('ui_remove_selection', 'Remove selected file')}
                        >
                            <HiOutlineXMark className="h-3.5 w-3.5" aria-hidden />
                        </button>
                    ) : null}
                </div>
                <div className="min-w-0">
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand/40 hover:bg-brand-light/60 hover:text-brand-dark">
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={(e) => onChange(e.target.files?.[0] || null)}
                        />
                        {file ? t('ui_change_file', 'Change file') : t('ui_choose_file', 'Choose file')}
                    </label>
                    {file ? <p className="mt-1.5 truncate text-xs text-slate-500" title={file.name}>{file.name}</p> : null}
                    {hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
                </div>
            </div>
        </div>
    );
}

export default function StoreGeneralSettingsPage() {
    const { t } = useTranslation();
    const { store } = useStoreContext();
    const { save, saving, errors, clearErrors } = useStoreSettings();
    const initial = useMemo(() => fromStore(store), [store]);
    const [values, setValues] = useState(initial);
    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);

    useEffect(() => { setValues(initial); }, [initial]);

    const dirty = useDirty(initial, values) || Boolean(logo) || Boolean(banner);
    const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
    const err = (key) => errors?.[key];
    const cls = (key) => `${INPUT_CLASS} ${err(key) ? INPUT_ERROR_CLASS : ''}`;

    const reset = () => { setValues(initial); setLogo(null); setBanner(null); clearErrors(); };

    const submit = async (e) => {
        e.preventDefault();
        const payload = {
            name: values.name.trim(),
            slug: values.slug.trim().toLowerCase() || null,
            description: values.description,
            email: values.email.trim() || null,
            phone: values.phone.trim() || null,
        };
        try {
            await save(payload, { logo, banner });
            setLogo(null);
            setBanner(null);
        } catch {
            /* surfaced by the hook */
        }
    };

    const subdomainPreview = store?.subdomain_host && store?.slug && values.slug
        ? store.subdomain_host.replace(store.slug, values.slug.trim().toLowerCase())
        : store?.subdomain_host;

    return (
        <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
            <PageHeader
                title={t('store_general_title', 'General')}
                subtitle={t('store_general_subtitle', 'Your store identity and how customers reach you.')}
                badge={<StoreStatusPill status={store?.status} />}
            />

            <SettingsCard title={t('store_general_identity', 'Store identity')} description={t('store_general_identity_hint', 'Shown in the storefront header, emails and search results.')}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label={t('store_name', 'Store name')} htmlFor="store-name" required error={err('name')}>
                        <input id="store-name" value={values.name} onChange={set('name')} className={cls('name')} maxLength={255} required />
                    </FormField>
                    <FormField
                        label={t('store_slug', 'Slug')}
                        htmlFor="store-slug"
                        error={err('slug')}
                        hint={t('store_general_slug_hint', 'Lowercase letters, numbers and dashes. Changing it changes your subdomain.')}
                    >
                        <input
                            id="store-slug"
                            value={values.slug}
                            onChange={set('slug')}
                            className={`${cls('slug')} font-mono`}
                            dir="ltr"
                            pattern="[a-z0-9\-]+"
                            maxLength={255}
                        />
                        {subdomainPreview ? <p className="mt-1.5 truncate text-xs text-slate-500" dir="ltr">https://{subdomainPreview}</p> : null}
                    </FormField>
                    <FormField
                        label={t('store_description', 'Company description')}
                        htmlFor="store-description"
                        error={err('description')}
                        hint={t('store_description_hint', 'Appears on your site and in search results.')}
                        className="sm:col-span-2"
                    >
                        <textarea
                            id="store-description"
                            rows={4}
                            value={values.description}
                            onChange={set('description')}
                            maxLength={5000}
                            placeholder={t('store_description_ph', 'What does your company make, and who do you serve?')}
                            className={cls('description')}
                        />
                    </FormField>
                </div>
            </SettingsCard>

            <SettingsCard title={t('store_general_contact', 'Contact')} description={t('store_general_contact_hint', 'Used on the contact page and in order notifications.')}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label={t('store_email', 'Store email')} htmlFor="store-email" error={err('email')}>
                        <input id="store-email" type="email" value={values.email} onChange={set('email')} className={cls('email')} dir="ltr" placeholder="hello@example.com" />
                    </FormField>
                    <FormField label={t('store_phone', 'Phone')} htmlFor="store-phone" error={err('phone')}>
                        <input id="store-phone" type="tel" value={values.phone} onChange={set('phone')} className={cls('phone')} dir="ltr" placeholder="+20 100 000 0000" />
                    </FormField>
                </div>
            </SettingsCard>

            <SettingsCard title={t('store_general_branding', 'Branding')} description={t('store_general_branding_hint', 'PNG, JPG or WebP. Logo up to 2 MB, banner up to 4 MB.')}>
                <div className="grid gap-6 sm:grid-cols-2">
                    <ImageField
                        label={t('store_logo', 'Logo')}
                        hint={t('store_general_logo_hint', 'Square works best.')}
                        current={store?.logo_url}
                        file={logo}
                        onChange={setLogo}
                    />
                    <ImageField
                        label={t('store_banner', 'Banner')}
                        hint={t('store_general_banner_hint', 'Wide image for the storefront hero.')}
                        current={store?.banner_url}
                        file={banner}
                        onChange={setBanner}
                        aspect="wide"
                    />
                </div>
                {err('logo') || err('banner') ? (
                    <p className="mt-3 text-xs font-medium text-red-600" role="alert">{(err('logo') || err('banner'))[0]}</p>
                ) : null}
            </SettingsCard>

            <SaveBar dirty={dirty} saving={saving} onReset={reset} />
        </form>
    );
}
