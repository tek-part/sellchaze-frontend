/**
 * @typedef {{ id: string, title: string, body: string, read: boolean, at: number, link?: string }} DisplayNotification
 */

/**
 * Resolve order detail path from common notification payload shapes.
 * @param {Record<string, unknown>} d
 * @param {string} fallback
 */
export function orderNotificationPath(d, fallback = '/orders/in') {
    const raw =
        (typeof d.order_code === 'string' && d.order_code.trim()) ||
        (typeof d.code === 'string' && d.code.trim()) ||
        (d.order &&
            typeof d.order === 'object' &&
            d.order !== null &&
            typeof d.order.code === 'string' &&
            d.order.code.trim());
    if (raw) {
        return `/orders/${encodeURIComponent(String(raw).trim())}`;
    }
    return fallback;
}

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
 * @param {{ isSupplier?: boolean }} [opts]
 * @returns {DisplayNotification}
 */
export function mapServerNotification(row, t, opts = {}) {
    const isSupplier = Boolean(opts.isSupplier);
    const orderFallback = isSupplier ? '/orders/out' : '/orders/in';

    const r = row && typeof row === 'object' ? row : {};
    const d = r.data && typeof r.data === 'object' ? r.data : {};
    const read = Boolean(r.read_at);
    const at = r.created_at ? new Date(r.created_at).getTime() : Date.now();

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
    if (type === 'order') {
        return {
            id: String(r.id),
            title: t('notif_type_order_title'),
            body: t('notif_type_order_body', { id: d.order_id ?? d.order_code ?? '—' }),
            read,
            at,
            link: orderNotificationPath(d, orderFallback),
        };
    }
    if (type === 'quotation') {
        const code = typeof d.order_code === 'string' ? d.order_code : '';
        const isAccepted = d.action === 'accepted';
        return {
            id: String(r.id),
            title: isAccepted ? t('notif_type_quotation_accepted_title') : t('notif_type_quotation_title'),
            body: isAccepted
                ? t('notif_type_quotation_accepted_body', { code: code || d.order_id || '—' })
                : t('notif_type_quotation_body', { id: d.order_id ?? '—' }),
            read,
            at,
            link: code ? `/orders/${encodeURIComponent(code)}` : orderFallback,
        };
    }
    if (type === 'ticket_reply') {
        const tid = d.ticket_id;
        return {
            id: String(r.id),
            title: t('notif_type_ticket_reply_title'),
            body: t('notif_type_ticket_reply_body', {
                ticket: tid ?? '—',
                preview: String(d.preview || '').slice(0, 80),
            }),
            read,
            at,
            link: tid != null ? `/tickets/${tid}` : '/tickets',
        };
    }
    if (type === 'ticket_created') {
        return {
            id: String(r.id),
            title: t('notif_type_ticket_created_title'),
            body: t('notif_type_ticket_created_body', { id: d.ticket_id ?? '—', order: d.order_code ?? '—' }),
            read,
            at,
            link: d.ticket_id != null ? `/tickets/${d.ticket_id}` : '/tickets',
        };
    }
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
    if (type === 'shipping_updated' || type === 'tracking_added') {
        return {
            id: String(r.id),
            title: t('notif_type_shipping_title'),
            body: t('notif_type_shipping_body', { order: d.order_id ?? d.order_code ?? '—' }),
            read,
            at,
            link: orderNotificationPath(d, orderFallback),
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
    if (type === 'order_assigned_to_supplier') {
        const code = typeof d.order_code === 'string' ? d.order_code : '';
        return {
            id: String(r.id),
            title: t('notif_type_order_assigned_supplier_title'),
            body: t('notif_type_order_assigned_supplier_body', {
                code: code || '—',
                product: d.product_name ?? '—',
            }),
            read,
            at,
            link: code ? `/orders/${encodeURIComponent(code)}` : '/orders/out',
        };
    }
    if (type === 'invitation') {
        const sender = typeof d.sender_name === 'string' && d.sender_name ? d.sender_name : '—';
        const invitedRole = typeof d.invited_role === 'string' ? d.invited_role : '';
        return {
            id: String(r.id),
            title: t('notif_type_invitation_title'),
            body: t('notif_type_invitation_body', { sender, role: invitedRole }),
            read,
            at,
            link: '/partners',
        };
    }
    if (type === 'inventory_low' || type === 'inventory_out') {
        return {
            id: String(r.id),
            title: type === 'inventory_out' ? t('notif_type_inventory_out_title') : t('notif_type_inventory_low_title'),
            body: t('notif_type_inventory_body', { product: d.product_id ?? '—', qty: d.qty_available ?? '—' }),
            read,
            at,
            link: '/inventory',
        };
    }

    const urlFallback = typeof d.url === 'string' && d.url.trim() ? d.url.trim() : undefined;
    const fallbackBody =
        d && Object.keys(d).length > 0
            ? JSON.stringify(d).slice(0, 200)
            : t('notif_type_generic_body');
    return {
        id: String(r.id),
        title: t('notif_type_generic_title'),
        body: fallbackBody,
        read,
        at,
        ...(urlFallback ? { link: urlFallback } : {}),
    };
}
