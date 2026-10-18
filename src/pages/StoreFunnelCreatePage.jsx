import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlinePaintBrush, HiOutlineSparkles, HiOutlineChevronDown } from '../components/workspace/WorkspaceIcons';
import { funnelCopy, funnelError } from '../components/store/funnels/funnelCopy';
import '../components/store/funnels/funnel-workspace.css';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const catalogOrder = ['glasses-en', 'glasses-ar', 'hair-revive-en', 'hair-revive-ar', 'litter-robot-en', 'litter-robot-ar', 'electric-biker-en', 'electric-biker-ar', 'hair-care-en', 'hair-care-ar'];
function templateName(item) { return (item?.name?.en || item?.key || '').replace(' — English', ' EN').replace(' — Arabic', ' AR'); }
function previewSourceSet(item, device) {
    const path = `/media/funnel-previews/${item.key}-${device}`;
    return catalogOrder.includes(item.key) && item[device === 'desktop' ? 'preview_desktop_image' : 'preview_mobile_image'] === `${path}.png` ? `${path}.jpg 1x` : undefined;
}

export default function StoreFunnelCreatePage() {
    const { i18n } = useTranslation(); const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'; const c = funnelCopy[lang];
    const { apiBase, uiBase } = useStoreScope(); const { access, locales } = useOutletContext(); const navigate = useNavigate();
    const [params, setParams] = useSearchParams(); const cloneParam = params.get('clone'); const loadedClone = useRef(''); const cloneRequest = useRef(null); const mounted = useRef(true);
    const [mode, setMode] = useState(cloneParam ? 'manual' : null); const [step, setStep] = useState(1);
    const scroller = useRef(null);
    useLayoutEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [step]);
    const [templates, setTemplates] = useState([]); const [template, setTemplate] = useState('');
    const [aiAvailable, setAiAvailable] = useState(false); const [baseUrl, setBaseUrl] = useState('/funnels/');
    const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
    const [code, setCode] = useState(cloneParam || ''); const [source, setSource] = useState(null); const [codeBusy, setCodeBusy] = useState(false);
    const [form, setForm] = useState({ title: '', slug: '', product_id: '', locale: locales?.default || 'en' });
    const [query, setQuery] = useState(''); const [products, setProducts] = useState([]); const [productLoading, setProductLoading] = useState(false); const [selectedProduct, setSelectedProduct] = useState(null);
    const [generation, setGeneration] = useState({ language: locales?.default === 'ar' ? 'العربية' : 'English', dialect: '', product_name: '', description: '' });
    const allowed = access?.canStorePages;
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; cloneRequest.current?.abort(); loadedClone.current = ''; }; }, []);
    useEffect(() => {
        if (!allowed) return undefined;
        let active = true; const controller = new AbortController(); setLoading(true);
        api.get(`${apiBase}/funnels/templates`, { signal: controller.signal }).then(({ data }) => {
            if (active) { setTemplates(data.data || []); setAiAvailable(Boolean(data.ai?.available)); setBaseUrl(data.funnel_base_url || '/funnels/'); }
        }).catch(e => { if (active) setError(funnelError(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [allowed, apiBase]);

    const lookup = useCallback(async value => {
        cloneRequest.current?.abort();
        setSource(null); setTemplate(''); setStep(1);
        const next = value.trim().toLowerCase();
        if (!uuid.test(next)) { setCodeBusy(false); setError(c.codeInvalid); return; }
        const controller = new AbortController(); cloneRequest.current = controller;
        setCodeBusy(true); setError('');
        try {
            const { data } = await api.get(`${apiBase}/funnels/by-code/${encodeURIComponent(next)}`, { signal: controller.signal }); const item = data.data;
            if (controller.signal.aborted || !mounted.current) return;
            setSource(item); setCode(item.code); setTemplate(item.template_key); setSelectedProduct(item.product || null);
            setForm({ title: `${item.title} (${c.duplicate})`, slug: `${item.slug}-copy`, product_id: item.product?.id || '', locale: item.locale });
            setMode('manual'); setStep(2);
        } catch (e) { if (!controller.signal.aborted && mounted.current) setError(e.response?.status === 404 ? c.cloneNotFound : funnelError(e)); }
        finally { if (cloneRequest.current === controller && mounted.current) setCodeBusy(false); }
    }, [apiBase, c]);
    useEffect(() => {
        const key = `${apiBase}/${cloneParam}`;
        if (allowed && cloneParam && loadedClone.current !== key) { loadedClone.current = key; void lookup(cloneParam); }
    }, [allowed, apiBase, cloneParam, lookup]);

    useEffect(() => {
        if (!allowed || step !== 2) return undefined;
        let active = true; const controller = new AbortController(); setProductLoading(true);
        const timer = setTimeout(() => {
            api.get(`${apiBase}/funnels/products`, { params: { search: query }, signal: controller.signal })
                .then(({ data }) => { if (active) setProducts(data.data || []); })
                .catch(e => { if (active) setError(funnelError(e)); })
                .finally(() => { if (active) setProductLoading(false); });
        }, 200);
        return () => { active = false; clearTimeout(timer); controller.abort(); };
    }, [allowed, apiBase, query, step]);
    function selectTemplate(item) {
        setTemplate(item.key); setSource(null); setCode(''); setError('');
        setForm(value => ({ ...value, locale: item.locale || value.locale }));
        if (item.locale) setGeneration(value => ({ ...value, language: item.locale === 'ar' ? 'العربية' : 'English' }));
        if (cloneParam) setParams({}, { replace: true });
    }
    async function submit(event) {
        event.preventDefault(); if (saving || !form.product_id || !template || !(locales?.supported || ['en']).includes(form.locale) || (mode === 'ai' && !aiAvailable)) return;
        setSaving(true); setError('');
        try {
            const payload = { ...form, product_id: Number(form.product_id), template_key: template, ...(source && mode === 'manual' ? { clone_code: source.code } : {}), ...(mode === 'ai' ? { generation } : {}) };
            const { data } = await api.post(`${apiBase}/funnels${mode === 'ai' ? '/generate' : ''}`, payload, { timeout: 90000 });
            if (mounted.current) navigate(`${uiBase}/pages/${data.data.page_id}/builder`);
        } catch (e) { if (mounted.current) setError(e.response?.status === 429 ? c.aiLimit : funnelError(e)); } finally { if (mounted.current) setSaving(false); }
    }
    if (!allowed) return <Navigate to={`${uiBase}/overview`} replace />;
    const supported = locales?.supported || ['en'];
    const gallery = templates.filter(item => item.native_layout).sort((a, b) => (catalogOrder.indexOf(a.key) < 0 ? 999 : catalogOrder.indexOf(a.key)) - (catalogOrder.indexOf(b.key) < 0 ? 999 : catalogOrder.indexOf(b.key)));
    const chosen = templates.find(item => item.key === template);
    const localeAllowed = supported.includes(form.locale);
    return <div className="fw-workspace fw-create">
        <ol className="fw-steps" aria-label={c.create}><li className={`fw-step ${step === 2 ? 'fw-step-done' : ''}`} aria-current={step === 1 ? 'step' : undefined}><span>1</span>{c.templates}</li><li className="fw-step-line" aria-hidden="true" /><li className="fw-step" aria-current={step === 2 ? 'step' : undefined}><span>2</span>{c.details}</li></ol>
        <div className="fw-create-scroll" ref={scroller}>
            {error ? <div className="fw-error" role="alert">{error}</div> : null}
            {codeBusy ? <p role="status">{c.loading}</p> : step === 1 ? <div className="fw-gallery">
                <div className="fw-clone-box"><p>{c.clonePrompt}</p><div className="fw-clone-fields"><label>{c.cloneCode}<input value={code} dir="ltr" autoComplete="off" onChange={event => { setCode(event.target.value); if (source) { setSource(null); setTemplate(''); } }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void lookup(code); } }} /></label><button type="button" className="fw-button" disabled={!code.trim() || codeBusy} onClick={() => void lookup(code)}>{c.next}</button></div></div>
                <div className="fw-separator">{c.chooseTemplate}</div>
                {loading ? <p role="status">{c.loading}</p> : <div className="fw-templates" aria-label={c.templates}>{gallery.map(item => {
                    const selectable = !item.locale || supported.includes(item.locale);
                    return <article className="fw-template" key={item.key} data-selected={template === item.key || undefined}>
                        <div className="fw-template-image"><img className="fw-template-desktop" src={item.preview_desktop_image || item.preview_image} srcSet={previewSourceSet(item, 'desktop')} alt={templateName(item)} loading="lazy" />{item.preview_mobile_image ? <img className="fw-template-phone" src={item.preview_mobile_image} srcSet={previewSourceSet(item, 'phone')} alt="" loading="lazy" /> : null}{item.preview_url ? <a href={item.preview_url} target="_blank" rel="noopener noreferrer">{c.preview}</a> : null}</div>
                        <div className="fw-template-name">{templateName(item)}</div><div className="fw-template-action"><button type="button" className="fw-button fw-button-primary" disabled={!selectable || template === item.key} onClick={() => selectTemplate(item)} aria-label={`${c.useTemplate}: ${templateName(item)}`}>{template === item.key ? c.selected : c.useTemplate}</button></div>
                        {!selectable ? <p className="fw-template-note">{c.enableLocale} {item.locale?.toUpperCase()} <Link to={`${uiBase}/settings/general`}>{c.manageLanguages}</Link></p> : null}
                    </article>;
                })}</div>}
            </div> : <form className="fw-form" onSubmit={submit} aria-label={c.details}>
                {source ? <p className="fw-form-note">{c.sourceCopy}: {source.title}</p> : null}
                {!localeAllowed ? <p className="fw-error" role="alert">{c.enableLocale} {form.locale.toUpperCase()} <Link to={`${uiBase}/settings/general`}>{c.manageLanguages}</Link></p> : null}
                {chosen ? <p className="fw-form-note">{templateName(chosen) || c.legacy}</p> : null}
                <label>{c.name}<input required maxLength={255} value={form.title} disabled={saving} onChange={event => setForm(value => ({ ...value, title: event.target.value }))} /></label>
                <label>{c.slug}<span className="fw-url"><span id="fw-url-prefix" title={baseUrl}>{baseUrl}</span><input required aria-label={c.slug} aria-describedby="fw-url-prefix" dir="ltr" maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} disabled={saving} onChange={event => setForm(value => ({ ...value, slug: event.target.value }))} /></span></label>
                <div className="fw-label"><label htmlFor="fw-product">{c.product}</label><Combobox value={selectedProduct} by="id" onChange={item => { setSelectedProduct(item); setForm(value => ({ ...value, product_id: item?.id || '' })); setGeneration(value => ({ ...value, product_name: item?.name || '' })); }} disabled={saving}><div className="fw-product-picker"><ComboboxInput id="fw-product" aria-label={c.product} displayValue={item => item?.name || ''} autoComplete="off" onChange={event => { setQuery(event.target.value); setForm(value => ({ ...value, product_id: '' })); }} /><ComboboxButton aria-label={c.choose}><HiOutlineChevronDown aria-hidden /></ComboboxButton><ComboboxOptions className="fw-product-options">{productLoading ? <p role="status">{c.loading}</p> : products.length === 0 ? <p>{c.noProducts}</p> : products.map(item => <ComboboxOption key={item.id} value={item}>{item.name}</ComboboxOption>)}</ComboboxOptions></div></Combobox></div>
                {!chosen?.locale ? <label>{c.locale}<select value={form.locale} disabled={saving} onChange={event => setForm(value => ({ ...value, locale: event.target.value }))}>{supported.map(locale => <option key={locale} value={locale}>{locale.toUpperCase()}</option>)}</select></label> : null}
                {mode === 'ai' ? <fieldset className="fw-ai-fields" disabled={saving}><label>{c.language}<input required maxLength={80} value={generation.language} onChange={event => setGeneration(value => ({ ...value, language: event.target.value }))} /></label><label>{c.dialect}<input required maxLength={120} value={generation.dialect} onChange={event => setGeneration(value => ({ ...value, dialect: event.target.value }))} /></label><label>{c.productName}<input required maxLength={255} value={generation.product_name} onChange={event => setGeneration(value => ({ ...value, product_name: event.target.value }))} /></label><label className="fw-description">{c.description}<textarea required minLength={20} maxLength={6000} rows={5} value={generation.description} onChange={event => setGeneration(value => ({ ...value, description: event.target.value }))} /></label><p className="fw-form-note">{c.aiNote}</p></fieldset> : null}
                <p className="fw-form-note">{c.note}</p>
                <div className="flex flex-wrap gap-3"><button type="submit" className="fw-button fw-button-primary" disabled={saving || !localeAllowed || !form.product_id || productLoading || (mode === 'ai' && !aiAvailable)}>{saving ? mode === 'ai' ? c.generating : c.loading : mode === 'ai' ? c.generate : c.submit}</button><button type="button" className="fw-button" disabled={saving} onClick={() => setStep(1)}>{c.back}</button></div>
            </form>}
        </div>
        {step === 1 ? <footer className="fw-create-footer"><button type="button" className="fw-button" disabled>{c.previous}</button><button type="button" className="fw-button" disabled={!template || loading || codeBusy} onClick={() => { setError(''); setStep(2); }}>{c.next}</button></footer> : null}
        <Dialog open={mode === null} onClose={() => navigate(`${uiBase}/funnels`)} className="fw-dialog"><DialogBackdrop className="fw-backdrop" /><div className="fw-dialog-position"><DialogPanel className="fw-method-panel"><DialogTitle>{c.methodTitle}</DialogTitle><p>{c.methodDescription}</p><div className="fw-methods"><button type="button" className="fw-method" onClick={() => setMode('manual')}><HiOutlinePaintBrush aria-hidden /><strong>{c.manual}</strong><span>{c.manualDescription}</span></button><button type="button" className="fw-method fw-method-ai" disabled={!aiAvailable || loading} onClick={() => setMode('ai')}><HiOutlineSparkles aria-hidden /><strong>{c.ai}</strong><span>{c.aiDescription}</span></button></div>{!loading && !aiAvailable ? <p className="fw-unavailable">{c.aiUnavailable}</p> : null}</DialogPanel></div></Dialog>
    </div>;
}
