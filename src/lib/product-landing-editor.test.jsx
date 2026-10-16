// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import ProductLandingEditorPage from '../pages/ProductLandingEditorPage';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ productId: '33' }), useOutletContext: () => ({ store: { name: 'Own', currency: 'EGP' } }) }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../apps/storefront/store-identity', () => ({ loadIdentityFonts: vi.fn().mockResolvedValue(), identityFontStylesheet: () => undefined, identityForeground: () => '#ffffff' }));
vi.mock('../apps/storefront/landing/LandingSections', () => ({ LandingBlock: ({ section }) => <div>{section.settings.title}</div> }));
const version = 'a'.repeat(64); const nextVersion = 'b'.repeat(64);
const product = { id: 33, name: 'Own product', slug: 'own-product', price: 150, media: [] };
let host, root;
beforeEach(() => { vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); api.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/landing-page') ? { data: { schema: 1, mode: 'standard', sections: [] }, version, product } : { data: product } })); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const button = name => [...host.querySelectorAll('button')].find(el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent).trim() === name);
const click = async name => act(async () => button(name).click());

describe('product landing editor save recovery', () => {
  it('changes all six how-to designs without losing merchant content, retries a conflict and restores a saved document', async () => {
    const own = { id: crypto.randomUUID(), type: 'how_to', settings: { variant: 'howto-1', eyebrow: ' Own intro ', title: 'Own instructions', description: 'Own subtitle', image: { url: '/storage/own-hero.png' }, button_text: ' Own action ', padding: 72, align: 'end', accent: '#123456', items: Array.from({ length: 7 }, (_, i) => ({ title: `Own ${i}`, caption: ' Own caption ', text: 'Own detail ', image: { url: '/storage/own.png', alt: 'Own image' } })) } };
    const initial = { schema: 1, mode: 'standalone', sections: [own] };
    api.get.mockResolvedValue({ data: { data: initial, version, product } });
    await act(async () => root.render(<ProductLandingEditorPage />)); await act(async () => host.querySelector('.pl-section-title').click()); await click('تغيير تنسيق الخطوات');
    expect(document.querySelectorAll('.pl-design-card')).toHaveLength(6);
    expect(document.querySelectorAll('.pl-design-card button')).toHaveLength(0);
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق الخطوات 6:')).click());
    api.put.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Changed elsewhere' } } });
    await click('حفظ'); const payload = api.put.mock.calls[0][1];
    expect(payload.document.sections[0]).toEqual({ ...own, settings: { ...own.settings, variant: 'howto-6' } });
    api.put.mockImplementation((_, request) => Promise.resolve({ data: { data: request.document, version: nextVersion } }));
    await click('حفظ'); expect(api.put.mock.calls[1][1]).toEqual(payload);
    await click('تراجع'); await click('حفظ'); expect(api.put.mock.calls[2][1].document).toEqual(initial);
    expect(api.post).not.toHaveBeenCalled();
  });
  it('adds how-to sections with blank owned steps and measured design defaults, never gallery samples', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />)); await click('طريقة الاستخدام');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق الخطوات 2:')).click());
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.type).toBe('how_to'); expect(saved.settings.variant).toBe('howto-2'); expect(saved.settings.items).toEqual(Array.from({ length: 3 }, () => ({ title: '', text: '' })));
    for (const key of ['background', 'foreground', 'align', 'padding']) expect(saved.settings).not.toHaveProperty(key);
    expect(JSON.stringify(saved)).not.toContain('عنوان الخطوة');
  });

  it('changes video layouts and undoes a saved change without losing URLs, extra benefits or merchant styling', async () => {
    const own = { id: crypto.randomUUID(), type: 'video', settings: { variant: 'video-3', title: 'Own film', description: 'Own caption', video: '/storage/own.mp4', button_text: 'Own action', accent: '#123456', css: '.own { color: red }', items: Array.from({ length: 7 }, (_, i) => ({ title: `Own ${i}`, text: 'Own detail ', image: { url: '/storage/own.png', alt: 'Own image' } })) } };
    const initial = { schema: 1, mode: 'standalone', sections: [own] };
    api.get.mockResolvedValue({ data: { data: initial, version, product } });
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await act(async () => root.render(<ProductLandingEditorPage />)); await act(async () => host.querySelector('.pl-section-title').click()); await click('تغيير تنسيق الفيديو');
    expect(document.querySelectorAll('.pl-video-diagram')).toHaveLength(5);
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق الفيديو 5:')).click());
    await click('حفظ'); expect(api.put.mock.calls[0][1].document.sections[0]).toEqual({ ...own, settings: { ...own.settings, variant: 'video-5' } });
    await click('تراجع'); await click('حفظ'); expect(api.put.mock.calls[1][1].document).toEqual(initial);
    expect(api.post).not.toHaveBeenCalled();
  });
  it('retains edits after a conflict and retries with the same document and version until accepted', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />));
    await click('نموذج الشراء'); await click('إغلاق الإعدادات');
    api.put.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Changed elsewhere' } } });
    await click('حفظ'); const [path, first] = api.put.mock.calls[0];
    expect(path).toBe('/my-store/catalog/products/33/landing-page'); expect(first.version).toBe(version); expect(first.document.mode).toBe('standalone');
    expect(host.querySelector('[role=alert]').textContent).toContain('Changed elsewhere');
    expect(host.querySelectorAll('.pl-section')).toHaveLength(1);
    api.put.mockResolvedValueOnce({ data: { data: first.document, version: nextVersion } });
    await click('حفظ'); expect(api.put.mock.calls[1][1]).toEqual(first); expect(host.querySelector('[role=status]').textContent).toContain('تم حفظ');
    await click('زر الشراء'); await click('إغلاق الإعدادات');
    api.put.mockResolvedValueOnce({ data: { data: { ...first.document, sections: [] }, version: 'c'.repeat(64) } });
    await click('حفظ'); expect(api.put.mock.calls[2][1].version).toBe(nextVersion);
  });
  it('can undo deletion and redo it without issuing a publish request', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />)); await click('نموذج الشراء');
    await click('حذف القسم'); expect(host.querySelectorAll('.pl-section')).toHaveLength(0);
    await click('تراجع'); expect(host.querySelectorAll('.pl-section')).toHaveLength(1);
    await click('إعادة'); expect(host.querySelectorAll('.pl-section')).toHaveLength(0);
    expect(api.put).not.toHaveBeenCalled(); expect(api.post).not.toHaveBeenCalled();
  });
  it('applies and undoes a testimonial design without persisting gallery examples', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />)); await click('تقييمات مخصصة');
    expect(document.querySelector('[role=dialog]')).not.toBeNull();
    const preset = [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام التنسيق 3:'));
    await act(async () => preset.click());
    expect(document.querySelector('[role=dialog]')).toBeNull();
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.settings.variant).toBe('testimonials-3'); expect(saved.settings.items).toEqual([]);
    expect(JSON.stringify(saved)).not.toContain('اسم العميل');
    await click('تغيير تنسيق التقييمات');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام التنسيق 11:')).click());
    await click('تراجع'); await click('حفظ');
    // Undo restores the accepted document, so no second save is necessary.
    expect(api.put).toHaveBeenCalledTimes(1);
  });
  it('preserves banner images and destinations when applying a different layout and exports portable links', async () => {
    const banner = { id: crypto.randomUUID(), type: 'promo_banners', settings: { variant: 'banners-1', items: [{ image: { url: '/own.png' }, destination: { type: 'page', id: 23 } }] } };
    api.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/destinations') ? { data: [{ id: 23, name: 'Own page', url: '/pages/own' }], selected: { id: 23, name: 'Own page', url: '/pages/own' }, meta: { page: 1, has_more: false } } : { data: { schema: 1, mode: 'standalone', sections: [banner] }, version, product, destination_urls: { 'page:23': '/pages/own' } } }));
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion, destination_urls: { 'page:23': '/pages/own' } } }));
    await act(async () => root.render(<ProductLandingEditorPage />));
    // The palette and existing section each have this label; select the section tool.
    vi.useFakeTimers();
    await act(async () => [...host.querySelectorAll('button')].filter(el => el.textContent.trim() === 'لافتات ترويجية مخصصة').at(-1).click());
    // Exercise the debounced picker request using its actual response contract.
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    vi.useRealTimers();
    expect([...host.querySelectorAll('select')].some(select => [...select.options].some(option => option.textContent === 'Own page'))).toBe(true);
    await click('تغيير تنسيق اللافتات');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق اللافتات 4:')).click());
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.settings.variant).toBe('banners-4'); expect(saved.settings.items).toHaveLength(5);
    expect(saved.settings.items[0]).toEqual(banner.settings.items[0]);
    let blob; const revoked = vi.fn(); vi.stubGlobal('URL', class extends URL { static createObjectURL(value) { blob = value; return 'blob:own'; } static revokeObjectURL(value) { revoked(value); } });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let release; const schedule = vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(callback => { release = callback; return 0; });
    await click('تصدير صفحة Sellchaze');
    schedule.mockRestore();
    const exported = JSON.parse(await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob); })); expect(exported.sections[0].settings.items[0].url).toBe('/pages/own'); expect(exported.sections[0].settings.items[0]).not.toHaveProperty('destination');
    release(); expect(revoked).toHaveBeenCalledWith('blob:own');
    anchorClick.mockRestore();
  });
  it('offers45 feature designs and preserves owned content, ordering and undo across design changes', async () => {
    const items = [{ title: 'Own first', text: 'Own policy', icon: 'shield', image: { url: '/own-first.png' }, accent: '#112233', url: '/pages/own-policy' }, { title: 'Own second', text: 'Own second detail' }];
    const feature = { id: crypto.randomUUID(), type: 'store_features', settings: { variant: 'features-1', title: 'Own features', items } };
    api.get.mockResolvedValue({ data: { data: { schema: 1, mode: 'standalone', sections: [feature] }, version, product } });
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await act(async () => root.render(<ProductLandingEditorPage />));
    await act(async () => [...host.querySelectorAll('button')].filter(el => el.textContent.trim() === 'مميزات المتجر').at(-1).click());
    const cardColor = [...host.querySelectorAll('label')].find(el => el.textContent.trim() === 'خلفية البطاقات').querySelector('input');
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(cardColor, '#eaf1f7'); cardColor.dispatchEvent(new Event('input', { bubbles: true })); });
    await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings.card_background).toBe('#eaf1f7');
    await click('تراجع'); await click('حفظ'); api.put.mockClear();
    await click('تغيير تنسيق المميزات');
    const choices = [...document.querySelectorAll('button')].filter(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق المميزات '));
    expect(choices).toHaveLength(45);
    await act(async () => choices.find(el => el.getAttribute('aria-label').startsWith('استخدام تنسيق المميزات 35:')).click());
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.settings.variant).toBe('features-35'); expect(saved.settings.items).toHaveLength(5); expect(saved.settings.items.slice(0, 2)).toEqual(items);
    expect(JSON.stringify(saved)).not.toContain('بيانات تجريبية'); expect(JSON.stringify(saved)).not.toContain('عنوان الميزة');
    await click('تحريك العنصر 1 لأسفل'); await click('حفظ'); expect(api.put.mock.calls[1][1].document.sections[0].settings.items.slice(0, 2)).toEqual([items[1], items[0]]);
    await click('تراجع'); await click('حفظ'); expect(api.put.mock.calls[2][1].document.sections[0].settings.items.slice(0, 2)).toEqual(items);
    await click('تغيير تنسيق المميزات');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق المميزات 42:')).click());
    await click('حفظ'); expect(api.put.mock.calls[3][1].document.sections[0].settings.items).toEqual(saved.settings.items);
  });
  it('offers35 FAQ styles while preserving extra questions, answers, media, colors, ordering and undo', async () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ title: `Own question ${i}`, text: `Own answer ${i}`, html: '<p>Own rich answer</p>', image: { url: '/own-answer.png' }, url: '/pages/own-policy' }));
    const faq = { id: crypto.randomUUID(), type: 'faq', settings: { variant: 'faq-1', title: 'Own FAQs', background: '#112233', question_background: '#abcdef', items } };
    api.get.mockResolvedValue({ data: { data: { schema: 1, mode: 'standalone', sections: [faq] }, version, product } });
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await act(async () => root.render(<ProductLandingEditorPage />));
    await act(async () => host.querySelector('.pl-section-title').click());
    await click('تغيير تنسيق الأسئلة');
    const choices = [...document.querySelectorAll('button')].filter(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق الأسئلة ')); expect(choices).toHaveLength(35);
    await act(async () => choices.find(el => el.getAttribute('aria-label').startsWith('استخدام تنسيق الأسئلة 34:')).click());
    await click('حفظ'); const saved = api.put.mock.calls.at(-1)[1].document.sections[0];
    expect(saved.settings).toEqual({ ...faq.settings, variant: 'faq-34' });
    await click('تحريك العنصر 1 لأسفل'); await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings.items.slice(0, 2)).toEqual([items[1], items[0]]);
    await click('تراجع'); await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings.items).toEqual(items);
    await click('استعادة ألوان وتنسيق التصميم'); await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings).not.toHaveProperty('background');
    await click('تراجع'); await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings).toEqual(saved.settings);
  });
  it('edits and clears the FAQ purchase label without losing the saved answer or undo history', async () => {
    const faq = { id: crypto.randomUUID(), type: 'faq', settings: { variant: 'faq-22', items: [{ title: 'Own question', text: 'Own answer', image: { url: '/own.png' } }] } };
    api.get.mockResolvedValue({ data: { data: { schema: 1, mode: 'standalone', sections: [faq] }, version, product } });
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await act(async () => root.render(<ProductLandingEditorPage />)); await act(async () => host.querySelector('.pl-section-title').click());
    const field = [...host.querySelectorAll('label')].find(el => el.textContent.startsWith('نص زر الشراء')).querySelector('input');
    expect(field.value).toBe('الشراء الآن');
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, ''); field.dispatchEvent(new Event('input', { bubbles: true })); });
    await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings.button_text).toBe(''); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings.items).toEqual(faq.settings.items);
    await click('تراجع'); await click('حفظ'); expect(api.put.mock.calls.at(-1)[1].document.sections[0].settings).toEqual(faq.settings);
  });
  it('creates blank FAQ slots with preset paint defaults and never persists preview answers', async () => {
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await act(async () => root.render(<ProductLandingEditorPage />)); await click('الأسئلة الشائعة');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق الأسئلة 5:')).click());
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.settings.variant).toBe('faq-5'); expect(saved.settings.items).toEqual(Array.from({ length: 6 }, () => ({ title: '', text: '' })));
    expect(saved.settings).not.toHaveProperty('background'); expect(saved.settings).not.toHaveProperty('foreground'); expect(JSON.stringify(saved)).not.toContain('أضف إجابتك');
  });
  it('starts a narrow editor with an unobstructed canvas and closes the palette while choosing a design', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await act(async () => root.render(<ProductLandingEditorPage />));
    expect(button('عرض الأقسام').getAttribute('aria-pressed')).toBe('false');
    await click('عرض الأقسام'); expect(button('عرض الأقسام').getAttribute('aria-pressed')).toBe('true');
    await click('مميزات المتجر'); expect(button('عرض الأقسام').getAttribute('aria-pressed')).toBe('false');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق المميزات 1:')).click());
    expect(button('عرض الأقسام').getAttribute('aria-pressed')).toBe('false');
    await click('حفظ'); expect(api.put.mock.calls[0][1].document.sections).toHaveLength(1);
    expect(api.put.mock.calls[0][1].document.sections[0].settings.variant).toBe('features-1');
    await click('إغلاق الإعدادات');
    await act(async () => host.querySelector('.pl-section-title').click());
    expect(button('عرض الأقسام').getAttribute('aria-pressed')).toBe('false');
    await click('إغلاق الإعدادات'); expect(button('عرض الأقسام').getAttribute('aria-pressed')).toBe('false');
  });
});
