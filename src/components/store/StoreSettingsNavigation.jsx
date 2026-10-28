import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown } from '../workspace/WorkspaceIcons';
import StoreSettingsReferenceIcon from './StoreSettingsReferenceIcon';
import './store-settings-navigation.css';

function ApiNavigation({ items, uiBase, rel, searching, onNavigate }) {
    const active = items.some(item => item.isActive(rel));
    const [open, setOpen] = useState(active);
    const id = useId();
    useEffect(() => { if (active) setOpen(true); }, [active]);
    const expanded = searching || open;
    return <div className="ws-settings-api">
        <button type="button" className="ws-settings-api-trigger" aria-expanded={expanded} aria-controls={id} onClick={() => setOpen(!open)}>
            <StoreSettingsReferenceIcon itemKey="public-api-group" aria-hidden /><span>Public API</span><HiOutlineChevronDown aria-hidden />
        </button>
        <div id={id} className="ws-settings-api-panel" data-open={expanded || undefined} inert={!expanded}>
            <div>{items.map(item => <Link key={item.key} to={`${uiBase}/${item.to}`} onClick={onNavigate} aria-current={item.isActive(rel) ? 'page' : undefined}><span>{item.label}</span></Link>)}</div>
        </div>
    </div>;
}

const sections = [
    { key: 'general', ar: 'عام', en: 'General', items: ['general', 'domains', 'store-info', 'localization', 'publish'] },
    { key: 'appearance', ar: 'المتجر والظهور', en: 'Store and appearance', items: ['seo-settings', 'social-links', 'head-code', 'shopping-preferences'] },
    { key: 'orders', ar: 'الطلبات والدفع', en: 'Orders and payments', items: ['payments', 'shipping', 'order-limits', 'digital-delivery', 'bot-protection', 'phone-verification', 'customer-login'] },
    { key: 'notifications', ar: 'الإشعارات', en: 'Notifications', items: ['notifications', 'order-push'] },
    { key: 'team', ar: 'المستخدمون والأمان', en: 'Team and security', items: ['managers', 'login-sessions'] },
    { key: 'integrations', ar: 'التكاملات', en: 'Integrations', items: ['webhooks', 'public-api'] },
];

export default function StoreSettingsNavigation({ items, uiBase, rel, label, query = '', onNavigate }) {
    const { t, i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const labels = { general: text('إعدادات المتجر', 'Store settings'), domains: text('النطاقات', 'Domains'), 'store-info': text('سياسات المتجر', 'Store policies'),
        'head-code': text('إضافة كود للهيد', 'Add head code'), 'seo-settings': text('إعدادات SEO', 'SEO settings'), payments: text('بوابات الدفع', 'Payment gateways'),
        'digital-delivery': text('تسليم المنتجات الرقمية', 'Digital delivery'), notifications: text('الإشعارات', 'Notifications'), 'order-push': text('إشعارات الطلبات', 'Order notifications'), shipping: text('الشحن والضرائب', 'Shipping & tax'),
        'social-links': text('روابط التواصل الاجتماعي', 'Social links'), managers: text('المديرون', 'Managers'), 'login-sessions': text('جلسات الدخول', 'Login sessions'), 'phone-verification': text('التحقق من الهاتف', 'Phone verification'), 'customer-login': text('دخول العملاء', 'Customer login') };
    const navigation = useRef(null);
    useLayoutEffect(() => {
        const nav = navigation.current;
        const scroll = nav?.closest('.ws-secondary-sidebar-scroll');
        const selected = nav?.querySelector('[aria-current="page"]');
        if (!scroll || !selected) return;
        const reveal = () => {
            const bounds = scroll.getBoundingClientRect();
            const item = selected.getBoundingClientRect();
            if (!item.height || !scroll.clientHeight) return;
            if (item.top < bounds.top) scroll.scrollTop += item.top - bounds.top;
            else if (item.bottom > bounds.bottom) scroll.scrollTop += item.bottom - bounds.bottom;
        };
        reveal();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(reveal);
        observer.observe(nav);
        observer.observe(scroll);
        return () => observer.disconnect();
    }, [rel, query, ar]);
    const search = query.trim().toLocaleLowerCase();
    const known = new Set(sections.flatMap(section => section.items));
    const groups = [...sections, { key: 'other', ar: 'المزيد', en: 'More', items: items.filter(item => !known.has(item.key)).map(item => item.key) }].map(section => ({
        ...section,
        rows: section.items.map(key => items.find(item => item.key === key)).filter(Boolean).filter(item => !search || [labels[item.key], item.label, item.to, ar ? section.ar : section.en, ...(['webhooks', 'public-api'].includes(item.key) ? ['Public API'] : [])].filter(Boolean).join(' ').toLocaleLowerCase().includes(search)),
    })).filter(section => section.rows.length);
    return <nav ref={navigation} className="ws-settings-navigation" aria-label={label}>
        {groups.map(section => <section key={section.key} className="ws-settings-nav-group" aria-label={ar ? section.ar : section.en}>
            <h3>{ar ? section.ar : section.en}</h3>
            {section.key === 'integrations' ? <ApiNavigation items={section.rows} uiBase={uiBase} rel={rel} searching={!!search} onNavigate={onNavigate} /> : section.rows.map(item => <Link key={item.key} to={`${uiBase}/${item.to}`} onClick={onNavigate} aria-current={item.isActive(rel) ? 'page' : undefined}>
                <StoreSettingsReferenceIcon itemKey={item.key} fallback={item.Icon} aria-hidden /><span>{labels[item.key] || item.label}</span>
                {['digital-delivery', 'notifications'].includes(item.key) ? <small className="ws-nav-badge">{t('workspace_new', 'New')}</small> : null}
            </Link>)}
        </section>)}
        {!groups.length ? <p className="ws-settings-nav-empty" role="status">{text('لا توجد إعدادات مطابقة.', 'No matching settings.')}</p> : null}
    </nav>;
}
