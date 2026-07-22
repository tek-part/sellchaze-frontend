import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    HiOutlineArrowLeft,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineBanknotes,
    HiOutlineBuildingStorefront,
    HiOutlineCalendarDays,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineClipboardDocumentList,
    HiOutlineCube,
    HiOutlineCurrencyDollar,
    HiOutlineInformationCircle,
    HiOutlineMapPin,
    HiOutlinePencilSquare,
    HiOutlineTag,
    HiOutlineTicket,
    HiOutlineTrash,
    HiOutlineTruck,
    HiOutlineUser,
    HiOutlineUserGroup,
    HiOutlineWallet,
    HiXMark,
} from 'react-icons/hi2';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';

function unwrap(o) {
    return o?.data ?? o;
}

const ORDER_STATUS_OPTIONS = [
    'pending',
    'accepted',
    'awaiting_shipping',
    'shipped',
    'deal',
    'completed',
    'rejected',
    'cancelled',
];

const TICKET_TYPES = [
    { value: 'replacement', labelKey: 'ticket_type_replacement' },
    { value: 'return', labelKey: 'ticket_type_return' },
    { value: 'other', labelKey: 'ticket_type_other' },
];

/** Fallback when Settings → Currencies API is empty or unreachable. */
const FALLBACK_QUOTATION_CURRENCIES = ['EGP', 'AED', 'USD', 'SAR'];

const WIGPLEASURE_STORE_STATUSES = [
    'pending',
    'pending_payment',
    'processing',
    'on_hold',
    'completed',
    'canceled',
    'refunded',
];

function wigpleasureStoreStatusLabel(t, value) {
    if (value == null || value === '') {
        return '—';
    }
    return t(`wigpleasure_store_status_${value}`, { defaultValue: value });
}

function statusBadgeClass(status) {
    const s = String(status ?? '').toLowerCase();
    if (s === 'pending') {
        return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
    }
    if (s === 'awaiting_shipping') {
        return 'bg-sky-50 text-sky-800 ring-1 ring-sky-200';
    }
    if (s === 'shipped') {
        return 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200';
    }
    if (['accepted', 'deal', 'completed'].includes(s)) {
        return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
    }
    if (['rejected', 'cancelled'].includes(s)) {
        return 'bg-red-50 text-red-800 ring-1 ring-red-200';
    }
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

function formatWhen(iso, locale) {
    if (!iso) {
        return '—';
    }
    try {
        return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : undefined);
    } catch {
        return String(iso);
    }
}

function pickLocalized(source, lang, fallback = '—') {
    const useAr = String(lang || '').startsWith('ar');
    const en = source?.title_en ?? source?.name_en ?? null;
    const ar = source?.title_ar ?? source?.name_ar ?? null;
    const base = source?.title ?? source?.name ?? null;
    const chosen = useAr ? ar ?? en ?? base : en ?? ar ?? base;
    const text = String(chosen ?? fallback).trim();
    return text === '' ? fallback : text;
}

/** @param {Record<string, unknown> | null | undefined} source */
function pickProductImageUrls(source) {
    if (!source || typeof source !== 'object') {
        return { thumb: null, large: null };
    }
    const str = (v) => {
        if (typeof v !== 'string') {
            return null;
        }
        const t = v.trim();
        return t === '' ? null : t;
    };
    const thumb =
        str(source.image_thumb_url) ||
        str(source.thumbnail_url) ||
        str(source.thumb_url) ||
        null;
    const large =
        str(source.image_url) ||
        str(source.image) ||
        str(source.full_image_url) ||
        null;
    return {
        thumb: thumb ?? large,
        large: large ?? thumb,
    };
}

function localizedStatusLabel(status, t) {
    const key = `order_status_${String(status ?? '').toLowerCase()}`;
    return t(key, { defaultValue: String(status ?? '—') });
}

function deliveryStatusLabel(status, t) {
    const key = `delivery_status_${String(status ?? '').toLowerCase()}`;
    return t(key, { defaultValue: String(status ?? '—') });
}

function isBlankAddrPart(v) {
    if (v == null) {
        return true;
    }
    const s = String(v).trim();
    return s === '' || s === '-';
}

/**
 * @param {Record<string, unknown>} data
 * @param {(k: string, o?: object) => string} t
 */
function structuredShippingRows(data, t) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return [];
    }
    /** @type {{ key: string; labelKey: string; value: string }[]} */
    const rows = [];
    const push = (key, labelKey, val) => {
        if (isBlankAddrPart(val)) {
            return;
        }
        rows.push({ key, labelKey, value: String(val) });
    };
    const shipType = String(data.type ?? '').toLowerCase();
    let warehouseDisplay = data.warehouse_name;
    if (isBlankAddrPart(warehouseDisplay) && shipType === 'warehouse') {
        const wid = data.warehouse_id;
        const idStr = wid != null ? String(wid).trim() : '';
        if (idStr !== '' && idStr !== '0') {
            warehouseDisplay = t('order_address_warehouse_number', { id: idStr });
        }
    }

    if (!isBlankAddrPart(data.type)) {
        const typeKey = `order_address_type_${data.type}`;
        const typeDisp = t(typeKey, { defaultValue: String(data.type).replace(/_/g, ' ') });
        rows.push({ key: 'type', labelKey: 'order_address_type', value: typeDisp });
    }
    push('warehouse', 'order_address_warehouse', warehouseDisplay);
    push('addr1', 'order_address_line1', data.address_1);
    push('addr2', 'order_address_line2', data.address_2);
    push('city', 'order_address_city', data.city);
    push('state', 'order_address_state', data.state);
    push('zip', 'order_address_zip', data.zip);
    push('country', 'order_address_country', data.country);
    return rows;
}

/**
 * @param {object} props
 * @param {import('react').ComponentType<{ className?: string }>} props.icon
 * @param {string} props.title
 * @param {import('react').ReactNode} props.children
 * @param {number} [props.delay]
 */
function SectionCard({ icon: Icon, title, children, delay = 0 }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
        >
            <div className="flex items-center gap-3 border-b border-slate-100/90 bg-linear-to-b from-slate-50/90 to-white px-5 py-4">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/12"
                    aria-hidden
                >
                    <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </motion.section>
    );
}

/**
 * @param {object} props
 * @param {import('react').ComponentType<{ className?: string }>} [props.icon]
 * @param {string} props.label
 * @param {import('react').ReactNode} props.children
 */
function SidebarField({ icon: Icon, label, children }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-3">
            <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden /> : null}
                {label}
            </dt>
            <dd className="mt-1.5 text-sm text-slate-800 **:text-inherit">{children}</dd>
        </div>
    );
}

/**
 * @param {object} props
 * @param {import('react').ComponentType<{ className?: string }>} props.icon
 * @param {string} props.label
 * @param {import('react').ReactNode} props.value
 */
function StatChip({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="truncate text-lg font-semibold tabular-nums text-slate-900">{value}</p>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const ordersBackList = location.state?.ordersDir === 'out' ? '/orders/out' : '/orders/in';
    const outlet = useOutletContext();
    const isAdmin = Boolean(outlet?.isAdmin);
    const permissions = Array.isArray(outlet?.permissions) ? outlet.permissions : [];
    const canOrderActions = isAdmin || permissions.includes('orders-out') || permissions.includes('orders-in');
    const canCreateTicket = isAdmin || permissions.includes('tickets-create');
    const me = outlet?.me ?? null;
    const isSupplier = Boolean(outlet?.isSupplier);
    const canQuotationsOut = isAdmin || permissions.includes('quotations-out');
    const canQuotationsIn = isAdmin || permissions.includes('quotations-in');
    const canDeliveriesUpdate = isSupplier && permissions.includes('deliveries-update');
    const canAdminDeliveriesUpdate =
        isAdmin || (!isSupplier && permissions.includes('deliveries-update'));
    const canAssignSuppliersOnDetail =
        !isSupplier &&
        (isAdmin || permissions.includes('orders-in') || permissions.includes('orders-out'));
    const { t, i18n } = useTranslation();
    const [row, setRow] = useState(null);
    const [err, setErr] = useState('');

    const [ticketOpen, setTicketOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [ticketType, setTicketType] = useState('other');
    const [ticketNotes, setTicketNotes] = useState('');
    const [editStatus, setEditStatus] = useState('pending');
    const [editNotes, setEditNotes] = useState('');
    const [editRef, setEditRef] = useState('');
    const [editQty, setEditQty] = useState('');
    const [savingTicket, setSavingTicket] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [qPrice, setQPrice] = useState('');
    const [qDeliveryDate, setQDeliveryDate] = useState('');
    const [qCurrency, setQCurrency] = useState('EGP');
    const [qShippingCompany, setQShippingCompany] = useState('');
    const [qPriceIncludesShipping, setQPriceIncludesShipping] = useState(true);
    const [qNotes, setQNotes] = useState('');
    const [savingQuotation, setSavingQuotation] = useState(false);
    const [quotationCurrencies, setQuotationCurrencies] = useState([]);
    const lastQuotationOrderCodeRef = useRef(null);
    const syncedPendingQuotationIdRef = useRef(null);

    const [acceptQuotationId, setAcceptQuotationId] = useState(null);
    const [acceptingQuotation, setAcceptingQuotation] = useState(false);

    const [shippingCompanies, setShippingCompanies] = useState([]);
    const [deliveryCompanyId, setDeliveryCompanyId] = useState('');
    const [deliveryTracking, setDeliveryTracking] = useState('');
    const [deliveryCod, setDeliveryCod] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [deliveryStatus, setDeliveryStatus] = useState('pending');
    const [savingDelivery, setSavingDelivery] = useState(false);

    const [adminDeliveryCompanyId, setAdminDeliveryCompanyId] = useState('');
    const [adminDeliveryTracking, setAdminDeliveryTracking] = useState('');
    const [adminDeliveryCod, setAdminDeliveryCod] = useState('');
    const [adminDeliveryNotes, setAdminDeliveryNotes] = useState('');
    const [adminDeliveryStatus, setAdminDeliveryStatus] = useState('pending');
    const [savingAdminDelivery, setSavingAdminDelivery] = useState(false);

    const [assignDetailOpen, setAssignDetailOpen] = useState(false);
    const [assignDetailSearch, setAssignDetailSearch] = useState('');
    const [assignDetailSelected, setAssignDetailSelected] = useState([]);
    const [supplierOptionsDetail, setSupplierOptionsDetail] = useState([]);
    const [assigningDetail, setAssigningDetail] = useState(false);

    const [wigpleasureStoreDraft, setWigpleasureStoreDraft] = useState('');
    const [wigpleasureReturnWarehouseDraft, setWigpleasureReturnWarehouseDraft] = useState('');
    const [savingWigpleasureStore, setSavingWigpleasureStore] = useState(false);
    const [detailRefreshNonce, setDetailRefreshNonce] = useState(0);
    const [itemImageLightbox, setItemImageLightbox] = useState(null);

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible') {
                setDetailRefreshNonce((n) => n + 1);
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    useEffect(() => {
        if (!code) {
            return;
        }
        setErr('');
        api
            .get(`/orders/${encodeURIComponent(code)}`)
            .then(({ data }) => setRow(unwrap(data.data)))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [code, detailRefreshNonce]);

    useEffect(() => {
        if (!row) {
            return;
        }
        setWigpleasureStoreDraft(row.wigpleasure_store_status || 'pending');
        setWigpleasureReturnWarehouseDraft('');
    }, [row?.code, row?.wigpleasure_store_status]);

    useEffect(() => {
        if (!canQuotationsOut && !canQuotationsIn) {
            return;
        }
        api
            .get('/currencies')
            .then(({ data }) => {
                const list = data?.data;
                setQuotationCurrencies(Array.isArray(list) ? list : []);
            })
            .catch(() => setQuotationCurrencies([]));
    }, [canQuotationsOut, canQuotationsIn]);

    useEffect(() => {
        if (!canDeliveriesUpdate && !canAdminDeliveriesUpdate) {
            return;
        }
        api
            .get('/shipping-companies', { params: { active_only: 1, per_page: 100 } })
            .then(({ data }) => {
                const list = data?.data ?? [];
                setShippingCompanies(Array.isArray(list) ? list : []);
            })
            .catch(() => setShippingCompanies([]));
    }, [canDeliveriesUpdate, canAdminDeliveriesUpdate]);

    useEffect(() => {
        if (!assignDetailOpen || !canAssignSuppliersOnDetail) {
            return;
        }
        api.get('/suppliers', { params: { per_page: 200 } })
            .then(({ data }) => {
                const list = data?.data ?? [];
                setSupplierOptionsDetail(Array.isArray(list) ? list : []);
            })
            .catch(() => setSupplierOptionsDetail([]));
    }, [assignDetailOpen, canAssignSuppliersOnDetail]);

    useEffect(() => {
        if (!assignDetailOpen || !row?.suppliers) {
            return;
        }
        const ids = (Array.isArray(row.suppliers) ? row.suppliers : [])
            .map((s) => Number(s.supplier_id ?? s.supplier))
            .filter((v) => Number.isFinite(v) && v > 0);
        setAssignDetailSelected([...new Set(ids)]);
        setAssignDetailSearch('');
    }, [assignDetailOpen, row?.code, row?.suppliers]);

    useEffect(() => {
        if (!canDeliveriesUpdate || !row) {
            return;
        }
        const list = Array.isArray(row.deliveries) ? row.deliveries : [];
        const supplierSeg = row.shipping_type === 'warehouse' ? 'to_warehouse' : 'to_customer';
        const d = list.find((x) => (x.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer') === supplierSeg);
        if (d) {
            setDeliveryCompanyId(String(d.shipping_company_id ?? ''));
            setDeliveryTracking(d.tracking_number ?? '');
            setDeliveryCod(d.cod_amount != null ? String(d.cod_amount) : '');
            setDeliveryNotes(d.notes ?? '');
            setDeliveryStatus(String(d.status ?? 'pending'));
        } else {
            setDeliveryCompanyId('');
            setDeliveryTracking('');
            setDeliveryCod('');
            setDeliveryNotes('');
            setDeliveryStatus('pending');
        }
    }, [row?.code, row?.deliveries, row?.shipping_type, canDeliveriesUpdate]);

    useEffect(() => {
        if (!canAdminDeliveriesUpdate || !row) {
            return;
        }
        if (row.shipping_type !== 'warehouse') {
            setAdminDeliveryCompanyId('');
            setAdminDeliveryTracking('');
            setAdminDeliveryCod('');
            setAdminDeliveryNotes('');
            setAdminDeliveryStatus('pending');
            return;
        }
        const list = Array.isArray(row.deliveries) ? row.deliveries : [];
        const wLeg = list.find((x) => (x.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer') === 'to_warehouse');
        if (!wLeg || String(wLeg.status ?? '') !== 'delivered') {
            setAdminDeliveryCompanyId('');
            setAdminDeliveryTracking('');
            setAdminDeliveryCod('');
            setAdminDeliveryNotes('');
            setAdminDeliveryStatus('pending');
            return;
        }
        const cLeg = list.find((x) => (x.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer') === 'to_customer');
        if (cLeg) {
            setAdminDeliveryCompanyId(String(cLeg.shipping_company_id ?? ''));
            setAdminDeliveryTracking(cLeg.tracking_number ?? '');
            setAdminDeliveryCod(cLeg.cod_amount != null ? String(cLeg.cod_amount) : '');
            setAdminDeliveryNotes(cLeg.notes ?? '');
            setAdminDeliveryStatus(String(cLeg.status ?? 'pending'));
        } else {
            setAdminDeliveryCompanyId('');
            setAdminDeliveryTracking('');
            setAdminDeliveryCod('');
            setAdminDeliveryNotes('');
            setAdminDeliveryStatus('pending');
        }
    }, [row?.code, row?.deliveries, row?.shipping_type, canAdminDeliveriesUpdate]);

    const locale = i18n.language;

    const badges = useMemo(() => (Array.isArray(row?.attribute_badges) ? row.attribute_badges : []), [row]);
    const wigpleasure = useMemo(
        () => (Array.isArray(row?.wigpleasure_products) ? row.wigpleasure_products : []),
        [row],
    );
    const quotations = useMemo(() => (Array.isArray(row?.quotations) ? row.quotations : []), [row]);
    const deliveries = useMemo(() => (Array.isArray(row?.deliveries) ? row.deliveries : []), [row]);
    const isWarehouseShipping = row?.shipping_type === 'warehouse';
    const warehouseNameFromOrder = useMemo(() => {
        const raw = row?.shipping_address_json;
        let o = raw;
        if (typeof raw === 'string') {
            try {
                o = JSON.parse(raw);
            } catch {
                o = null;
            }
        }
        if (!o || typeof o !== 'object') {
            return '';
        }
        const n = String(o.warehouse_name || '').trim();
        if (n) {
            return n;
        }
        const wid = o.warehouse_id;
        if (wid != null && String(wid).trim() !== '') {
            return `#${String(wid).trim()}`;
        }
        return '';
    }, [row?.shipping_address_json]);
    const deliveryLegWarehouse = useMemo(
        () => deliveries.find((d) => (d.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer') === 'to_warehouse'),
        [deliveries],
    );
    const deliveryLegCustomer = useMemo(
        () => deliveries.find((d) => (d.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer') === 'to_customer'),
        [deliveries],
    );
    const supplierFormSegment = isWarehouseShipping ? 'to_warehouse' : 'to_customer';
    const supplierTargetDelivery = useMemo(
        () => deliveries.find((d) => (d.segment === 'to_warehouse' ? 'to_warehouse' : 'to_customer') === supplierFormSegment),
        [deliveries, supplierFormSegment],
    );
    const showAdminSecondLegForm = Boolean(
        canAdminDeliveriesUpdate && isWarehouseShipping && deliveryLegWarehouse && String(deliveryLegWarehouse.status) === 'delivered',
    );
    const suppliers = useMemo(() => (Array.isArray(row?.suppliers) ? row.suppliers : []), [row]);

    const myUserId = me?.id != null ? Number(me.id) : null;
    const isAssignedSupplier = useMemo(() => {
        if (myUserId == null) {
            return false;
        }
        return suppliers.some((s) => Number(s.supplier_id) === myUserId);
    }, [suppliers, myUserId]);

    const myQuotation = useMemo(() => {
        if (myUserId == null) {
            return null;
        }
        return quotations.find((q) => Number(q.supplier_user_id) === myUserId) ?? null;
    }, [quotations, myUserId]);

    const myQuotationIsPending = useMemo(() => {
        if (!myQuotation) {
            return false;
        }
        const st = String(myQuotation.status ?? '').toLowerCase();
        return st === 'pending';
    }, [myQuotation]);

    const canSubmitQuote = Boolean(
        row && isSupplier && canQuotationsOut && isAssignedSupplier && (!myQuotation || myQuotationIsPending),
    );

    const quoteCurrencyCodes = useMemo(() => {
        const fromApi = quotationCurrencies
            .map((r) => String(r?.currency_code ?? '')
                .trim()
                .toUpperCase())
            .filter((c) => /^[A-Z]{3}$/.test(c));
        if (fromApi.length > 0) {
            return [...new Set(fromApi)].sort();
        }
        return [...FALLBACK_QUOTATION_CURRENCIES];
    }, [quotationCurrencies]);

    useEffect(() => {
        syncedPendingQuotationIdRef.current = null;
    }, [row?.code]);

    useEffect(() => {
        if (!row?.code || quoteCurrencyCodes.length === 0) {
            return;
        }
        const orderCur =
            row.currency != null && String(row.currency).trim() !== ''
                ? String(row.currency).trim().toUpperCase()
                : '';
        const switchedOrder = lastQuotationOrderCodeRef.current !== row.code;
        lastQuotationOrderCodeRef.current = row.code;
        if (switchedOrder) {
            if (orderCur && quoteCurrencyCodes.includes(orderCur)) {
                setQCurrency(orderCur);
            } else {
                setQCurrency(quoteCurrencyCodes[0]);
            }
            return;
        }
        setQCurrency((prev) => {
            if (quoteCurrencyCodes.includes(prev)) {
                return prev;
            }
            if (orderCur && quoteCurrencyCodes.includes(orderCur)) {
                return orderCur;
            }
            return quoteCurrencyCodes[0];
        });
    }, [row?.code, row?.currency, quoteCurrencyCodes]);

    useEffect(() => {
        if (!row?.code || !isSupplier || !myQuotation) {
            return;
        }
        const st = String(myQuotation.status ?? '').toLowerCase();
        if (st !== 'pending') {
            return;
        }
        if (syncedPendingQuotationIdRef.current === myQuotation.id) {
            return;
        }
        syncedPendingQuotationIdRef.current = myQuotation.id;

        setQPrice(
            myQuotation.price != null && myQuotation.price !== ''
                ? String(myQuotation.price)
                : '',
        );
        if (myQuotation.delivery_date) {
            const d = String(myQuotation.delivery_date);
            setQDeliveryDate(d.length >= 10 ? d.slice(0, 10) : d);
        } else {
            setQDeliveryDate('');
        }
        const cur = myQuotation.currency ? String(myQuotation.currency).trim().toUpperCase() : '';
        if (cur && /^[A-Z]{3}$/.test(cur)) {
            setQCurrency(cur);
        }
        setQShippingCompany(
            myQuotation.shipping_company ? String(myQuotation.shipping_company) : '',
        );
        setQPriceIncludesShipping(Boolean(myQuotation.price_includes_shipping));
        setQNotes(myQuotation.notes ? String(myQuotation.notes) : '');
    }, [row?.code, isSupplier, myQuotation]);

    const canAcceptQuotes = Boolean(row && (isAdmin || (!isSupplier && canQuotationsIn)));

    /** Suppliers only see Deliveries after their quotation is accepted (parity with legacy flow). */
    const supplierSeesDeliveriesSection = useMemo(() => {
        if (!isSupplier) {
            return true;
        }
        if (!myQuotation) {
            return false;
        }
        const st = String(myQuotation.status ?? '').toLowerCase();
        return ['accepted', 'deal'].includes(st);
    }, [isSupplier, myQuotation]);

    const itemRows = useMemo(() => {
        if (!row) {
            return [];
        }
        if (wigpleasure.length > 0) {
            return wigpleasure.map((wp, idx) => {
                const { thumb, large } = pickProductImageUrls(wp);
                return {
                    key: `wp-${idx}-${wp?.product_id ?? idx}`,
                    title: pickLocalized(wp, locale, t('order_none')),
                    subtitle:
                        wp?.product_id != null ? `${t('order_col_product_id')}: ${wp.product_id}` : null,
                    qty: wp.qty ?? row.quantity ?? t('order_none'),
                    storefrontUrl:
                        typeof wp?.storefront_url === 'string' && wp.storefront_url ? wp.storefront_url : null,
                    imageThumbUrl: thumb,
                    imagePreviewUrl: large,
                };
            });
        }
        if (row.product && typeof row.product === 'object') {
            const p = row.product;
            const { thumb, large } = pickProductImageUrls(p);
            return [
                {
                    key: `product-${p.id}`,
                    title: pickLocalized(p, locale, p.name ?? t('order_none')),
                    subtitle: `${t('order_col_product_id')}: ${p.id}`,
                    qty: row.quantity ?? t('order_none'),
                    storefrontUrl:
                        typeof p.storefront_url === 'string' && p.storefront_url ? p.storefront_url : null,
                    imageThumbUrl: thumb,
                    imagePreviewUrl: large,
                },
            ];
        }
        return [];
    }, [row, wigpleasure, locale, t]);

    const shippingAddressRows = useMemo(
        () => structuredShippingRows(row?.shipping_address_json, t),
        [row?.shipping_address_json, t],
    );

    const statusSelectOptions = useMemo(() => {
        const s = row?.status != null ? String(row.status).toLowerCase() : '';
        if (s && !ORDER_STATUS_OPTIONS.includes(s)) {
            return [s, ...ORDER_STATUS_OPTIONS];
        }
        return ORDER_STATUS_OPTIONS;
    }, [row?.status]);

    const shippingAddressBody = useMemo(() => {
        if (shippingAddressRows.length > 0) {
            return (
                <dl className="mt-0 space-y-2.5 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-100">
                    {shippingAddressRows.map((r) => (
                        <div key={r.key} className="flex gap-2">
                            <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                            <div>
                                <dt className="text-xs font-medium text-slate-500">{t(r.labelKey)}</dt>
                                <dd className="text-slate-800">{r.value}</dd>
                            </div>
                        </div>
                    ))}
                </dl>
            );
        }
        const j = row?.shipping_address_json;
        if (typeof j === 'string' && j.trim() !== '') {
            return <p className="text-slate-800">{j}</p>;
        }
        const line = row?.shipping_address?.trim();
        if (line) {
            return <p className="whitespace-pre-wrap text-slate-800">{line}</p>;
        }
        return <span className="text-slate-500">{t('order_none')}</span>;
    }, [row, shippingAddressRows, t]);

    const openEditModal = () => {
        if (!row) {
            return;
        }
        const st = String(row.status ?? 'pending').toLowerCase();
        setEditStatus(st);
        setEditNotes(row.notes ?? '');
        setEditRef(row.ref_number ?? '');
        setEditQty(row.quantity != null ? String(row.quantity) : '');
        setEditOpen(true);
    };

    const submitTicket = async () => {
        if (!row?.code || !ticketNotes.trim()) {
            toast.error(t('order_ticket_notes_required'));
            return;
        }
        setSavingTicket(true);
        try {
            const { data } = await api.post('/tickets', {
                order_code: row.code,
                type: ticketType,
                notes: ticketNotes.trim(),
            });
            const id = data?.data?.id;
            toast.success(t('order_ticket_created'));
            setTicketOpen(false);
            setTicketNotes('');
            setTicketType('other');
            if (id) {
                navigate(`/tickets/${id}`);
            } else {
                const { data: fresh } = await api.get(`/orders/${encodeURIComponent(row.code)}`);
                setRow(unwrap(fresh.data));
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSavingTicket(false);
        }
    };

    const submitWigpleasureStore = async () => {
        if (!row?.code || !row.wigpleasure_order_id || !isAdmin) {
            return;
        }
        const next = String(wigpleasureStoreDraft || '').trim();
        if (!next) {
            toast.error(t('order_wigpleasure_store_status_required'));
            return;
        }
        const needsReturn = next === 'canceled' || next === 'refunded';
        const whRaw = wigpleasureReturnWarehouseDraft.trim();
        const whId = whRaw === '' ? NaN : parseInt(whRaw, 10);
        if (needsReturn && (!Number.isFinite(whId) || whId < 1)) {
            toast.error(t('order_wigpleasure_return_warehouse_required'));
            return;
        }
        setSavingWigpleasureStore(true);
        try {
            const payload = { wigpleasure_store_status: next };
            if (needsReturn) {
                payload.wigpleasure_return_warehouse_id = whId;
            }
            const { data } = await api.patch(`/orders/${encodeURIComponent(row.code)}`, payload);
            setRow(unwrap(data.data));
            toast.success(t('order_wigpleasure_store_saved'));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSavingWigpleasureStore(false);
        }
    };

    const submitEdit = async () => {
        if (!row?.code) {
            return;
        }
        const qtyNum = editQty.trim() === '' ? undefined : parseInt(editQty, 10);
        if (qtyNum !== undefined && (Number.isNaN(qtyNum) || qtyNum < 1)) {
            toast.error(t('order_col_quantity'));
            return;
        }
        setSavingEdit(true);
        try {
            const payload = {
                status: editStatus,
                notes: editNotes,
                ref_number: editRef.trim() || null,
            };
            if (qtyNum !== undefined) {
                payload.quantity = qtyNum;
            }
            const { data } = await api.patch(`/orders/${encodeURIComponent(row.code)}`, payload);
            setRow(unwrap(data.data));
            toast.success(t('order_saved'));
            setEditOpen(false);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSavingEdit(false);
        }
    };

    const submitQuotation = async (e) => {
        e.preventDefault();
        if (!row?.code || savingQuotation) {
            return;
        }
        const price = parseFloat(String(qPrice).replace(',', '.'));
        if (Number.isNaN(price) || price < 0) {
            toast.error(t('order_quotation_price_invalid'));
            return;
        }
        if (!qDeliveryDate) {
            toast.error(t('order_quotation_date_required'));
            return;
        }
        setSavingQuotation(true);
        try {
            const payload = {
                price,
                delivery_date: qDeliveryDate,
                currency: 'USD',
                shipping_company: qShippingCompany.trim() || null,
                price_includes_shipping: qPriceIncludesShipping,
                notes: qNotes.trim() || null,
            };
            const updatingPendingQuotation =
                myQuotation && String(myQuotation.status ?? '').toLowerCase() === 'pending';
            const { data } = updatingPendingQuotation
                ? await api.patch(
                      `/orders/${encodeURIComponent(row.code)}/quotations/${myQuotation.id}`,
                      payload,
                  )
                : await api.post(`/orders/${encodeURIComponent(row.code)}/quotations`, payload);
            setRow(unwrap(data.data));
            if (updatingPendingQuotation) {
                toast.success(t('order_quotation_updated'));
            } else {
                toast.success(t('order_quotation_saved'));
                setQPrice('');
                setQNotes('');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setSavingQuotation(false);
        }
    };

    const confirmAcceptQuotation = async () => {
        if (acceptQuotationId == null || !row?.code) {
            return;
        }
        setAcceptingQuotation(true);
        try {
            const { data } = await api.post(
                `/orders/${encodeURIComponent(row.code)}/quotations/${acceptQuotationId}/accept`,
            );
            setRow(unwrap(data.data));
            toast.success(t('order_quotation_accepted_toast'));
            setAcceptQuotationId(null);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setAcceptingQuotation(false);
        }
    };

    const submitDeliveryRecord = async (e) => {
        e.preventDefault();
        if (!row?.code || savingDelivery) {
            return;
        }
        const existing = supplierTargetDelivery;
        const companyId = Number(deliveryCompanyId);
        if (!companyId) {
            toast.error(t('order_delivery_company_required'));
            return;
        }
        let codAmount = null;
        if (deliveryCod.trim() !== '') {
            const n = Number(deliveryCod);
            if (Number.isNaN(n) || n < 0) {
                toast.error(t('order_delivery_cod_invalid'));
                return;
            }
            codAmount = n;
        }
        setSavingDelivery(true);
        try {
            if (existing?.id != null) {
                await api.patch(`/deliveries/${existing.id}`, {
                    shipping_company_id: companyId,
                    tracking_number: deliveryTracking.trim() || null,
                    cod_amount: codAmount,
                    notes: deliveryNotes.trim() || null,
                    status: deliveryStatus,
                });
                toast.success(t('order_delivery_saved'));
            } else {
                await api.post('/deliveries', {
                    order_code: row.code,
                    shipping_company_id: companyId,
                    tracking_number: deliveryTracking.trim() || null,
                    cod_amount: codAmount,
                    notes: deliveryNotes.trim() || null,
                    segment: supplierFormSegment,
                });
                toast.success(t('shipping_delivery_created'));
                setDeliveryTracking('');
                setDeliveryCod('');
                setDeliveryNotes('');
                setDeliveryStatus('pending');
            }
            const { data } = await api.get(`/orders/${encodeURIComponent(row.code)}`);
            setRow(unwrap(data.data));
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setSavingDelivery(false);
        }
    };

    const submitAdminDeliveryRecord = async (e) => {
        e.preventDefault();
        if (!row?.code || savingAdminDelivery || !showAdminSecondLegForm) {
            return;
        }
        const companyId = Number(adminDeliveryCompanyId);
        if (!companyId) {
            toast.error(t('order_delivery_company_required'));
            return;
        }
        let codAmount = null;
        if (adminDeliveryCod.trim() !== '') {
            const n = Number(adminDeliveryCod);
            if (Number.isNaN(n) || n < 0) {
                toast.error(t('order_delivery_cod_invalid'));
                return;
            }
            codAmount = n;
        }
        setSavingAdminDelivery(true);
        try {
            if (deliveryLegCustomer?.id != null) {
                await api.patch(`/deliveries/${deliveryLegCustomer.id}`, {
                    shipping_company_id: companyId,
                    tracking_number: adminDeliveryTracking.trim() || null,
                    cod_amount: codAmount,
                    notes: adminDeliveryNotes.trim() || null,
                    status: adminDeliveryStatus,
                });
                toast.success(t('order_delivery_saved'));
            } else {
                await api.post('/deliveries', {
                    order_code: row.code,
                    shipping_company_id: companyId,
                    tracking_number: adminDeliveryTracking.trim() || null,
                    cod_amount: codAmount,
                    notes: adminDeliveryNotes.trim() || null,
                });
                toast.success(t('shipping_delivery_created'));
                setAdminDeliveryTracking('');
                setAdminDeliveryCod('');
                setAdminDeliveryNotes('');
                setAdminDeliveryStatus('pending');
            }
            const { data } = await api.get(`/orders/${encodeURIComponent(row.code)}`);
            setRow(unwrap(data.data));
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setSavingAdminDelivery(false);
        }
    };

    const runDelete = async () => {
        if (!row?.code) {
            return;
        }
        setDeleting(true);
        try {
            const { data } = await api.post('/orders/bulk-destroy', { codes: [row.code] });
            const n = data?.deleted ?? 0;
            if (n < 1) {
                toast.error(t('order_delete_confirm_body'));
            } else {
                toast.success(t('order_deleted'));
                navigate(ordersBackList);
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
        }
    };

    const actionBtnBase =
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/60 to-brand/6 px-5 py-7 shadow-[0_8px_40px_rgba(15,23,42,0.07)] sm:px-8">
                <div
                    className="pointer-events-none absolute -inset-e-16 -top-16 h-48 w-48 rounded-full bg-brand/[0.07] blur-3xl"
                    aria-hidden
                />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
                            <HiOutlineClipboardDocumentList className="h-7 w-7" aria-hidden />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {t('order_detail_title', { code: code ?? '' })}
                            </h1>
                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <HiOutlineCalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                {row?.created_at ? formatWhen(row.created_at, locale) : t('loading')}
                            </p>
                            {row?.status != null ? (
                                <p className="mt-3">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(row.status)}`}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
                                        {localizedStatusLabel(row.status, t)}
                                    </span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                    {row ? (
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <Link
                                to={ordersBackList}
                                className={`${actionBtnBase} bg-slate-100 text-slate-900 ring-1 ring-slate-200/90 hover:bg-slate-200`}
                            >
                                <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                                {t('order_action_back')}
                            </Link>
                            {canCreateTicket ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTicketType('other');
                                        setTicketNotes('');
                                        setTicketOpen(true);
                                    }}
                                    className={`${actionBtnBase} bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-400`}
                                >
                                    <HiOutlineTicket className="h-4 w-4" aria-hidden />
                                    {t('order_action_create_ticket')}
                                </button>
                            ) : null}
                            {canOrderActions ? (
                                <button
                                    type="button"
                                    onClick={openEditModal}
                                    className={`${actionBtnBase} bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400`}
                                >
                                    <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                                    {t('order_action_edit')}
                                </button>
                            ) : null}
                            {canOrderActions ? (
                                <button
                                    type="button"
                                    onClick={() => setDeleteOpen(true)}
                                    className={`${actionBtnBase} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400`}
                                >
                                    <HiOutlineTrash className="h-4 w-4" aria-hidden />
                                    {t('order_action_delete')}
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <Link
                            to={ordersBackList}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-xs backdrop-blur-xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                        >
                            <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                            {t('order_back_list')}
                        </Link>
                    )}
                </div>
            </div>

            {err && (
                <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <span className="font-medium">{err}</span>
                </p>
            )}

            {row ? (
                <div className="space-y-8">
                    {row.wigpleasure_order_id && !isSupplier ? (
                        <SectionCard
                            icon={HiOutlineBuildingStorefront}
                            title={t('order_wigpleasure_store_status_section')}
                            delay={0}
                        >
                            <p className="mb-4 text-sm text-slate-600">
                                <span className="font-medium text-slate-500">{t('order_external_id')}: </span>
                                <span className="font-mono font-semibold text-slate-900">{row.wigpleasure_order_id}</span>
                            </p>
                            {isAdmin ? (
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            {t('col_wigpleasure_store_status')}
                                        </label>
                                        <select
                                            value={wigpleasureStoreDraft}
                                            onChange={(e) => setWigpleasureStoreDraft(e.target.value)}
                                            className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                        >
                                            {WIGPLEASURE_STORE_STATUSES.map((s) => (
                                                <option key={s} value={s}>
                                                    {t(`wigpleasure_store_status_${s}`)}
                                                </option>
                                            ))}
                                        </select>
                                        {wigpleasureStoreDraft === 'canceled' ||
                                        wigpleasureStoreDraft === 'refunded' ? (
                                            <div className="pt-1">
                                                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_wigpleasure_return_warehouse_label')}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    inputMode="numeric"
                                                    value={wigpleasureReturnWarehouseDraft}
                                                    onChange={(e) =>
                                                        setWigpleasureReturnWarehouseDraft(e.target.value)
                                                    }
                                                    className="mt-1 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={savingWigpleasureStore}
                                        onClick={() => void submitWigpleasureStore()}
                                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                                    >
                                        {savingWigpleasureStore ? '…' : t('order_wigpleasure_store_save')}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-lg font-semibold text-slate-900">
                                    {wigpleasureStoreStatusLabel(t, row.wigpleasure_store_status)}
                                </p>
                            )}
                        </SectionCard>
                    ) : null}
                    <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
                        <div className="space-y-8 lg:col-span-2">
                        <SectionCard icon={HiOutlineCube} title={t('order_section_line_items')} delay={0}>
                            {canAssignSuppliersOnDetail && row?.code ? (
                                <div className="mb-4 flex flex-wrap justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAssignDetailOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-xs ring-1 ring-slate-100 hover:bg-slate-50"
                                    >
                                        <HiOutlineUserGroup className="h-4 w-4 text-slate-600" aria-hidden />
                                        {t('col_assign_supplier')}
                                    </button>
                                </div>
                            ) : null}
                            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                                <table className="min-w-full divide-y divide-slate-100 text-sm">
                                    <thead className="bg-slate-50/90">
                                        <tr>
                                            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {t('order_item')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {t('order_col_quantity')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                {t('col_actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {itemRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                                                    <HiOutlineCube className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden />
                                                    {t('col_product')}: {t('order_none')}
                                                </td>
                                            </tr>
                                        ) : (
                                            itemRows.map((item) => (
                                                <tr key={item.key} className="transition hover:bg-slate-50/50">
                                                    <td className="max-w-[min(100%,28rem)] px-4 py-4">
                                                        <div className="flex items-start gap-3">
                                                            {item.imageThumbUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setItemImageLightbox({
                                                                            src:
                                                                                item.imagePreviewUrl ||
                                                                                item.imageThumbUrl,
                                                                            alt: item.title,
                                                                        })
                                                                    }
                                                                    className="group shrink-0 rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                                                                    aria-label={t('order_gallery_open')}
                                                                >
                                                                    <img
                                                                        src={item.imageThumbUrl}
                                                                        alt=""
                                                                        className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200 transition group-hover:ring-brand/35"
                                                                    />
                                                                </button>
                                                            ) : (
                                                                <div
                                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 ring-1 ring-slate-200"
                                                                    aria-hidden
                                                                >
                                                                    —
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-semibold text-slate-900">{item.title}</p>
                                                                {item.subtitle ? (
                                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                                        {item.subtitle}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-end">
                                                        <span className="inline-flex rounded-lg bg-brand/10 px-3 py-1 text-sm font-bold tabular-nums text-brand ring-1 ring-brand/10">
                                                            {item.qty}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-end">
                                                        {item.storefrontUrl ? (
                                                            <a
                                                                href={item.storefrontUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                                            >
                                                                <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                                                                {t('order_view_store_product')}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {badges.length > 0 ? (
                                <div className="mt-6 border-t border-slate-100 pt-6">
                                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <HiOutlineTag className="h-4 w-4 text-slate-400" aria-hidden />
                                        {t('order_section_attributes')}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {badges.map((b, i) => {
                                            const isAr = String(locale || '')
                                                .toLowerCase()
                                                .startsWith('ar');
                                            const badgeName = isAr
                                                ? (b.name_ar ?? b.name)
                                                : (b.name_en ?? b.name);
                                            const badgeValue = isAr
                                                ? (b.value_ar ?? b.value)
                                                : (b.value_en ?? b.value);
                                            return (
                                                <span
                                                    key={`${badgeName}-${badgeValue}-${i}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-900 ring-1 ring-sky-100"
                                                >
                                                    <HiOutlineTag className="h-3.5 w-3.5 opacity-70" aria-hidden />
                                                    {badgeName}: {badgeValue}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            {row.notes ? (
                                <div className="mt-6 flex gap-3 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 ring-1 ring-amber-100/80">
                                    <HiOutlineChatBubbleBottomCenterText
                                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600/90"
                                        aria-hidden
                                    />
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                                            {t('order_section_notes')}
                                        </p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{row.notes}</p>
                                    </div>
                                </div>
                            ) : null}
                        </SectionCard>

                        <SectionCard icon={HiOutlineCurrencyDollar} title={t('order_section_quotations')} delay={0.06}>
                            <div className="space-y-6">
                                {canSubmitQuote ? (
                                    <form
                                        onSubmit={(e) => void submitQuotation(e)}
                                        className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 ring-1 ring-slate-100"
                                    >
                                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                            {myQuotationIsPending
                                                ? t('order_quotation_edit_title')
                                                : t('order_quotation_submit_title')}
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_quotation_price_label')}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    required
                                                    value={qPrice}
                                                    onChange={(e) => setQPrice(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            {/* currency removed — USD only */}
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_quotation_shipping_company')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={qShippingCompany}
                                                    onChange={(e) => setQShippingCompany(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 sm:col-span-2">
                                                <input
                                                    id="q-inc-ship"
                                                    type="checkbox"
                                                    checked={qPriceIncludesShipping}
                                                    onChange={(e) => setQPriceIncludesShipping(e.target.checked)}
                                                    className="h-4 w-4 rounded-sm border-slate-300 text-brand focus:ring-brand/30"
                                                />
                                                <label htmlFor="q-inc-ship" className="text-sm text-slate-700">
                                                    {t('order_quotation_price_includes_shipping')}
                                                </label>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_quotation_estimated_delivery')}
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={qDeliveryDate}
                                                    onChange={(e) => setQDeliveryDate(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_section_notes')}
                                                </label>
                                                <textarea
                                                    value={qNotes}
                                                    onChange={(e) => setQNotes(e.target.value)}
                                                    rows={2}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={savingQuotation}
                                                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                                            >
                                                {savingQuotation
                                                    ? '…'
                                                    : myQuotationIsPending
                                                      ? t('order_quotation_update_btn')
                                                      : t('order_quotation_submit_btn')}
                                            </button>
                                        </div>
                                    </form>
                                ) : null}

                                {quotations.length === 0 && !canSubmitQuote ? (
                                    <div className="flex flex-col items-center py-10 text-slate-500">
                                        <HiOutlineBanknotes className="mb-3 h-10 w-10 text-slate-300" aria-hidden />
                                        <p className="text-sm">{t('order_no_quotations')}</p>
                                    </div>
                                ) : null}

                                {quotations.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                                            <thead className="bg-slate-50/90">
                                                <tr>
                                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                        {t('col_price')}
                                                    </th>
                                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                        {t('col_status')}
                                                    </th>
                                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                        {t('col_party')}
                                                    </th>
                                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                        {t('col_delivery')}
                                                    </th>
                                                    {canAcceptQuotes ? (
                                                        <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                            {t('col_actions')}
                                                        </th>
                                                    ) : null}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {quotations.map((q) => {
                                                    const st = String(q.status ?? '').toLowerCase();
                                                    const canAcceptThis =
                                                        canAcceptQuotes && st !== 'accepted' && st !== 'rejected';
                                                    return (
                                                        <tr key={q.id} className="transition hover:bg-slate-50/50">
                                                            <td className="px-3 py-3 whitespace-nowrap font-medium tabular-nums">
                                                                {q.price ?? '—'}{' '}
                                                                <span className="font-normal text-slate-500">USD</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                                    {localizedStatusLabel(q.status, t)}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-slate-700">
                                                                <div className="max-w-56 space-y-1">
                                                                    {q.supplier_user?.name && (
                                                                        <p className="truncate text-xs">
                                                                            <span className="font-semibold text-slate-600">{t('suppliers')}: </span>
                                                                            {q.supplier_user.name}
                                                                        </p>
                                                                    )}
                                                                    {q.customer_user?.name && (
                                                                        <p className="truncate text-xs text-slate-600">
                                                                            <span className="font-semibold">{t('col_customer')}: </span>
                                                                            {q.customer_user.name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-xs text-slate-600">
                                                                {q.delivery_date ? (
                                                                    <p className="flex items-center gap-1">
                                                                        <HiOutlineTruck className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                                                                        {q.delivery_date}
                                                                    </p>
                                                                ) : null}
                                                                {q.shipping_company ? <p className="truncate">{q.shipping_company}</p> : null}
                                                                {q.tracking_number ? (
                                                                    <p>
                                                                        {t('order_tracking')}: {q.tracking_number}
                                                                    </p>
                                                                ) : null}
                                                                {q.shipped_at ? <p>{formatWhen(q.shipped_at, locale)}</p> : null}
                                                            </td>
                                                            {canAcceptQuotes ? (
                                                                <td className="px-3 py-3 whitespace-nowrap">
                                                                    {canAcceptThis ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setAcceptQuotationId(q.id)}
                                                                            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95"
                                                                        >
                                                                            {t('order_quotation_accept_btn')}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400">—</span>
                                                                    )}
                                                                </td>
                                                            ) : null}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : null}
                            </div>
                        </SectionCard>

                        {supplierSeesDeliveriesSection ? (
                        <SectionCard icon={HiOutlineTruck} title={t('order_section_deliveries')} delay={0.08}>
                            <div className="space-y-6">
                                <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm text-sky-950 ring-1 ring-sky-100/80">
                                    {isWarehouseShipping ? (
                                        <p>
                                            <span className="font-semibold">{t('order_ship_destination_warehouse')}</span>
                                            {warehouseNameFromOrder ? (
                                                <span className="mt-1 block text-sky-900/90">
                                                    {t('order_ship_warehouse_name_label')}: {warehouseNameFromOrder}
                                                </span>
                                            ) : null}
                                        </p>
                                    ) : (
                                        <p className="font-semibold">{t('order_ship_destination_customer')}</p>
                                    )}
                                </div>

                                {canDeliveriesUpdate && row?.code ? (
                                    <form
                                        onSubmit={(e) => void submitDeliveryRecord(e)}
                                        className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 ring-1 ring-slate-100"
                                    >
                                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                            {isWarehouseShipping
                                                ? t('order_delivery_supplier_warehouse_title')
                                                : t('order_delivery_supplier_customer_title')}
                                            {' · '}
                                            {supplierTargetDelivery?.id != null
                                                ? t('order_delivery_edit_title')
                                                : t('order_delivery_add_title')}
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_delivery_company')}
                                                </label>
                                                <select
                                                    value={deliveryCompanyId}
                                                    onChange={(e) => setDeliveryCompanyId(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                    required
                                                >
                                                    <option value="">{t('order_delivery_select_placeholder')}</option>
                                                    {shippingCompanies.map((c) => (
                                                        <option key={c.id} value={String(c.id)}>
                                                            {c.name || c.code || c.id}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {supplierTargetDelivery?.id != null ? (
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        {t('order_delivery_status_label')}
                                                    </label>
                                                    <select
                                                        value={deliveryStatus}
                                                        onChange={(e) => setDeliveryStatus(e.target.value)}
                                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                    >
                                                        <option value="pending">{t('delivery_status_pending')}</option>
                                                        <option value="in_transit">{t('delivery_status_in_transit')}</option>
                                                        <option value="delivered">{t('delivery_status_delivered')}</option>
                                                        <option value="failed">{t('delivery_status_failed')}</option>
                                                    </select>
                                                </div>
                                            ) : null}
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_delivery_tracking_label')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={deliveryTracking}
                                                    onChange={(e) => setDeliveryTracking(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_cod')}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    value={deliveryCod}
                                                    onChange={(e) => setDeliveryCod(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_delivery_notes_label')}
                                                </label>
                                                <textarea
                                                    value={deliveryNotes}
                                                    onChange={(e) => setDeliveryNotes(e.target.value)}
                                                    rows={2}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={savingDelivery}
                                                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                                            >
                                                {savingDelivery
                                                    ? '…'
                                                    : supplierTargetDelivery?.id != null
                                                      ? t('order_delivery_save_btn')
                                                      : t('order_delivery_create_btn')}
                                            </button>
                                        </div>
                                    </form>
                                ) : null}

                                {showAdminSecondLegForm ? (
                                    <form
                                        onSubmit={(e) => void submitAdminDeliveryRecord(e)}
                                        className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 ring-1 ring-amber-100/90"
                                    >
                                        <h3 className="mb-3 text-sm font-semibold text-amber-950">
                                            {t('order_delivery_admin_second_leg_title')}
                                        </h3>
                                        <p className="mb-3 text-xs text-amber-900/85">{t('order_delivery_admin_second_leg_hint')}</p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_delivery_company')}
                                                </label>
                                                <select
                                                    value={adminDeliveryCompanyId}
                                                    onChange={(e) => setAdminDeliveryCompanyId(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                    required
                                                >
                                                    <option value="">{t('order_delivery_select_placeholder')}</option>
                                                    {shippingCompanies.map((c) => (
                                                        <option key={c.id} value={String(c.id)}>
                                                            {c.name || c.code || c.id}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {deliveryLegCustomer?.id != null ? (
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        {t('order_delivery_status_label')}
                                                    </label>
                                                    <select
                                                        value={adminDeliveryStatus}
                                                        onChange={(e) => setAdminDeliveryStatus(e.target.value)}
                                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                    >
                                                        <option value="pending">{t('delivery_status_pending')}</option>
                                                        <option value="in_transit">{t('delivery_status_in_transit')}</option>
                                                        <option value="delivered">{t('delivery_status_delivered')}</option>
                                                        <option value="failed">{t('delivery_status_failed')}</option>
                                                    </select>
                                                </div>
                                            ) : null}
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_delivery_tracking_label')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={adminDeliveryTracking}
                                                    onChange={(e) => setAdminDeliveryTracking(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_cod')}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    value={adminDeliveryCod}
                                                    onChange={(e) => setAdminDeliveryCod(e.target.value)}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {t('order_delivery_notes_label')}
                                                </label>
                                                <textarea
                                                    value={adminDeliveryNotes}
                                                    onChange={(e) => setAdminDeliveryNotes(e.target.value)}
                                                    rows={2}
                                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={savingAdminDelivery}
                                                className="inline-flex items-center justify-center rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
                                            >
                                                {savingAdminDelivery
                                                    ? '…'
                                                    : deliveryLegCustomer?.id != null
                                                      ? t('order_delivery_save_btn')
                                                      : t('order_delivery_create_btn')}
                                            </button>
                                        </div>
                                    </form>
                                ) : null}

                                {deliveries.length === 0 && !canDeliveriesUpdate && !showAdminSecondLegForm ? (
                                    <div className="flex flex-col items-center py-10 text-slate-500">
                                        <HiOutlineTruck className="mb-3 h-10 w-10 text-slate-300" aria-hidden />
                                        <p className="text-sm">{t('order_no_deliveries')}</p>
                                    </div>
                                ) : null}
                                {deliveries.length > 0 ? (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            {t('order_delivery_registered_shipments')}
                                        </h4>
                                        {deliveries.map((d) => (
                                            <div
                                                key={d.id}
                                                className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/30 p-4 ring-1 ring-slate-100/80"
                                            >
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-xs ring-1 ring-slate-100">
                                                    <HiOutlineTruck className="h-5 w-5" aria-hidden />
                                                </span>
                                                <div className="min-w-0 flex-1 text-sm">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        {d.segment === 'to_warehouse'
                                                            ? t('order_delivery_segment_to_warehouse')
                                                            : t('order_delivery_segment_to_customer')}
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-900">
                                                        {d.shipping_company?.name || d.delivery_company || '—'}
                                                    </p>
                                                    {d.tracking_number ? (
                                                        <p className="mt-1 text-xs text-slate-600">{d.tracking_number}</p>
                                                    ) : null}
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {d.status ? (
                                                            <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                                                                {deliveryStatusLabel(d.status, t)}
                                                            </span>
                                                        ) : null}
                                                        {d.cod_amount != null ? (
                                                            <span className="rounded-md bg-white px-2 py-0.5 text-xs tabular-nums text-slate-600 ring-1 ring-slate-200">
                                                                {t('order_cod')}: {d.cod_amount}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    {d.delivered_at ? (
                                                        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                                            <HiOutlineCalendarDays className="h-3.5 w-3.5" aria-hidden />
                                                            {formatWhen(d.delivered_at, locale)}
                                                        </p>
                                                    ) : null}
                                                    {d.notes ? (
                                                        <p className="mt-2 border-s-2 border-slate-200 ps-2 text-xs text-slate-600">{d.notes}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </SectionCard>
                        ) : null}

                        {!isSupplier && suppliers.length > 0 ? (
                            <SectionCard icon={HiOutlineBuildingStorefront} title={t('order_section_suppliers')} delay={0.1}>
                                <ul className="divide-y divide-slate-100">
                                    {suppliers.map((s) => (
                                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                    <HiOutlineUser className="h-4 w-4" aria-hidden />
                                                </span>
                                                <div className="text-sm">
                                                    {s.customer?.name && (
                                                        <p>
                                                            <span className="text-slate-500">{t('col_customer')}: </span>
                                                            <span className="font-medium text-slate-900">{s.customer.name}</span>
                                                        </p>
                                                    )}
                                                    {s.supplier_user?.name && (
                                                        <p className="mt-1 text-slate-600">
                                                            <span className="text-slate-500">{t('suppliers')}: </span>
                                                            <span className="font-medium text-slate-800">{s.supplier_user.name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {s.seen != null ? (
                                                <span
                                                    className={
                                                        s.seen
                                                            ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100'
                                                            : 'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200'
                                                    }
                                                >
                                                    {s.seen ? t('order_supplier_seen') : t('order_supplier_unseen')}
                                                </span>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </SectionCard>
                        ) : null}
                        </div>

                    <aside className="space-y-6 lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-linear-to-b from-slate-50/90 to-white px-5 py-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                    <HiOutlineWallet className="h-5 w-5" aria-hidden />
                                </span>
                                <h2 className="text-base font-semibold text-slate-900">{t('order_section_summary')}</h2>
                            </div>
                            <div className="space-y-3 p-5">
                                <StatChip
                                    icon={HiOutlineCube}
                                    label={t('order_col_quantity')}
                                    value={row.quantity ?? t('order_none')}
                                />
                                <StatChip
                                    icon={HiOutlineBanknotes}
                                    label={t('order_quotations_count')}
                                    value={quotations.length}
                                />
                                <StatChip icon={HiOutlineTicket} label={t('order_tickets_count')} value={row.tickets_count ?? 0} />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-linear-to-b from-slate-50/90 to-white px-5 py-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                                    <HiOutlineInformationCircle className="h-5 w-5" aria-hidden />
                                </span>
                                <h2 className="text-base font-semibold text-slate-900">{t('order_section_info')}</h2>
                            </div>
                            <dl className="space-y-3 p-5">
                                <SidebarField icon={HiOutlineClipboardDocumentList} label={t('col_code')}>
                                    <span className="font-mono font-semibold text-slate-900">{row.code}</span>
                                    {row.is_late ? (
                                        <span
                                            className="ms-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                                            title={t('order_is_late')}
                                        >
                                            {t('badge_late')}
                                        </span>
                                    ) : null}
                                </SidebarField>
                                <SidebarField label={t('order_ref')}>
                                    <span className="text-slate-800">{row.ref_number || t('order_none')}</span>
                                </SidebarField>
                                <SidebarField icon={HiOutlineUser} label={t('order_ordered_by')}>
                                    <span className="font-medium text-slate-900">
                                        {row.customer_name || row.user?.name || t('order_none')}
                                    </span>
                                    {row.customer_email ? (
                                        <p className="mt-1 text-xs text-slate-500">
                                            {t('order_customer_email')}: {row.customer_email}
                                        </p>
                                    ) : row.user?.email ? (
                                        <p className="mt-1 text-xs text-slate-500">{row.user.email}</p>
                                    ) : null}
                                    {row.customer_phone ? (
                                        <p className="mt-1 text-xs text-slate-500">
                                            {t('order_customer_phone')}: {row.customer_phone}
                                        </p>
                                    ) : null}
                                </SidebarField>
                                <SidebarField icon={HiOutlineCalendarDays} label={t('order_order_date')}>
                                    {formatWhen(row.created_at, locale)}
                                </SidebarField>
                                <SidebarField icon={HiOutlineMapPin} label={t('order_shipping_address')}>
                                    {shippingAddressBody}
                                </SidebarField>
                                <SidebarField icon={HiOutlineTruck} label={t('order_shipping_type')}>
                                    {row.shipping_type || t('order_none')}
                                </SidebarField>
                                {!isSupplier ? (
                                    <>
                                        <SidebarField icon={HiOutlineWallet} label={t('order_payment_method')}>
                                            {row.payment_method || t('order_none')}
                                        </SidebarField>
                                        <SidebarField icon={HiOutlineBanknotes} label={t('order_payment_type')}>
                                            {row.payment_type || t('order_none')}
                                        </SidebarField>
                                        <SidebarField icon={HiOutlineCurrencyDollar} label={t('order_paid_amount')}>
                                            <span className="tabular-nums font-semibold">
                                                {row.paid_amount != null ? row.paid_amount : t('order_none')}
                                                <span className="ms-1 font-normal text-slate-500">(USD)</span>
                                            </span>
                                        </SidebarField>
                                        {row.payment_transaction_id ? (
                                            <SidebarField label={t('order_transaction_id')}>
                                                <span className="break-all text-xs">{row.payment_transaction_id}</span>
                                            </SidebarField>
                                        ) : null}
                                        {row.delivery_path ? (
                                            <SidebarField icon={HiOutlineTruck} label={t('order_delivery_path')}>
                                                {row.delivery_path}
                                            </SidebarField>
                                        ) : null}
                                        {row.wigpleasure_order_id ? (
                                            <SidebarField label={t('order_external_id')}>{row.wigpleasure_order_id}</SidebarField>
                                        ) : null}
                                    </>
                                ) : null}
                            </dl>
                        </motion.div>
                    </aside>
                </div>
                </div>
            ) : !err ? (
                <p className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-brand/40" aria-hidden />
                    {t('loading')}
                </p>
            ) : null}

            <Dialog
                open={itemImageLightbox != null}
                onClose={() => setItemImageLightbox(null)}
                className="relative z-110"
            >
                <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-xs" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative max-h-[min(90vh,100%)] max-w-[min(100%,56rem)] rounded-2xl bg-transparent p-0 shadow-none ring-0">
                        <DialogTitle className="sr-only">
                            {itemImageLightbox?.alt ? itemImageLightbox.alt : t('order_item')}
                        </DialogTitle>
                        <button
                            type="button"
                            onClick={() => setItemImageLightbox(null)}
                            className="absolute -inset-e-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50"
                            aria-label={t('cancel')}
                        >
                            <HiXMark className="h-6 w-6" aria-hidden />
                        </button>
                        {itemImageLightbox ? (
                            <img
                                src={itemImageLightbox.src}
                                alt={itemImageLightbox.alt}
                                className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
                            />
                        ) : null}
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={ticketOpen} onClose={savingTicket ? () => {} : () => setTicketOpen(false)} className="relative z-100">
                <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <DialogTitle className="text-lg font-bold text-slate-900">{t('order_ticket_modal_title')}</DialogTitle>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t('order_ticket_type')}
                                </label>
                                <select
                                    value={ticketType}
                                    onChange={(e) => setTicketType(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                >
                                    {TICKET_TYPES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {t(opt.labelKey)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t('order_ticket_notes')}
                                </label>
                                <textarea
                                    value={ticketNotes}
                                    onChange={(e) => setTicketNotes(e.target.value)}
                                    rows={4}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                disabled={savingTicket}
                                onClick={() => setTicketOpen(false)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={savingTicket}
                                onClick={() => void submitTicket()}
                                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-600 disabled:opacity-50"
                            >
                                {savingTicket ? '…' : t('order_ticket_submit')}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={editOpen} onClose={savingEdit ? () => {} : () => setEditOpen(false)} className="relative z-100">
                <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <DialogTitle className="text-lg font-bold text-slate-900">{t('order_edit_modal_title')}</DialogTitle>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t('col_status')}
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                >
                                    {statusSelectOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {localizedStatusLabel(s, t)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t('order_section_notes')}
                                </label>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={3}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {t('order_ref')}
                                    </label>
                                    <input
                                        type="text"
                                        value={editRef}
                                        onChange={(e) => setEditRef(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {t('order_col_quantity')}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={editQty}
                                        onChange={(e) => setEditQty(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => setEditOpen(false)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => void submitEdit()}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                                {savingEdit ? '…' : t('order_edit_save')}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog
                open={assignDetailOpen}
                onClose={assigningDetail ? () => {} : () => setAssignDetailOpen(false)}
                className="relative z-100"
            >
                <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <DialogTitle className="text-base font-semibold text-slate-900">
                                {t('col_assign_supplier')}
                            </DialogTitle>
                            <button
                                type="button"
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                onClick={() => !assigningDetail && setAssignDetailOpen(false)}
                                aria-label={t('cancel')}
                            >
                                <HiXMark className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-3 p-4">
                            <input
                                type="text"
                                value={assignDetailSearch}
                                onChange={(e) => setAssignDetailSearch(e.target.value)}
                                placeholder={t('table_search_placeholder')}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <div className="max-h-64 space-y-1 overflow-auto rounded-xl border border-slate-200 p-2">
                                {supplierOptionsDetail
                                    .filter((s) => {
                                        const q = assignDetailSearch.trim().toLowerCase();
                                        if (!q) {
                                            return true;
                                        }
                                        return String(s.name ?? '').toLowerCase().includes(q);
                                    })
                                    .map((s) => {
                                        const checked = assignDetailSelected.includes(Number(s.id));
                                        return (
                                            <label
                                                key={s.id}
                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-slate-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => {
                                                        const id = Number(s.id);
                                                        setAssignDetailSelected((prev) => {
                                                            const cur = Array.isArray(prev) ? prev : [];
                                                            if (cur.includes(id)) {
                                                                return cur.filter((v) => v !== id);
                                                            }
                                                            return [...cur, id];
                                                        });
                                                    }}
                                                />
                                                <span>{s.name}</span>
                                            </label>
                                        );
                                    })}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    onClick={() => !assigningDetail && setAssignDetailOpen(false)}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    disabled={!assignDetailSelected.length || assigningDetail || !row?.code}
                                    onClick={async () => {
                                        if (!row?.code || assigningDetail) {
                                            return;
                                        }
                                        setAssigningDetail(true);
                                        try {
                                            await api.post(`/orders/${encodeURIComponent(row.code)}/assign-supplier`, {
                                                supplier_ids: assignDetailSelected,
                                            });
                                            const { data } = await api.get(`/orders/${encodeURIComponent(row.code)}`);
                                            setRow(unwrap(data.data));
                                            toast.success(t('order_assign_suppliers_saved'));
                                            setAssignDetailOpen(false);
                                        } catch (e) {
                                            toast.error(e.response?.data?.message || e.message);
                                        } finally {
                                            setAssigningDetail(false);
                                        }
                                    }}
                                >
                                    {assigningDetail ? '…' : t('save')}
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <ConfirmDialog
                open={acceptQuotationId != null}
                onClose={() => {
                    if (!acceptingQuotation) {
                        setAcceptQuotationId(null);
                    }
                }}
                title={t('order_quotation_accept_confirm_title')}
                body={t('order_quotation_accept_confirm_body')}
                confirmLabel={t('order_quotation_accept_btn')}
                cancelLabel={t('cancel')}
                onConfirm={confirmAcceptQuotation}
                loading={acceptingQuotation}
            />

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => {
                    if (!deleting) {
                        setDeleteOpen(false);
                    }
                }}
                title={t('order_delete_confirm_title')}
                body={t('order_delete_confirm_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                onConfirm={runDelete}
                danger
                loading={deleting}
            />
        </div>
    );
}
