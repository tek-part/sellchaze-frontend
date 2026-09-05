import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineExclamationTriangle, HiOutlinePlus, HiOutlineSquares2X2, HiOutlineSwatch } from 'react-icons/hi2';
import api from '../api/client';
import useStoreContext from '../hooks/useStoreContext';
import useStoreLocales from '../hooks/useStoreLocales';
import { notify } from '../components/ui/notify';
import { confirmDialog } from '../components/ui/confirmDialog';
import { toLocalized } from '../lib/localized';
import { commit, createHistory, redo, reorder, undo, VIEWPORT_WIDTH } from '../apps/storefront/platform/studio/editor-domain';
import CustomizerTopBar from '../components/customizer/CustomizerTopBar';
import PreviewFrame from '../components/customizer/PreviewFrame';
import RevisionsDrawer from '../components/customizer/RevisionsDrawer';
import SectionSettingsPanel from '../components/customizer/SectionSettingsPanel';
import ThemeSettingsPanel from '../components/customizer/ThemeSettingsPanel';
import { SectionList, SectionPicker } from '../components/customizer/SectionsPanel';
import {
    FALLBACK_VIEWPORT_WIDTH, defaultsFor, fromApiSections, isTranslatable, newSection, previewBaseFor, previewUrlFor,
    stableJson, toApiSections, toPreviewSections,
} from '../components/customizer/customizerUtils';

const AUTOSAVE_MS = 900;
const HYDRATE_DEBOUNCE_MS = 150;
const WIDTHS = VIEWPORT_WIDTH || FALLBACK_VIEWPORT_WIDTH;

const errorMessage = (e) => e?.response?.data?.message || e?.message || 'Error';
const isNotFound = (e) => e?.response?.status === 404;
const isEditableTarget = (el) => !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);

/** Flatten theme `settings_schema` groups into fields. */
const fieldsOf = (groups) => (groups || []).flatMap((g) => g.fields || []);

/** Theme draft → editable values (defaults + draft, translatable fields as locale maps). */
function normalizeThemeValues(groups, raw, locales, defaultLocale) {
    const fields = fieldsOf(groups);
    const out = { ...defaultsFor(fields, locales, defaultLocale), ...(raw && typeof raw === 'object' ? raw : {}) };
    fields.forEach((f) => { if (isTranslatable(f)) out[f.id] = toLocalized(out[f.id], locales, defaultLocale); });
    return out;
}

/**
 * Salla-style live customizer: sections + theme settings on the left, the storefront in an iframe
 * on the right, autosave, undo/redo and a single Publish for page + theme.
 * Contract: docs/THEME_SECTIONS_CONTRACT.md (§1 fields, §3 endpoints, §5 postMessage).
 */
export default function StoreCustomizePage() {
    const { t } = useTranslation();
    const { apiBase, uiBase, store, access } = useStoreContext();
    const { locales, defaultLocale } = useStoreLocales();
    const localesRef = useRef({ locales, defaultLocale });
    localesRef.current = { locales, defaultLocale };

    // ----- editor state -------------------------------------------------------------------------
    const [pageKey, setPageKey] = useState('home');
    const [pages, setPages] = useState([]);
    const [creatingPage, setCreatingPage] = useState(false);
    const [schema, setSchema] = useState({});
    const [schemaError, setSchemaError] = useState('');
    const [page, setPage] = useState(null);
    const [pageStatus, setPageStatus] = useState('loading');
    const [pageError, setPageError] = useState('');
    const [history, setHistory] = useState(() => createHistory([]));
    const sections = history.present;
    const [selectedId, setSelectedId] = useState(null);
    const [tab, setTab] = useState('sections');
    const [view, setView] = useState('list');
    const [viewport, setViewport] = useState('desktop');
    const [locale, setLocale] = useState(defaultLocale);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [pageDirty, setPageDirty] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageRevisions, setPageRevisions] = useState([]);
    const [revisionsOpen, setRevisionsOpen] = useState(false);

    // Theme settings (contract §3 `settings_schema` + PUT themes/settings)
    const [theme, setTheme] = useState(null); // { id, key, name }
    const [themeGroups, setThemeGroups] = useState([]);
    const [themeValues, setThemeValues] = useState(null);
    const [themeStatus, setThemeStatus] = useState('loading');
    const [themeError, setThemeError] = useState('');
    const [themeDirty, setThemeDirty] = useState(false);
    const [themeSaveStatus, setThemeSaveStatus] = useState('saved');
    const [themeRevisions, setThemeRevisions] = useState([]);

    const savedJson = useRef('');
    const themeSavedJson = useRef('');
    const pageRef = useRef(null);
    const loadSeq = useRef(0);
    const preview = useRef(null);
    const [previewReady, setPreviewReady] = useState(false);

    useEffect(() => { setLocale((cur) => (locales.includes(cur) ? cur : defaultLocale)); }, [locales, defaultLocale]);
    useEffect(() => { pageRef.current = page; }, [page]);

    // ----- loaders ------------------------------------------------------------------------------
    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/pages/schema`)
            .then(({ data }) => { if (active) { setSchema(data?.sections_schema ?? {}); setSchemaError(''); } })
            .catch((e) => { if (active) setSchemaError(isNotFound(e) ? t('customizer_schema_missing', 'The section library endpoint is not available yet.') : errorMessage(e)); });
        api.get(`${apiBase}/pages`, { params: { template: 'page,landing', per_page: 50 } })
            .then(({ data }) => { if (active) setPages((Array.isArray(data?.data) ? data.data : []).filter((p) => p.template !== 'home')); })
            .catch(() => { if (active) setPages([]); });
        return () => { active = false; };
    }, [apiBase, t]);

    const loadPageRevisions = useCallback(async (id) => {
        if (!id) return;
        try { const { data } = await api.get(`${apiBase}/pages/${id}/revisions`); setPageRevisions(Array.isArray(data?.data) ? data.data : []); }
        catch { setPageRevisions([]); }
    }, [apiBase]);

    const loadPage = useCallback(async ({ keepHistory = false } = {}) => {
        const seq = ++loadSeq.current;
        setPageStatus('loading');
        setPageError('');
        try {
            const url = pageKey === 'home' ? `${apiBase}/pages/template/home` : `${apiBase}/pages/${pageKey}`;
            const { data } = await api.get(url, pageKey === 'home' ? { params: { locale } } : undefined);
            if (seq !== loadSeq.current) return;
            const payload = data?.data ?? data;
            const sameRecord = keepHistory && pageRef.current && String(pageRef.current.id) === String(payload?.id);
            setPage(payload);
            if (!sameRecord) {
                const loaded = fromApiSections(payload?.sections);
                setHistory(createHistory(loaded));
                savedJson.current = stableJson(toApiSections(loaded));
                setSaveStatus('saved');
                setSelectedId(null);
                setView('list');
            }
            setPageDirty(!!payload?.has_unpublished_changes);
            setPageStatus('ready');
            loadPageRevisions(payload?.id);
        } catch (e) {
            if (seq !== loadSeq.current) return;
            setPageStatus('error');
            setPageError(isNotFound(e) && pageKey === 'home'
                ? t('customizer_home_missing', 'The home layout endpoint is not available yet. Once the backend ships it, reload this page.')
                : errorMessage(e));
        }
        // `locale` is read on purpose: the home page is per-locale (contract §3).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, pageKey, loadPageRevisions, t]);

    useEffect(() => { loadPage(); }, [loadPage]);
    // Locale switch: re-resolve the home page for that locale, keeping local edits when it is the same
    // record. Pending edits are flushed first so a per-locale record swap never drops them.
    const firstLocaleRun = useRef(true);
    useEffect(() => {
        if (firstLocaleRun.current) { firstLocaleRun.current = false; return; }
        if (pageKey !== 'home') return;
        flushSections().finally(() => loadPage({ keepHistory: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale]);

    const loadThemeRevisions = useCallback(async (id) => {
        if (!id) return;
        try { const { data } = await api.get(`${apiBase}/themes/${id}/revisions`); setThemeRevisions(Array.isArray(data?.data) ? data.data : []); }
        catch { setThemeRevisions([]); }
    }, [apiBase]);

    const loadTheme = useCallback(async () => {
        setThemeStatus('loading');
        setThemeError('');
        try {
            const { data: list } = await api.get(`${apiBase}/themes`);
            const activeId = list?.active_theme_id ?? null;
            if (!activeId) { setThemeStatus('error'); setThemeError(t('store_customize_no_theme', 'Activate a theme first')); return; }
            const { data } = await api.get(`${apiBase}/themes/${activeId}`);
            const groups = data?.version?.settings_schema ?? [];
            const { locales: ls, defaultLocale: dl } = localesRef.current;
            const values = normalizeThemeValues(groups, data?.install?.draft_settings ?? data?.install?.settings ?? {}, ls, dl);
            setTheme({ id: Number(activeId), key: data?.theme?.key ?? '', name: data?.theme?.name ?? '' });
            setThemeGroups(groups);
            setThemeValues(values);
            themeSavedJson.current = stableJson(values);
            setThemeSaveStatus('saved');
            setThemeDirty(!!data?.install?.has_unpublished_changes);
            setThemeStatus('ready');
            loadThemeRevisions(activeId);
        } catch (e) {
            setThemeStatus('error');
            setThemeError(errorMessage(e));
        }
    }, [apiBase, loadThemeRevisions, t]);

    useEffect(() => { loadTheme(); }, [loadTheme]);

    // ----- persistence --------------------------------------------------------------------------
    const persistSections = useCallback(async (snapshot, { quiet = true } = {}) => {
        const id = pageRef.current?.id;
        if (!id) return false;
        const json = stableJson(snapshot);
        if (json === savedJson.current) return true;
        setSaveStatus('saving');
        try {
            await api.put(`${apiBase}/pages/${id}/sections`, { sections: snapshot });
            savedJson.current = json;
            setSaveStatus('saved');
            setPageDirty(true);
            loadPageRevisions(id);
            return true;
        } catch (e) {
            setSaveStatus('error');
            if (!quiet) notify.error(t('customizer_save_failed', 'Autosave failed'), errorMessage(e));
            return false;
        }
    }, [apiBase, loadPageRevisions, t]);

    const persistTheme = useCallback(async (snapshot, source = 'autosave', { quiet = true } = {}) => {
        if (!theme?.id) return true;
        const json = stableJson(snapshot);
        if (json === themeSavedJson.current) return true;
        setThemeSaveStatus('saving');
        try {
            await api.put(`${apiBase}/themes/settings`, { theme_id: theme.id, settings: snapshot, source });
            themeSavedJson.current = json;
            setThemeSaveStatus('saved');
            setThemeDirty(true);
            loadThemeRevisions(theme.id);
            return true;
        } catch (e) {
            setThemeSaveStatus('error');
            if (!quiet) notify.error(t('customizer_save_failed', 'Autosave failed'), errorMessage(e));
            return false;
        }
    }, [apiBase, theme?.id, loadThemeRevisions, t]);

    // Autosave sections 900ms after the last change.
    const apiSnapshot = useMemo(() => toApiSections(sections), [sections]);
    const snapshotRef = useRef(apiSnapshot);
    snapshotRef.current = apiSnapshot;
    /** Persist whatever is pending for the current page right now (page switch, locale reload). */
    const flushSections = useCallback(() => persistSections(snapshotRef.current), [persistSections]);
    useEffect(() => {
        if (pageStatus !== 'ready') return undefined;
        if (stableJson(apiSnapshot) === savedJson.current) { setSaveStatus((cur) => (cur === 'pending' ? 'saved' : cur)); return undefined; }
        setSaveStatus('pending');
        const timer = window.setTimeout(() => { persistSections(apiSnapshot); }, AUTOSAVE_MS);
        return () => window.clearTimeout(timer);
    }, [apiSnapshot, pageStatus, persistSections]);

    // Autosave theme settings.
    useEffect(() => {
        if (themeStatus !== 'ready' || !themeValues) return undefined;
        if (stableJson(themeValues) === themeSavedJson.current) { setThemeSaveStatus((cur) => (cur === 'pending' ? 'saved' : cur)); return undefined; }
        setThemeSaveStatus('pending');
        const timer = window.setTimeout(() => { persistTheme(themeValues, 'autosave'); }, AUTOSAVE_MS);
        return () => window.clearTimeout(timer);
    }, [themeValues, themeStatus, persistTheme]);

    const combinedSaveStatus = [saveStatus, themeSaveStatus].includes('error') ? 'error'
        : [saveStatus, themeSaveStatus].includes('saving') ? 'saving'
            : [saveStatus, themeSaveStatus].includes('pending') ? 'pending' : 'saved';

    useEffect(() => {
        if (combinedSaveStatus === 'saved') return undefined;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [combinedSaveStatus]);

    const saveNow = async () => {
        setSaving(true);
        const okPage = await persistSections(apiSnapshot, { quiet: false });
        const okTheme = themeValues ? await persistTheme(themeValues, 'manual', { quiet: false }) : true;
        setSaving(false);
        if (okPage && okTheme) notify.success(t('customizer_draft_saved', 'Draft saved'));
    };

    const publish = async () => {
        if (!page?.id) return;
        setPublishing(true);
        try {
            const okPage = await persistSections(apiSnapshot, { quiet: false });
            if (!okPage) return;
            const { data } = await api.post(`${apiBase}/pages/${page.id}/publish`);
            setPage((cur) => ({ ...cur, ...(data?.data || {}), has_unpublished_changes: false }));
            setPageDirty(false);
            if (theme?.id && themeValues) {
                const okTheme = await persistTheme(themeValues, 'manual', { quiet: false });
                if (okTheme) {
                    await api.post(`${apiBase}/themes/publish`, { theme_id: theme.id });
                    setThemeDirty(false);
                }
            }
            notify.success(t('customizer_published', 'Published'), t('customizer_published_hint', 'Your storefront now shows these changes.'));
        } catch (e) {
            notify.error(t('customizer_publish_failed', 'Publish failed'), errorMessage(e));
        } finally {
            setPublishing(false);
        }
    };

    const createPage = async (title) => {
        setCreatingPage(true);
        try {
            const { data } = await api.post(`${apiBase}/pages`, { title, template: 'page', locale, status: 'draft' });
            const created = data?.data;
            if (created?.id) {
                setPages((prev) => [created, ...prev]);
                setPageKey(String(created.id));
                notify.success(t('store_pages_created', 'Page created'));
            }
            return true;
        } catch (e) {
            notify.error(t('store_pages_create_failed', 'Could not create the page'), errorMessage(e));
            return false;
        } finally {
            setCreatingPage(false);
        }
    };

    const restorePage = async (revision) => {
        if (!page?.id) return;
        setSaving(true);
        try {
            await api.post(`${apiBase}/pages/${page.id}/revisions/${revision.id}/restore`);
            notify.success(t('page_restored', 'Restored'));
            setRevisionsOpen(false);
            await loadPage();
        } catch (e) { notify.error(t('customizer_restore_failed', 'Could not restore'), errorMessage(e)); }
        finally { setSaving(false); }
    };

    const restoreTheme = async (revision) => {
        if (!theme?.id) return;
        setSaving(true);
        try {
            const { data } = await api.post(`${apiBase}/themes/${theme.id}/revisions/${revision.id}/restore`);
            const { locales: ls, defaultLocale: dl } = localesRef.current;
            const restored = normalizeThemeValues(themeGroups, data?.data?.settings || {}, ls, dl);
            setThemeValues(restored);
            themeSavedJson.current = stableJson(restored);
            setThemeSaveStatus('saved');
            setThemeDirty(true);
            setRevisionsOpen(false);
            notify.success(t('theme_revision_restored', 'Revision restored'));
        } catch (e) { notify.error(t('customizer_restore_failed', 'Could not restore'), errorMessage(e)); }
        finally { setSaving(false); }
    };

    // ----- section editing ----------------------------------------------------------------------
    const changeSections = useCallback((recipe) => setHistory((cur) => commit(cur, recipe(cur.present))), []);
    const selectedIndex = sections.findIndex((s) => s.id === selectedId);
    const selected = selectedIndex >= 0 ? sections[selectedIndex] : null;

    const select = useCallback((id) => {
        setSelectedId(id);
        if (id) { setTab('sections'); setView('settings'); }
    }, []);
    const backToList = useCallback(() => { setView('list'); setSelectedId(null); }, []);

    const add = (type) => {
        const created = newSection(type, schema[type], locales, defaultLocale);
        changeSections((prev) => {
            const at = selectedIndex >= 0 ? selectedIndex + 1 : prev.length;
            const next = [...prev];
            next.splice(at, 0, created);
            return next;
        });
        select(created.id);
    };
    const move = (i, dir) => changeSections((prev) => reorder(prev, i, i + dir));
    const reorderAt = (from, to) => changeSections((prev) => reorder(prev, from, to));
    const duplicate = (i) => {
        const copy = { ...structuredClone(sections[i]), id: crypto.randomUUID() };
        changeSections((prev) => { const next = [...prev]; next.splice(i + 1, 0, copy); return next; });
        setSelectedId(copy.id);
    };
    const remove = async (i) => {
        const target = sections[i];
        if (!target) return;
        const ok = await confirmDialog({
            title: t('customizer_remove_title', 'Remove this section?'),
            text: t('customizer_remove_text', '"{{label}}" will be removed from this page. You can undo this.', { label: schema[target.type]?.label || target.type }),
            confirmText: t('customizer_remove', 'Remove'),
            danger: true,
        });
        if (!ok) return;
        changeSections((prev) => prev.filter((_, j) => j !== i));
        if (target.id === selectedId) backToList();
    };
    const toggleVisible = (i) => changeSections((prev) => prev.map((s, j) => (j === i ? { ...s, is_visible: s.is_visible === false } : s)));
    const editSettings = (i, settings) => changeSections((prev) => prev.map((s, j) => (j === i ? { ...s, settings } : s)));

    const doUndo = useCallback(() => setHistory((cur) => undo(cur)), []);
    const doRedo = useCallback(() => setHistory((cur) => redo(cur)), []);

    // Keyboard: Delete removes the selection, Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo, Esc back to the list.
    useEffect(() => {
        const onKey = (e) => {
            if (isEditableTarget(e.target)) return;
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
            if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
            if (e.key === 'Escape') { if (view !== 'list') backToList(); return; }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIndex >= 0 && tab === 'sections') { e.preventDefault(); remove(selectedIndex); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doUndo, doRedo, backToList, selectedIndex, view, tab, sections]);

    // ----- live preview (contract §5) -----------------------------------------------------------
    const previewBase = previewBaseFor(store);
    const previewSrc = previewUrlFor(previewBase, locale, theme?.key || undefined);
    const storefrontHref = import.meta.env.DEV ? (previewBase ? `${previewBase}?preview=1&lang=${locale}` : '') : (store?.storefront_url || store?.public_url || '');
    const path = pageKey === 'home' ? '/' : `/pages/${page?.slug || ''}`;
    const hydratePayload = useMemo(() => ({
        sections: toPreviewSections(sections),
        locale,
        path,
        ...(themeValues ? { settings: themeValues } : {}),
    }), [sections, locale, path, themeValues]);

    const onPreviewReady = useCallback(() => setPreviewReady(true), []);
    useEffect(() => { setPreviewReady(false); }, [previewSrc]);

    useEffect(() => {
        if (!previewReady) return undefined;
        const timer = window.setTimeout(() => { preview.current?.post({ type: 'hydrate', payload: hydratePayload }); }, HYDRATE_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [previewReady, hydratePayload]);

    useEffect(() => {
        if (!previewReady) return;
        preview.current?.post({ type: 'select-section', payload: { id: selectedId ?? null } });
    }, [previewReady, selectedId]);

    const onSectionSelectedInPreview = useCallback((id) => { select(id); }, [select]);

    // ----- guards -------------------------------------------------------------------------------
    if (access && access.canStoreThemes === false) return <Navigate to={`${uiBase}/overview`} replace />;

    const dirty = pageDirty || themeDirty || combinedSaveStatus !== 'saved';
    const canPublish = pageStatus === 'ready' && !!page?.id && dirty;
    const editLocale = locales.includes(locale) ? locale : defaultLocale;

    const tabBtn = (key, Icon, label) => (
        <button
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => { setTab(key); if (key === 'theme') setSelectedId(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${tab === key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
        </button>
    );

    return (
        <div className="-mx-3 -my-3 flex h-[calc(100vh-72px)] min-h-[560px] flex-col overflow-hidden bg-slate-100 md:-mx-5 md:-my-5 lg:-my-7 lg:-me-7 lg:ms-0">
            <CustomizerTopBar
                pages={pages}
                pageKey={pageKey}
                onPageChange={(key) => { if (key !== pageKey) flushSections().finally(() => setPageKey(key)); }}
                onCreatePage={createPage}
                creatingPage={creatingPage}
                viewport={viewport}
                onViewportChange={setViewport}
                locales={locales}
                locale={locale}
                onLocaleChange={setLocale}
                canUndo={history.past.length > 0}
                canRedo={history.future.length > 0}
                onUndo={doUndo}
                onRedo={doRedo}
                dirty={dirty}
                saveStatus={combinedSaveStatus}
                onSave={saveNow}
                saving={saving}
                onPublish={publish}
                publishing={publishing}
                canPublish={canPublish}
                storefrontHref={storefrontHref}
                onOpenRevisions={() => setRevisionsOpen(true)}
            />

            <div className="flex min-h-0 flex-1">
                {/* Left panel */}
                <aside className="flex w-full shrink-0 flex-col border-e border-slate-200/80 bg-white md:w-80 xl:w-96" aria-label={t('customizer_panel', 'Customizer panel')}>
                    <div className="flex border-b border-slate-100" role="tablist">
                        {tabBtn('sections', HiOutlineSquares2X2, t('customizer_tab_sections', 'Sections'))}
                        {tabBtn('theme', HiOutlineSwatch, t('customizer_tab_theme', 'Theme settings'))}
                    </div>

                    {tab === 'sections' ? (
                        pageStatus === 'loading' ? (
                            <div className="space-y-2 p-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
                        ) : pageStatus === 'error' ? (
                            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><HiOutlineExclamationTriangle className="h-6 w-6" aria-hidden /></span>
                                <p className="text-sm font-semibold text-slate-800">{t('customizer_page_unavailable', 'This page could not be loaded')}</p>
                                <p className="text-xs leading-relaxed text-slate-500">{pageError}</p>
                                <button type="button" onClick={() => loadPage()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><HiOutlineArrowPath className="h-4 w-4" aria-hidden />{t('action_retry', 'Retry')}</button>
                            </div>
                        ) : view === 'add' ? (
                            <SectionPicker schema={schema} onPick={(type) => add(type)} onBack={() => setView(selected ? 'settings' : 'list')} />
                        ) : view === 'settings' && selected ? (
                            <SectionSettingsPanel
                                section={selected}
                                schema={schema[selected.type]}
                                onBack={backToList}
                                onChange={(settings) => editSettings(selectedIndex, settings)}
                                onDuplicate={() => duplicate(selectedIndex)}
                                onRemove={() => remove(selectedIndex)}
                                onToggleVisible={() => toggleVisible(selectedIndex)}
                                locales={locales}
                                defaultLocale={defaultLocale}
                                editLocale={editLocale}
                                viewport={viewport}
                                apiBase={apiBase}
                            />
                        ) : (
                            <>
                                {schemaError ? <p className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">{schemaError}</p> : null}
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                    <SectionList
                                        sections={sections}
                                        schema={schema}
                                        selectedId={selectedId}
                                        locale={editLocale}
                                        defaultLocale={defaultLocale}
                                        onSelect={select}
                                        onMove={move}
                                        onReorder={reorderAt}
                                        onDuplicate={duplicate}
                                        onRemove={remove}
                                        onToggleVisible={toggleVisible}
                                        onAdd={() => setView('add')}
                                    />
                                </div>
                                <div className="border-t border-slate-100 p-3">
                                    <button type="button" onClick={() => setView('add')} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand/40 bg-brand-light/30 px-3 py-2.5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand-light/60">
                                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                                        {t('customizer_add_section', 'Add section')}
                                    </button>
                                </div>
                            </>
                        )
                    ) : (
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <ThemeSettingsPanel
                                groups={themeGroups}
                                values={themeValues || {}}
                                onChange={setThemeValues}
                                status={themeStatus}
                                error={themeError}
                                onRetry={loadTheme}
                                themeName={theme?.name}
                                locales={locales}
                                defaultLocale={defaultLocale}
                                editLocale={editLocale}
                                viewport={viewport}
                                apiBase={apiBase}
                            />
                        </div>
                    )}
                </aside>

                {/* Preview */}
                <main className="hidden min-w-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#e2e8f0,#f1f5f9_70%)] p-4 md:flex lg:p-6">
                    <PreviewFrame
                        ref={preview}
                        src={previewSrc}
                        width={WIDTHS[viewport] || WIDTHS.desktop}
                        onReady={onPreviewReady}
                        onSectionSelected={onSectionSelectedInPreview}
                        openHref={storefrontHref}
                    />
                </main>
            </div>

            <RevisionsDrawer
                open={revisionsOpen}
                onClose={() => setRevisionsOpen(false)}
                pageRevisions={pageRevisions}
                themeRevisions={themeRevisions}
                onRestorePage={restorePage}
                onRestoreTheme={restoreTheme}
                busy={saving}
            />
        </div>
    );
}
