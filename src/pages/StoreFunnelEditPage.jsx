import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { HiOutlineChevronDown } from '../components/workspace/WorkspaceIcons';
import { funnelCopy, funnelError } from '../components/store/funnels/funnelCopy';
import '../components/store/funnels/funnel-workspace.css';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const pixelProviders = ['facebook', 'tiktok', 'snapchat'];
const pixelNames = { facebook: 'Facebook', tiktok: 'TikTok', snapchat: 'Snapchat' };
const pixelValues = draft => Object.fromEntries(pixelProviders.map(provider => [provider, [...new Set((draft[provider] || '').split(/\r?\n/).map(id => id.trim()).filter(Boolean))]]));
const pixelText = record => Object.fromEntries(pixelProviders.map(provider => [provider, (record.browser_pixels?.[provider] || []).join('\n')]));
// Keep local copy as a key so a language switch also updates completed requests.
// API validation details stay verbatim; changing language must never repeat a save.
const requestError = error => ({
    key: error.response?.status === 404 ? 'editMissing' : error.response?.status === 409 ? 'editConflict' : 'editRequestFailed',
    detail: [404, 409].includes(error.response?.status) ? '' : funnelError(error),
});

export default function StoreFunnelEditPage() {
    const { funnelId } = useParams(); const scope = useStoreScope(); const { access } = useOutletContext();
    if (!access?.canStorePages) return <Navigate to={`${scope.uiBase}/overview`} replace />;
    return <FunnelDetails key={`${scope.apiBase}/${funnelId}`} {...scope} funnelId={funnelId} />;
}

function FunnelDetails({ apiBase, uiBase, funnelId }) {
    const { i18n } = useTranslation(); const c = funnelCopy[i18n.language?.startsWith('ar') ? 'ar' : 'en'];
    const endpoint = `${apiBase}/funnels/${funnelId}`;
    const [record, setRecord] = useState(null); const [version, setVersion] = useState(''); const [baseUrl, setBaseUrl] = useState('');
    const [form, setForm] = useState({ title: '', slug: '', product_id: '' }); const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null); const [conflict, setConflict] = useState(false); const [reload, setReload] = useState(0);
    const [query, setQuery] = useState(''); const [products, setProducts] = useState([]); const [productLoading, setProductLoading] = useState(false);
    const [pixels, setPixels] = useState({});
    const mounted = useRef(true); const saveRequest = useRef(null); const inFlight = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; saveRequest.current?.abort(); }; }, []);
    function hydrate(data) {
        const item = data.data; setRecord(item); setVersion(data.version); setBaseUrl(data.funnel_base_url);
        setForm({ title: item.title, slug: item.slug, product_id: item.product?.id || '' }); setSelectedProduct(item.product || null); setQuery('');
        setPixels(pixelText(item));
    }
    useEffect(() => {
        let active = true; const controller = new AbortController(); setLoading(true); setError(null); setConflict(false); setSaved(false); setRecord(null);
        api.get(endpoint, { signal: controller.signal }).then(({ data }) => { if (active) hydrate(data); })
            .catch(e => { if (active) setError(requestError(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [endpoint, reload]);
    useEffect(() => {
        if (!record) return undefined;
        let active = true; const controller = new AbortController(); setProductLoading(true);
        const timer = setTimeout(() => {
            api.get(`${apiBase}/funnels/products`, { params: { search: query }, signal: controller.signal })
                .then(({ data }) => { if (active) setProducts(data.data || []); })
                .catch(e => { if (active) setError({ key: 'editRequestFailed', detail: funnelError(e) }); }).finally(() => { if (active) setProductLoading(false); });
        }, 200);
        return () => { active = false; clearTimeout(timer); controller.abort(); };
    }, [apiBase, query, record]);
    const pixelsDirty = !!record && JSON.stringify(pixelValues(pixels)) !== JSON.stringify(pixelValues(pixelText(record)));
    const dirty = !!record && (pixelsDirty || form.title !== record.title || form.slug !== record.slug || form.product_id !== (record.product?.id || ''));
    useEffect(() => {
        const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    function change(field, value) { setForm(current => ({ ...current, [field]: value })); setSaved(false); }
    async function submit(event) {
        event.preventDefault(); if (inFlight.current || !dirty || !form.product_id || conflict) return;
        inFlight.current = true; setSaving(true); setSaved(false); setError(null); const controller = new AbortController(); saveRequest.current = controller;
        try {
            const { data } = await api.put(endpoint, { ...form, product_id: Number(form.product_id), version, ...(pixelsDirty ? { browser_pixels: pixelValues(pixels) } : {}) }, { signal: controller.signal });
            if (mounted.current) { hydrate(data); setSaved(true); }
        } catch (e) { if (mounted.current && !controller.signal.aborted) { setError(requestError(e)); setConflict(e.response?.status === 409); } }
        finally { inFlight.current = false; if (mounted.current) setSaving(false); }
    }
    return <div className="fw-workspace fw-details">
        <header className="fw-details-header"><h1>{c.editTitle}</h1><Link className="fw-button" to={`${uiBase}/funnels`}>{c.backToList}</Link></header>
        {error ? <div className="fw-error" role="alert">{c[error.key]}{error.detail ? <> {error.detail}</> : null}{!saving ? <button type="button" onClick={() => setReload(value => value + 1)}>{conflict ? c.reloadDetails : c.retry}</button> : null}</div> : null}
        {loading ? <p role="status">{c.loading}</p> : record ? <form className="fw-form" onSubmit={submit}>
            <label htmlFor="fw-edit-name">{c.name}<input id="fw-edit-name" required maxLength={255} disabled={saving} value={form.title} onChange={event => change('title', event.target.value)} /></label>
            <label htmlFor="fw-edit-slug">{c.slug}<span className="fw-url"><span id="fw-edit-prefix" title={baseUrl}>{baseUrl}</span><input id="fw-edit-slug" dir="ltr" aria-label={c.slug} aria-describedby="fw-edit-prefix" required maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={saving} value={form.slug} onChange={event => change('slug', event.target.value)} /></span></label>
            <div className="fw-label"><label htmlFor="fw-edit-product">{c.product}</label><Combobox value={selectedProduct} by="id" disabled={saving} onChange={item => { setSelectedProduct(item); change('product_id', item?.id || ''); }}><div className="fw-product-picker"><ComboboxInput id="fw-edit-product" aria-label={c.product} displayValue={item => item?.name || ''} autoComplete="off" onChange={event => { setQuery(event.target.value); change('product_id', ''); }} /><ComboboxButton aria-label={c.choose}><HiOutlineChevronDown aria-hidden /></ComboboxButton><ComboboxOptions className="fw-product-options">{productLoading ? <p role="status">{c.loading}</p> : products.length === 0 ? <p>{c.noProducts}</p> : products.map(item => <ComboboxOption key={item.id} value={item}>{item.name}</ComboboxOption>)}</ComboboxOptions></div></Combobox></div>
            <details className="fw-advanced"><summary>{c.advanced}</summary><section aria-labelledby="fw-pixels-title"><h2 id="fw-pixels-title">Custom Pixel</h2><p className="fw-form-note" id="fw-pixels-help">{c.funnelPixelsHelp}</p><div className="fw-pixel-fields">{pixelProviders.map(provider => <div className="fw-pixel-field" key={provider}><label htmlFor={`fw-pixel-${provider}`}>{pixelNames[provider]} Pixel ID</label><textarea id={`fw-pixel-${provider}`} dir="ltr" rows={3} autoComplete="off" spellCheck={false} disabled={saving} aria-describedby="fw-pixels-help" value={pixels[provider] || ''} onChange={event => { setPixels(current => ({ ...current, [provider]: event.target.value })); setSaved(false); }} /></div>)}</div><p className="fw-form-note">{c.funnelPixelsLiveNote}</p></section></details>
            {record.is_public ? <p className="fw-form-note">{c.editPublishedNote}</p> : <p className="fw-form-note">{c.editDraftNote}</p>}
            <div className="fw-details-actions"><button className="fw-button fw-button-primary" type="submit" disabled={!dirty || saving || !form.product_id || conflict}>{saving ? c.loading : c.saveDetails}</button><Link className="fw-button" aria-disabled={dirty || saving || undefined} tabIndex={dirty || saving ? -1 : undefined} onClick={event => { if (dirty || saving) event.preventDefault(); }} to={`${uiBase}/pages/${record.page_id}/builder`}>{c.openDesign}</Link></div>
            {dirty ? <p className="fw-form-note">{c.saveBeforeDesign}</p> : null}
            {saved ? <p role="status" className="fw-details-saved">{c.detailsSaved}</p> : null}
        </form> : null}
    </div>;
}
