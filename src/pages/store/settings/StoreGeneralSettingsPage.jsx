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
import fontCatalog from '../../../shared/store-fonts.json';

function fromStore(store) {
    return {
        name: store?.name ?? '',
        slug: store?.slug ?? '',
        description: store?.description ?? '',
        email: store?.email ?? '',
        phone: store?.phone ?? '',
        site_title: store?.identity?.site_title ?? '',
        header_mode: store?.identity?.header_mode ?? 'theme',
        header_text: store?.identity?.header_text ?? '',
        primary_color: store?.identity?.primary_color ?? '',
        font_family: store?.identity?.font_family ?? '',
        remove_logo: false, remove_banner: false, remove_favicon: false,
    };
}

/** Image field with a live preview, a file picker and a "remove selection" action. */
function ImageField({ label, hint, current, file, onChange, removed, onRemove, aspect = 'square', accept = 'image/png,image/jpeg,image/webp' }) {
    const { t, i18n } = useTranslation();
    const inputRef = useRef(null);
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    const src = preview || (!removed && current);
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
                    <button type="button" onClick={() => inputRef.current?.click()} aria-label={`${t('ui_choose_file', 'Choose file')} — ${label}`} className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand/40 hover:bg-brand-light/60 hover:text-brand-dark">
                        {file ? t('ui_change_file', 'Change file') : t('ui_choose_file', 'Choose file')}
                    </button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            aria-label={label}
                            className="hidden"
                            onChange={(e) => onChange(e.target.files?.[0] || null)}
                        />
                    {current && onRemove ? <label className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={Boolean(removed)} disabled={Boolean(file)} onChange={(event) => onRemove(event.target.checked)} />{i18n.language.startsWith('ar') ? 'حذف الصورة المحفوظة عند الحفظ' : 'Remove saved image when saving'}</label> : null}
                    {file ? <p className="mt-1.5 truncate text-xs text-slate-500" title={file.name}>{file.name}</p> : null}
                    {hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
                </div>
            </div>
        </div>
    );
}

export default function StoreGeneralSettingsPage() {
    const { t, i18n } = useTranslation();
    const { store } = useStoreContext();
    const text = (ar, en) => i18n.language.startsWith('ar') ? ar : en;
    const { save, saving, errors, clearErrors } = useStoreSettings();
    const initial = useMemo(() => fromStore(store), [store]);
    const [values, setValues] = useState(initial);
    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [favicon, setFavicon] = useState(null);
    const [fontSearch, setFontSearch] = useState('');
    const recommendedFonts = ['Cairo', 'Tajawal', 'IBM Plex Sans Arabic', 'Almarai', 'El Messiri', 'Mada', 'Readex Pro', 'Changa', 'Noto Sans Arabic', 'Raleway', 'Unna', 'Wittgenstein', 'Baskervville', 'Nunito Sans', 'Didact Gothic', 'Hind'];
    const fonts = Object.keys(fontCatalog).filter(font => font.toLowerCase().includes(fontSearch.trim().toLowerCase()) || font === values.font_family);

    useEffect(() => { setValues(initial); }, [initial]);

    const dirty = useDirty(initial, values) || Boolean(logo) || Boolean(banner) || Boolean(favicon);
    const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
    const err = (key) => errors?.[key];
    const cls = (key) => `${INPUT_CLASS} ${err(key) ? INPUT_ERROR_CLASS : ''}`;

    const reset = () => { setValues(initial); setLogo(null); setBanner(null); setFavicon(null); setFontSearch(''); clearErrors(); };

    const submit = async (e) => {
        e.preventDefault();
        const payload = {
            name: values.name.trim(),
            slug: values.slug.trim().toLowerCase() || null,
            description: values.description,
            email: values.email.trim() || null,
            phone: values.phone.trim() || null,
            site_title: values.site_title.trim() || null,
            header_mode: values.header_mode, header_text: values.header_text.trim() || null,
            primary_color: values.primary_color.trim() || null,
            font_family: values.font_family || null,
            remove_logo: values.remove_logo, remove_banner: values.remove_banner, remove_favicon: values.remove_favicon,
        };
        try {
            await save(payload, { logo, banner, favicon });
            setLogo(null);
            setBanner(null);
            setFavicon(null);
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

            <SettingsCard title={text('مظهر المتجر', 'Store appearance')} description={text('تطبق هذه القيم على الثيمات الخمسة بعد تحديث المتجر. اترك اللون والخط فارغين لاستخدام إعدادات الثيم.', 'These values apply across all five themes after refreshing the store. Leave color and font unset to use the theme settings.')}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label={text('عنوان الموقع الرئيسي', 'Site title')} htmlFor="site-title" error={err('site_title')} hint={text('يظهر في تبويب المتصفح ونتائج البحث. اتركه فارغًا لاستخدام اسم المتجر.', 'Used in the browser tab and search results. Leave blank to use the store name.')}>
                        <input id="site-title" value={values.site_title} onChange={set('site_title')} maxLength={255} className={cls('site_title')} />
                    </FormField>
                    <FormField label={text('الجزء العلوي من الهيدر', 'Top header')} htmlFor="header-mode" error={err('header_mode')}>
                        <select id="header-mode" value={values.header_mode} onChange={set('header_mode')} className={cls('header_mode')}>
                            <option value="theme">{text('استخدام إعدادات الثيم', 'Use theme settings')}</option><option value="custom">{text('نص مخصص', 'Custom text')}</option><option value="hidden">{text('إخفاء', 'Hide')}</option>
                        </select>
                    </FormField>
                    <FormField label={text('محتوى الجزء العلوي من الهيدر', 'Top header text')} htmlFor="header-text" error={err('header_text')} hint={text('اتركه فارغًا لإخفائه عند اختيار نص مخصص.', 'Leave blank to hide it when using custom text.')} className="sm:col-span-2">
                        <input id="header-text" value={values.header_text} onChange={set('header_text')} disabled={values.header_mode !== 'custom'} maxLength={500} className={cls('header_text')} />
                    </FormField>
                    <FormField label={text('اللون الرئيسي', 'Primary color')} htmlFor="primary-color" error={err('primary_color')}>
                        <div className="flex gap-2"><input type="color" aria-label={text('اختيار اللون الرئيسي', 'Pick primary color')} value={/^#[0-9a-f]{6}$/i.test(values.primary_color) ? values.primary_color : '#073f4b'} onChange={set('primary_color')} className="h-11 w-12 shrink-0 cursor-pointer rounded-lg" /><input id="primary-color" value={values.primary_color} onChange={set('primary_color')} maxLength={7} pattern="#[0-9a-fA-F]{6}" placeholder={text('إعدادات الثيم', 'Theme settings')} dir="ltr" className={cls('primary_color')} /></div>
                    </FormField>
                    <FormField label={text('خط المتجر', 'Store font')} htmlFor="store-font" error={err('font_family')} hint={text('تحميل الخط المحدد فقط؛ خط عربي بديل للنصوص العربية عند الحاجة.', 'Loads only the selected font, with an Arabic fallback when needed.')}>
                        <input type="search" aria-label={text('البحث عن خط', 'Search fonts')} value={fontSearch} onChange={event => setFontSearch(event.target.value)} placeholder={text('ابحث في الخطوط', 'Search fonts')} className={`${INPUT_CLASS} mb-2`} />
                        <select id="store-font" value={values.font_family} onChange={set('font_family')} className={cls('font_family')}>
                            <option value="">{text('استخدام إعدادات الثيم', 'Use theme settings')}</option><option value="system">{text('خط الجهاز', 'System font')}</option>
                            <optgroup label={text('خطوط مقترحة', 'Recommended fonts')}>{fonts.filter(font => recommendedFonts.includes(font)).map(font => <option key={font} value={font}>{font}</option>)}</optgroup>
                            <optgroup label={text('كل الخطوط', 'All fonts')}>{fonts.filter(font => !recommendedFonts.includes(font)).map(font => <option key={font} value={font}>{font}</option>)}</optgroup>
                        </select>
                    </FormField>
                </div>
                <button type="button" className="mt-4 text-sm underline" onClick={() => setValues(current => ({ ...current, primary_color: '', font_family: '', header_mode: 'theme', header_text: '' }))}>{text('استعادة مظهر الثيم', 'Restore theme appearance')}</button>
            </SettingsCard>

            <SettingsCard title={t('store_general_branding', 'Branding')} description={t('store_general_branding_hint', 'PNG, JPG or WebP. Logo up to 2 MB, banner up to 4 MB.')}>
                <div className="grid gap-6 sm:grid-cols-2">
                    <ImageField
                        label={t('store_logo', 'Logo')}
                        hint={t('store_general_logo_hint', 'Square works best.')}
                        current={store?.logo_url}
                        file={logo}
                        onChange={setLogo}
                        removed={values.remove_logo} onRemove={value => setValues(current => ({ ...current, remove_logo: value }))}
                    />
                    <ImageField
                        label={t('store_banner', 'Banner')}
                        hint={t('store_general_banner_hint', 'Wide image for the storefront hero.')}
                        current={store?.banner_url}
                        file={banner}
                        onChange={setBanner}
                        removed={values.remove_banner} onRemove={value => setValues(current => ({ ...current, remove_banner: value }))}
                        aspect="wide"
                    />
                    <ImageField label={text('الأيقونة المصغرة', 'Favicon')} hint={text('PNG أو JPG أو WebP، مربع 16–512 بكسل، حتى 512 كيلوبايت.', 'PNG, JPG or WebP. Square, 16–512 px, up to 512 KB.')} current={store?.identity?.favicon_url} file={favicon} onChange={setFavicon} removed={values.remove_favicon} onRemove={value => setValues(current => ({ ...current, remove_favicon: value }))} />
                </div>
                {err('logo') || err('banner') || err('favicon') ? (
                    <p className="mt-3 text-xs font-medium text-red-600" role="alert">{(err('logo') || err('banner') || err('favicon'))[0]}</p>
                ) : null}
            </SettingsCard>

            <SaveBar dirty={dirty} saving={saving} onReset={reset} />
        </form>
    );
}
