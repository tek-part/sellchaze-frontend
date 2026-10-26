import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import './service-marketplace.css';
import { currencyDigits } from './service-marketplace-money';
import { ServiceRatingStarIcon } from '../../components/workspace/SidebarReferenceIcons';

export const CATEGORIES = [
    ['moderation', 'ادارة الصفحات - moderation', 'Page moderation'], ['landing-pages', 'انشاء صفحات هبوط', 'Landing pages'], ['ugc', 'ugc', 'UGC'],
    ['video', 'صناعة الفيديو', 'Video production'], ['marketing', 'تسويق', 'Marketing'], ['development', 'برمجة', 'Development'],
    ['consulting', 'استشارات', 'Consulting'], ['store-setup', 'تهيئة المتاجر', 'Store setup'], ['design', 'تصميم', 'Design'], ['accounting', 'خدمات مالية ومحاسبة', 'Finance and accounting'],
];
export const CURRENCIES = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'MAD', 'DZD', 'TND', 'KWD', 'QAR', 'BHD'];
export { currencyDigits } from './service-marketplace-money';
export const servicePrice = (row) => new Intl.NumberFormat('en', { maximumFractionDigits: currencyDigits(row.currency) }).format(row.price_minor / (10 ** currencyDigits(row.currency))) + ' ' + row.currency;
export function useServiceCopy() {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
    return { ar, text: (arabic, english) => ar ? arabic : english };
}
export function ProviderLink({ provider }) {
    return <Link className="ws-service-provider-link" to={`/services/service-provider/${provider.id}`}>{provider.avatar_url ? <img className="ws-service-provider-avatar" src={provider.avatar_url} alt="" loading="lazy" /> : <span className="ws-service-provider-avatar" aria-hidden>{provider.display_name.slice(0, 1)}</span>}<span>{provider.display_name}</span></Link>;
}
export function ServiceCard({ row }) {
    return <article className="ws-service-card"><Link to={`/services/${row.id}`}>
        {row.images[0] ? <img className="ws-service-cover" src={row.images[0]} alt={row.title} loading="lazy" /> : <div className="ws-service-cover ws-service-no-image" aria-hidden><span>{row.title.slice(0, 1)}</span></div>}
        <p className="ws-service-card-title"><span>{row.title}</span></p><div className="ws-service-card-values"><p dir="ltr">{servicePrice(row)}</p><span className="ws-service-rating"><ServiceRatingStarIcon aria-hidden /><span>{row.ratings_count ? Number(row.rating).toFixed(2) : '0'}</span><span>({row.ratings_count})</span></span></div>
    </Link><ProviderLink provider={row.provider} /></article>;
}
/** G4 (#50): opening a published contact channel counts once per visitor and day for the provider's analytics. */
export function recordContactClick(provider, channel, serviceId) {
    api.post(`/service-marketplace/providers/${provider.id}/contact-clicks`, { channel, ...(serviceId ? { service_id: serviceId } : {}) }).catch(() => { /* Analytics never blocks contacting the provider. */ });
}
export function ServiceContacts({ provider, serviceId }) {
    const { text } = useServiceCopy(); const contacts = provider.contacts || {}; const entries = Object.entries(contacts).filter(([, value]) => value);
    const track = (type) => recordContactClick(provider, type, serviceId);
    return entries.length ? <div className="ws-service-contacts">{entries.map(([type, value]) => type === 'whatsapp' ? <a key={type} href={`https://wa.me/${value.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" dir="ltr" onClick={() => track(type)}>WhatsApp: {value}</a> : type === 'telegram' ? <a key={type} href={`https://t.me/${value.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" dir="ltr" onClick={() => track(type)}>Telegram: {value}</a> : <button key={type} dir="ltr" onClick={async () => { track(type); try { await navigator.clipboard.writeText(value); } catch { /* The selectable value remains available. */ } }}>{value}</button>)}</div> : <p className="ws-service-contact-empty">{text('لم ينشر مقدم الخدمة بيانات تواصل.', 'The provider has not published contact details.')}</p>;
}
