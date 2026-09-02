import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';

type FawryWindow = Window & {
  FawryPay?: { checkout: (request: Record<string, unknown>, configuration: Record<string, unknown>) => void };
  DISPLAY_MODE?: { SEPARATED: unknown };
};

const shell: CSSProperties = {
  minHeight: '72vh', display: 'grid', placeItems: 'center', padding: '48px 20px',
  background: 'radial-gradient(circle at 15% 0%, rgba(255,202,40,.28), transparent 38%), linear-gradient(145deg, #fffdf7, #f5f2e9)',
};
const card: CSSProperties = {
  width: 'min(100%, 620px)', padding: 'clamp(26px, 6vw, 52px)', borderRadius: 26,
  background: '#fff', border: '1px solid rgba(37,34,25,.1)', boxShadow: '0 28px 80px rgba(54,47,25,.13)',
};

export function FawryPayPage(): ReactElement {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const sessionUrl = params.get('session_url') ?? '';
  const mode = params.get('mode') === 'live' ? 'live' : 'test';
  const order = params.get('order') ?? '';
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    try {
      const endpoint = new URL(sessionUrl);
      if (!['https:', 'http:'].includes(endpoint.protocol)) throw new Error('Invalid session URL');
    } catch {
      setError('The Fawry payment session is invalid.');
      return;
    }

    fetch(sessionUrl, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to create Fawry session');
        return response.json() as Promise<Record<string, unknown>>;
      })
      .then((payload) => {
        if (cancelled) return;
        setSession(payload);
        script = document.createElement('script');
        script.src = mode === 'test'
          ? 'https://atfawry.fawrystaging.com/atfawry/plugin/assets/payments/js/fawrypay-payments.js'
          : 'https://www.atfawry.com/atfawry/plugin/assets/payments/js/fawrypay-payments.js';
        script.async = true;
        script.onload = () => setReady(true);
        script.onerror = () => setError('Unable to load Fawry secure checkout.');
        document.body.appendChild(script);
      })
      .catch(() => !cancelled && setError('Unable to prepare Fawry payment. Please try again.'));

    return () => {
      cancelled = true;
      script?.remove();
    };
  }, [mode, sessionUrl]);

  const openCheckout = () => {
    const fawryWindow = window as FawryWindow;
    if (!session || !fawryWindow.FawryPay || !fawryWindow.DISPLAY_MODE) {
      setError('Fawry checkout is not ready yet.');
      return;
    }
    fawryWindow.FawryPay.checkout(session, {
      locale: document.documentElement.lang?.startsWith('ar') ? 'ar' : 'en',
      mode: fawryWindow.DISPLAY_MODE.SEPARATED,
    });
  };

  return (
    <main style={shell}>
      <section style={card} aria-labelledby="fawry-title">
        <p style={{ margin: '0 0 10px', color: '#c58b00', fontSize: 12, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase' }}>FawryPay</p>
        <h1 id="fawry-title" style={{ margin: '0 0 12px', color: '#272319', fontSize: 'clamp(29px, 5vw, 43px)', lineHeight: 1.08 }}>Choose how you want to pay</h1>
        <p style={{ margin: '0 0 30px', color: '#756e5f', lineHeight: 1.75 }}>
          {order ? `Order ${order}. ` : ''}Continue to Fawry to pay securely by the methods enabled for this store.
        </p>
        {error ? <div role="alert" style={{ padding: 16, borderRadius: 14, color: '#8c241f', background: '#fff0ee', border: '1px solid #f2c5c0' }}>{error}</div> : null}
        {!error ? (
          <button type="button" disabled={!ready} onClick={openCheckout} style={{ width: '100%', minHeight: 54, border: 0, borderRadius: 14, cursor: ready ? 'pointer' : 'wait', background: ready ? '#f5b800' : '#ddd7c7', color: '#241f13', fontSize: 16, fontWeight: 900 }}>
            {ready ? 'Continue to Fawry' : 'Preparing secure checkout...'}
          </button>
        ) : null}
      </section>
    </main>
  );
}
