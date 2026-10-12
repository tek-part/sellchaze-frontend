import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { ServiceCard, ServiceContacts, useServiceCopy } from './ServiceMarketplaceCommon';

function PortfolioWork({ work, text }) {
    const [index, setIndex] = useState(0);
    return <article className="ws-service-portfolio-card">
        {work.images.length ? <div className="ws-service-work-gallery"><img src={work.images[index]} alt={work.title} />{work.images.length > 1 ? <div><button aria-label={text('الصورة السابقة', 'Previous image')} onClick={() => setIndex((index + work.images.length - 1) % work.images.length)}>‹</button><span>{index + 1}/{work.images.length}</span><button aria-label={text('الصورة التالية', 'Next image')} onClick={() => setIndex((index + 1) % work.images.length)}>›</button></div> : null}</div> : null}
        {work.url ? <a href={work.url} target="_blank" rel="noopener noreferrer"><h3>{work.title}</h3><p>{work.description}</p></a> : <><h3>{work.title}</h3><p>{work.description}</p></>}
    </article>;
}
export default function ServiceMarketplaceProviderPage() {
    const { provider } = useParams(); const { ar, text } = useServiceCopy();
    const [profile, setProfile] = useState(null); const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1); const [retry, setRetry] = useState(0); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
    useEffect(() => { setProfile(null); setRows([]); setPage(1); }, [provider]);
    useEffect(() => {
        const controller = new AbortController(); let current = true; setError('');
        api.get(`/service-marketplace/providers/${provider}`, { signal: controller.signal }).then(({ data }) => { if (current) setProfile(data.data); }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); });
        return () => { current = false; controller.abort(); };
    }, [provider, retry]);
    useEffect(() => {
        const controller = new AbortController(); let current = true; setLoading(true);
        api.get('/service-marketplace', { params: { provider, page, sort: 'newest' }, signal: controller.signal }).then(({ data }) => { if (current) { setRows((before) => page === 1 ? data.data : [...before, ...data.data.filter((row) => !before.some((item) => item.id === row.id))]); setMeta(data.meta); } }).catch((failure) => { if (current && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); }).finally(() => { if (current) setLoading(false); });
        return () => { current = false; controller.abort(); };
    }, [provider, page, retry]);
    return <div className="ws-services ws-service-provider-page" dir={ar ? 'rtl' : 'ltr'}><nav className="ws-service-breadcrumb" aria-label={text('مسار الصفحة', 'Breadcrumb')}><Link to="/services">{text('معرض الخدمات', 'Service marketplace')}</Link><span>/</span><span>{profile?.display_name || text('مقدم الخدمة', 'Service provider')}</span></nav>
        {error ? <div role="alert" className="ws-service-error">{error}<button onClick={() => { setError(''); setRetry((value) => value + 1); }}>{text('إعادة المحاولة', 'Try again')}</button></div> : null}
        {profile ? <><header className="ws-service-profile-heading">{profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} /> : <span className="ws-service-profile-avatar">{profile.display_name.slice(0, 1)}</span>}<h1>{profile.display_name}</h1><p>{profile.headline}</p><p>{profile.country}</p></header>
        <div className="ws-service-profile-layout"><div><section className="ws-service-profile-panel"><h2>{text('نبذة عني', 'About me')}</h2><p className="ws-service-description">{profile.bio || text('لم يُضف مقدم الخدمة نبذة بعد.', 'The provider has not added a biography yet.')}</p></section><section className="ws-service-profile-panel"><h2>{text('خدماتي', 'My services')}</h2><div className="ws-service-grid">{rows.map((row) => <ServiceCard row={row} key={row.id} />)}</div>{loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !rows.length ? <p>{text('لا توجد خدمات', 'No services')}</p> : null}{meta && page < meta.last_page ? <button className="ws-service-load-more" disabled={loading} onClick={() => setPage((page) => page + 1)}>{text('تحميل المزيد', 'Load more')}</button> : null}</section><section className="ws-service-profile-panel"><h2>{text('معرض الاعمال', 'Portfolio')}</h2><div className="ws-service-portfolio-grid">{profile.portfolio.map((work) => <PortfolioWork work={work} text={text} key={work.id} />)}</div>{!profile.portfolio.length ? <p>{text('لم تُضف أعمال بعد.', 'No work has been added yet.')}</p> : null}</section></div><aside><section className="ws-service-profile-panel"><h2>{text('تواصل معي', 'Contact me')}</h2><ServiceContacts provider={profile} /></section><section className="ws-service-profile-panel"><h2>{text('مهاراتي', 'My skills')}</h2><div className="ws-service-skills">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>{!profile.skills.length ? <p>{text('لم تُضف مهارات بعد.', 'No skills have been added yet.')}</p> : null}</section></aside></div></> : !error ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
    </div>;
}
