import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineDocumentDuplicate,
    HiOutlineRocketLaunch,
    HiOutlineUserGroup,
} from 'react-icons/hi2';
import api from '../../api/client';
import { getPaginatedRows } from '../../utils/apiPagination';
import WavexTemplateBodyEditor from '../../components/wavex/WavexTemplateBodyEditor';
import SearchableSelect from '../../components/ui/SearchableSelect';

function plainToTipTapHtml(plain) {
    if (plain == null || String(plain).trim() === '') return '<p></p>';
    const escaped = String(plain).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<p>${escaped.replace(/\r\n|\n|\r/g, '<br>')}</p>`;
}

function messageHtmlToPlainText(html) {
    if (typeof document === 'undefined') return (html || '').replace(/<[^>]+>/g, ' ').trim();
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').replace(/\u00a0/g, ' ').trim();
}

function parseRecipients(block) {
    return block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        const phone = parts[0] || '';
        if (!phone) return null;
        return { phone, display_name: parts.length > 1 ? parts.slice(1).join(', ') : null };
    }).filter(Boolean);
}

export default function WavexCampaignNewPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();

    const [err, setErr] = useState('');
    const [name, setName] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [messageEditorKey, setMessageEditorKey] = useState(0);
    const [recipientsBlock, setRecipientsBlock] = useState('');
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templateId, setTemplateId] = useState('');
    const [contactGroups, setContactGroups] = useState([]);
    const [contactGroupId, setContactGroupId] = useState('');
    const [recipientSource, setRecipientSource] = useState('group');

    const canAccessWavex = permissions.includes('wavex-access');

    const loadTemplates = useCallback(async () => {
        try {
            const { data } = await api.get('/wavex/templates');
            setTemplates(getPaginatedRows(data));
        } catch { setTemplates([]); }
    }, []);

    const loadContactGroups = useCallback(async () => {
        try {
            const { data } = await api.get('/wavex/contact-groups', { params: { per_page: 200 } });
            setContactGroups(getPaginatedRows(data));
        } catch { setContactGroups([]); }
    }, []);

    useEffect(() => {
        if (!canAccessWavex) return;
        void loadTemplates();
        void loadContactGroups();
    }, [loadTemplates, loadContactGroups, canAccessWavex]);

    async function createCampaign(e) {
        e.preventDefault();
        const recipients = parseRecipients(recipientsBlock);
        const useGroup = recipientSource === 'group' && contactGroupId !== '';
        if (!name.trim() || !messageHtmlToPlainText(messageBody)) return;
        if (!useGroup && recipients.length === 0) return;
        setSaving(true);
        setErr('');
        try {
            const payload = {
                name: name.trim(),
                message_body: messageBody,
                template_id: templateId ? Number(templateId) : null,
            };
            if (useGroup) {
                payload.contact_group_id = Number(contactGroupId);
            } else {
                payload.recipients = recipients;
            }
            await api.post('/wavex/campaigns', payload);
            navigate('/wavex/campaigns', { replace: true });
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setSaving(false);
        }
    }

    const selectedTemplate = templateId ? templates.find((x) => String(x.id) === templateId) : null;
    const selectedGroup = contactGroupId ? contactGroups.find((g) => String(g.id) === contactGroupId) : null;
    const manualCount = parseRecipients(recipientsBlock).length;

    if (!canAccessWavex) return <Navigate to="/dashboard" replace />;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
                <Link to="/wavex/campaigns" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand">
                    <HiOutlineArrowLeft className="h-5 w-5" />
                </Link>
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineRocketLaunch className="h-7 w-7 text-brand" aria-hidden />
                        {t('wavex_campaign_new')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{t('wavex_campaigns_subtitle_delay')}</p>
                </div>
            </div>

            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            <motion.form
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={createCampaign}
                className="space-y-6"
            >
                {/* Campaign Name */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">{t('wavex_campaign_name')}</h2>
                    <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('wavex_campaign_name')}
                        required
                        autoFocus
                    />
                </div>

                {/* Template + Message */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                    <div className="mb-4 flex items-center gap-2">
                        <HiOutlineDocumentDuplicate className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-slate-800">{t('wavex_campaign_message')}</h2>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-medium text-slate-600">{t('wavex_campaign_template')}</label>
                        <SearchableSelect
                            className="mt-1 w-full"
                            value={templateId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setTemplateId(id);
                                if (id) {
                                    const tpl = templates.find((x) => String(x.id) === id);
                                    if (tpl) {
                                        const html = tpl.body_html && String(tpl.body_html).trim() !== ''
                                            ? tpl.body_html : plainToTipTapHtml(tpl.body || '');
                                        setMessageBody(html);
                                        setMessageEditorKey((k) => k + 1);
                                    }
                                }
                            }}
                        >
                            <option value="">{t('wavex_campaign_template_none')}</option>
                            {templates.map((tpl) => (
                                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                            ))}
                        </SearchableSelect>
                        {selectedTemplate?.media_type && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-brand">
                                <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />
                                {t('wavex_template_attachment')}: {selectedTemplate.media_type}
                                {selectedTemplate.media_original_name ? ` — ${selectedTemplate.media_original_name}` : ''}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-600">{t('wavex_template_body_html')}</label>
                        <div className="mt-1">
                            <WavexTemplateBodyEditor
                                key={messageEditorKey}
                                initialHtml={messageBody || '<p></p>'}
                                onChange={setMessageBody}
                                placeholder={`{{name}} — ${t('wavex_template_editor_placeholder')}`}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">{t('wavex_campaign_recipients_hint')}</p>
                    </div>
                </div>

                {/* Recipients */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                    <div className="mb-4 flex items-center gap-2">
                        <HiOutlineUserGroup className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-slate-800">{t('wavex_campaign_recipients_source')}</h2>
                    </div>

                    {/* Source toggle */}
                    <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => { setRecipientSource('group'); setRecipientsBlock(''); }}
                            className={[
                                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors',
                                recipientSource === 'group' ? 'bg-white text-brand shadow-xs' : 'text-slate-600 hover:text-slate-800',
                            ].join(' ')}
                        >
                            {t('wavex_campaign_from_group')}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRecipientSource('manual'); setContactGroupId(''); }}
                            className={[
                                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors',
                                recipientSource === 'manual' ? 'bg-white text-brand shadow-xs' : 'text-slate-600 hover:text-slate-800',
                            ].join(' ')}
                        >
                            {t('wavex_campaign_manual_recipients')}
                        </button>
                    </div>

                    {recipientSource === 'group' ? (
                        <div>
                            <SearchableSelect
                                className="w-full"
                                value={contactGroupId}
                                onChange={(e) => setContactGroupId(e.target.value)}
                                required={recipientSource === 'group'}
                            >
                                <option value="">{t('wavex_campaign_select_group')}</option>
                                {contactGroups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name} {typeof g.members_count === 'number' ? `(${g.members_count})` : ''}
                                    </option>
                                ))}
                            </SearchableSelect>
                            {selectedGroup && (
                                <p className="mt-2 text-sm text-emerald-700">
                                    {selectedGroup.members_count ?? 0} {t('wavex_cg_members_count')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <textarea
                                className="min-h-[140px] w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm focus:border-brand focus:ring-1 focus:ring-brand"
                                value={recipientsBlock}
                                onChange={(e) => setRecipientsBlock(e.target.value)}
                                placeholder={'966501234567\n966501234567, Ahmed\n96550000000, Sara'}
                                required={recipientSource === 'manual'}
                            />
                            {manualCount > 0 && (
                                <p className="mt-1.5 text-sm text-emerald-700">
                                    {manualCount} {t('wavex_cg_members_count')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
                    >
                        <HiOutlineRocketLaunch className="h-5 w-5" />
                        {saving ? t('loading') : t('wavex_campaign_create')}
                    </button>
                    <Link
                        to="/wavex/campaigns"
                        className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        {t('cancel')}
                    </Link>
                </div>
            </motion.form>
        </div>
    );
}
