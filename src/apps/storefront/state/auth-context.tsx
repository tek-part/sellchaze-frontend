/**
 * Customer auth state — wraps the storefront auth endpoints (/auth/login, /auth/register,
 * /auth/logout, /account). Loads the current customer on mount (204/401 → guest) and exposes
 * login/register/logout/refresh. Session is cookie-based (credentials: 'include').
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { getAccount, login as loginReq, logout as logoutReq, register as registerReq } from '../api/storefront';
import { ApiError } from '../api/client';

export interface Customer {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalize(raw: unknown): Customer | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as { id?: number | string; name?: string; email?: string };
  if (value.id === undefined || !value.email) return null;
  return { id: String(value.id), name: value.name ?? value.email, email: value.email };
}

export function AuthProvider(props: { children: ReactNode }): ReactElement {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await getAccount();
      setCustomer(normalize((res as { data?: unknown }).data ?? res));
    } catch (error) {
      // 401 = guest; anything else also degrades to guest for the storefront.
      if (!(error instanceof ApiError)) throw error;
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginReq({ email, password });
      await refresh();
    },
    [refresh],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; password_confirmation: string }) => {
      await registerReq(input);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await logoutReq();
    } finally {
      setCustomer(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ customer, loading, login, register, logout, refresh }),
    [customer, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an <AuthProvider>.');
  return context;
}
