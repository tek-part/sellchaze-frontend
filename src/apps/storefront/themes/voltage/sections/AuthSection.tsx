/**
 * Voltage auth — one mode-driven console for the four auth flows (login / register / forgot / reset).
 * Real integration via the shared auth context + password-reset API; inline errors; success navigates
 * to the account area or shows a calm confirmation. Voltage's own .vlt-* markup + components.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  login: { eyebrow: 'auth.eyebrowAccess', title: 'auth.signIn' },
  register: { eyebrow: 'auth.eyebrowNewAccount', title: 'auth.registerTitleAlt' },
  forgot: { eyebrow: 'auth.eyebrowRecovery', title: 'auth.forgotTitle' },
  reset: { eyebrow: 'auth.eyebrowRecovery', title: 'auth.resetTitle' },
};

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function AuthSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
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
      setError(messageOf(err, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  const copy = COPY[mode];

  return (
    <Section>
      <Container>
        <div className="vlt-auth">
          <span className="vlt-eyebrow">{t(copy.eyebrow)}</span>
          <h1 className="vlt-auth__title">{t(copy.title)}</h1>

          {mode === 'forgot' && done ? (
            <p className="vlt-auth__status" role="status">
              {t('auth.resetLinkSent', { email: form.email })}
            </p>
          ) : (
            <form className="vlt-auth__form" onSubmit={(e) => void submit(e)} noValidate>
              {mode === 'register' ? (
                <Input label={t('auth.fullName')} name="name" autoComplete="name" required value={form.name} onChange={set('name')} />
              ) : null}

              <Input
                label={t('auth.email')}
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
                  label={mode === 'reset' ? t('auth.newPassword') : t('auth.password')}
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
                  label={t('auth.confirmPassword')}
                  type="password"
                  name="password_confirmation"
                  autoComplete="new-password"
                  required
                  value={form.password_confirmation}
                  onChange={set('password_confirmation')}
                />
              ) : null}

              <Button type="submit" block loading={busy}>
                {mode === 'login' ? t('auth.signIn') : mode === 'register' ? t('auth.createAccount') : mode === 'forgot' ? t('auth.sendResetLink') : t('auth.resetPassword')}
              </Button>
            </form>
          )}

          <div className="vlt-auth__alt">
            {mode === 'login' ? (
              <>
                <a href="/forgot-password">{t('auth.forgotLink')}</a>
                <span>{t('auth.newHere')} <a href="/register">{t('auth.createOne')}</a></span>
              </>
            ) : mode === 'register' ? (
              <span>{t('auth.alreadyHaveAccount')} <a href="/login">{t('auth.signIn')}</a></span>
            ) : (
              <a href="/login">{t('auth.backToSignIn')}</a>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
