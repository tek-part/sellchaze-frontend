import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { AppImage, useAppCopy } from './StoreAppsPage';
import AppPreviewGallery from './AppPreviewGallery';

function FeatureStar() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function StoreAppDetailPage() {
    const context = useStoreContext();
    const { app: key } = useParams();
    return <AppDetail key={`${context.apiBase}:${key}`} context={context} appKey={key} />;
}

function AppDetail({ context: { apiBase, uiBase, access }, appKey }) {
    const { ar, text, localized } = useAppCopy();
    const [registry, setRegistry] = useState(null);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!access.canStoreSettings) return undefined;
        const controller = new AbortController();let current = true;
        api.get(`${apiBase}/apps`, { signal: controller.signal }).then(({ data }) => { if (current) setRegistry(data); }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); });
        return () => { current = false;controller.abort(); };
    }, [apiBase, access.canStoreSettings, retry]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const app = registry?.data.find((row) => row.key === appKey);
    const category = app?.categories[0] || 'tracking';
    const categoryOrder = registry?.categories.find((row) => row.key === category)?.app_keys;
    const related = app ? (categoryOrder ? categoryOrder.map((key) => registry.data.find((row) => row.key === key)).filter(Boolean) : registry.data.filter((row) => row.categories.includes(category))).filter((row) => row.key !== app.key) : [];
    const features = app?.features?.[ar ? 'ar' : 'en'] || [];
    return <div className="ws-merchant-apps ws-app-detail" dir={ar ? 'rtl' : 'ltr'}>
        <nav className="ws-apps-breadcrumb" aria-label={text('مسار الصفحة', 'Breadcrumb')}><Link to={`${uiBase}/apps?tab=discover&category=${category}`}>{text('التطبيقات', 'Apps')}</Link><span>/</span><span aria-current="page">{app ? localized(app.title) : ''}</span></nav>
        {error ? <div className="ws-apps-error" role="alert">{error}<button onClick={() => { setError('');setRetry((value) => value + 1); }}>{text('إعادة المحاولة', 'Try again')}</button></div> : !registry ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !app ? <p role="alert">{text('التطبيق غير موجود.', 'App not found.')}</p> : <>
            <div className="ws-app-detail-layout">
                <aside className="ws-app-detail-panel">
                    <div className="ws-app-detail-title"><AppImage app={app} /><h1>{localized(app.title)}</h1></div>
                    <div className="ws-app-detail-price"><h2>{text('السعر', 'Price')}</h2><p>{app.available ? text('مجاني', 'Free') : <span className="ws-app-soon">{text('قريبًا', 'Coming soon')}</span>}</p></div>
                    <h2>{text('المميزات', 'Features')}</h2>
                    <ul className="ws-app-feature-list">{features.map((feature) => <li key={feature}><FeatureStar /><p>{feature}</p></li>)}</ul>
                    {app.can_manage ? <Link className="ws-apps-primary" to={`${uiBase}/${app.route}`}>{text('إدارة', 'Manage')}</Link> : <p className="ws-apps-note">{app.missing_permission ? text('يلزم منح صلاحيات الإدارة المطلوبة لاستخدام هذا التطبيق.', 'The required management permissions are needed for this app.') : text('قريبًا: هذا التطبيق لم يُطلق بعد، لذلك لا يمكن تفعيله أو ربطه حاليًا.', 'Coming soon: this app has not launched yet, so it cannot be enabled or connected today.')}</p>}
                    {app.key === 'minimum-order' && app.can_manage ? <Link className="ws-apps-outlined" to={`${uiBase}/settings/shipping`}>{text('إعداد حد الشحن المجاني', 'Set free-shipping threshold')}</Link> : null}
                </aside>
                <section className="ws-app-detail-visuals" aria-label={text('معاينات التطبيق', 'App previews')}>
                    <AppPreviewGallery app={app} />
                </section>
                <section className="ws-app-detail-description" aria-label={text('تفاصيل التطبيق', 'App details')}>
                    <p>{localized(app.description)}</p>
                    {app.key === 'sheets' ? <p className="ws-apps-note">{text('يُحفظ مفتاح حساب الخدمة مشفرًا، وتُرسل الطلبات الجديدة إلى تبويب مستقل في الجدول الذي تختاره.', 'The service-account key is encrypted. New orders go into a separate tab of your chosen spreadsheet.')}</p> : null}
                </section>
            </div>
            {related.length ? <section className="ws-app-related" aria-labelledby="related-app-heading"><h2 id="related-app-heading">{text('تطبيقات أخرى', 'Other apps')}</h2><div className="ws-apps-grid">{related.map((row) => <Link className="ws-app-card" key={row.key} to={`${uiBase}/apps/${row.key}`}><div className="ws-app-card-heading"><AppImage app={row} /><div><h3>{localized(row.title)}</h3><p>{row.available ? text('مجاني', 'Free') : <span className="ws-app-soon">{text('قريبًا', 'Coming soon')}</span>}</p></div></div><p className="ws-app-card-description">{localized(row.description)}</p></Link>)}</div></section> : null}
        </>}
    </div>;
}
