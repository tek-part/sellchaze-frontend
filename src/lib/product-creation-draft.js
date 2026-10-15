export function compileProductProperties(axes, gallery = []) {
    const names = new Set(); const display = []; const fields = []; const galleryImages = []; let combinations = [{}];
    for (const axis of axes) {
        const name = axis.name.trim(); const key = name.toLocaleLowerCase();
        if (!name || name.length > 80 || /^\d+$/.test(name) || names.has(key)) return { valid: false, reason: 'names', combinations: [] };
        names.add(key);
        if (axis.type === 'text' || axis.type === 'upload') {
            fields.push({ key: `p_${axis.id}`, label: name, type: axis.type === 'text' ? 'text' : 'image', required: Boolean(axis.required), max_length: 1000 });
            continue;
        }
        const values = axis.values.split(/[,،\n]/).map((value) => value.trim()).filter(Boolean);
        if (!values.length || values.length > 50 || values.some((value) => value.length > 120) || new Set(values.map((value) => value.toLocaleLowerCase())).size !== values.length) return { valid: false, reason: 'values', combinations: [] };
        if (combinations.length * values.length > 200) return { valid: false, reason: 'limit', combinations: [] };
        if (axis.type === 'image') {
            for (const value of values) {
                const index = gallery.indexOf(axis.images?.[value]);
                if (index < 0 || !gallery[index].type.startsWith('image/')) return { valid: false, reason: 'images', combinations: [] };
                galleryImages.push({ axis: name, value, index });
            }
        }
        combinations = combinations.flatMap((options) => values.map((value) => ({ ...options, [name]: value })));
        display.push({ name, type: axis.type, values: values.map((value) => ({ value, ...(axis.type === 'color' ? { color: axis.colors?.[value] || '#000000' } : {}) })) });
    }
    if (!display.length) combinations = [];
    if (combinations.some((options) => Object.values(options).join(' / ').length > 255)) return { valid: false, reason: 'length', combinations: [] };
    return { valid: true, combinations, display, fields, galleryImages, signature: JSON.stringify(combinations) };
}

export function propertyRowKey(options) { return JSON.stringify(Object.entries(options).sort(([a], [b]) => a.localeCompare(b))); }
export function buildCreationRows(combinations, previous = []) {
    const known = new Map(previous.map((row) => [propertyRowKey(row.options), row]));
    return combinations.map((options) => known.get(propertyRowKey(options)) || { name: Object.values(options).join(' / '), options, sku: '', price_override: '', compare_price: '', stock_quantity: '0', track_inventory: true, is_active: true });
}
export function creationPayload(rows, inventory, galleryImages = []) {
    return { inventory: { track_inventory: Boolean(inventory.track_inventory), stock_quantity: rows.length ? 0 : Number(inventory.stock_quantity) },
        ...(galleryImages.length ? { gallery_images: galleryImages } : {}), variants: rows.map((row, position) => ({ name: row.name, options: row.options, sku: row.sku.trim() || null,
            price_override: row.price_override === '' ? null : row.price_override, compare_price: row.compare_price === '' ? null : row.compare_price,
            stock_quantity: Number(row.stock_quantity), track_inventory: row.track_inventory, is_active: row.is_active, position })) };
}

export function regularPrice(draft) { return draft.compare_price !== '' && draft.compare_price != null ? draft.compare_price : draft.price; }
export function setRegularPrice(draft, value) { return draft.compare_price !== '' && draft.compare_price != null ? { ...draft, compare_price: value } : { ...draft, price: value }; }
export function setDiscountPrice(draft, value) { return value === '' ? { ...draft, price: regularPrice(draft), compare_price: '' } : { ...draft, price: value, compare_price: regularPrice(draft) }; }
