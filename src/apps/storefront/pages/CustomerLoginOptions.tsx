/**
 * G2: sign-in methods beyond e-mail on the login and register pages — a WhatsApp code (sign-in and
 * sign-up in one flow) and Google. Each appears only when the store enabled it and it is ready
 * (`/auth/methods`); otherwise nothing renders and the e-mail form stands alone.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../foundation/components';
import { useAsync } from '../api/useAsync';
import { getLoginMethods, sendAccountPhoneCode, sendLoginCode, startGoogleLogin, verifyAccountPhone, verifyLoginCode, type ApiPhoneCodeResult } from '../api/storefront';
import { useAuth } from '../state/auth-context';
import { apiErrorText, asciiDigits, newRequestToken, newVerifier, saveGoogleAttempt, sha256Hex } from './customer-login';

export function CustomerLoginOptions({ next }: { next: string }): ReactElement | null {
  const { t } = useTranslation();
  const methods = useAsync(() => getLoginMethods(), []).data?.data;
  if (!methods || (!methods.phone && !methods.google)) return null;
  return (
    <div className="sf-auth sf-auth-methods">
      {methods.google ? <GoogleSignIn next={next} /> : null}
      {methods.phone ? <PhoneSignIn next={next} /> : null}
      <p className="sf-auth__divider" role="separator" aria-label={t('auth.orDivider')}><span aria-hidden="true">{t('auth.orDivider')}</span></p>
    </div>
  );
}

function GoogleSignIn({ next }: { next: string }): ReactElement {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const start = async (): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      const verifier = newVerifier();
      saveGoogleAttempt({ verifier, next });
      const { data } = await startGoogleLogin(await sha256Hex(verifier));
      if (!/^https:\/\/accounts\.google\.com\//.test(data.url)) throw new Error('unexpected');
      window.location.assign(data.url);
    } catch (failure) {
      setError(apiErrorText(failure, t('auth.googleFailed')));
      setBusy(false);
    }
  };
  return (
    <>
      <Button type="button" variant="secondary" block loading={busy} onClick={() => void start()} icon={<GoogleMark />}>
        {busy ? t('auth.googleStarting') : t('auth.continueWithGoogle')}
      </Button>
      {error ? <p role="alert" className="sf-field__error">{error}</p> : null}
    </>
  );
}

function GoogleMark(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

type Step = 'phone' | 'code' | 'name';

function PhoneSignIn({ next }: { next: string }): ReactElement {
  const { t } = useTranslation();
  const { signInWithToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<ApiPhoneCodeResult>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const token = useRef('');
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [result]);
  useEffect(() => { if (step === 'code') codeInput.current?.focus(); }, [step]);

  const resendIn = result ? Math.max(0, Math.ceil((Date.parse(result.resend_at) - now) / 1000)) : 0;

  const send = async (event?: FormEvent): Promise<void> => {
    event?.preventDefault();
    if (busy || !phone.trim() || resendIn > 0) return;
    setBusy(true);
    setError(undefined);
    token.current = newRequestToken();
    try {
      const { data } = await sendLoginCode({ phone: asciiDigits(phone.trim()), token: token.current });
      setResult(data);
      setNow(Date.now());
      setCode('');
      setStep('code');
      if (data.state !== 'sent') setError(t('auth.codeNotConfirmed'));
    } catch (failure) {
      setError(apiErrorText(failure, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await verifyLoginCode(step === 'name' ? { token: token.current, name: name.trim() } : { token: token.current, code });
      if (response.token) {
        await signInWithToken(response.token);
        navigate(next);
        return;
      }
      setStep('name');
    } catch (failure) {
      setError(apiErrorText(failure, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  const restart = (): void => {
    setStep('phone');
    setResult(undefined);
    setCode('');
    setError(undefined);
  };

  if (!open) {
    return (
      <Button type="button" variant="secondary" block onClick={() => setOpen(true)}>
        {t('auth.phoneTitle')}
      </Button>
    );
  }

  return (
    <section className="sf-auth sf-auth-phone" aria-labelledby="sf-auth-phone-title">
      <h2 id="sf-auth-phone-title" className="sf-footer__group-title">{step === 'name' ? t('auth.newAccountTitle') : t('auth.phoneTitle')}</h2>
      {step === 'phone' ? (
        <form className="sf-auth" onSubmit={(event) => void send(event)} noValidate>
          <p className="sf-card-row__meta">{t('auth.phoneHint')}</p>
          <Input label={t('auth.phoneNumber')} type="tel" name="phone" autoComplete="tel" inputMode="tel" dir="ltr" required value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Button type="submit" block loading={busy} disabled={!phone.trim()}>{t('auth.sendCode')}</Button>
        </form>
      ) : null}
      {step === 'code' ? (
        <form className="sf-auth" onSubmit={(event) => void verify(event)} noValidate>
          <p className="sf-card-row__meta" role="status">{t('auth.codeSent', { phone: result?.phone ?? phone })}</p>
          <Input ref={codeInput} label={t('auth.codeLabel')} name="code" autoComplete="one-time-code" inputMode="numeric" dir="ltr" maxLength={6} required value={code}
            onChange={(event) => setCode(asciiDigits(event.target.value).replace(/[^0-9]/g, '').slice(0, 6))} />
          <Button type="submit" block loading={busy} disabled={code.length !== 6}>{t('auth.verifyCode')}</Button>
          <div className="sf-pdp__row">
            <Button type="button" variant="ghost" size="sm" disabled={busy || resendIn > 0} onClick={() => void send()}>
              {resendIn > 0 ? t('auth.resendIn', { seconds: resendIn }) : t('auth.resendCode')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={restart}>{t('auth.changeNumber')}</Button>
          </div>
        </form>
      ) : null}
      {step === 'name' ? (
        <form className="sf-auth" onSubmit={(event) => void verify(event)} noValidate>
          <p className="sf-card-row__meta">{t('auth.newAccountHint')}</p>
          <Input label={t('auth.fullName')} name="name" autoComplete="name" required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" block loading={busy} disabled={!name.trim()}>{t('auth.finishSignUp')}</Button>
        </form>
      ) : null}
      {error ? <p role="alert" className="sf-field__error">{error}</p> : null}
    </section>
  );
}

/**
 * Account page: confirm the customer's phone with a WhatsApp code so it can sign them in. A typed
 * phone never signs anyone in; only a confirmed one does. Shown when the store offers WhatsApp sign-in.
 */
export function AccountPhoneConfirm(): ReactElement | null {
  const { t } = useTranslation();
  const { customer, refresh } = useAuth();
  const methods = useAsync(() => getLoginMethods(), []).data?.data;
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ApiPhoneCodeResult>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const token = useRef('');

  if (!customer || !methods?.phone) return null;
  if (customer.phoneVerified || done) {
    return done ? <p className="sf-newsletter__success" role="status">{t('account.confirmPhoneDone')}</p>
      : <p className="sf-card-row__meta">{t('account.phoneConfirmed')}: <bdi dir="ltr">{customer.phone}</bdi></p>;
  }

  const send = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (busy || !phone.trim()) return;
    setBusy(true);
    setError(undefined);
    token.current = newRequestToken();
    try {
      const { data } = await sendAccountPhoneCode({ phone: asciiDigits(phone.trim()), token: token.current });
      setResult(data);
      setCode('');
      if (data.state !== 'sent') setError(t('auth.codeNotConfirmed'));
    } catch (failure) {
      setError(apiErrorText(failure, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await verifyAccountPhone({ token: token.current, code });
      setDone(true);
      await refresh();
    } catch (failure) {
      setError(apiErrorText(failure, t('auth.genericError')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sf-account__panel sf-auth-phone" aria-labelledby="sf-confirm-phone-title">
      <h2 id="sf-confirm-phone-title" className="sf-footer__group-title">{t('account.confirmPhoneTitle')}</h2>
      <p className="sf-card-row__meta">{t('account.confirmPhoneHint')}</p>
      {result ? (
        <form className="sf-account__panel" onSubmit={(event) => void verify(event)} noValidate>
          <p className="sf-card-row__meta" role="status">{t('auth.codeSent', { phone: result.phone })}</p>
          <Input label={t('auth.codeLabel')} name="code" autoComplete="one-time-code" inputMode="numeric" dir="ltr" maxLength={6} required value={code}
            onChange={(event) => setCode(asciiDigits(event.target.value).replace(/[^0-9]/g, '').slice(0, 6))} />
          <div className="sf-pdp__row">
            <Button type="submit" loading={busy} disabled={code.length !== 6}>{t('account.confirmPhone')}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setResult(undefined); setError(undefined); }}>{t('auth.changeNumber')}</Button>
          </div>
        </form>
      ) : (
        <form className="sf-account__panel" onSubmit={(event) => void send(event)} noValidate>
          <Input label={t('auth.phoneNumber')} type="tel" name="phone" autoComplete="tel" inputMode="tel" dir="ltr" required value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Button type="submit" variant="secondary" loading={busy} disabled={!phone.trim()}>{t('auth.sendCode')}</Button>
        </form>
      )}
      {error ? <p role="alert" className="sf-field__error">{error}</p> : null}
    </section>
  );
}
