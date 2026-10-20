export const productAiParts = ['name', 'description', 'features', 'faqs', 'reviews'];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

/** Only application-owned tags are emitted; generated content is always escaped. */
export function productAiDescription(copy, parts, locale) {
    const ar = locale === 'ar';
    const sections = [];
    if (parts.includes('description')) sections.push(...copy.description.filter(value => value.trim()).map(value => `<p>${escape(value)}</p>`));
    if (parts.includes('features') && copy.features.length) sections.push(`<h2>${ar ? 'المميزات' : 'Features'}</h2><ul>${copy.features.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`);
    if (parts.includes('faqs') && copy.faqs.length) sections.push(`<h2>${ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>${copy.faqs.map(item => `<h3>${escape(item.question)}</h3><p>${escape(item.answer)}</p>`).join('')}`);
    if (parts.includes('reviews') && copy.reviews.length) sections.push(`<h2>${ar ? 'ملخص تعليقات العملاء' : 'Customer feedback summaries'}</h2><p>${ar ? 'ملخصات بمساعدة الذكاء الاصطناعي لتعليقات قدّمها التاجر.' : 'AI-assisted summaries of feedback supplied by the merchant.'}</p>${copy.reviews.map(value => `<p>${escape(value)}</p>`).join('')}`);
    return sections.join('');
}

/** Merge into the current local draft, preserving every unrelated field/version/locale. */
export function applyProductAiDraft(draft, result, defaultLocale) {
    const { copy, parts, locale } = result;
    const current = key => locale === defaultLocale ? draft[key] : draft.translations?.[key]?.[locale] || '';
    const updates = {};
    if (parts.includes('name') && copy.name?.trim()) updates.name = copy.name.trim();
    const generated = productAiDescription(copy, parts, locale);
    if (generated) {
        const replacesDescription = parts.includes('description') && copy.description.some(value => value.trim());
        updates.description = replacesDescription ? generated : (current('description') || '') + generated;
        if (updates.description.length > 20000) throw new Error('description_limit');
    }
    return { ...draft, ...(locale === defaultLocale ? updates : {}), translations: { ...draft.translations,
        ...Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, { ...draft.translations?.[key], [locale]: value }])) } };
}
