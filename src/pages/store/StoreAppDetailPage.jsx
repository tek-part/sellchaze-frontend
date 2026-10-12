import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { AppImage, useAppCopy } from './StoreAppsPage';

export default function StoreAppDetailPage() {
    const context = useStoreContext();const { app: key } = useParams();return <AppDetail key={`${context.apiBase}:${key}`} context={context} appKey={key} />;
}
function AppDetail({ context: { apiBase, uiBase, access }, appKey }) {
    const { ar, text, localized } = useAppCopy();const [registry, setRegistry] = useState(null);const [error, setError] = useState('');const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!access.canStoreSettings) return undefined;
        const controller = new AbortController();let current = true;
        api.get(`${apiBase}/apps`, { signal: controller.signal }).then(({ data }) => { if (current) setRegistry(data); }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); });
        return () => { current = false;controller.abort(); };
    }, [apiBase, access.canStoreSettings, retry]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const app = registry?.data.find((row) => row.key === appKey);
    return <div className="ws-merchant-apps ws-app-detail" dir={ar ? 'rtl' : 'ltr'}><nav className="ws-apps-breadcrumb" aria-label={text('مسار الصفحة', 'Breadcrumb')}><Link to={`${uiBase}/apps?tab=discover&category=${app?.categories[0] || 'tracking'}`}>{text('التطبيقات', 'Apps')}</Link><span>/</span><span>{app ? localized(app.title) : ''}</span></nav>{error ? <div className="ws-apps-error" role="alert">{error}<button onClick={() => { setError('');setRetry((value) => value + 1); }}>{text('إعادة المحاولة', 'Try again')}</button></div> : !registry ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !app ? <p role="alert">{text('التطبيق غير موجود.', 'App not found.')}</p> : <div className="ws-app-detail-layout"><aside className="ws-app-detail-panel"><div className="ws-app-card-heading"><AppImage app={app} /><h1>{localized(app.title)}</h1></div><div className="ws-app-detail-price"><p>{text('السعر', 'Price')}</p><p>{app.available ? text('مجاني', 'Free') : text('غير متاح حاليًا', 'Currently unavailable')}</p></div><h2>{text('المميزات', 'Features')}</h2><p>{localized(app.description)}</p>{app.can_manage ? <Link className="ws-apps-primary" to={`${uiBase}/${app.route}`}>{text('إدارة', 'Manage')}</Link> : <p className="ws-apps-note">{app.missing_permission ? text('يلزم منح صلاحيات الإدارة المطلوبة لاستخدام هذا التطبيق.', 'The required management permissions are needed for this app.') : text('هذا التطبيق غير متاح للتفعيل حاليًا.', 'This app is not currently available for activation.')}</p>}{app.key === 'minimum-order' && app.can_manage ? <Link className="ws-apps-outlined" to={`${uiBase}/settings/shipping`}>{text('إعداد حد الشحن المجاني', 'Set free-shipping threshold')}</Link> : null}</aside><section className="ws-app-detail-description"><AppImage app={app} /><p>{localized(app.description)}</p>{app.key === 'sheets' ? <p>{text('يُحفظ مفتاح حساب الخدمة مشفرًا، وتُرسل الطلبات الجديدة إلى تبويب مستقل في الجدول الذي تختاره.', 'The service-account key is encrypted. New orders go into a separate tab of your chosen spreadsheet.')}</p> : null}</section></div>}</div>;
}
