/**
 * Voltage auth — one mode-driven console for the four auth flows (login / register / forgot / reset).
 * Real integration via the shared auth context + password-reset API; inline errors; success navigates
 * to the account area or shows a calm confirmation. Voltage's own .vlt-* markup + components.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../../../state/auth-context';
import { forgotPassword, resetPassword } from '../../../api/storefront';
import { option } from './section-settings';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
const MODES = ['login', 'register', 'forgot', 'reset'] as const;

const COPY: Record<Mode, { eyebrow: string; title: string }> = {
  login: { eyebrow: '// Access', title: 'Sign in' },
  register: { eyebrow: '// New account', title: 'Create your account' },
  forgot: { eyebrow: '// Recovery', title: 'Reset your password' },
  reset: { eyebrow: '// Recovery', title: 'Choose a new password' },
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function AuthSection(props: SectionRenderProps): ReactElement {
  const mode = option(props.settings, 'mode', MODES, 'login') as Mode;
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    email: params.get('email') ?? '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/account');
      } else if (mode === 'register') {
        await register({ name: form.name, email: form.email, password: form.password, password_confirmation: form.password_confirmation });
        navigate('/account');
      } else if (mode === 'forgot') {
        await forgotPassword(form.email);
        setDone(true);
      } else {
        await resetPassword({ token: params.get('token') ?? '', email: form.email, password: form.password, password_confirmation: form.password_confirmation });
        navigate('/login');
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = COPY[mode];

  return (
    <Section>
      <Container>
        <div className="vlt-auth">
          <span className="vlt-eyebrow">{copy.eyebrow}</span>
          <h1 className="vlt-auth__title">{copy.title}</h1>

          {mode === 'forgot' && done ? (
            <p className="vlt-auth__status" role="status">
              If an account exists for {form.email}, a reset link is on its way.
            </p>
          ) : (
            <form className="vlt-auth__form" onSubmit={(e) => void submit(e)} noValidate>
              {mode === 'register' ? (
                <Input label="Full name" name="name" autoComplete="name" required value={form.name} onChange={set('name')} />
              ) : null}

              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
                {...(error ? { error } : {})}
              />

              {mode !== 'forgot' ? (
                <Input
                  label={mode === 'reset' ? 'New password' : 'Password'}
                  type="password"
                  name="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={form.password}
                  onChange={set('password')}
                />
              ) : null}

              {mode === 'register' || mode === 'reset' ? (
                <Input
                  label="Confirm password"
                  type="password"
                  name="password_confirmation"
                  autoComplete="new-password"
                  required
                  value={form.password_confirmation}
                  onChange={set('password_confirmation')}
                />
              ) : null}

              <Button type="submit" block loading={busy}>
                {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Reset password'}
              </Button>
            </form>
          )}

          <div className="vlt-auth__alt">
            {mode === 'login' ? (
              <>
                <a href="/forgot-password">Forgot your password?</a>
                <span>New here? <a href="/register">Create an account</a></span>
              </>
            ) : mode === 'register' ? (
              <span>Already have an account? <a href="/login">Sign in</a></span>
            ) : (
              <a href="/login">Back to sign in</a>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
