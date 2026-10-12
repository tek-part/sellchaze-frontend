import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStoreContext from '../../hooks/useStoreContext';
import './merchant-catalog.css';
import './retargeting.css';

export default function StoreRetargetingPage() {
    const { access, uiBase } = useStoreContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (arabic, english) => ar ? arabic : english;
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    const videos = [
        { id: 'RelBqfCHBzg', title: text('شرح اعادة الاستهداف باستخدام push notification', 'Retargeting with push notifications'), description: text('احصل علي مبيعات مجانية عن طريق اشعارات الويب', 'Get sales through web notifications') },
        { id: 'BMpjgRxmvZE', title: 'Whatsapp Marketing', description: text('يمكنك ربط الواتساب بمتجرك لكي يتم ارسال رسالة تاكيد بالطلبات اوتوماتك او يمكنك ارسال رسائل ترويجية للعملاء', 'Connect WhatsApp to your store to send order confirmations or promotional messages to customers') },
    ];
    return <div className="ws-retargeting" dir={ar ? 'rtl' : 'ltr'}>
        <header className="ws-catalog-header"><div>
            <h1>{text('ادوات خاصة باعادة الاستهداف', 'Retargeting tools')}</h1>
            <p>{text('في هذه الصفحة ستتعرف علي افضل الادوات لاعادة استهداف العملاء لزيادة مبيعاتك', 'Explore tools for retargeting customers and increasing sales')}</p>
        </div></header>
        <div className="ws-retargeting-body"><div className="ws-retargeting-cards">
            {videos.map((video) => <article className="ws-retargeting-card" key={video.id}>
                <iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.id}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                <div className="ws-retargeting-copy"><h2>{video.title}</h2><p>{video.description}</p></div>
            </article>)}
        </div></div>
    </div>;
}
