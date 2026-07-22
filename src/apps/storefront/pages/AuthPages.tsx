/**
 * Auth pages — Login, Register, Forgot Password, Reset Password. Real integration against the
 * storefront auth endpoints (login/register) and the shared /auth password-reset routes. Errors
 * surface inline; success navigates to the account area or shows a calm confirmation.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Container, Section } from '../themes/luxury-fashion/components';
import { Input } from '../themes/luxury-fashion/components';
import { useAuth } from '../state/auth-context';
import { forgotPassword, resetPassword } from '../api/storefront';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { useStore } from '../state/store-context';
import { flowContext } from './flow-context';

/** Render the active theme's auth template when it provides one; otherwise the luxury fallback. */
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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function LoginPage(): ReactElement {
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
      navigate('/account');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell
      title="Sign in"
      alt={
        <>
          <p className="sf-auth__alt">
            <a href="/forgot-password">Forgot your password?</a>
          </p>
          <p className="sf-auth__alt">
            New here? <a href="/register">Create an account</a>
          </p>
        </>
      }
    >
      <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
        <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} {...(error ? { error } : {})} />
        <Input label="Password" type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" block loading={busy}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage(): ReactElement {
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
      navigate('/account');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell
      title="Create an account"
      alt={
        <p className="sf-auth__alt">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      }
    >
      <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
        <Input label="Full name" name="name" autoComplete="name" required value={form.name} onChange={set('name')} />
        <Input label="Email" type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} {...(error ? { error } : {})} />
        <Input label="Password" type="password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />
        <Input label="Confirm password" type="password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} />
        <Button type="submit" block loading={busy}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage(): ReactElement {
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
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell title="Reset your password" alt={<p className="sf-auth__alt"><a href="/login">Back to sign in</a></p>}>
      {done ? (
        <p className="sf-newsletter__success" role="status">
          If an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
          <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} {...(error ? { error } : {})} />
          <Button type="submit" block loading={busy}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage(): ReactElement {
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
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  if (themed) return themed;

  return (
    <AuthShell title="Choose a new password" alt={<p className="sf-auth__alt"><a href="/login">Back to sign in</a></p>}>
      <form className="sf-auth" onSubmit={(e) => void submit(e)} noValidate>
        <Input label="Email" type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} {...(error ? { error } : {})} />
        <Input label="New password" type="password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />
        <Input label="Confirm password" type="password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} />
        <Button type="submit" block loading={busy}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
