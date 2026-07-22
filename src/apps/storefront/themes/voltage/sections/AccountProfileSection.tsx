/**
 * Voltage account profile — edit contact details + change password. Real integration via the shared
 * auth context + account API. Rendered inside the Voltage account shell. Voltage's own .vlt-* markup.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { useAuth } from '../../../state/auth-context';
import { changePassword, updateAccount } from '../../../api/storefront';

type Status = 'idle' | 'saving' | 'saved' | 'error';

function DetailsForm(): ReactElement {
  const { customer, refresh } = useAuth();
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [status, setStatus] = useState<Status>('idle');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('saving');
    try {
      await updateAccount({ name, email });
      await refresh();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form className="vlt-account-form" onSubmit={(e) => void submit(e)} noValidate>
      <span className="vlt-eyebrow">// Details</span>
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      {status === 'saved' ? <p className="vlt-account-form__ok" role="status">Your details have been saved.</p> : null}
      {status === 'error' ? <p className="vlt-field__error" role="alert">Could not save — please try again.</p> : null}
      <div><Button type="submit" loading={status === 'saving'}>Save changes</Button></div>
    </form>
  );
}

function PasswordForm(): ReactElement {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>();
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('saving');
    setError(undefined);
    try {
      await changePassword(form);
      setForm({ current_password: '', password: '', password_confirmation: '' });
      setStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
      setStatus('error');
    }
  };

  return (
    <form className="vlt-account-form" onSubmit={(e) => void submit(e)} noValidate>
      <span className="vlt-eyebrow">// Password</span>
      <Input label="Current password" type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} required />
      <Input label="New password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required />
      <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} required />
      {status === 'saved' ? <p className="vlt-account-form__ok" role="status">Your password has been updated.</p> : null}
      {error ? <p className="vlt-field__error" role="alert">{error}</p> : null}
      <div><Button type="submit" variant="secondary" loading={status === 'saving'}>Update password</Button></div>
    </form>
  );
}

export function AccountProfileSection(_props: SectionRenderProps): ReactElement {
  return (
    <div className="vlt-account-stack">
      <DetailsForm />
      <Divider />
      <PasswordForm />
    </div>
  );
}
