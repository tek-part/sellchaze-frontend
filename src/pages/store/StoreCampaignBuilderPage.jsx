import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStoreContext from '../../hooks/useStoreContext';
import { buildCampaignUrl } from '../../shared/marketing/campaign-link';
import { CampaignCreateIcon, CampaignHelpIcon } from '../../components/workspace/CampaignReferenceIcons';
import './merchant-catalog.css';
import './campaign-builder.css';

export default function StoreCampaignBuilderPage() {
    const context = useStoreContext();
    return <CampaignBuilder key={context.apiBase} context={context} />;
}
function CampaignBuilder({ context: { access, uiBase } }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [draft, setDraft] = useState({ address: '', source: '', campaign: '' }); const [result, setResult] = useState(''); const [copied, setCopied] = useState(false); const [error, setError] = useState('');
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const generated = buildCampaignUrl(draft.address, draft.source, draft.campaign);
    const fields = [
        { key: 'address', title: text('رابط الحملة', 'Campaign URL'), label: text('رابط الحملة', 'Campaign URL'), max: 2048 },
        { key: 'source', title: text('مصدر الحملة', 'Campaign source'), label: text('منصة الاعلانات مثل: facebook, snapchat', 'Advertising platform, e.g. facebook, snapchat'), max: 100 },
        { key: 'campaign', title: text('اسم الحملة', 'Campaign name'), label: text('اسم الحملة مثل: test-campaign-1, watches-campaign', 'Campaign name, e.g. test-campaign-1, watches-campaign'), max: 200 },
    ];
    return <div className="ws-utm-builder" dir={ar ? 'rtl' : 'ltr'}><header className="ws-catalog-header"><div><h1>Utm Builder</h1><p>{text('يمكنك استخدام هذه الاداة لبناء رابط للحملة الاعلانية يمكنك من خلاله معرفة تفاصيل اكثر دقة عن طلباتك ومصدرها وللمزيد شاهد الفيديو', 'Build a campaign link to identify your orders and their sources. Watch the video for details.')}</p></div><a href="https://www.youtube.com/watch?v=OLa9kYXZkH0" target="_blank" rel="noopener noreferrer"><CampaignHelpIcon aria-hidden />{text('كيفية عمل utm', 'How UTM works')}</a></header>
        <form className="ws-campaign-form" onSubmit={(event) => { event.preventDefault(); if (generated) { setResult(generated); setCopied(false); setError(''); } }}>
            <div className="ws-campaign-fields">{fields.map((field) => <section className="ws-campaign-group" key={field.key}><h2>{field.title}</h2><label className={`ws-campaign-field ${draft[field.key] ? 'has-value' : ''}`}><span>{field.label}</span><input aria-label={field.label} value={draft[field.key]} required maxLength={field.max} onChange={(event) => { setDraft((old) => ({ ...old, [field.key]: event.target.value })); setResult(''); setCopied(false); setError(''); }} /></label><p className="ws-campaign-note" aria-hidden="true">{'​'}</p></section>)}</div>
            <button type="submit" className="ws-campaign-create" disabled={!generated}><CampaignCreateIcon aria-hidden />{text('انشاء', 'Create')}</button>
            <div className="ws-campaign-result">{result ? <button type="button" dir="ltr" aria-label={text('نسخ رابط الحملة', 'Copy campaign URL')} onClick={async () => { try { await navigator.clipboard.writeText(result); setCopied(true); setError(''); } catch { setError(text('تعذر النسخ. حدد الرابط وانسخه يدويًا.', 'Copy failed. Select and copy the URL manually.')); } }}>{result}</button> : null}</div>
            {!generated && draft.address && draft.source && draft.campaign ? <p role="alert">{text('أدخل رابط الموقع كاملًا وتأكد من صحة مصدر الحملة واسمها.', 'Enter the full website URL and check the campaign source and name.')}</p> : null}{copied ? <p role="status">{text('تم نسخ الرابط', 'URL copied')}</p> : null}{error ? <p role="alert">{error}</p> : null}
        </form>
    </div>;
}
