import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { HiOutlineCog6Tooth } from '../../components/workspace/WorkspaceIcons';
import { AppsInstalledReferenceIcon, AppsDiscoverReferenceIcon } from '../../components/workspace/SidebarReferenceIcons';
import './merchant-apps.css';
import SecondaryNavigation from '../../components/navigation/SecondaryNavigation';
import NavigationCategories from '../../components/navigation/NavigationCategories';

export function useAppCopy() {
    const { i18n } = useTranslation();const ar = i18n.language.startsWith('ar');
    return { ar, text: (a, e) => ar ? a : e, localized: (value) => value[ar ? 'ar' : 'en'] };
}
export function AppImage({ app }) {
    const [failed, setFailed] = useState(false);const { localized } = useAppCopy();
    return failed || !app.icon ? <span className="ws-app-image-fallback" aria-hidden>{localized(app.title).slice(0, 1)}</span> : <img className="ws-app-image" src={app.icon} alt="" onError={() => setFailed(true)} />;
}
export default function StoreAppsPage() {
    const context = useStoreContext();return <AppsDirectory key={context.apiBase} context={context} />;
}
function AppsDirectory({ context: { apiBase, uiBase, access } }) {
    const { ar, text, localized } = useAppCopy();const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get('tab') === 'discover' ? 'discover' : 'installed';const category = searchParams.get('category') || 'tracking';
    const [registry, setRegistry] = useState(null);const [error, setError] = useState('');const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!access.canStoreSettings) return undefined;
        const controller = new AbortController();let current = true;setError('');
        api.get(`${apiBase}/apps`, { signal: controller.signal }).then(({ data }) => { if (current) setRegistry(data); }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); });
        return () => { current = false;controller.abort(); };
    }, [apiBase, access.canStoreSettings, retry]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const categoryOrder = registry?.categories.find((row) => row.key === category)?.app_keys;
    const rows = mode === 'discover' && categoryOrder
        ? categoryOrder.map((key) => registry.data.find((row) => row.key === key)).filter(Boolean)
        : registry?.data.filter((row) => mode === 'installed' ? row.included : row.categories.includes(category)) || [];
    return <div className="ws-merchant-apps" dir={ar ? 'rtl' : 'ltr'}><header className="ws-apps-heading"><h1>{text('التطبيقات', 'Apps')}</h1><p>{text('ستجد هنا التطبيقات التي قد تحتاجها لتحسين متجرك او زيادة المبيعات او تحقيق وظيفة معينة يحتاجها متجرك', 'Find apps to improve your store, increase sales or add a function your store needs.')}</p></header>
        <div className="ws-apps-main-tabs" role="tablist" aria-label={text('التطبيقات', 'Apps')}><button role="tab" aria-selected={mode === 'installed'} onClick={() => setSearchParams({ tab: 'installed' })}><AppsInstalledReferenceIcon aria-hidden /><span>{text('تطبيقات مثبتة', 'Installed apps')}</span></button><button role="tab" aria-selected={mode === 'discover'} onClick={() => setSearchParams({ tab: 'discover', category })}><AppsDiscoverReferenceIcon aria-hidden /><span>{text('اكتشف تطبيقات اكثر', 'Discover more apps')}</span></button></div>
        {error ? <div role="alert" className="ws-apps-error">{error}<button onClick={() => setRetry((value) => value + 1)}>{text('إعادة التحميل', 'Reload')}</button></div> : null}
        {!registry && !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : registry ? <div className={`ws-apps-content ws-apps-with-navigation ${mode === 'discover' ? 'is-discovery' : ''}`}>
            {mode === 'discover' ? <SecondaryNavigation title={text('تصنيفات التطبيقات', 'App categories')}>{(query, close) => <NavigationCategories title={text('تصنيفات التطبيقات', 'App categories')} query={query} selected={category} items={registry.categories.map(row => ({ key: row.key, label: row[ar ? 'ar' : 'en'] }))} onSelect={key => { setSearchParams({ tab: 'discover', category: key }); close(); }} />}</SecondaryNavigation> : null}
            <section className="ws-apps-grid" aria-label={text('التطبيقات', 'Apps')}>{rows.map((app) => <article className={`ws-app-card ${mode === 'installed' ? 'is-installed' : ''}`} key={app.key}><Link className="ws-app-card-heading" to={`${uiBase}/apps/${app.key}`}><AppImage app={app} /><div><h2>{localized(app.title)}</h2><p>{app.available ? text('مجاني', 'Free') : <span className="ws-app-soon">{text('قريبًا', 'Coming soon')}</span>}</p></div>{mode === 'installed' ? <HiOutlineCog6Tooth className="ws-app-card-settings" aria-hidden /> : null}</Link><p className="ws-app-card-description">{localized(app.description)}</p>{mode === 'installed' ? <div className="ws-app-card-state"><span>{app.configured ? text('إعدادات محفوظة', 'Settings saved') : text('متاح للإعداد', 'Ready to configure')}</span>{app.can_manage ? <Link to={`${uiBase}/${app.route}`}>{text('إدارة', 'Manage')}</Link> : <span>{text('تحتاج صلاحية الإدارة', 'Management permission required')}</span>}</div> : null}</article>)}</section>
            {!rows.length ? <p className="ws-apps-empty">{text('لا توجد تطبيقات', 'No apps')}</p> : null}
        </div> : null}
    </div>;
}
