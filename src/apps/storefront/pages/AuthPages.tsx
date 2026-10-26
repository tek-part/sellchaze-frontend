import { customerAuthLink, customerAuthReturn } from './auth-return';
import { withSessionParams } from './NavigationInterceptor';
/**
 * Auth pages — Login, Register, Forgot Password, Reset Password. Real integration against the
 * storefront auth endpoints (login/register) and the shared /auth password-reset routes. Errors
 * surface inline; success navigates to the account area or shows a calm confirmation.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container, Section } from '../foundation/components';
import { Input } from '../foundation/components';
import { useAuth } from '../state/auth-context';
import { exchangeGoogleLogin, forgotPassword, resetPassword } from '../api/storefront';
import { CustomerLoginOptions } from './CustomerLoginOptions';
import { apiErrorText, codeFromHash, takeGoogleAttempt } from './customer-login';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { useStore } from '../state/store-context';
import { flowContext } from './flow-context';

/** Render the active theme's auth template when it provides one; otherwise the foundation fallback. */
function useAuthTemplate(name: 'login' | 'register' | 'forgot-password' | 'reset-password'): ReactElement | null {
  const tpl = useTemplate(name);
  const { store } = useStore();
  if (!tpl) return null;
  return <ThemeRenderer page={tpl} context={flowContext(store)} />;
}

function AuthShell(props: { title: string; children: ReactElement; alt?: ReactElement }): ReactElement {
  return (
    <Section>
      <Container>
        <div className="sf-auth">
          <h1 className="sf-auth__title">{props.title}</h1>
          {props.children}
          {props.alt}
        </div>
      </Container>
    </Section>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function LoginPage(): ReactElement {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const themed = useAuthTemplate('login');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await login(email, password);
      navigate(withSessionParams(customerAuthReturn(window.location.search), window.location.search));
    } catch (err) {
      setError(messageOf(err, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  const googleFailed = new URLSearchParams(window.location.search).get('google') === 'failed';
  return (
    <AuthShell
      title={t('auth.signIn')}
      alt={
        <>
          <p className="sf-auth__alt">
            <a href="/forgot-password">{t('auth.forgotLink')}</a>
          </p>
          <p className="sf-auth__alt">
            {t('auth.newHere')} <a href={withSessionParams(customerAuthLink('/register', window.location.search), window.location.search)}>{t('auth.createOne')}</a>
          </p>
          <p className="sf-auth__alt">
            <a href="/track">{t('auth.trackOrderLink')}</a>
          </p>
        </>
      }
    >
      <>
      {googleFailed ? <p role="alert" className="sf-field__error">{t('auth.googleFailed')}</p> : null}
      <CustomerLoginOptions next={withSessionParams(customerAuthReturn(window.location.search), window.location.search)} />
      <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
        <Input label={t('auth.email')} type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} {...(error ? { error } : {})} />
        <Input label={t('auth.password')} type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" block loading={busy}>
          {t('auth.signIn')}
        </Button>
      </form>
      </>
    </AuthShell>
  );
}

export function RegisterPage(): ReactElement {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const themed = useAuthTemplate('register');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await register(form);
      navigate(withSessionParams(customerAuthReturn(window.location.search), window.location.search));
    } catch (err) {
      setError(messageOf(err, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      alt={
        <p className="sf-auth__alt">
          {t('auth.alreadyHaveAccount')} <a href={withSessionParams(customerAuthLink('/login', window.location.search), window.location.search)}>{t('auth.signIn')}</a>
        </p>
      }
    >
      <>
      <CustomerLoginOptions next={withSessionParams(customerAuthReturn(window.location.search), window.location.search)} />
      <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
        <Input label={t('auth.fullName')} name="name" autoComplete="name" required value={form.name} onChange={set('name')} />
        <Input label={t('auth.email')} type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} {...(error ? { error } : {})} />
        <Input label={t('auth.password')} type="password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />
        <Input label={t('auth.confirmPassword')} type="password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} />
        <Button type="submit" block loading={busy}>
          {t('auth.createAccount')}
        </Button>
      </form>
      </>
    </AuthShell>
  );
}

export function ForgotPasswordPage(): ReactElement {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const themed = useAuthTemplate('forgot-password');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(messageOf(err, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell title={t('auth.forgotTitle')} alt={<p className="sf-auth__alt"><a href="/login">{t('auth.backToSignIn')}</a></p>}>
      {done ? (
        <p className="sf-newsletter__success" role="status">
          {t('auth.resetLinkSent', { email })}
        </p>
      ) : (
        <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
          <Input label={t('auth.email')} type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} {...(error ? { error } : {})} />
          <Button type="submit" block loading={busy}>
            {t('auth.sendResetLink')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage(): ReactElement {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const emailParam = params.get('email') ?? '';
  const [form, setForm] = useState({ email: emailParam, password: '', password_confirmation: '' });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const themed = useAuthTemplate('reset-password');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await resetPassword({ token, ...form });
      navigate('/login');
    } catch (err) {
      setError(messageOf(err, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell title={t('auth.resetTitle')} alt={<p className="sf-auth__alt"><a href="/login">{t('auth.backToSignIn')}</a></p>}>
      <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
        <Input label={t('auth.email')} type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} {...(error ? { error } : {})} />
        <Input label={t('auth.newPassword')} type="password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />
        <Input label={t('auth.confirmPassword')} type="password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} />
        <Button type="submit" block loading={busy}>
          {t('auth.resetPassword')}
        </Button>
      </form>
    </AuthShell>
  );
}

/**
 * G2: where the API sends the browser back after Google (`/login/google#code=…`). Only the tab that
 * started the sign-in holds the verifier, so the code is useless anywhere else.
 */
export function GoogleReturnPage(): ReactElement {
  const { t } = useTranslation();
  const { signInWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = codeFromHash(window.location.hash);
    const attempt = takeGoogleAttempt();
    // Drop the code from the address bar and history straight away.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    if (!code || !attempt) {
      setError(t('auth.googleExpired'));
      return;
    }
    exchangeGoogleLogin({ code, verifier: attempt.verifier })
      .then(async (response) => {
        if (!response.token) throw new Error('missing token');
        await signInWithToken(response.token);
        navigate(attempt.next, { replace: true });
      })
      .catch((failure: unknown) => setError(apiErrorText(failure, t('auth.googleExpired'))));
  }, [navigate, signInWithToken, t]);

  return (
    <AuthShell title={t('auth.signIn')} alt={<p className="sf-auth__alt"><a href="/login">{t('auth.backToSignIn')}</a></p>}>
      {error ? <p role="alert" className="sf-field__error">{error}</p> : <p role="status" className="sf-auth__alt">{t('auth.googleFinishing')}</p>}
    </AuthShell>
  );
}
