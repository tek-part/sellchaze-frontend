import { useState } from 'react';

const extensions: Record<string, string> = { cod: 'png', paymob: 'png', kashier: 'png', stripe: 'png', paypal: 'png', paytabs: 'png', moyasar: 'png', paylink: 'png', tap: 'png', tabby: 'png', taager: 'png', myfatoorah: 'png', fawaterak: 'webp', xpay: 'png', ziina: 'svg', tamara: 'png', easykash: 'png', upayments: 'svg', transfer_receipt: 'png', fabmisr: 'png', bank_transfer: 'svg', fawry: 'png', hyperpay: 'svg' };
const aliases: Record<string, string> = { fawaterk: 'fawaterak', my_fatoorah: 'myfatoorah', upay: 'upayments', 'bank-transfer': 'bank_transfer' };

// Tenant/custom domains load these modules from the dashboard's asset origin.
// Resolve default marks against that origin, as /payments on a tenant is an SPA route.
function staticAsset(path: string): string {
  const origin = new URL(import.meta.url).origin;
  return path.startsWith('/payments/') && origin !== 'null' ? `${origin}${path}` : path;
}

export function paymentLogoUrl(slug: string): string | undefined {
  const key = aliases[slug] ?? slug;
  return extensions[key] ? staticAsset(`/payments/${key}.${extensions[key]}`) : undefined;
}

/** Identity is also rendered as text by the caller; a missing mark stays decorative. */
export default function PaymentMethodLogo({ slug, src, className = '', width = 64, height = 32 }: { slug: string; src?: string | null; className?: string; width?: number; height?: number }) {
  const source = src ? staticAsset(src) : paymentLogoUrl(slug);
  const [failed, setFailed] = useState<string | undefined>();
  const style = { width, height, maxWidth: '100%', objectFit: 'contain' as const, flexShrink: 0 };
  return source && failed !== source
    ? <img src={source} width={width} height={height} style={style} className={className} alt="" loading="lazy" decoding="async" onError={() => setFailed(source)} />
    : slug === 'deema' ? <span style={{ ...style, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }} className={className} aria-hidden="true">Deema</span>
    : <svg viewBox="0 0 48 32" width={width} height={height} style={style} className={className} aria-hidden="true"><rect x="2" y="2" width="44" height="28" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 11h42M9 23h10" stroke="currentColor" strokeWidth="3" /></svg>;
}
