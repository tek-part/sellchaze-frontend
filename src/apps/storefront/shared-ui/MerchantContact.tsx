import type { ReactElement } from 'react';
import { useOptionalStore } from '../state/store-context';
import { Container } from '../foundation/components/Container';

/** Merchant-authored business contacts, displayed consistently in every theme footer. */
export function MerchantContact(): ReactElement | null {
  const information = useOptionalStore()?.store.merchantInformation;
  if (!information) return null;
  const phone = information.phone.replace(/[^+0-9]/g, '');
  return <Container><address className="sf-merchant-contact"><a href={`mailto:${information.email}`}>{information.email}</a><a href={`tel:${phone}`} dir="ltr">{information.phone}</a><span>{information.address}</span></address></Container>;
}
