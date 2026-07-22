import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiEye, HiPencilSquare, HiTrash, HiOutlineUserCircle } from 'react-icons/hi2';

const btn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs outline-hidden transition hover:border-slate-300 hover:bg-slate-50 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30';
const btnDanger =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 shadow-xs outline-hidden transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-40';

/**
 * @param {{
 *   viewTo?: string;
 *   viewLinkState?: object;
 *   editTo?: string;
 *   onDelete?: () => void;
 *   deleteDisabled?: boolean;
 *   onImpersonate?: () => void;
 *   impersonateDisabled?: boolean;
 *   impersonateLoading?: boolean;
 *   showView?: boolean;
 *   showEdit?: boolean;
 *   showDelete?: boolean;
 *   showImpersonate?: boolean;
 * }} props
 */
export default function TableIconActions({
    viewTo,
    viewLinkState,
    editTo,
    onDelete,
    deleteDisabled,
    onImpersonate,
    impersonateDisabled,
    impersonateLoading,
    showView = true,
    showEdit = true,
    showDelete = true,
    showImpersonate = true,
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap items-center justify-start gap-1">
            {showView && viewTo ? (
                <Link
                    to={viewTo}
                    state={viewLinkState}
                    className={btn}
                    title={t('aria_view')}
                    aria-label={t('aria_view')}
                >
                    <HiEye className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
            ) : null}
            {showEdit && editTo ? (
                <Link
                    to={editTo}
                    className={btn}
                    title={t('aria_edit')}
                    aria-label={t('aria_edit')}
                >
                    <HiPencilSquare className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
            ) : null}

            {showImpersonate && onImpersonate ? (
                <button
                    type="button"
                    onClick={onImpersonate}
                    disabled={impersonateDisabled || impersonateLoading}
                    className={btn}
                    title={t('aria_impersonate')}
                    aria-label={t('aria_impersonate')}
                >
                    {impersonateLoading ? (
                        <span className="h-4 w-4 animate-pulse rounded-full bg-slate-300" aria-hidden />
                    ) : (
                        <HiOutlineUserCircle className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                </button>
            ) : null}
            {showDelete && onDelete ? (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleteDisabled}
                    className={btnDanger}
                    title={t('aria_delete')}
                    aria-label={t('aria_delete')}
                >
                    <HiTrash className="h-4 w-4 shrink-0" aria-hidden />
                </button>
            ) : null}
        </div>
    );
}
