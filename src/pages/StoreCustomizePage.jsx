import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineAdjustmentsHorizontal, HiOutlineEye, HiOutlineSquares2X2 } from 'react-icons/hi2';
import api from '../api/client';
import useStoreContext from '../hooks/useStoreContext';
import useStoreLocales from '../hooks/useStoreLocales';
import { notify } from '../components/ui/notify';
import { confirmDialog } from '../components/ui/confirmDialog';
import { toLocalized } from '../lib/localized';
import { commit, createHistory, redo, reorder, undo, VIEWPORT_WIDTH } from '../apps/storefront/platform/studio/editor-domain';
import EditorTopBar from '../components/editor/EditorTopBar';
import EditorSidebar from '../components/editor/EditorSidebar';
import Inspector from '../components/editor/Inspector';
import PreviewFrame from '../components/customizer/PreviewFrame';
import RevisionsDrawer from '../components/customizer/RevisionsDrawer';
import {
    FALLBACK_VIEWPORT_WIDTH, blockLimits, blockSchemaFor, defaultsFor, fromApiSections, hasBlocks, isTranslatable, migrateLegacyBlocks,
    newBlock, newBlockId, newSection, previewBaseFor, previewUrlFor, sectionBlocks, stableJson, toApiSections, toPreviewSections,
} from '../components/customizer/customizerUtils';

const AUTOSAVE_MS = 900;
const HYDRATE_DEBOUNCE_MS = 150;
const WIDTHS = VIEWPORT_WIDTH || FALLBACK_VIEWPORT_WIDTH;
const MOBILE_QUERY = '(max-width: 1023px)';

const errorMessage = (e) => e?.response?.data?.message || e?.message || 'Error';
const isNotFound = (e) => e?.response?.status === 404;
const isEditableTarget = (el) => !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
const isMobileViewport = () => typeof window !== 'undefined' && window.matchMedia?.(MOBILE_QUERY).matches;

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
 * Full-screen store editor (Shopify theme editor / Salla "تخصيص" style), rendered inside
 * EditorLayout: top bar, Sections | Theme settings panel on the start side, live storefront preview
 * in the middle, the inspector on the end side. Autosave, undo/redo and one Publish for page + theme.
 *
 * Query params: `?theme=<id>` edits a non-active installed theme's settings; `?tab=theme` opens the
 * Theme settings tab. Contract: docs/THEME_SECTIONS_CONTRACT.md (§1 fields, §3 endpoints, §5 postMessage,
 * §7 variants / blocks / section style — blocks live in `settings.blocks` and share the section history).
 */
export default function StoreCustomizePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { apiBase, uiBase, store, access } = useStoreContext();
    const { locales, defaultLocale } = useStoreLocales();
    const localesRef = useRef({ locales, defaultLocale });
    localesRef.current = { locales, defaultLocale };
    const themeIdParam = searchParams.get('theme');

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
    const [selectedBlockId, setSelectedBlockId] = useState(null); // block inside `selectedId` (contract §7)
    const [expanded, setExpanded] = useState({}); // section id → blocks expanded in the tree
    const [tab, setTab] = useState(() => (searchParams.get('tab') === 'theme' ? 'theme' : 'sections'));
    const [addOpen, setAddOpen] = useState(false);
    const [pane, setPane] = useState('sections'); // < lg: which of sections | preview | inspector is shown
    const [viewport, setViewport] = useState('desktop');
    const [locale, setLocale] = useState(defaultLocale);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [pageDirty, setPageDirty] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageRevisions, setPageRevisions] = useState([]);
    const [revisionsOpen, setRevisionsOpen] = useState(false);

    // Theme settings (contract §3 `settings_schema` + PUT themes/settings)
    const [theme, setTheme] = useState(null); // { id, key, name, isActive }
    const [themeGroups, setThemeGroups] = useState([]);
    const [themeValues, setThemeValues] = useState(null);
    const [themeStatus, setThemeStatus] = useState('loading');
    const [themeError, setThemeError] = useState('');
    const [themeDirty, setThemeDirty] = useState(false);
    const [themeSaveStatus, setThemeSaveStatus] = useState('saved');
    const [themeRevisions, setThemeRevisions] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    const savedJson = useRef('');
    const themeSavedJson = useRef('');
    const pageRef = useRef(null);
    const schemaRef = useRef(schema);
    schemaRef.current = schema;
    const loadSeq = useRef(0);
    const preview = useRef(null);
    const [previewReady, setPreviewReady] = useState(false);

    useEffect(() => { setLocale((cur) => (locales.includes(cur) ? cur : defaultLocale)); }, [locales, defaultLocale]);
    useEffect(() => { pageRef.current = page; }, [page]);

    // Keep `?tab=` in the URL so the Theme settings view stays deep-linkable.
    useEffect(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tab === 'theme') next.set('tab', 'theme'); else next.delete('tab');
            return next;
        }, { replace: true });
    }, [tab, setSearchParams]);

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
                setSelectedBlockId(null);
                setExpanded({});
                setAddOpen(false);
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

    // `?theme=<id>` edits that installed theme; otherwise the active one.
    const loadTheme = useCallback(async () => {
        setThemeStatus('loading');
        setThemeError('');
        try {
            let activeId = null;
            try { const { data: list } = await api.get(`${apiBase}/themes`); activeId = list?.active_theme_id ?? null; }
            catch (e) { if (!themeIdParam) throw e; }
            const targetId = themeIdParam ? Number(themeIdParam) : activeId;
            if (!targetId) { setThemeStatus('error'); setThemeError(t('store_customize_no_theme', 'Activate a theme first')); return; }
            const { data } = await api.get(`${apiBase}/themes/${targetId}`);
            const groups = data?.version?.settings_schema ?? [];
            const { locales: ls, defaultLocale: dl } = localesRef.current;
            const values = normalizeThemeValues(groups, data?.install?.draft_settings ?? data?.install?.settings ?? {}, ls, dl);
            setTheme({ id: Number(targetId), key: data?.theme?.key ?? '', name: data?.theme?.name ?? '', isActive: activeId == null ? undefined : Number(activeId) === Number(targetId) });
            setThemeGroups(groups);
            setThemeValues(values);
            themeSavedJson.current = stableJson(values);
            setThemeSaveStatus('saved');
            setThemeDirty(!!data?.install?.has_unpublished_changes);
            setThemeStatus('ready');
            setSelectedGroupId((cur) => (groups.some((g) => g.id === cur) ? cur : (groups[0]?.id ?? null)));
            loadThemeRevisions(targetId);
        } catch (e) {
            setThemeStatus('error');
            setThemeError(isNotFound(e) && themeIdParam ? t('editor_theme_load_failed', 'This theme could not be loaded') : errorMessage(e));
        }
    }, [apiBase, themeIdParam, loadThemeRevisions, t]);

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

    /**
     * Select a section: highlights it in the list and opens it in the inspector (list stays put).
     * The first time a legacy section (list field, no `blocks`) is selected its rows are converted
     * into blocks as one undoable history step (contract §7).
     */
    const select = useCallback((id) => {
        setSelectedId(id);
        setSelectedBlockId(null);
        if (id) {
            setTab('sections');
            setAddOpen(false);
            if (isMobileViewport()) setPane('inspector');
            const { locales: ls, defaultLocale: dl } = localesRef.current;
            changeSections((prev) => prev.map((s) => (s.id === id ? migrateLegacyBlocks(s, schemaRef.current[s.type], ls, dl) : s)));
        }
    }, [changeSections]);
    // Selecting a section with blocks expands it in the tree (it can still be collapsed afterwards).
    useEffect(() => {
        if (!selectedId || !hasBlocks(schema[selected?.type])) return;
        setExpanded((cur) => (cur[selectedId] ? cur : { ...cur, [selectedId]: true }));
    }, [selectedId, selected?.type, schema]);
    const clearSelection = useCallback(() => { setSelectedId(null); setSelectedBlockId(null); }, []);

    /** Select a block: the parent section stays the preview selection (`select-section` posts its id). */
    const selectBlock = useCallback((sectionId, blockId) => {
        setSelectedId(sectionId);
        setSelectedBlockId(blockId);
        setTab('sections');
        setAddOpen(false);
        if (blockId) setExpanded((cur) => (cur[sectionId] ? cur : { ...cur, [sectionId]: true }));
        if (isMobileViewport()) setPane('inspector');
    }, []);
    const toggleExpanded = useCallback((id) => setExpanded((cur) => ({ ...cur, [id]: !cur[id] })), []);

    const selectGroup = useCallback((id) => {
        setSelectedGroupId(id);
        if (isMobileViewport()) setPane('inspector');
    }, []);

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
        if (target.id === selectedId) clearSelection();
    };
    const toggleVisible = (i) => changeSections((prev) => prev.map((s, j) => (j === i ? { ...s, is_visible: s.is_visible === false } : s)));
    const editSettings = (i, settings) => changeSections((prev) => prev.map((s, j) => (j === i ? { ...s, settings } : s)));

    // ----- blocks (contract §7) — every operation is one history step, so undo/redo covers them ---
    /** Rewrite section `i`'s blocks through `recipe(blocks)`; a `null` result leaves the section untouched. */
    const editBlocks = (i, recipe) => changeSections((prev) => prev.map((s, j) => {
        if (j !== i) return s;
        const next = recipe(sectionBlocks(s), s);
        return next ? { ...s, settings: { ...(s.settings || {}), blocks: next } } : s;
    }));
    const addBlock = (i, type) => {
        const section = sections[i];
        const sc = schema[section?.type];
        const bs = blockSchemaFor(sc, type);
        if (!section || !bs) return;
        const { max } = blockLimits(sc);
        const current = sectionBlocks(section);
        if (current.length >= max || (Number.isFinite(bs.limit) && current.filter((b) => b.type === type).length >= bs.limit)) return;
        const created = newBlock(bs, locales, defaultLocale);
        editBlocks(i, (blocks) => [...blocks, created]);
        selectBlock(section.id, created.id);
    };
    const moveBlock = (i, from, to) => editBlocks(i, (blocks) => (to < 0 || to >= blocks.length ? null : reorder(blocks, from, to)));
    const duplicateBlock = (i, bi) => {
        const section = sections[i];
        if (!section) return;
        const { max } = blockLimits(schema[section.type]);
        const current = sectionBlocks(section);
        if (!current[bi] || current.length >= max) return;
        const copy = { ...structuredClone(current[bi]), id: newBlockId() };
        editBlocks(i, (blocks) => { const next = [...blocks]; next.splice(bi + 1, 0, copy); return next; });
        selectBlock(section.id, copy.id);
    };
    const removeBlock = (i, bi) => {
        const target = sectionBlocks(sections[i])[bi];
        if (!target) return;
        editBlocks(i, (blocks) => blocks.filter((_, k) => k !== bi));
        if (target.id === selectedBlockId) setSelectedBlockId(null);
    };
    const toggleBlockHidden = (i, bi) => editBlocks(i, (blocks) => blocks.map((b, k) => (k === bi ? { ...b, hidden: b.hidden !== true } : b)));
    const editBlockSettings = (i, bi, settings) => editBlocks(i, (blocks) => blocks.map((b, k) => (k === bi ? { ...b, settings } : b)));

    const doUndo = useCallback(() => setHistory((cur) => undo(cur)), []);
    const doRedo = useCallback(() => setHistory((cur) => redo(cur)), []);

    // Keyboard: Delete removes the selection, Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo, Esc closes the picker / inspector.
    useEffect(() => {
        const onKey = (e) => {
            if (isEditableTarget(e.target)) return;
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
            if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
            if (e.key === 'Escape') { if (addOpen) setAddOpen(false); else if (selectedBlockId) setSelectedBlockId(null); else if (selectedId) clearSelection(); return; }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIndex >= 0 && tab === 'sections') {
                e.preventDefault();
                const bi = selectedBlockId ? sectionBlocks(sections[selectedIndex]).findIndex((b) => b.id === selectedBlockId) : -1;
                if (bi >= 0) removeBlock(selectedIndex, bi); else remove(selectedIndex);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doUndo, doRedo, clearSelection, selectedIndex, selectedId, selectedBlockId, addOpen, tab, sections]);

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

    // ----- exit ---------------------------------------------------------------------------------
    const exit = async () => {
        if (combinedSaveStatus !== 'saved') {
            const ok = await confirmDialog({
                title: t('editor_exit_title', 'Leave the editor?'),
                text: t('editor_exit_text', 'Some changes have not been saved yet. Leave anyway?'),
                confirmText: t('editor_exit_confirm', 'Leave'),
                danger: true,
            });
            if (!ok) return;
        }
        navigate(`${uiBase}/themes`);
    };

    // ----- guards -------------------------------------------------------------------------------
    if (access && access.canStoreThemes === false) return <Navigate to={`${uiBase}/overview`} replace />;

    const dirty = pageDirty || themeDirty || combinedSaveStatus !== 'saved';
    const canPublish = pageStatus === 'ready' && !!page?.id && dirty;
    const editLocale = locales.includes(locale) ? locale : defaultLocale;
    const selectedGroup = tab === 'theme' ? themeGroups.find((g) => g.id === selectedGroupId) || null : null;
    const paneClass = (key) => (pane === key ? 'flex' : 'hidden') + ' lg:flex';

    const paneBtn = (key, Icon, label) => (
        <button type="button" onClick={() => setPane(key)} aria-pressed={pane === key} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${pane === key ? 'text-brand' : 'text-slate-500'}`}>
            <Icon className="h-5 w-5" aria-hidden />
            {label}
        </button>
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <EditorTopBar
                onExit={exit}
                storeName={store?.name}
                theme={theme}
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
                {/* Start panel: sections / theme settings */}
                <aside className={`${paneClass('sections')} w-full shrink-0 flex-col border-e border-slate-200 bg-white lg:w-80`} aria-label={t('customizer_panel', 'Customizer panel')}>
                    <EditorSidebar
                        tab={tab}
                        onTabChange={(key) => { setTab(key); setAddOpen(false); }}
                        pageStatus={pageStatus}
                        pageError={pageError}
                        onRetryPage={() => loadPage()}
                        schemaError={schemaError}
                        sections={sections}
                        schema={schema}
                        selectedId={selectedId}
                        selectedBlockId={selectedBlockId}
                        expanded={expanded}
                        onToggleExpanded={toggleExpanded}
                        locale={editLocale}
                        defaultLocale={defaultLocale}
                        onSelect={select}
                        onMove={move}
                        onReorder={reorderAt}
                        onDuplicate={duplicate}
                        onRemove={remove}
                        onToggleVisible={toggleVisible}
                        onSelectBlock={selectBlock}
                        onAddBlock={addBlock}
                        onMoveBlock={(i, bi, dir) => moveBlock(i, bi, bi + dir)}
                        onReorderBlock={moveBlock}
                        onDuplicateBlock={duplicateBlock}
                        onRemoveBlock={removeBlock}
                        onToggleBlockHidden={toggleBlockHidden}
                        addOpen={addOpen}
                        onOpenAdd={() => setAddOpen(true)}
                        onCloseAdd={() => setAddOpen(false)}
                        onAdd={(type) => add(type)}
                        themeGroups={themeGroups}
                        themeStatus={themeStatus}
                        themeError={themeError}
                        onRetryTheme={loadTheme}
                        theme={theme}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={selectGroup}
                    />
                </aside>

                {/* Canvas */}
                <main className={`${paneClass('preview')} min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 p-3 lg:p-5`}>
                    <PreviewFrame
                        ref={preview}
                        src={previewSrc}
                        width={WIDTHS[viewport] || WIDTHS.desktop}
                        onReady={onPreviewReady}
                        onSectionSelected={onSectionSelectedInPreview}
                        openHref={storefrontHref}
                    />
                </main>

                {/* End panel: inspector */}
                <aside className={`${paneClass('inspector')} w-full shrink-0 flex-col border-s border-slate-200 bg-white lg:w-96`} aria-label={t('editor_tab_inspector', 'Inspector')}>
                    <Inspector
                        tab={tab}
                        section={selected}
                        sectionSchema={selected ? schema[selected.type] : null}
                        onCloseSection={clearSelection}
                        onSectionChange={(settings) => editSettings(selectedIndex, settings)}
                        onDuplicate={() => duplicate(selectedIndex)}
                        onRemove={() => remove(selectedIndex)}
                        onToggleVisible={() => toggleVisible(selectedIndex)}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={(blockId) => (blockId ? selectBlock(selectedId, blockId) : setSelectedBlockId(null))}
                        onBlockChange={(bi, settings) => editBlockSettings(selectedIndex, bi, settings)}
                        onBlockToggleHidden={(bi) => toggleBlockHidden(selectedIndex, bi)}
                        onBlockRemove={(bi) => removeBlock(selectedIndex, bi)}
                        group={selectedGroup}
                        themeValues={themeValues}
                        onThemeChange={setThemeValues}
                        locales={locales}
                        defaultLocale={defaultLocale}
                        editLocale={editLocale}
                        viewport={viewport}
                        apiBase={apiBase}
                    />
                </aside>
            </div>

            {/* < lg: switch between the three panes */}
            <nav className="flex shrink-0 border-t border-slate-200 bg-white lg:hidden" aria-label={t('customizer_panel', 'Customizer panel')}>
                {paneBtn('sections', HiOutlineSquares2X2, t('customizer_tab_sections', 'Sections'))}
                {paneBtn('inspector', HiOutlineAdjustmentsHorizontal, t('editor_tab_inspector', 'Inspector'))}
                {paneBtn('preview', HiOutlineEye, t('editor_tab_preview', 'Preview'))}
            </nav>

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
