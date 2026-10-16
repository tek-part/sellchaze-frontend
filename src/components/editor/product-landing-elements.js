export const elementFamilies = [
    { label: 'الصور والميديا', icon: 'photo', types: [['slider', 'عارض صور'], ['image', 'صورة'], ['banner', 'لافتة ترويجية'], ['youtube', 'فيديو يوتيوب'], ['simple', 'تصميم بسيط'], ['advanced', 'تصميم متقدم']] },
    { label: 'نص', icon: 'text', types: [['heading', 'عنوان ونص فرعي'], ['rich_text', 'نص متقدم']] },
    { label: 'كود HTML', icon: 'code', types: [['html', 'كود HTML']] },
    ...[['checkout', 'نموذج الشراء'], ['faq', 'الأسئلة الشائعة'], ['store_features', 'مميزات المتجر'], ['custom_reviews', 'تقييمات مخصصة'], ['promo_banners', 'لافتات ترويجية مخصصة'], ['countdown', 'عداد تنازلي'], ['video', 'قوالب الفيديو'], ['gallery', 'معرض الصور'], ['how_to', 'طريقة الاستخدام'], ['content', 'المحتوى'], ['buy_button', 'زر الشراء'], ['product_features', 'مميزات المنتج'], ['reviews', 'التقييمات'], ['product_description', 'وصف المنتج'], ['billboard', 'لوحة إعلانية']].map(([type, label]) => ({ label, icon: type, types: [[type, label]] })),
];
export const elementLabel = (type) => elementFamilies.flatMap(f => f.types).find(row => row[0] === type)?.[1] || type;
export function newLandingSection(type, product) {
    const images = (product?.media || []).filter(item => item.type !== 'video').map(item => ({ media_id: item.id, url: item.url, alt: item.alt || product.name }));
    const settings = { padding: 32, align: 'center', background: '#ffffff', foreground: '#111827' };
    if (['heading', 'simple', 'banner', 'content', 'advanced'].includes(type)) settings.title = product?.name || 'عنوان القسم';
    if (['html', 'advanced', 'rich_text'].includes(type)) settings.html = '<section><h2>عنوان القسم</h2><p>اكتب محتوى صفحة المنتج هنا.</p></section>';
    if (['image', 'banner', 'simple', 'content'].includes(type) && images[0]) settings.image = images[0];
    if (['gallery', 'slider'].includes(type)) settings.images = images;
    if (['faq', 'custom_reviews', 'store_features', 'product_features', 'promo_banners', 'how_to'].includes(type)) settings.items = [];
    if (type === 'countdown') { settings.title = 'الوقت المتبقي'; settings.hours = 1; }
    if (type === 'buy_button') settings.button_text = 'اضغط هنا للشراء';
    return { id: crypto.randomUUID(), type, settings };
}
