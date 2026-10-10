import { useTranslation } from 'react-i18next';
import type { DigitalDelivery } from '../../types/digital';

export function DigitalDeliverySummary({ delivery }: { delivery?: DigitalDelivery | null }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  if (!delivery) return null;
  return <section className="sf-personalization-summary" aria-label={ar ? 'التسليم الرقمي' : 'Digital delivery'}>
    <strong>{ar ? 'التسليم الرقمي' : 'Digital delivery'}</strong>
    {delivery.status !== 'ready' ? <p>{delivery.status === 'cancelled' ? (ar ? 'الطلب ملغي.' : 'Order cancelled.') : (ar ? 'متاح بعد تأكيد الدفع.' : 'Available after payment is confirmed.')}</p> : <ul>{delivery.values.map((value, index) => <li key={index}>{delivery.type === 'link' && /^https?:\/\//i.test(value) ? <a href={value} target="_blank" rel="noreferrer">{ar ? 'فتح المنتج الرقمي' : 'Open digital product'}</a> : <code dir="ltr">{value}</code>}</li>)}</ul>}
  </section>;
}
