import { useStore } from '../state/store-context';

function Mark({ mark, fallback }: { mark?: { name: string; logo_url?: string | null }; fallback?: string }) {
  return mark?.logo_url ? <img src={mark.logo_url} alt={mark.name} width={64} height={28} loading="lazy" decoding="async" style={{ width: 64, height: 28, objectFit: 'contain', maxWidth: '100%' }} /> : <>{mark?.name || fallback}</>;
}

/** Footer identity comes from the same configured providers as checkout. */
export function PaymentMark({ index, fallback }: { index: number; fallback: string }) {
  const { store } = useStore();
  return <Mark mark={store.paymentMarks?.[index]} fallback={fallback} />;
}

export function StorePaymentMarks({ label = 'Payment methods' }: { label?: string }) {
  const { store } = useStore();
  return store.paymentMarks?.length ? <ul aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, listStyle: 'none', padding: 0, margin: '12px 0' }}>{store.paymentMarks.map((mark, index) => <li key={index} style={{ padding: '4px 8px', borderRadius: 4, background: '#fff' }}><Mark mark={mark} /></li>)}</ul> : null;
}
