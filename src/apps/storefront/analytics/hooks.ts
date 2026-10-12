import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../state/store-context';
import { recordVisit } from './events';

export function StorefrontVisit(): null {
  const { store, apiOk } = useStore(); const { pathname, search } = useLocation();
  useEffect(() => {
    if (!apiOk) return;
    const visit = (): void => { if (document.visibilityState === 'visible') recordVisit(store.id); };
    visit(); window.addEventListener('online', visit);
    document.addEventListener('visibilitychange', visit);
    return () => { window.removeEventListener('online', visit); document.removeEventListener('visibilitychange', visit); };
  }, [store.id, apiOk, pathname, search]);
  return null;
}
