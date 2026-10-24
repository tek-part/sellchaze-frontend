import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import {
    arrangeColumns, cleanFilters, rangeBetween, readState, toApiParams, viewChanged, viewStateOf, writeState,
} from '../../features/data-table/state';

const storage = {
    read(key, fallback) { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
    write(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
};

/**
 * State for a Shopify-style index table: URL-synced search/sort/filters/page (shareable links,
 * back button works), built-in + saved views (server-side, private per user), column order and
 * visibility, density, and row selection with shift-click ranges.
 *
 * @param {object} config
 * @param {string} config.scope        Stable key, store-qualified: e.g. `store:12:products`.
 * @param {Array}  config.filters      Filter definitions (see features/data-table/state.ts).
 * @param {Array}  config.columns      Column definitions ({ key, hideable, defaultHidden }).
 * @param {Array}  [config.views]      Built-in views: [{ id, label, state: { filters, sort, search } }]; the first is "All".
 * @param {object} [config.defaults]   { sort, perPage, perPageOptions }.
 * @param {boolean} [config.savedViews=true]
 */
export default function useIndexTable({ scope, filters: filterDefs, columns, views = [], defaults = {}, savedViews: savedEnabled = true }) {
    const [params, setParams] = useSearchParams();
    const builtIn = useMemo(() => (views.length ? views : [{ id: 'all', label: '', state: { filters: {} } }]), [views]);
    const tableDefaults = useMemo(() => ({ view: builtIn[0].id, ...defaults }), [builtIn, defaults]);
    const state = useMemo(() => readState(params, filterDefs, tableDefaults), [params, filterDefs, tableDefaults]);

    const commit = useCallback((next) => {
        setParams((current) => {
            const keep = [...current.entries()].filter(([key]) => !['view', 'q', 'sort', 'page', 'per'].includes(key) && !key.startsWith('f.'));
            return new URLSearchParams([...keep, ...writeState(next, filterDefs, tableDefaults)]);
        }, { replace: true });
    }, [setParams, filterDefs, tableDefaults]);
    const update = useCallback((patch) => commit({ ...state, page: 1, ...patch }), [commit, state]);

    // Typing updates the box at once; the URL (and the request) follows after a short pause.
    const [searchInput, setSearchInput] = useState(state.search);
    const typed = useRef(false);
    useEffect(() => { if (!typed.current) setSearchInput(state.search); }, [state.search]);
    useEffect(() => {
        if (!typed.current) return undefined;
        const timer = setTimeout(() => { typed.current = false; if (searchInput !== state.search) update({ search: searchInput }); }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, state.search, update]);
    const setSearch = (value) => { typed.current = true; setSearchInput(value); };

    // ---- Columns & density (per device) ----
    const columnsKey = `ws-table:${scope}:columns`;
    const [columnPrefs, setColumnPrefs] = useState(() => storage.read(columnsKey, null));
    useEffect(() => { setColumnPrefs(storage.read(columnsKey, null)); }, [columnsKey]);
    const saveColumns = (prefs) => { setColumnPrefs(prefs); storage.write(columnsKey, prefs); };
    const visibleColumns = useMemo(() => arrangeColumns(columns, columnPrefs), [columns, columnPrefs]);
    const densityKey = `ws-table:${scope}:density`;
    const [density, setDensityState] = useState(() => storage.read(densityKey, 'comfortable'));
    const setDensity = (value) => { setDensityState(value); storage.write(densityKey, value); };

    // ---- Saved views (server) ----
    const [saved, setSaved] = useState([]);
    const [viewsError, setViewsError] = useState('');
    useEffect(() => {
        let active = true;
        setSaved([]);
        if (!savedEnabled || !scope) return undefined;
        api.get('/table-views', { params: { scope } }).then(({ data }) => { if (active) setSaved(data.data ?? []); }).catch(() => {});
        return () => { active = false; };
    }, [scope, savedEnabled]);

    const allViews = useMemo(() => [
        ...builtIn.map((view) => ({ ...view, builtIn: true })),
        ...saved.map((view) => ({ id: `saved-${view.id}`, savedId: view.id, label: view.name, state: view.state, builtIn: false })),
    ], [builtIn, saved]);
    const activeView = allViews.find((view) => view.id === state.view) ?? allViews[0];
    const changed = activeView ? viewChanged(state, { search: activeView.state?.search ?? '', sort: activeView.state?.sort ?? tableDefaults.sort ?? null, filters: activeView.state?.filters ?? {} }, tableDefaults) : false;

    const selectView = (view) => {
        typed.current = false;
        setSearchInput(view.state?.search ?? '');
        commit({ ...state, view: view.id, page: 1, search: view.state?.search ?? '', sort: view.state?.sort ?? tableDefaults.sort ?? null, filters: cleanFilters(view.state?.filters ?? {}) });
        if (view.state?.columns?.length) saveColumns({ order: view.state.columns, hidden: columns.filter((column) => column.hideable !== false && !view.state.columns.includes(column.key)).map((column) => column.key) });
    };
    const currentViewState = () => viewStateOf(state, visibleColumns.map((column) => column.key));
    const saveViewAs = async (name) => {
        setViewsError('');
        const { data } = await api.post('/table-views', { scope, name, state: currentViewState() });
        setSaved((current) => [...current, data.data]);
        commit({ ...state, view: `saved-${data.data.id}` });
        return data.data;
    };
    const updateView = async (view, patch = {}) => {
        const { data } = await api.patch(`/table-views/${view.savedId}`, { ...(patch.name ? { name: patch.name } : {}), ...(patch.name ? {} : { state: currentViewState() }) });
        setSaved((current) => current.map((item) => (item.id === view.savedId ? data.data : item)));
        return data.data;
    };
    const deleteView = async (view) => {
        await api.delete(`/table-views/${view.savedId}`);
        setSaved((current) => current.filter((item) => item.id !== view.savedId));
        if (state.view === view.id) selectView(builtIn[0]);
    };

    // ---- Selection ----
    const [selected, setSelected] = useState(() => new Map());
    const anchor = useRef(null);
    const clearSelection = useCallback(() => { setSelected(new Map()); anchor.current = null; }, []);
    const selectionKey = JSON.stringify(writeState({ ...state, page: 1 }, filterDefs, tableDefaults));
    useEffect(() => { clearSelection(); }, [selectionKey, clearSelection]);
    const toggleRow = (row, rows, rowKey, checked, shift) => {
        // Resolve the range now: the state updater runs later, after the anchor has moved.
        const ids = rows.map(rowKey);
        const targets = shift && anchor.current !== null ? rangeBetween(ids, anchor.current, rowKey(row)) : [rowKey(row)];
        anchor.current = rowKey(row);
        setSelected((current) => {
            const next = new Map(current);
            targets.forEach((id) => { const item = rows[ids.indexOf(id)]; if (checked) next.set(id, item); else next.delete(id); });
            return next;
        });
    };
    const togglePage = (rows, rowKey, checked) => setSelected((current) => {
        const next = new Map(current);
        rows.forEach((row) => { if (checked) next.set(rowKey(row), row); else next.delete(rowKey(row)); });
        return next;
    });

    return {
        scope, state, filterDefs, defaults: tableDefaults,
        apiParams: toApiParams(state, filterDefs),
        searchInput, setSearch, searching: searchInput !== state.search,
        setFilter: (key, value) => update({ filters: cleanFilters({ ...state.filters, [key]: value }) }),
        removeFilter: (key) => { const { [key]: _removed, ...rest } = state.filters; update({ filters: rest }); },
        clearFilters: () => { typed.current = false; setSearchInput(''); update({ filters: {}, search: '' }); },
        setSort: (sort) => update({ sort }),
        setPage: (page) => commit({ ...state, page }),
        setPerPage: (perPage) => update({ perPage }),
        columns, visibleColumns, columnPrefs, saveColumns, density, setDensity,
        views: allViews, activeView, viewChanged: changed, selectView, saveViewAs, updateView, deleteView, viewsError, setViewsError, savedViewsEnabled: savedEnabled,
        selected, setSelected, clearSelection, toggleRow, togglePage,
    };
}
