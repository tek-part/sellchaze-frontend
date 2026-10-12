export interface QuantityOffer {
  id: string;
  quantity: number;
  unitPrice: number;
  version: number;
  freeShipping: boolean;
  title: string;
  subtitle: string;
}

export function validQuantityOffer(value: unknown): value is QuantityOffer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const offer = value as Partial<QuantityOffer>;
  return typeof offer.id === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(offer.id)
    && Number.isInteger(offer.quantity) && (offer.quantity ?? 0) >= 1 && (offer.quantity ?? 0) <= 999
    && Number.isInteger(offer.version) && (offer.version ?? 0) >= 1 && (offer.version ?? 0) <= 2147483647
    && typeof offer.unitPrice === 'number' && Number.isFinite(offer.unitPrice) && offer.unitPrice >= 0
    && typeof offer.freeShipping === 'boolean' && typeof offer.title === 'string' && typeof offer.subtitle === 'string';
}
