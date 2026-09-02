import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';

type WidgetWindow = Window & { wpwlOptions?: Record<string, unknown> };

const shell: CSSProperties = {
  minHeight: '72vh', display: 'grid', placeItems: 'center', padding: '48px 20px',
  background: 'radial-gradient(circle at top right, rgba(202,163,79,.18), transparent 36%), linear-gradient(135deg, #f8f5ed, #fff)',
};
const card: CSSProperties = {
  width: 'min(100%, 640px)', background: '#fff', border: '1px solid rgba(30,27,22,.1)',
  borderRadius: 24, padding: 'clamp(24px, 6vw, 48px)', boxShadow: '0 24px 70px rgba(41,35,24,.12)',
};

export function HyperPayPage(): ReactElement {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const checkoutId = params.get('checkout_id') ?? '';
  const returnUrl = params.get('return_url') ?? '';
  const mode = params.get('mode') === 'live' ? 'live' : 'test';
  const brands = (params.get('brands') ?? 'VISA MASTER MADA').replace(/[^A-Z0-9_ ]/gi, '').trim();
  const order = params.get('order') ?? '';
  const [error, setError] = useState('');

  useEffect(() => {
    if (!checkoutId || !returnUrl) {
      setError('Payment session information is incomplete.');
      return;
    }

    try {
      const target = new URL(returnUrl);
      if (!['https:', 'http:'].includes(target.protocol)) throw new Error('Invalid return URL');
    } catch {
      setError('The payment return address is invalid.');
      return;
    }

    const widgetWindow = window as WidgetWindow;
    widgetWindow.wpwlOptions = {
      locale: document.documentElement.lang?.startsWith('ar') ? 'ar' : 'en',
      style: 'plain',
      showCVVHint: true,
      brandDetection: true,
    };
    const script = document.createElement('script');
    script.src = `${mode === 'test' ? 'https://eu-test.oppwa.com' : 'https://eu-prod.oppwa.com'}/v1/paymentWidgets.js?checkoutId=${encodeURIComponent(checkoutId)}`;
    script.async = true;
    script.onerror = () => setError('Unable to load the secure payment form. Please try again.');
    document.body.appendChild(script);

    return () => {
      script.remove();
      delete widgetWindow.wpwlOptions;
    };
  }, [checkoutId, mode, returnUrl]);

  return (
    <main style={shell}>
      <section style={card} aria-labelledby="hyperpay-title">
        <p style={{ margin: '0 0 10px', color: '#9b7729', fontSize: 12, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' }}>
          Secure checkout
        </p>
        <h1 id="hyperpay-title" style={{ margin: '0 0 10px', color: '#1e1b16', fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.1 }}>
          Complete your payment
        </h1>
        <p style={{ margin: '0 0 28px', color: '#746d62', lineHeight: 1.7 }}>
          {order ? `Order ${order}. ` : ''}Your card details are processed securely by HyperPay and are never stored by this store.
        </p>
        {error ? (
          <div role="alert" style={{ borderRadius: 14, padding: 16, color: '#8c241f', background: '#fff0ee', border: '1px solid #f2c5c0' }}>{error}</div>
        ) : (
          <form action={returnUrl} className="paymentWidgets" data-brands={brands || 'VISA MASTER MADA'} />
        )}
      </section>
    </main>
  );
}
