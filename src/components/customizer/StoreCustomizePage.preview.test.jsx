// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
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
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockImplementation(async (path, options) => {
        if (path === '/my-store/themes') return { data: { active_theme_id: 10 } };
        if (path === '/my-store/themes/10') return { data: { theme: { id: 10, key: 'naseem', name: 'Naseem' }, version: { settings_schema: [] }, install: { draft_settings: {}, has_unpublished_changes: true } } };
        if (path === '/my-store/pages/template/home') return { data: { data: { id: options.params.locale === 'en' ? 11 : 10, sections: [{ id: 'saved-hero', type: 'rich-text', settings: { heading: options.params.locale === 'en' ? 'English draft' : 'المسودة العربية' } }], has_unpublished_changes: true } } };
        if (path === '/my-store/pages/schema') return { data: { sections_schema: {} } };
        return { data: { data: [] } };
    });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it('opens the real production editor with a signed capability while keeping saved draft content unpublished', async () => {
    api.post.mockResolvedValue({ data: { preview_url: 'https://draft.example/?__preview=signed-owner', expires_in: 1800 } });
    await act(async () => root.render(<MemoryRouter initialEntries={['/store/customize?theme=10']}><StoreCustomizePage /></MemoryRouter>));
    expect(api.post.mock.calls).toEqual([['/my-store/themes/preview', { theme_id: 10 }]]);
    const initial = new URL(host.querySelector('iframe').src);
    expect(initial.searchParams.get('__preview')).toBe('signed-owner');
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
