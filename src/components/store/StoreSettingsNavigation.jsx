import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown } from '../workspace/WorkspaceIcons';
import StoreSettingsReferenceIcon from './StoreSettingsReferenceIcon';
import './store-settings-navigation.css';

function ApiNavigation({ items, uiBase, rel }) {
    const active = items.some(item => item.isActive(rel));
    const [open, setOpen] = useState(active);
    const [horizontal, setHorizontal] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width:1023px)').matches);
    const id = useId();
    useEffect(() => {
        const media = window.matchMedia('(max-width:1023px)');
        const update = () => setHorizontal(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => { if (active) setOpen(true); }, [active]);
    return <div className="ws-settings-api">
        <button type="button" className="ws-settings-api-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
            <StoreSettingsReferenceIcon itemKey="public-api-group" aria-hidden /><span>Public API</span><HiOutlineChevronDown aria-hidden />
        </button>
        <div id={id} className="ws-settings-api-panel" data-open={open || undefined} inert={!open && !horizontal}>
            <div>{items.map(item => <Link key={item.key} to={`${uiBase}/${item.to}`} aria-current={item.isActive(rel) ? 'page' : undefined}><span>{item.label}</span></Link>)}</div>
        </div>
    </div>;
}

export default function StoreSettingsNavigation({ items, uiBase, rel, label }) {
    const { t, i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const navigation = useRef(null);
    useLayoutEffect(() => {
        const strip = navigation.current;
        const selected = strip?.querySelector('[aria-current="page"]');
        if (!strip || !selected) return;
        const reveal = () => {
            if (getComputedStyle(strip).flexDirection !== 'row' || !strip.clientWidth) return;
            const bounds = strip.getBoundingClientRect();
            const item = selected.getBoundingClientRect();
            const left = bounds.left + strip.clientLeft;
            const right = left + strip.clientWidth;
            const delta = item.width > strip.clientWidth
                ? (ar ? item.right - right : item.left - left)
                : item.left < left ? item.left - left : item.right > right ? item.right - right : 0;
            // Reveal only this strip: scrollIntoView would also move the settings form.
            if (Math.abs(delta) > 1) strip.scrollBy({ left: delta, behavior: 'instant' });
        };
        reveal();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', reveal);
            return () => window.removeEventListener('resize', reveal);
        }
        const observer = new ResizeObserver(reveal);
        observer.observe(strip);
        observer.observe(selected);
        return () => observer.disconnect();
    }, [rel, ar]);
    const referenceLabels = { general: 'اعدادات المتجر', domains: 'اعدادات الدومين', 'store-info': 'سياسات المتجر',
        'head-code': 'اضافة كود للهيد', 'seo-settings': 'اعدادات ال SEO', payments: 'بوابات الدفع',
        'digital-delivery': 'إعدادات تسليم المنتجات الرقمية', 'order-push': 'اشعارات الطلبات', shipping: 'اعدادات الشحن',
        'social-links': 'روابط التواصل الاجتماعي', managers: 'اعدادات المديرين', 'login-sessions': 'جلسات الدخول', 'phone-verification': 'رقم الهاتف' };
    const apiItems = items.filter(item => ['webhooks', 'public-api'].includes(item.key));
    return <nav ref={navigation} className="ws-settings-navigation" aria-label={label}>{items.map(item => {
        if (apiItems.includes(item)) return item === apiItems[0] ? <ApiNavigation key="public-api-group" items={apiItems} uiBase={uiBase} rel={rel} /> : null;
        return <Link key={item.key} to={`${uiBase}/${item.to}`} aria-current={item.isActive(rel) ? 'page' : undefined}>
            <StoreSettingsReferenceIcon itemKey={item.key} fallback={item.Icon} aria-hidden />
            <span>{ar && referenceLabels[item.key] ? referenceLabels[item.key] : item.key === 'general' ? t('nav_store_settings', 'Store settings') : item.label}</span>
            {item.key === 'digital-delivery' ? <small className="ws-nav-badge">{t('workspace_new', 'New')}</small> : null}
        </Link>;
    })}</nav>;
}
