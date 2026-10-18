import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { HiOutlineChevronDown } from '../components/workspace/WorkspaceIcons';
import { funnelCopy, funnelError } from '../components/store/funnels/funnelCopy';
import '../components/store/funnels/funnel-workspace.css';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

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
    const [error, setError] = useState(''); const [conflict, setConflict] = useState(false); const [reload, setReload] = useState(0);
    const [query, setQuery] = useState(''); const [products, setProducts] = useState([]); const [productLoading, setProductLoading] = useState(false);
    const mounted = useRef(true); const saveRequest = useRef(null); const inFlight = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; saveRequest.current?.abort(); }; }, []);
    function hydrate(data) {
        const item = data.data; setRecord(item); setVersion(data.version); setBaseUrl(data.funnel_base_url);
        setForm({ title: item.title, slug: item.slug, product_id: item.product?.id || '' }); setSelectedProduct(item.product || null); setQuery('');
    }
    useEffect(() => {
        let active = true; const controller = new AbortController(); setLoading(true); setError(''); setConflict(false); setSaved(false); setRecord(null);
        api.get(endpoint, { signal: controller.signal }).then(({ data }) => { if (active) hydrate(data); })
            .catch(e => { if (active) setError(e.response?.status === 404 ? funnelCopy[i18n.language?.startsWith('ar') ? 'ar' : 'en'].editMissing : funnelError(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [endpoint, reload, i18n]);
    useEffect(() => {
        if (!record) return undefined;
        let active = true; const controller = new AbortController(); setProductLoading(true);
        const timer = setTimeout(() => {
            api.get(`${apiBase}/funnels/products`, { params: { search: query }, signal: controller.signal })
                .then(({ data }) => { if (active) setProducts(data.data || []); })
                .catch(e => { if (active) setError(funnelError(e)); }).finally(() => { if (active) setProductLoading(false); });
        }, 200);
        return () => { active = false; clearTimeout(timer); controller.abort(); };
    }, [apiBase, query, record]);
    const dirty = !!record && (form.title !== record.title || form.slug !== record.slug || form.product_id !== (record.product?.id || ''));
    useEffect(() => {
        const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    function change(field, value) { setForm(current => ({ ...current, [field]: value })); setSaved(false); }
    async function submit(event) {
        event.preventDefault(); if (inFlight.current || !dirty || !form.product_id || conflict) return;
        inFlight.current = true; setSaving(true); setSaved(false); setError(''); const controller = new AbortController(); saveRequest.current = controller;
        try {
            const { data } = await api.put(endpoint, { ...form, product_id: Number(form.product_id), version }, { signal: controller.signal });
            if (mounted.current) { hydrate(data); setSaved(true); }
        } catch (e) { if (mounted.current && !controller.signal.aborted) { setError(e.response?.status === 409 ? c.editConflict : e.response?.status === 404 ? c.editMissing : funnelError(e)); setConflict(e.response?.status === 409); } }
        finally { inFlight.current = false; if (mounted.current) setSaving(false); }
    }
    return <div className="fw-workspace fw-details">
        <header className="fw-details-header"><h1>{c.editTitle}</h1><Link className="fw-button" to={`${uiBase}/funnels`}>{c.backToList}</Link></header>
        {error ? <div className="fw-error" role="alert">{error}{!saving ? <button type="button" onClick={() => setReload(value => value + 1)}>{conflict ? c.reloadDetails : c.retry}</button> : null}</div> : null}
        {loading ? <p role="status">{c.loading}</p> : record ? <form className="fw-form" onSubmit={submit}>
            <label htmlFor="fw-edit-name">{c.name}<input id="fw-edit-name" required maxLength={255} disabled={saving} value={form.title} onChange={event => change('title', event.target.value)} /></label>
            <label htmlFor="fw-edit-slug">{c.slug}<span className="fw-url"><span id="fw-edit-prefix" title={baseUrl}>{baseUrl}</span><input id="fw-edit-slug" dir="ltr" aria-label={c.slug} aria-describedby="fw-edit-prefix" required maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={saving} value={form.slug} onChange={event => change('slug', event.target.value)} /></span></label>
            <div className="fw-label"><label htmlFor="fw-edit-product">{c.product}</label><Combobox value={selectedProduct} by="id" disabled={saving} onChange={item => { setSelectedProduct(item); change('product_id', item?.id || ''); }}><div className="fw-product-picker"><ComboboxInput id="fw-edit-product" aria-label={c.product} displayValue={item => item?.name || ''} autoComplete="off" onChange={event => { setQuery(event.target.value); change('product_id', ''); }} /><ComboboxButton aria-label={c.choose}><HiOutlineChevronDown aria-hidden /></ComboboxButton><ComboboxOptions className="fw-product-options">{productLoading ? <p role="status">{c.loading}</p> : products.length === 0 ? <p>{c.noProducts}</p> : products.map(item => <ComboboxOption key={item.id} value={item}>{item.name}</ComboboxOption>)}</ComboboxOptions></div></Combobox></div>
            {record.is_public ? <p className="fw-form-note">{c.editPublishedNote}</p> : <p className="fw-form-note">{c.editDraftNote}</p>}
            <div className="fw-details-actions"><button className="fw-button fw-button-primary" type="submit" disabled={!dirty || saving || !form.product_id || conflict}>{saving ? c.loading : c.saveDetails}</button><Link className="fw-button" aria-disabled={dirty || saving || undefined} tabIndex={dirty || saving ? -1 : undefined} onClick={event => { if (dirty || saving) event.preventDefault(); }} to={`${uiBase}/pages/${record.page_id}/builder`}>{c.openDesign}</Link></div>
            {dirty ? <p className="fw-form-note">{c.saveBeforeDesign}</p> : null}
            {saved ? <p role="status" className="fw-details-saved">{c.detailsSaved}</p> : null}
        </form> : null}
    </div>;
}
