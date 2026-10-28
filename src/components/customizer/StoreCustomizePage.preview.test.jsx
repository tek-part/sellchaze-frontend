// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import StoreCustomizePage from '../../pages/StoreCustomizePage';
import api from '../../api/client';

const fixture = vi.hoisted(() => ({
    t: (_key, fallback) => typeof fallback === 'string' ? fallback : _key,
    locales: { locales: ['ar', 'en'], defaultLocale: 'ar' },
    context: { apiBase: '/my-store', uiBase: '/store', access: { canStoreThemes: true }, store: { id: 14, name: 'Draft store', status: 'draft', storefront_url: 'https://draft.example/' } },
}));
vi.mock('../../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: fixture.t }) }));
vi.mock('../../hooks/useStoreContext', () => ({ default: () => fixture.context }));
vi.mock('../../hooks/useStoreLocales', () => ({ default: () => fixture.locales }));
vi.mock('../editor/EditorSidebar', () => ({ default: () => null }));
vi.mock('../editor/Inspector', () => ({ default: () => null }));
vi.mock('./RevisionsDrawer', () => ({ default: () => null }));
vi.mock('../editor/EditorTopBar', () => ({ default: ({ onLocaleChange }) => <button onClick={() => onLocaleChange('en')}>English</button> }));
let host, root;
beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv('DEV', false); vi.useFakeTimers(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    fixture.context = { ...fixture.context, store: { ...fixture.context.store, id: 14 } };
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockImplementation(async (path, options) => {
        if (path === '/my-store/themes') return { data: { active_theme_id: 10 } };
        if (path === '/my-store/themes/10') return { data: { theme: { id: 10, key: 'naseem', name: 'Naseem' }, version: { settings_schema: [] }, install: { draft_settings: {}, has_unpublished_changes: true } } };
        if (path === '/my-store/pages/template/home') return { data: { data: { id: options.params.locale === 'en' ? 11 : 10, sections: [{ id: 'saved-hero', type: 'rich-text', settings: { heading: options.params.locale === 'en' ? 'English draft' : 'المسودة العربية' } }], has_unpublished_changes: true } } };
        if (path === '/my-store/pages/schema') return { data: { sections_schema: {} } };
        return { data: { data: [] } };
    });
});

function ChangeTheme() {
    const navigate = useNavigate();
    return <button data-switch-theme onClick={() => navigate('/store/customize?theme=11')}>Next theme</button>;
}
const editor = () => <MemoryRouter initialEntries={['/store/customize?theme=10']}><ChangeTheme /><StoreCustomizePage /></MemoryRouter>;
const themeData = (id, marker) => ({ data: { theme: { id, key: 'naseem', name: marker }, version: { settings_schema: [] }, install: { draft_settings: { marker } } } });

it('ignores an older theme detail response after a newer theme is ready', async () => {
    const defaultGet = api.get.getMockImplementation();
    let resolveOld;
    api.get.mockImplementation((path, options) => {
        if (path === '/my-store/themes/10') return new Promise(resolve => { resolveOld = resolve; });
        if (path === '/my-store/themes/11') return Promise.resolve(themeData(11, 'Current theme'));
        return defaultGet(path, options);
    });
    api.post.mockResolvedValue({ data: { preview_url: 'https://draft.example/?__preview=current-theme', expires_in: 1800 } });
    await act(async () => root.render(editor()));
    await act(async () => host.querySelector('[data-switch-theme]').click());
    expect(api.post.mock.calls).toEqual([['/my-store/themes/preview', { theme_id: 11 }]]);
    await act(async () => resolveOld(themeData(10, 'Stale theme')));
    expect(new URL(host.querySelector('iframe').src).searchParams.get('__preview')).toBe('current-theme');
    expect(api.post).toHaveBeenCalledTimes(1);
    const frame = host.querySelector('iframe'); const post = vi.spyOn(frame.contentWindow, 'postMessage');
    await act(async () => window.dispatchEvent(new MessageEvent('message', { origin: 'https://draft.example', source: frame.contentWindow, data: { channel: 'sellchaze-theme-preview', version: 1, type: 'ready' } })));
    await act(async () => vi.advanceTimersByTimeAsync(200));
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'hydrate', payload: expect.objectContaining({ settings: { marker: 'Current theme' } }) }), 'https://draft.example');
    post.mockRestore();
});

it('ignores old merchant settings when a new store has the same theme and my-store alias', async () => {
    const defaultGet = api.get.getMockImplementation();
    let resolveOld, resolveOldPage, resolveNewPage, detailCalls = 0;
    api.get.mockImplementation((path, options) => {
        if (path === '/my-store/themes/10') {
            detailCalls += 1;
            return detailCalls === 1 ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(themeData(10, 'New merchant'));
        }
        if (path === '/my-store/pages/template/home') return new Promise(resolve => {
            if (fixture.context.store.id === 14) resolveOldPage = resolve;
            else resolveNewPage = resolve;
        });
        return defaultGet(path, options);
    });
    api.post.mockResolvedValue({ data: { preview_url: 'https://draft.example/?__preview=new-merchant', expires_in: 1800 } });
    await act(async () => root.render(editor()));
    fixture.context = { ...fixture.context, store: { ...fixture.context.store, id: 15 } };
    await act(async () => root.render(editor()));
    expect(host.querySelector('iframe')).toBeNull();
    await act(async () => resolveNewPage({ data: { data: { id: 21, sections: [{ id: 'new-merchant-section', type: 'rich-text', settings: { heading: 'New merchant home' } }] } } }));
    await act(async () => resolveOldPage({ data: { data: { id: 10, sections: [{ id: 'old-merchant-section', type: 'rich-text', settings: { heading: 'Old merchant home' } }] } } }));
    await act(async () => resolveOld(themeData(10, 'Old merchant')));
    expect(detailCalls).toBe(2);
    const frame = host.querySelector('iframe'); const post = vi.spyOn(frame.contentWindow, 'postMessage');
    await act(async () => window.dispatchEvent(new MessageEvent('message', { origin: 'https://draft.example', source: frame.contentWindow, data: { channel: 'sellchaze-theme-preview', version: 1, type: 'ready' } })));
    await act(async () => vi.advanceTimersByTimeAsync(200));
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'hydrate', payload: expect.objectContaining({ settings: { marker: 'New merchant' }, sections: [expect.objectContaining({ settings: { heading: 'New merchant home' } })] }) }), 'https://draft.example');
    expect(JSON.stringify(post.mock.calls)).not.toContain('Old merchant');
    post.mockRestore();
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it('opens the real production editor with a signed capability while keeping saved draft content unpublished', async () => {
    api.post.mockResolvedValue({ data: { preview_url: 'https://draft.example/?__preview=signed-owner', expires_in: 1800 } });
    await act(async () => root.render(<MemoryRouter initialEntries={['/store/customize?theme=10']}><StoreCustomizePage /></MemoryRouter>));
    expect(api.post.mock.calls).toEqual([['/my-store/themes/preview', { theme_id: 10 }]]);
    const initial = new URL(host.querySelector('iframe').src);
    expect(initial.searchParams.get('__preview')).toBe('signed-owner');
    expect(initial.searchParams.has('preview')).toBe(false);
    expect(initial.searchParams.get('customize')).toBe('1');
    expect(initial.searchParams.get('lang')).toBe('ar');
    await act(async () => host.querySelector('button').click());
    expect(new URL(host.querySelector('iframe').src).searchParams.get('lang')).toBe('en');
    expect(api.get).toHaveBeenCalledWith('/my-store/pages/template/home', { params: { locale: 'en' } });
    const frame = host.querySelector('iframe');
    const post = vi.spyOn(frame.contentWindow, 'postMessage');
    await act(async () => window.dispatchEvent(new MessageEvent('message', { origin: 'https://draft.example', source: frame.contentWindow, data: { channel: 'sellchaze-theme-preview', version: 1, type: 'ready' } })));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'hydrate', payload: expect.objectContaining({ locale: 'en', sections: [expect.objectContaining({ settings: { heading: 'English draft' } })] }) }), 'https://draft.example');
    expect(JSON.stringify(post.mock.calls)).not.toContain('signed-owner');
    post.mockRestore();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.put).not.toHaveBeenCalled();
});
