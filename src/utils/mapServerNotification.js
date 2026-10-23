/**
 * @typedef {{ id: string, title: string, body: string, read: boolean, at: number, link?: string }} DisplayNotification
 */

/**
 * @param {string | undefined} link
 * @param {import('react-router-dom').NavigateFunction} navigate
 */
export function followNotificationLink(link, navigate) {
    if (!link || typeof link !== 'string') {
        return;
    }
    const t = link.trim();
    if (!t) {
        return;
    }
    if (/^https?:\/\//i.test(t)) {
        window.location.assign(t);
        return;
    }
    navigate(t);
}

/**
 * @param {unknown} row
 * @param {import('i18next').TFunction} t
 * @returns {DisplayNotification}
 */
export function mapServerNotification(row, t) {
    const r = row && typeof row === 'object' ? row : {};
    const d = r.data && typeof r.data === 'object' ? r.data : {};
    const read = Boolean(r.read_at);
    const at = r.created_at ? new Date(r.created_at).getTime() : Date.now();

    if (d.type === 'store_order_export') {
        const id = String(d.export_id || '');
        const valid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
        const merchantUrl = `/store/orders?export=${id}`;
        const storeId = Number(d.store_id);
        const adminUrl = Number.isSafeInteger(storeId) && storeId > 0 ? `/stores/${storeId}/orders?export=${id}` : '';
        const url = adminUrl && d.url === adminUrl ? adminUrl : merchantUrl;
        return { id: String(r.id), read, at, title: t('notification_order_export_ready', 'Order export ready'),
            body: t('notification_order_export_body', { defaultValue: '{{count}} orders · Download your export', count: Number(d.row_count) || 0 }), ...(valid ? { link: url } : {}) };
    }

    if (d.type === 'store_order') {
        return {
            id: String(r.id), read, at,
            title: d.event === 'created' ? t('notification_store_order_created', 'New store order') : t('notification_store_order_updated', 'Store order status updated'),
            body: t('notification_store_order_body', { defaultValue: 'Order {{number}} · {{status}}', number: d.order_number ?? '—', status: t(`store_order_status_${d.status}`, String(d.status ?? '')) }),
            ...(Number.isSafeInteger(Number(d.order_id)) && Number(d.order_id) > 0 ? { link: `/store/orders/${Number(d.order_id)}` } : {}),
        };
    }

    if (d.type === 'support_ticket') {
        const ticketId = Number(d.ticket_id);
        const url = typeof d.url === 'string' && /^\/(admin\/)?support\/\d+$/.test(d.url) ? d.url : '';
        const titles = {
            created: t('notification_support_created', 'New support ticket'),
            replied: t('notification_support_replied', 'New reply on your support ticket'),
            resolved: t('notification_support_resolved', 'Support ticket resolved'),
            closed: t('notification_support_closed', 'Support ticket closed'),
        };
        return {
            id: String(r.id), read, at,
            title: titles[d.event] || titles.replied,
            body: [d.reference, d.subject].filter(Boolean).map(String).join(' · '),
            ...(url && Number.isSafeInteger(ticketId) && ticketId > 0 ? { link: url } : {}),
        };
    }

    if (d.type === 'domain') {
        return { id: String(r.id), read, at, title: String(d.title || t('notification_domain_title', 'Store domain alert')), body: String(d.message || ''), link: '/store/settings/domains' };
    }

    if (typeof d.title === 'string' && typeof d.message === 'string') {
        const url = typeof d.url === 'string' ? d.url.trim() : '';
        return {
            id: String(r.id),
            title: d.title,
            body: d.message,
            read,
            at,
            ...(url ? { link: url } : {}),
        };
    }

    const type = d.type;
    if (type === 'user_registered') {
        return {
            id: String(r.id),
            title: t('notif_type_user_registered_title'),
            body: t('notif_type_user_registered_body', { id: d.user_id ?? '—' }),
            read,
            at,
            link: '/admin/users',
        };
    }
    if (type === 'login' || type === 'login_new_device') {
        return {
            id: String(r.id),
            title: t('notif_type_login_title'),
            body: t('notif_type_login_body', { ip: d.ip ?? '—' }),
            read,
            at,
            link: '/settings/profile',
        };
    }
    if (type === 'inventory_low' || type === 'inventory_out') {
        return {
            id: String(r.id),
            title: type === 'inventory_out' ? t('notif_type_inventory_out_title') : t('notif_type_inventory_low_title'),
            body: t('notif_type_inventory_body', { product: d.product_id ?? '—', qty: d.qty_available ?? '—' }),
            read,
            at,
        };
    }

    const urlFallback = typeof d.url === 'string' && d.url.trim() ? d.url.trim() : undefined;
    const fallbackBody = [d.message, d.body, d.preview].find((value) => typeof value === 'string' && value.trim()) || t('notif_type_generic_body');
    return {
        id: String(r.id),
        title: t('notif_type_generic_title'),
        body: fallbackBody,
        read,
        at,
        ...(urlFallback ? { link: urlFallback } : {}),
    };
}
