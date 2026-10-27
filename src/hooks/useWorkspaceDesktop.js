import { useSyncExternalStore } from 'react';

const query = '(min-width:1024px)';
const subscribe = (notify) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
};
const snapshot = () => window.matchMedia(query).matches;
export default function useWorkspaceDesktop() {
    return useSyncExternalStore(subscribe, snapshot, () => false);
}
