import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlinePlayCircle, HiOutlineXCircle, HiOutlineBookOpen, HiOutlineArrowTopRightOnSquare, HiOutlineRocketLaunch, HiOutlineChevronRight, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import useWorkspaceAppearance from '../workspace/useWorkspaceAppearance';
import { SetupWalletIcon, SetupCategoriesIcon, SetupProductsIcon, SetupHomeIcon, SetupDomainIcon, SetupLogoIcon, SetupAddressIcon, SetupFontIcon, SetupColorIcon, SetupSeoIcon } from './DashboardSetupIcons';
import './dashboard-guide.css';

export const dashboardSteps = [
    { key:'wallet', ar:'المحفظة', en:'Wallet', href:'/top-up', permission:'isStoreOwner', helpAr:'شحن رصيد المحفظة', helpEn:'Fund your wallet', detailAr:'افتح المحفظة للاطلاع على الرصيد وطرق الشحن المتاحة. تأكد من تأكيد الدفع قبل اعتماد الرصيد.', detailEn:'Open your wallet to see the balance and available funding methods. A payment must be confirmed before its credit becomes available.' },
    { key:'categories', ar:'إضافة أقسام', en:'Add categories', href:'/store/categories', permission:'canStoreCategories', helpAr:'تنظيم أقسام المتجر', helpEn:'Organize store categories', detailAr:'أضف أقسامًا بأسماء واضحة، ثم رتّب ظهورها وأضف المنتجات إلى القسم المناسب.', detailEn:'Create clearly named categories, arrange their visibility and add each product to its relevant category.' },
    { key:'products', ar:'إضافة منتجات', en:'Add products', href:'/store/products', permission:'canStoreProducts', helpAr:'إضافة منتجات المتجر', helpEn:'Add store products', detailAr:'أضف اسم المنتج وصوره وسعره ومخزونه، واضبط خياراته وطريقة تسليمه قبل نشره.', detailEn:'Add the product name, images, price and inventory, then configure options and delivery before publishing.' },
    { key:'home', ar:'تعديل الشاشة الرئيسية', en:'Customize the home page', href:'/store/customize', permission:'canStoreThemes', helpAr:'تصميم الصفحة الرئيسية', helpEn:'Design your home page', detailAr:'افتح محرر المتجر لاختيار الأقسام وترتيبها وتعديل محتواها، ثم راجع المعاينة واحفظ تغييراتك.', detailEn:'Open the store editor to choose and arrange sections and edit their content. Review the preview and save your changes.' },
    { key:'domain', ar:'إضافة دومين مخصص', en:'Add a custom domain', href:'/store/settings/domains', permission:'canStoreSettings', helpAr:'ربط دومينك بالمتجر', helpEn:'Connect your store domain', detailAr:'أضف الدومين واتبع تعليمات سجلات DNS. انتظر التحقق من الملكية وإتمام تجهيز الدومين قبل استخدامه.', detailEn:'Add your domain and follow its DNS instructions. Wait for ownership verification and provisioning before using it.' },
    { key:'logo', ar:'إضافة لوجو للمتجر', en:'Add a store logo', href:'/store/settings/general', permission:'canStoreSettings', helpAr:'إعداد هوية المتجر', helpEn:'Set up store identity', detailAr:'ارفع شعارًا واضحًا من الإعدادات العامة، وحدد طريقة عرضه في رأس المتجر ثم احفظه.', detailEn:'Upload a clear logo in general settings, choose how it appears in the store header and save it.' },
    { key:'address', ar:'إضافة عنوان المتجر', en:'Add the store address', href:'/store/google-merchant', permission:'canStoreSettings', helpAr:'إضافة بيانات التواصل والعنوان', helpEn:'Add contact and address information', detailAr:'أدخل عنوان النشاط وبيانات التواصل في إعدادات Google Merchant، وراجع سياسات المتجر التي تريد إظهارها.', detailEn:'Enter the business address and contact details in Google Merchant settings, and review the store policies you want to display.' },
    { key:'font', ar:'إضافة خط مخصص', en:'Choose a custom font', href:'/store/settings/general', permission:'canStoreSettings', helpAr:'اختيار خط المتجر', helpEn:'Choose your store font', detailAr:'اختر الخط من إعدادات هوية المتجر، ثم راجع وضوح العربية والإنجليزية على الهاتف والكمبيوتر.', detailEn:'Choose a font in store identity settings, then review Arabic and English readability on phone and desktop.' },
    { key:'color', ar:'إضافة لون مخصص', en:'Choose a custom color', href:'/store/settings/general', permission:'canStoreSettings', helpAr:'اختيار اللون الأساسي', helpEn:'Choose a primary color', detailAr:'اختر اللون الأساسي لهوية المتجر، وتأكد من وضوح النص والأزرار في المعاينة قبل حفظه.', detailEn:'Choose the store identity primary color and check text and button readability in the preview before saving.' },
    { key:'seo', ar:'إضافة بيانات SEO', en:'Add SEO information', href:'/store/pages', permission:'canStorePages', helpAr:'إعداد بيانات صفحات المتجر', helpEn:'Set up store page metadata', detailAr:'راجع عنوان المتجر ووصفه من الإعدادات العامة، ثم افتح صفحات المتجر لإضافة عنوان SEO ووصف واضح لكل صفحة.', detailEn:'Review the store title and description in general settings, then open store pages to add a clear SEO title and description for each page.' },
];
export function DashboardPromotions({ access, ar }) {
    const text = (a,e) => ar ? a : e;
    const track = useRef(null); const paused = useRef({ mouse:false, focus:false }); const [active, setActive] = useState(0);
    const count = Number(Boolean(access.canStoreOrders && access.canStoreSettings)) + Number(Boolean(access.canStoreCoupons && access.canStoreSettings));
    useEffect(() => {
        if (count < 2) return;
        const timer = setInterval(() => {
            const node = track.current;
            if (!node || document.hidden || paused.current.mouse || paused.current.focus || !window.matchMedia('(max-width:767px)').matches || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
            const stride = node.clientWidth + 16; const index = (Math.round(Math.abs(node.scrollLeft) / stride) + 1) % count;
            setActive(index);node.scrollTo({ left:(ar ? -1 : 1) * index * stride, behavior:'smooth' });
        },6500);
        return () => clearInterval(timer);
    },[ar,count]);
    function choose(index) { const node = track.current;setActive(index); if (node) node.scrollTo({ left:(ar ? -1 : 1) * index * (node.clientWidth + 16), behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' }); }
    if (!count) return null;
    return <section className="ws-dashboard-campaigns" onFocusCapture={() => { paused.current.focus=true; }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) paused.current.focus=false; }}><div ref={track} className="ws-dashboard-promotions" onMouseEnter={() => { paused.current.mouse=true; }} onMouseLeave={() => { paused.current.mouse=false; }} onScroll={event => { const node=event.currentTarget;setActive(Math.round(Math.abs(node.scrollLeft)/(node.clientWidth+16))); }} role="region" tabIndex={0} aria-label={text('أدوات لتنمية متجرك', 'Tools to grow your store')} onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const container = event.currentTarget;if (container.scrollWidth <= container.clientWidth) return;
        event.preventDefault();container.scrollBy({ left:(event.key === 'ArrowLeft' ? -1 : 1) * (container.clientWidth + 16), behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }}>
        {access.canStoreOrders && access.canStoreSettings ? <Link to="/store/sheets" className="ws-dashboard-promotion ws-dashboard-promotion-sheets"><div><span>Google Sheets</span><h2>{text('طلباتك في مكان واحد', 'Your orders in one place')}</h2><p>{text('اربط جدولك بالمتجر لمزامنة الطلبات الجديدة.', 'Connect your spreadsheet to synchronize new orders.')}</p><strong>{text('إعداد الربط', 'Set up connection')} <HiOutlineArrowTopRightOnSquare aria-hidden /></strong></div><div className="ws-promotion-visual" aria-hidden><img src="/app-icons/sheets.svg" alt="" /><i /><i /><i /></div></Link> : null}
        {access.canStoreCoupons && access.canStoreSettings ? <Link to="/store/apps/downsell" className="ws-dashboard-promotion ws-dashboard-promotion-discount"><div><span>Downsell</span><h2>{text('امنح العميل سببًا لإكمال طلبه', 'Give shoppers a reason to finish')}</h2><p>{text('اعرض كوبونًا في اللحظة المناسبة واضبط وقت ظهوره.', 'Show a coupon at the right moment and control its timing.')}</p><strong>{text('إعداد نافذة الخصم', 'Set up discount popup')} <HiOutlineArrowTopRightOnSquare aria-hidden /></strong></div><div className="ws-promotion-visual" aria-hidden><img src="/app-icons/downsell.png" alt="" /><i /><i /><i /></div></Link> : null}
    </div>{count > 1 ? <div className="ws-promotion-dots" role="group" aria-label={text('التنقل بين بطاقات المتجر', 'Store campaign navigation')}>{Array.from({length:count},(_,index)=><button key={index} type="button" aria-label={text(`عرض البطاقة ${index+1}`,`Show campaign ${index+1}`)} aria-pressed={index===active} onClick={()=>choose(index)} />)}</div> : null}</section>;
}
const setupStepVisuals = {
    wallet: [SetupWalletIcon, "rgb(14, 164, 79)"],
    categories: [SetupCategoriesIcon, "rgb(100, 116, 139)"],
    products: [SetupProductsIcon, "rgb(8, 145, 178)"],
    home: [SetupHomeIcon, "rgb(234, 88, 12)"],
    domain: [SetupDomainIcon, "rgb(124, 58, 237)"],
    logo: [SetupLogoIcon, "rgb(8, 145, 178)"],
    address: [SetupAddressIcon, "rgb(249, 115, 22)"],
    font: [SetupFontIcon, "rgb(124, 58, 237)"],
    color: [SetupColorIcon, "rgb(14, 164, 79)"],
    seo: [SetupSeoIcon, "rgb(100, 116, 139)"],
};
export function DashboardSetupGuide({ guide, access, ar, onHelp }) {
    const text = (a,e) => ar ? a : e;
    if (guide.data?.preferences.hidden_panels.includes('setup')) return null;
    const completed = dashboardSteps.filter(step => guide.data?.completed[step.key]).length;
    return <section className="ws-dashboard-setup" aria-labelledby="dashboard-setup-title" aria-busy={guide.loading || guide.busy}>
        <header><div className="ws-guide-title"><span className="ws-guide-title-icon" aria-hidden="true"><HiOutlineRocketLaunch /></span><div><h2 id="dashboard-setup-title">{text('دليل إعداد المتجر', 'Store setup guide')}</h2><p className="ws-guide-subtitle">{text('اتبع هذه الخطوات البسيطة لإعداد متجرك وبدء البيع', 'Follow these simple steps to set up your store and start selling')}</p></div></div><button type="button" className="ws-guide-close" aria-label={text('إخفاء دليل الإعداد', 'Hide setup guide')} disabled={!guide.data || guide.busy} onClick={() => guide.dismiss('setup')}><HiOutlineXMark aria-hidden /></button></header>
        <div className="ws-guide-progress-row"><div className="ws-guide-progress-label"><p>{guide.data ? text(`${completed} من ${dashboardSteps.length} خطوات`, `${completed} of ${dashboardSteps.length} steps`) : text('جارٍ تحميل التقدم…', 'Loading progress…')}</p><strong>{guide.data ? `${guide.data.percent}%` : '—'}</strong></div><div className="ws-guide-progress" role="progressbar" aria-label={text('تقدم إعداد المتجر', 'Store setup progress')} aria-valuemin={0} aria-valuemax={100} {...(guide.data ? { 'aria-valuenow':guide.data.percent } : {})}><span style={{ width:`${guide.data?.percent || 0}%` }} /></div></div>
        {guide.error ? <div role="alert" className="ws-guide-error">{guide.error}<button type="button" disabled={guide.busy} onClick={guide.reload}>{text('إعادة التحميل', 'Reload')}</button></div> : null}
        <div className="ws-guide-slider" role="region" tabIndex={0} aria-label={text('خطوات إعداد المتجر', 'Store setup steps')}><div className="ws-guide-steps">{dashboardSteps.map((step) => {
            const done = Boolean(guide.data?.completed[step.key]); const [Icon,color] = setupStepVisuals[step.key];
            const copy = <><h3>{text(step.ar,step.en)}</h3><p>{step.key === 'wallet' ? text('إضافة رصيد إلى محفظتك', 'Add funds to your wallet') : text('إعدادات متجرك الخاصة', 'Your store settings')}</p></>;
            return <article key={step.key} data-complete={done} style={{ '--step-color':color }}><div className="ws-guide-step-top"><span className="ws-guide-step-icon" aria-hidden="true"><Icon /></span><label className="ws-guide-check" title={text('تحديد إكمال الخطوة', 'Mark step complete')}><input type="checkbox" aria-label={text(`إكمال ${step.ar}`,`Complete ${step.en}`)} checked={done} disabled={!guide.data || guide.loading || guide.busy} onChange={(event) => guide.complete(step.key,event.target.checked)} /><span aria-hidden="true" /></label></div><div className="ws-guide-step-copy">{access[step.permission] ? <Link to={step.href}>{copy}</Link> : copy}</div><div className="ws-guide-step-bottom">{access[step.permission] ? <Link to={step.href}>{done ? text('المزيد', 'More') : text('ابدأ', 'Start')}<HiOutlineChevronRight aria-hidden /></Link> : <span />}<button type="button" aria-label={text(`شرح ${step.ar}`,`Help: ${step.en}`)} onClick={() => onHelp(step.key)}><HiOutlinePlayCircle aria-hidden /></button></div></article>;
        })}</div></div>
    </section>;
}
export function DashboardResources({ guide, ar, onHelp }) {
    const text=(a,e)=>ar?a:e;const resources=guide.data?.resources || {};const hidden=guide.data?.preferences.hidden_panels || [];
    return <div className="ws-dashboard-resources">
        {!hidden.includes('help') ? <section className="ws-dashboard-resource"><button type="button" className="ws-guide-close" aria-label={text('إخفاء بطاقة الدليل', 'Hide help card')} disabled={!guide.data || guide.busy} onClick={() => guide.dismiss('help')}><HiOutlineXCircle aria-hidden /></button><h2>{text('دليلك للبدء والمتابعة', 'Your guide to getting started')}</h2><p>{text('تعرف على كيفية استخدام المنصة وتجهيز متجرك وزيادة مبيعاتك من خلال دليل الإعداد.', 'Learn how to use the platform, prepare your store and grow your sales with the setup guide.')}</p><div>{resources.tutorials_url ? <a href={resources.tutorials_url} target="_blank" rel="noopener noreferrer"><HiOutlinePlayCircle aria-hidden />{text('مشاهدة الفيديوهات التعليمية', 'Watch tutorials')}</a> : <button type="button" onClick={() => onHelp('all')}><HiOutlineBookOpen aria-hidden />{text('عرض دليل استخدام المنصة', 'View platform guide')}</button>}{resources.updates_url ? <a href={resources.updates_url} target="_blank" rel="noopener noreferrer">{text('متابعة تحديثات المنصة', 'Follow platform updates')}</a> : null}</div></section> : null}
        {(resources.android_url || resources.ios_url) && !hidden.includes('app') ? <section className="ws-dashboard-resource ws-dashboard-resource-app"><button type="button" className="ws-guide-close" aria-label={text('إخفاء بطاقة التطبيق', 'Hide app card')} disabled={guide.busy} onClick={() => guide.dismiss('app')}><HiOutlineXCircle aria-hidden /></button><h2>{text('تحميل تطبيق Sellchaze', 'Download Sellchaze app')}</h2><p>{text('حمّل التطبيق لكي تتابع متجرك من أي مكان.', 'Get the app to manage your store from anywhere.')}</p><div>{resources.android_url ? <a href={resources.android_url} target="_blank" rel="noopener noreferrer">Google Play</a> : null}{resources.ios_url ? <a href={resources.ios_url} target="_blank" rel="noopener noreferrer">App Store</a> : null}</div></section> : null}
    </div>;
}
export function DashboardGuideDialog({ selected, onClose, access, ar }) {
    const { theme }=useWorkspaceAppearance();const text=(a,e)=>ar?a:e;const steps=selected==='all'?dashboardSteps:dashboardSteps.filter((step)=>step.key===selected);
    return <Dialog open={Boolean(selected)} onClose={onClose} className="ws-dashboard-guide-modal" data-workspace-theme={theme} dir={ar?'rtl':'ltr'}><DialogBackdrop className="ws-guide-backdrop" /><div className="ws-guide-dialog-position"><DialogPanel className="ws-guide-dialog-panel"><header><DialogTitle>{steps.length===1?text(steps[0].helpAr,steps[0].helpEn):text('دليل إعداد متجرك', 'Set up your store')}</DialogTitle><button type="button" className="ws-guide-close" aria-label={text('إغلاق الدليل', 'Close guide')} onClick={onClose}><HiOutlineXCircle aria-hidden /></button></header>{steps.map((step)=><section key={step.key}><h3>{text(step.ar,step.en)}</h3><p>{text(step.detailAr,step.detailEn)}</p>{access[step.permission]?<Link to={step.href} onClick={onClose}>{text('فتح الإعدادات', 'Open settings')} <HiOutlineArrowTopRightOnSquare aria-hidden /></Link>:null}</section>)}</DialogPanel></div></Dialog>;
}
export function useDashboardGuideDialog() {
    const [selected,setSelected]=useState(null);return { selected,open:setSelected,close:()=>setSelected(null) };
}
