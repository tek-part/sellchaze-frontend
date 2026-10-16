import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { ProductPreferences } from '../types/product-preferences';

interface Presentation { path: string; hidden: boolean }
interface PresentationApi { hidden: boolean; register: (data: Presentation) => () => void }
const Context = createContext<PresentationApi | null>(null);

export function ProductPresentationProvider({ children }: { children: ReactNode }): ReactElement {
  const { pathname } = useLocation();
  const [record, setRecord] = useState<Presentation>();
  const register = useCallback((data: Presentation) => {
    setRecord(data);
    return () => setRecord((current) => current === data ? undefined : current);
  }, []);
  const hidden = record?.path === pathname && record.hidden;
  const value = useMemo(() => ({ hidden, register }), [hidden, register]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Header wrappers render fragments normally: existing theme selectors and layout stay intact. */
export function ProductHeaderChrome({ children }: { children: ReactNode }): ReactElement | null {
  const state = useContext(Context);
  return state?.hidden ? null : <>{children}</>;
}

export function useProductPresentation(id: string | undefined, preferences: ProductPreferences | undefined): void {
  const state = useContext(Context); const register = state?.register; const { pathname } = useLocation();
  const hidden = preferences?.is_header_hidden === true;
  useLayoutEffect(() => id && register ? register({ path: pathname, hidden }) : undefined, [id, pathname, register, hidden]);
}
