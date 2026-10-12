/** Export the catalog's editorial fields; private delivery data and cost stay out. */
export function catalogExportRow(product) {
    const price = typeof product.price === 'string' && product.price.trim() !== '' && Number.isFinite(Number(product.price)) ? Number(product.price) : product.price;
    return {
        id: product.id, name: product.name, sku: product.sku || '', slug: product.slug,
        category: product.category?.name || '', price,
        published: Boolean(product.is_active), stock: product.track_inventory ? product.stock : '',
        variant_count: Array.isArray(product.variants) ? product.variants.length : 0,
    };
}
