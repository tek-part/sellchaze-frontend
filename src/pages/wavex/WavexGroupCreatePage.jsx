import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineArrowLeft } from 'react-icons/hi2';
import api from '../../api/client';
import { extractApiList, groupIdFrom, groupLabel } from './wavexHelpers';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function WavexGroupCreatePage() {
    const { t, i18n } = useTranslation();
    const { permissions } = useOutletContext();
    const navigate = useNavigate();
    const can = (p) => permissions.includes(p);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [importMode, setImportMode] = useState('none');
    const [waGroups, setWaGroups] = useState([]);
    const [waGroupsLoading, setWaGroupsLoading] = useState(false);
    const [waGroupsErr, setWaGroupsErr] = useState('');
    const [whatsappGroupId, setWhatsappGroupId] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setWaGroupsLoading(true);
            setWaGroupsErr('');
            try {
                const { data } = await api.get('/wavex/groups');
                if (!cancelled) {
                    setWaGroups(extractApiList(data));
                }
            } catch {
                if (!cancelled) {
                    setWaGroups([]);
                    setWaGroupsErr(t('wavex_cg_import_wa_failed'));
                }
            } finally {
                if (!cancelled) {
                    setWaGroupsLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    const sortedWaGroups = useMemo(() => {
        const list = [...waGroups];
        list.sort((a, b) => String(groupLabel(a)).localeCompare(String(groupLabel(b)), undefined, { sensitivity: 'base' }));
        return list;
    }, [waGroups]);

    function setMode(next) {
        setImportMode(next);
        if (next !== 'group') {
            setWhatsappGroupId('');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return;
        if (importMode === 'group' && !whatsappGroupId.trim()) {
            setErr(t('wavex_cg_import_wa_pick_group'));
            return;
        }
        setBusy(true);
        setErr('');
        try {
            const body = {
                name: name.trim(),
                description: description.trim() || null,
            };
            if (importMode === 'group' && whatsappGroupId) {
                body.whatsapp_group_id = whatsappGroupId.trim();
                body.locale = i18n.language || 'en';
                body.arabic_numerals = String(i18n.language || '').toLowerCase().startsWith('ar');
            }
            if (importMode === 'all') {
                body.import_all_whatsapp_contacts = true;
                body.locale = i18n.language || 'en';
                body.arabic_numerals = String(i18n.language || '').toLowerCase().startsWith('ar');
            }
            const { data } = await api.post('/wavex/contact-groups', body);
            const wa = data?.whatsapp_import;
            const id = data?.data?.id;
            navigate(id ? `/wavex/groups/${id}` : '/wavex/groups', {
                state:
                    wa && wa.ok === false && wa.message
                        ? { importWarning: String(wa.message) }
                        : undefined,
            });
        } catch (e2) {
            const d = e2.response?.data;
            if (d?.errors && typeof d.errors === 'object') {
                const first = Object.values(d.errors)[0];
                setErr(Array.isArray(first) ? String(first[0]) : String(first));
            } else {
                setErr(d?.message || e2.message);
            }
        } finally {
            setBusy(false);
        }
    }

    if (!can('wavex-access')) return <Navigate to="/dashboard" replace />;

    const radioClass =
        'mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-brand focus:ring-brand';

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    to="/wavex/groups"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand"
                >
                    <HiOutlineArrowLeft className="h-5 w-5" />
                </Link>
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineUserGroup className="h-7 w-7 text-brand" aria-hidden />
                        {t('wavex_cg_new_group')}
                    </h1>
                </div>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-slate-700">{t('wavex_cg_name')}</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">{t('wavex_cg_description')}</label>
                        <textarea
                            className="mt-1 min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                        <p className="text-sm font-medium text-slate-700">{t('wavex_cg_import_wa_section')}</p>
                        <div className="mt-3 space-y-3">
                            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="waImportMode"
                                    className={radioClass}
                                    checked={importMode === 'none'}
                                    onChange={() => setMode('none')}
                                />
                                <span>{t('wavex_cg_import_mode_none')}</span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="waImportMode"
                                    className={radioClass}
                                    checked={importMode === 'group'}
                                    onChange={() => setMode('group')}
                                />
                                <span className="font-medium">{t('wavex_cg_import_mode_group')}</span>
                            </label>
                            {importMode === 'group' && (
                                <div className="ms-6 space-y-2 border-s-2 border-slate-200 ps-3">
                                    <p className="text-xs text-slate-500">{t('wavex_cg_import_wa_hint')}</p>
                                    {waGroupsErr && <p className="text-xs text-amber-700">{waGroupsErr}</p>}
                                    <div>
                                        <label className="text-xs font-medium text-slate-600">
                                            {t('wavex_cg_import_wa_group_label')}
                                        </label>
                                        <SearchableSelect
                                            className="mt-1 w-full"
                                            value={whatsappGroupId}
                                            onChange={(e) => setWhatsappGroupId(e.target.value)}
                                            disabled={waGroupsLoading}
                                        >
                                            <option value="">{t('wavex_cg_import_wa_group_placeholder')}</option>
                                            {sortedWaGroups.map((g) => {
                                                const gid = groupIdFrom(g);
                                                if (!gid) return null;
                                                return (
                                                    <option key={gid} value={gid}>
                                                        {groupLabel(g)}
                                                    </option>
                                                );
                                            })}
                                        </SearchableSelect>
                                        {waGroupsLoading && (
                                            <p className="mt-1 text-xs text-slate-500">{t('wavex_cg_import_wa_loading')}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="waImportMode"
                                    className={radioClass}
                                    checked={importMode === 'all'}
                                    onChange={() => setMode('all')}
                                />
                                <span className="font-medium">{t('wavex_cg_import_mode_all')}</span>
                            </label>
                            {importMode === 'all' && (
                                <p className="ms-6 border-s-2 border-slate-200 ps-3 text-xs text-slate-500">
                                    {t('wavex_cg_import_all_contacts_hint')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                        >
                            {busy ? t('loading') : t('wavex_cg_create')}
                        </button>
                        <Link
                            to="/wavex/groups"
                            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            {t('cancel')}
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
