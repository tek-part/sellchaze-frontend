import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, apiSend } from '../api/client';

export interface BotConfiguration { required: boolean; provider: 'turnstile'; site_key: string | null; action: string; revision: number }
interface Proof { nonce: string; expires_at: string | null; state: string }
export function usableBotProof(proof: Proof | undefined, nonce: string, now: number): string | undefined {
  return proof?.nonce === nonce && /^[a-f0-9]{64}$/.test(nonce) && proof.state === 'verified' && Date.parse(proof.expires_at ?? '') > now ? nonce : undefined;
}
const newNonce = (): string => Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');

export function useBotProtection(config: BotConfiguration | undefined, locale: string) {
  const [revision, setRevision] = useState(0);
  const required = !!config?.required;
  const key = `${required}:${config?.site_key}:${config?.revision}:${revision}:${locale}`;
  const nonce = useMemo(() => ({ key, value: newNonce() }), [key]).value;
  const current = useRef(nonce); current.current = nonce;
  const mounted = useRef(true);
  const sequence = useRef(0);
  const pending = useRef<string | undefined>(undefined);
  const [proof, setProof] = useState<Proof>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const text = (ar: string, en: string): string => locale === 'ar' ? ar : en;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current += 1; }; }, []);
  useEffect(() => { setProof(undefined); setError(''); setBusy(false); sequence.current += 1; }, [nonce]);
  useEffect(() => { if (!proof) return undefined; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [proof]);
  const token = required ? usableBotProof(proof, nonce, now) : undefined;
  const invalidate = (expired = false): void => {
    sequence.current += 1; setProof(undefined); setBusy(false);
    setError(expired ? text('انتهت صلاحية الفحص. أعد الفحص للمتابعة.', 'The security check expired. Run it again to continue.') : text('تعذّر إجراء فحص الحماية. أعد المحاولة.', 'Unable to complete the security check. Try again.'));
  };
  const verify = async (providerToken: string): Promise<void> => {
    if (!required || !providerToken || pending.current === nonce) return;
    const requestSequence = ++sequence.current;
    pending.current = nonce; setBusy(true); setError(''); setProof(undefined);
    try {
      const { data } = await apiSend<{ data: Omit<Proof, 'nonce'> }>('/checkout/bot/verify', 'POST', { nonce, token: providerToken });
      if (mounted.current && current.current === nonce && sequence.current === requestSequence) {
        setNow(Date.now()); setProof({ ...data, nonce });
        if (data.state !== 'verified') setError(text('لم يكتمل التحقق من الحماية. أعد الفحص.', 'The security check was not verified. Run it again.'));
      }
    } catch (failure) {
      if (mounted.current && current.current === nonce && sequence.current === requestSequence) {
        const payload = failure instanceof ApiError ? failure.payload as { errors?: Record<string, string[]> } : undefined;
        setError(Object.values(payload?.errors ?? {}).flat().join(' ') || text('تعذّر التحقق من الحماية. أعد الفحص أو حاول لاحقًا.', 'Security verification failed. Run the check again or try later.'));
      }
    } finally { if (pending.current === nonce) pending.current = undefined; if (mounted.current && current.current === nonce) setBusy(false); }
  };
  return { required, ready: !required || !!token, proof: token, nonce, config, busy, error, verified: !!token, verify, invalidate,
    reset: (): void => { sequence.current += 1; setProof(undefined); setRevision((value) => value + 1); } };
}
