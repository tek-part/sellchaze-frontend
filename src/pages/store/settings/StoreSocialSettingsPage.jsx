import { Navigate } from 'react-router-dom';
import useStoreContext from '../../../hooks/useStoreContext';
import useMerchantSettings from '../../../hooks/useMerchantSettings';
import MerchantSettingsHeading from '../../../components/store/MerchantSettingsHeading';
import MerchantSettingsFeedback from '../../../components/store/MerchantSettingsFeedback';
import MerchantSettingsSave from '../../../components/store/MerchantSettingsSave';
import '../merchant-catalog.css';

const labels = { facebook: ['فيسبوك', 'Facebook'], instagram: ['انستجرام', 'Instagram'], twitter: ['تويتر', 'Twitter'], linkedin: ['لينكدإن', 'LinkedIn'], tiktok: ['تيك توك', 'TikTok'], youtube: ['يوتيوب', 'YouTube'], snapchat: ['سناب شات', 'Snapchat'] };
export default function StoreSocialSettingsPage() {
    const context = useStoreContext(); return <SocialEditor key={context.apiBase} context={context} />;
}
function SocialEditor({ context }) {
    const state = useMerchantSettings(context, 'social-links');
    const { ar, text, initial, draft, change, loading, busy, save } = state;
    if (!context.access.canStoreSettings) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const dirty = Boolean(draft && initial && JSON.stringify(draft) !== JSON.stringify(initial));
    return <div dir={ar ? 'rtl' : 'ltr'}><MerchantSettingsFeedback state={state} /><section className="ws-settings-card ws-social-settings">
        <MerchantSettingsHeading title={text('إضافة روابط التواصل الاجتماعي', 'Add social links')} description={text('أضف روابط حسابات متجرك على شبكات التواصل الاجتماعي.', 'Add your store’s social media profile links.')} />
        {!loading && draft ? <form onSubmit={(event) => { event.preventDefault(); if (dirty && !busy) save(draft); }}><fieldset disabled={busy}>
            <label className="ws-merchant-toggle"><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => change({ ...draft, enabled: event.target.checked })} /><span>{text('تفعيل', 'Enable')}</span></label>
            <div className="ws-social-fields">{Object.entries(labels).map(([key, [a, e]]) => <label className={`ws-settings-input ${draft.links[key] ? 'is-filled' : ''}`} key={key}><span>{text(a, e)}</span><input type="url" dir="ltr" aria-label={text(a, e)} maxLength={2048} value={draft.links[key] || ''} onChange={(event) => change({ ...draft, links: { ...draft.links, [key]: event.target.value } })} /></label>)}</div>
            <MerchantSettingsSave busy={busy} disabled={!dirty || busy} ar={ar} />
        </fieldset></form> : null}
    </section></div>;
}
