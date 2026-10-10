import { useEffect, useRef, useState } from 'react';
import { ApiError, apiSend } from '../api/client';

export interface PhoneVerificationConfiguration { required: boolean; channel: 'whatsapp'; expires_in: number; resend_in: number }
interface Result { state: string; phone: string; expires_at: string; resend_at: string; proof_expires_at: string | null }
export interface PhoneChallenge { phone: string; token: string; result?: Result }

export function verifiedPhoneProof(challenge: PhoneChallenge | undefined, phone: string, now: number): string | undefined {
  return challenge?.phone === phone.trim() && /^[a-f0-9]{64}$/.test(challenge.token) && challenge.result?.state === 'verified'
    && Date.parse(challenge.result.proof_expires_at ?? '') > now ? challenge.token : undefined;
}

const newToken = (): string => Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
const errorMessage = (error: unknown): string => {
  const payload = error instanceof ApiError ? error.payload as { errors?: Record<string, string[]>; message?: string } : undefined;
  return Object.values(payload?.errors ?? {}).flat().join(' ') || payload?.message || (error instanceof Error ? error.message : 'Unable to verify phone.');
};

export function usePhoneVerification(configuration: PhoneVerificationConfiguration | undefined, phone: string, locale: string) {
  const required = !!configuration?.required;
  const key = `${required}:${phone.trim()}`;
  const currentKey = useRef(key); currentKey.current = key;
  const mounted = useRef(true);
  const working = useRef(false);
  const [challenge, setChallenge] = useState<PhoneChallenge>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setChallenge(undefined); setCode(''); setError(''); }, [key]);
  useEffect(() => {
    if (!challenge) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);
  const active = challenge?.phone === phone.trim() ? challenge : undefined;
  const proof = required ? verifiedPhoneProof(active, phone, now) : undefined;
  const verified = !!proof;
  const resendIn = active?.result ? Math.max(0, Math.ceil((Date.parse(active.result.resend_at) - now) / 1000)) : 0;
  const send = async (): Promise<void> => {
    if (working.current || !phone.trim() || !required || resendIn > 0) return;
    const request = active && !active.result ? active : { phone: phone.trim(), token: newToken() };
    working.current = true; setBusy(true); setError(''); setChallenge(request); setCode('');
    try {
      const { data } = await apiSend<{ data: Result }>('/checkout/phone/send', 'POST', { phone: request.phone, token: request.token });
      if (mounted.current && currentKey.current === key) {
        setChallenge({ ...request, result: data }); setNow(Date.now());
        if (data.state !== 'sent') setError(locale === 'ar' ? 'تعذّر تأكيد إرسال الرمز. انتظر ثم اطلب رمزًا جديدًا.' : 'Code sending could not be confirmed. Wait, then request a new code.');
      }
    } catch (failure) { if (mounted.current && currentKey.current === key) setError(errorMessage(failure)); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  };
  const verify = async (): Promise<void> => {
    if (working.current || !active || !/^[0-9]{6}$/.test(code)) return;
    working.current = true; setBusy(true); setError('');
    try {
      const { data } = await apiSend<{ data: Result }>('/checkout/phone/verify', 'POST', { token: active.token, code });
      if (mounted.current && currentKey.current === key) { setChallenge({ ...active, result: data }); setCode(''); setNow(Date.now()); }
    } catch (failure) { if (mounted.current && currentKey.current === key) setError(errorMessage(failure)); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  };
  return { required, verified, ready: !required || verified, proof, sent: active?.result?.state === 'sent',
    code, setCode, busy, error, resendIn, send, verify };
}
