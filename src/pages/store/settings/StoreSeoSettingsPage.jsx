import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useStoreContext from '../../../hooks/useStoreContext';
import useStoreSettings from '../../../hooks/useStoreSettings';
import MerchantSettingsHeading from '../../../components/store/MerchantSettingsHeading';
import MerchantSettingsFeedback from '../../../components/store/MerchantSettingsFeedback';
import MerchantSettingsSave from '../../../components/store/MerchantSettingsSave';
import { BrandImage } from './MerchantGeneralSettingsPage';

export default function StoreSeoSettingsPage() {
    const context = useStoreContext();
    return <SeoEditor key={context.apiBase} context={context} />;
}
function SeoEditor({ context }) {
    const state = useStoreSettings({ endpoint: 'seo-settings', enabled: context.access.canStoreSettings });
    const { ar, text, initial, draft, change, loading, busy, save } = state;
    const [logo, setLogo] = useState(null); const [favicon, setFavicon] = useState(null);
    const [removeLogo, setRemoveLogo] = useState(false); const [removeFavicon, setRemoveFavicon] = useState(false);
    if (!context.access.canStoreSettings) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const dirty = Boolean(draft && initial && (draft.site_title !== initial.site_title || draft.description !== initial.description || logo || favicon || removeLogo || removeFavicon));
    const submit = async (event) => {
        event.preventDefault(); if (!dirty || busy) return;
        const body = new FormData(); body.append('_method', 'PUT');
        ['revision', 'site_title', 'description'].forEach((key) => body.append(key, draft[key] || ''));
        if (logo) body.append('logo', logo); if (favicon) body.append('favicon', favicon);
        body.append('remove_logo', removeLogo ? '1' : '0'); body.append('remove_favicon', removeFavicon ? '1' : '0');
        if (await save(body)) { setLogo(null); setFavicon(null); setRemoveLogo(false); setRemoveFavicon(false); }
    };
    const reload = () => { setLogo(null); setFavicon(null); setRemoveLogo(false); setRemoveFavicon(false); state.reload(); };
    return <div dir={ar ? 'rtl' : 'ltr'}><MerchantSettingsFeedback state={{ ...state, reload }} /><section className="ws-settings-card ws-seo-settings">
        <MerchantSettingsHeading title={text('إعدادات SEO', 'SEO settings')} description={text('حدّث عنوان المتجر ووصفه والشعار والأيقونة المصغرة.', 'Update your store title, description, logo and favicon.')} />
        {!loading && draft ? <form onSubmit={submit}><fieldset disabled={busy}>
            <label className={`ws-settings-input ${draft.site_title ? 'is-filled' : ''}`}><span>{text('عنوان الموقع الرئيسي', 'Main site title')}</span><input aria-label={text('عنوان الموقع الرئيسي', 'Main site title')} maxLength={255} value={draft.site_title || ''} onChange={(event) => change({ ...draft, site_title: event.target.value })} /></label>
            <label className={`ws-settings-input ${draft.description ? 'is-filled' : ''}`}><span>Meta Description</span><textarea aria-label="Meta Description" rows={4} maxLength={5000} value={draft.description || ''} onChange={(event) => change({ ...draft, description: event.target.value })} /></label>
            <div className="ws-settings-media-row"><BrandImage title={text('لوجو الموقع', 'Site logo')} current={initial.logo_url} file={logo} setFile={setLogo} removed={removeLogo} setRemoved={setRemoveLogo} ar={ar} /><BrandImage title={text('الأيقونة المصغرة 16×16', 'Favicon 16×16')} current={initial.favicon_url} file={favicon} setFile={setFavicon} removed={removeFavicon} setRemoved={setRemoveFavicon} ar={ar} /></div>
            <MerchantSettingsSave busy={busy} disabled={!dirty || busy} ar={ar} />
        </fieldset></form> : null}
    </section></div>;
}
