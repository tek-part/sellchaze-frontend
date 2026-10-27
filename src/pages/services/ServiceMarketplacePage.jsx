import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { ServiceAddIcon } from '../../components/workspace/SidebarReferenceIcons';
import { CATEGORIES, ServiceCard, ServiceContacts, useServiceCopy } from './ServiceMarketplaceCommon';
import ServiceCategoryIcon from './ServiceCategoryIcon';
import SecondaryNavigation from '../../components/navigation/SecondaryNavigation';
import NavigationCategories from '../../components/navigation/NavigationCategories';

export default function ServiceMarketplacePage() {
    const { provider } = useParams(); const { ar, text } = useServiceCopy();
    const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [profile, setProfile] = useState(null);
    const [category, setCategory] = useState(''); const [sort, setSort] = useState('rating'); const [page, setPage] = useState(1); const [retry, setRetry] = useState(0);
    const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    useEffect(() => { setCategory(''); setSort('rating'); setPage(1); setRows([]); setProfile(null); }, [provider]);
    useEffect(() => {
        const controller = new AbortController(); let current = true; setLoading(true); setError('');
        if (page === 1) { setRows([]); setMeta(null); }
        api.get('/service-marketplace', { params: { page, sort, ...(category ? { category } : {}), ...(provider ? { provider } : {}) }, signal: controller.signal }).then(({ data }) => { if (current) { setRows((before) => page === 1 ? data.data : [...before, ...data.data.filter((row) => !before.some((item) => item.id === row.id))]); setMeta(data.meta); } }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); }).finally(() => { if (current) setLoading(false); });
        return () => { current = false; controller.abort(); };
    }, [provider, category, sort, page, retry]);
    useEffect(() => {
        if (!provider) return undefined;
        const controller = new AbortController(); let current = true;
        api.get(`/service-marketplace/providers/${provider}`, { signal: controller.signal }).then(({ data }) => { if (current) setProfile(data.data); }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); });
        return () => { current = false; controller.abort(); };
    }, [provider, retry]);
    const sorts = [['rating', 'الأعلى تقييماً', 'Highest rated'], ['newest', 'الأحدث', 'Newest'], ['price_asc', 'السعر: من الأقل للأعلى', 'Price: low to high'], ['price_desc', 'السعر: من الأعلى للأقل', 'Price: high to low']];
    return <div className="ws-services" dir={ar ? 'rtl' : 'ltr'}><header className="ws-services-heading"><div><h1>{provider && profile ? profile.display_name : text('معرض الخدمات', 'Service marketplace')}</h1><p>{provider && profile ? profile.bio : text('مجموعة من مقدمي الخدمات التي ستساعدك لكي ترتقي بمتجرك لأعلى مستوى', 'Find service providers to help improve your store')}</p></div><div className="ws-services-toolbar"><SearchableSelect aria-label={text('ترتيب الخدمات', 'Sort services')} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>{sorts.map(([value, a, e]) => <option value={value} key={value}>{text(a, e)}</option>)}</SearchableSelect><Link className="ws-service-add" to="/services/manage"><ServiceAddIcon aria-hidden />{text('اضافة خدمتك من هنا', 'Add your service here')}</Link></div></header>
        {provider && profile ? <section className="ws-service-provider-summary"><p>{profile.country}</p><ServiceContacts provider={profile} /></section> : null}
        <div className="ws-services-layout ws-services-with-navigation"><SecondaryNavigation title={text('تصنيفات الخدمات', 'Service categories')}>{(query, close) => <NavigationCategories title={text('تصنيفات الخدمات', 'Service categories')} query={query} selected={category} items={[["", 'الكل', 'All'], ...CATEGORIES].map(([key, a, e]) => ({ key, label: text(a, e), Icon: props => <ServiceCategoryIcon {...props} category={key} /> }))} onSelect={key => { setCategory(key); setPage(1); close(); }} />}</SecondaryNavigation><section className="ws-services-results" aria-label={text('الخدمات', 'Services')} aria-busy={loading}>
            {error ? <div role="alert" className="ws-service-error">{error}<button onClick={() => setRetry((value) => value + 1)}>{text('إعادة المحاولة', 'Try again')}</button></div> : null}
            {meta?.currency_filter && sort.startsWith('price_') ? <p className="ws-service-currency-note">{text('الترتيب حسب أسعار الخدمات بالعملة', 'Prices compared in')}: {meta.currency_filter}</p> : null}
            <div className="ws-service-grid">{rows.map((row) => <ServiceCard key={row.id} row={row} />)}</div>
            {loading ? <p role="status" className="ws-service-loading">{text('جارٍ التحميل…', 'Loading…')}</p> : !rows.length && !error ? <p className="ws-service-empty">{text('لا توجد خدمات', 'No services')}</p> : null}
            {meta && page < meta.last_page && !error ? <button className="ws-service-load-more" disabled={loading} onClick={() => setPage((value) => value + 1)}>{text('تحميل المزيد', 'Load more')}</button> : null}
        </section></div>
    </div>;
}
