// Local visual fixture, with synthetic in-memory API responses. Never calls a live API.
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Outlet, useOutletContext, useParams } from 'react-router-dom';
import AppLayout from '../../src/components/AppLayout';
import StoreFunnelsPage from '../../src/pages/StoreFunnelsPage';
import api from '../../src/api/client';
import i18n from '../../src/i18n';
import '../../src/index.css';

const me = { id: 999, name: 'متجر المعاينة', roles: ['Merchant'], permissions: ['products-list', 'store.pages.manage'] };
const records = [];
api.defaults.adapter = async (config) => {
    let data = { data: [] };
    if (config.url === '/auth/me') data = { user: me };
    else if (config.url === '/my-store') data = { data: { status: 'draft' } };
    else if (config.url === '/my-store/funnels/templates') data = { data: [
        { key: 'spotlight', name: { ar: 'واجهة المنتج', en: 'Product spotlight' }, description: { ar: 'عرض بصري للمنتج وزر شراء واضح', en: 'A focused product hero and purchase action' }, color: '#146c43' },
        { key: 'story', name: { ar: 'قصة المنتج', en: 'Product story' }, description: { ar: 'تفاصيل المنتج في أقسام قابلة للتحرير', en: 'Editable product details' }, color: '#7c3aed' },
        { key: 'minimal', name: { ar: 'عرض مختصر', en: 'Minimal offer' }, description: { ar: 'عرض يركز على الطلب', en: 'A concise purchase offer' }, color: '#0369a1' },
    ] };
    else if (config.url === '/my-store/catalog/products') data = { data: [{ id: 1, name: 'حقيبة قماش', slug: 'canvas-bag' }].filter((p) => !config.params?.search || p.name.includes(config.params.search)) };
    else if (config.url === '/my-store/funnels' && config.method === 'post') {
        const input = JSON.parse(config.data);
        const record = { ...input, id: records.length + 1, page_id: records.length + 100, status: 'draft', product: { name: 'حقيبة قماش' }, public_path: `/pages/${input.slug}` };
        records.push(record); data = { data: record };
    } else if (config.url === '/my-store/funnels') data = { data: records.filter((r) => (!config.params?.search || r.title.includes(config.params.search)) && (!config.params?.status || r.status === config.params.status)), meta: { last_page: 1 } };
    else if (config.method !== 'get') throw new Error('Unsupported local fixture operation');
    return { data, status: config.method === 'post' ? 201 : 200, statusText: 'OK', headers: {}, config };
};
function Context() {
    const parent = useOutletContext();
    return <Outlet context={{ ...parent, access: { canStorePages: true }, locales: { default: 'ar', supported: ['ar', 'en'] } }} />;
}
function Receipt() {
    const { pageId } = useParams();
    const record = records.find((r) => String(r.page_id) === pageId);
    return <section><h1>Local fixture: editor navigation verified</h1><p>{record?.title}</p><p>{record?.slug}</p><p>{record?.status}</p></section>;
}
const locale = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ar';
await i18n.changeLanguage(locale);
document.documentElement.lang = locale;
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/store/funnels']}><Routes><Route element={<AppLayout />}><Route element={<Context />}><Route path="/store/funnels" element={<StoreFunnelsPage />} /><Route path="/store/pages/:pageId/builder" element={<Receipt />} /></Route><Route path="*" element={<p>Local navigation target</p>} /></Route></Routes></MemoryRouter>);
