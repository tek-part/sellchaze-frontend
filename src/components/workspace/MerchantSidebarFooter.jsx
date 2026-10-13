import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './merchant-sidebar-footer.css';

export default function MerchantSidebarFooter({ onNavigate }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
    return <footer className="merchant-sidebar-footer"><Link to="/subscriptions" onClick={onNavigate} className="merchant-subscription-promo"><p>{ar ? <>اشترك في الباقة المميزة<br />ونمي متجرك!</> : <>Choose a premium plan<br />and grow your store!</>}</p><span>{ar ? 'اشترك الآن' : 'Subscribe now'}</span></Link><Link to="/" onClick={onNavigate} className="merchant-sidebar-company" aria-label="Sellchaze"><img src="/icon.png" alt="" /><strong>Sellchaze</strong></Link><small>v1.0.0</small></footer>;
}
