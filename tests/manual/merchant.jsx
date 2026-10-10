// Development-only visual fixture. All API traffic is intercepted with synthetic data.
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../../src/components/AppLayout';
import StoreThemesPage from '../../src/pages/StoreThemesPage';
import api from '../../src/api/client';
import i18n from '../../src/i18n';
import '../../src/index.css';

const me = { id: 999, name: 'متجر المعاينة', roles: ['Merchant'], permissions: ['products-list', 'categories-list', 'orders-in', 'store.themes.manage', 'store.pages.manage', 'store.orders.manage', 'store.settings.manage'] };
const catalog = [
    { id: 1, key: 'naseem', name: 'نسيم', description: 'ثيم مرن للأزياء والعلامات التجارية', category: 'أزياء', price: 0, licensed: true, installed: true, latest_version: '1.0.0' },
    { id: 2, key: 'fresh', name: 'Fresh', description: 'الطعام والمنتجات الطازجة', category: 'طعام', price: 0, licensed: true, latest_version: '1.0.0' },
    { id: 3, key: 'techno', name: 'Techno', description: 'الإلكترونيات والأجهزة الذكية', category: 'إلكترونيات', price: 49, currency: 'USD', licensed: false, latest_version: '1.0.0' },
];
api.defaults.adapter = async (config) => {
    if (config.method !== 'get') throw new Error('Read-only review: mutations disabled');
    const payloads = {
        '/auth/me': { user: me }, '/my-store': { data: { id: 999, status: 'draft' } },
        '/my-store/themes': { data: catalog, active_theme_id: 1 },
        '/marketplace/themes': { data: catalog, categories: ['أزياء', 'طعام', 'إلكترونيات'] },
        '/notifications': { data: [], unread_count: 0 }, '/chat/unread-count': { unread: 0 },
    };
    return { data: payloads[config.url] ?? { data: [] }, status: 200, statusText: 'OK', headers: {}, config };
};
const locale = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ar';
await i18n.changeLanguage(locale);
document.documentElement.lang = locale;
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
createRoot(document.getElementById('root')).render(
    <MemoryRouter initialEntries={['/store/themes/marketplace']}>
        <Routes><Route element={<AppLayout />}>
            <Route path="/store/themes/marketplace" element={<StoreThemesPage mode="marketplace" />} />
            <Route path="/store/themes" element={<StoreThemesPage />} />
            <Route path="*" element={<p>Local preview — navigation target</p>} />
        </Route></Routes>
    </MemoryRouter>,
);
