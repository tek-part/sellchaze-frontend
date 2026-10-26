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
import { ApiError, getAuthToken, setAuthToken } from '../api/client';

export interface Customer {
  id: string;
  name: string;
  /** Empty for accounts created by WhatsApp code (G2); they sign in with their phone. */
  email: string;
  phone: string | null;
  hasPassword: boolean;
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Keep a token issued by WhatsApp-code or Google sign-in and load the customer. */
  signInWithToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalize(raw: unknown): Customer | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as { id?: number | string; name?: string; email?: string | null; phone?: string | null; has_password?: boolean };
  if (value.id === undefined || (!value.email && !value.phone)) return null;
  const email = value.email ?? '';
  return { id: String(value.id), name: value.name || email || value.phone || '', email, phone: value.phone ?? null, hasPassword: value.has_password !== false };
}

export function AuthProvider(props: { children: ReactNode }): ReactElement {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Customer routes authenticate by bearer token only, so a guest's /account read is always a
    // 401: skip the request (one less PHP round trip on every first view).
    if (!getAuthToken()) {
      setCustomer(null);
      setLoading(false);
      return;
    }
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
      const res = await loginReq({ email, password });
      if (res.token) setAuthToken(res.token);
      await refresh();
    },
    [refresh],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; password_confirmation: string }) => {
      const res = await registerReq(input);
      if (res.token) setAuthToken(res.token);
      await refresh();
    },
    [refresh],
  );

  const signInWithToken = useCallback(
    async (token: string) => {
      setAuthToken(token);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await logoutReq();
    } finally {
      setAuthToken(null);
      setCustomer(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ customer, loading, login, register, logout, refresh, signInWithToken }),
    [customer, loading, login, register, logout, refresh, signInWithToken],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an <AuthProvider>.');
  return context;
}

/** Theme/editor previews may render without customer authentication providers. */
export function useOptionalAuth(): AuthContextValue | null { return useContext(AuthContext); }
