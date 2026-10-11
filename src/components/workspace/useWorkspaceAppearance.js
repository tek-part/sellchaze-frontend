import { useEffect, useState } from 'react';

const KEY = 'sellchaze_workspace_appearance';
const EVENT = 'sellchaze:workspace-appearance';
const modes = ['light', 'dark', 'system'];
function storedMode() {
    try { const value = localStorage.getItem(KEY); return modes.includes(value) ? value : 'light'; } catch { return 'light'; }
}
export default function useWorkspaceAppearance() {
    const [mode, setMode] = useState(storedMode);
    const [systemDark, setSystemDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => setSystemDark(media.matches);
        const sync = (event) => setMode(modes.includes(event.detail) ? event.detail : storedMode());
        media.addEventListener('change', update);
        window.addEventListener(EVENT, sync); window.addEventListener('storage', sync);
        return () => { media.removeEventListener('change', update); window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
    }, []);
    const change = (value) => {
        if (!modes.includes(value)) return;
        setMode(value);
        try { localStorage.setItem(KEY, value); } catch { /* Current document still supports the preference. */ }
        window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
    };
    return { mode, theme: mode === 'system' ? (systemDark ? 'dark' : 'light') : mode, change };
}
