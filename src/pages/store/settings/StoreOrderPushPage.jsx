import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import MerchantSettingsHeading from '../../../components/store/MerchantSettingsHeading';
import { deviceSubscription, enableDevicePush, endpointHash, pushSupported } from '../../../lib/merchantDevicePush';
import './merchant-device-settings.css';

export default function StoreOrderPushPage() {
    const context = useStoreContext();
    return <DeviceEditor key={`${context.apiBase}:${context.me?.id}`} context={context} />;
}
function DeviceEditor({ context }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const allowed = context.access.isStoreOwner && !context.isAdminScope;
    const cacheKey = `merchant-push:${context.me?.id}:${context.store?.id}`;
    const [settings, setSettings] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [reload, setReload] = useState(0);
    const working = useRef(false);
    const remember = (data) => {
        try { if (data.subscription) localStorage.setItem(cacheKey, data.subscription.id); } catch { /* Storage may be disabled. */ }
    };
    useEffect(() => {
        if (!allowed) return;
        let active = true;
        setLoading(true); setError(''); setSaved(false);
        (async () => {
            const subscription = await deviceSubscription();
            let id;
            try { id = localStorage.getItem(cacheKey); } catch { /* Storage may be disabled. */ }
            const params = subscription ? { endpoint_hash: await endpointHash(subscription) } : id ? { subscription_id: id } : {};
            const { data } = await api.get(`${context.apiBase}/order-push`, { params });
            if (active) {
                remember(data.data); setSettings(data.data);
                setEnabled(Boolean(data.data.subscription?.enabled && subscription && Notification.permission === 'granted'));
            }
        })().catch((failure) => { if (active) setError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // The cache key scopes the remembered public subscription ID to this account and store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowed, context.apiBase, cacheKey, reload]);
    if (!allowed) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const save = async (event) => {
        event.preventDefault();
        if (working.current) return;
        working.current = true; setBusy(true); setSaved(false); setError('');
        try {
            let next = settings;
            if (enabled) {
                const subscription = await enableDevicePush(settings.public_key);
                const { data: current } = await api.get(`${context.apiBase}/order-push`, { params: { endpoint_hash: await endpointHash(subscription) } });
                const { data } = await api.put(`${context.apiBase}/order-push`, { enabled: true, version: current.data.subscription?.version || 0, ...subscription.toJSON() });
                next = data.data;
            } else {
                if (settings.subscription) {
                    const { data } = await api.put(`${context.apiBase}/order-push`, { enabled: false, subscription_id: settings.subscription.id, version: settings.subscription.version });
                    next = data.data; setSettings(next);
                }
                const subscription = await deviceSubscription();
                if (subscription && !await subscription.unsubscribe()) throw new Error('PUSH_RENEW');
            }
            remember(next); setSettings(next); setSaved(true);
        } catch (failure) {
            setError(failure.response?.data?.code === 'push_subscription_renewal_required' ? text('اشتراك هذا المتصفح مرتبط بحساب آخر. ألغِ التفعيل واحفظ، ثم فعّل الإشعارات مجددًا لإنشاء اشتراك جديد لهذا الحساب.', 'This browser subscription belongs to another account. Turn notifications off and save, then enable them again to create a new subscription for this account.')
                : failure.message === 'PUSH_PERMISSION' ? text('لم يتم السماح بالإشعارات. غيّر إذن الموقع في المتصفح ثم حاول مجددًا.', 'Notifications were not allowed. Update this site’s browser permission and try again.')
                : failure.message === 'PUSH_RENEW' ? text('تعذر تحديث اشتراك هذا الجهاز. أعد المحاولة.', 'Could not update this device subscription. Try again.')
                    : failure.response?.data?.message || failure.message);
        } finally { working.current = false; setBusy(false); }
    };
    return <div dir={ar ? 'rtl' : 'ltr'}>
        {error ? <div className="ws-settings-feedback" role="alert">{error}<button onClick={() => setReload((value) => value + 1)}>{text('إعادة تحميل', 'Reload')}</button></div> : null}
        {saved ? <p className="ws-settings-feedback" role="status">{text('تم حفظ إعدادات هذا الجهاز.', 'Device settings saved.')}</p> : null}
        <section className="ws-settings-card ws-device-push">
            <MerchantSettingsHeading title={text('اشعارات الطلبات', 'Order notifications')} description={text('يمكنك تفعيل هذا الخيار لتلقي اشعارات عندما تستلم طلبات', 'Enable this option to receive notifications when orders arrive.')} />
            <h3>{text('يجب عليك السماح للتطبيق او الموقع بتلقي الاشعارات لكي تتمكن من تفعيل هذه الخاصية', 'Allow this app or site to send notifications before enabling this feature.')}</h3>
            {!pushSupported() ? <p role="status">{text('هذا المتصفح لا يدعم إشعارات الجهاز. استخدم متصفحًا يدعمها عبر اتصال آمن.', 'This browser does not support device notifications. Use a supported browser on a secure connection.')}</p> : null}
            {!loading && settings && !settings.configured ? <p role="status">{text('خدمة إشعارات الأجهزة غير مفعّلة حاليًا. يمكنك إلغاء الاشتراك السابق.', 'Device notifications are not configured yet. You can disable a previous subscription.')}</p> : null}
            <form onSubmit={save}><label className="ws-merchant-toggle"><input type="checkbox" role="switch" checked={enabled} disabled={loading || busy || !settings || (!enabled && (!settings.configured || !pushSupported()))} onChange={(event) => { setEnabled(event.target.checked); setSaved(false); }} /><span>{text('تفعيل الاشعارات لهذا الجهاز', 'Enable notifications for this device')}</span></label>
                <button className="ws-device-save" disabled={loading || busy || !settings || (enabled && !settings.configured)}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>
            </form>
        </section>
    </div>;
}
