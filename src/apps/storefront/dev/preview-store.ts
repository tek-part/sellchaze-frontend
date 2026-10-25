import type { StoreInfo } from '../state/store-context';
/** Align isolated previews with their demo prices; resolved merchant stores use API currency. */
export function previewStore(base: StoreInfo, themeId: string | null): StoreInfo {
  if (themeId === 'elite-wallets') return { ...base, name: 'Sellchaze Accessories', logoUrl: undefined };
  if (themeId === 'hype-fashion') return { ...base, name: 'Sellchaze Apparel', logoUrl: undefined };
  if (themeId === 'glow') return { ...base, name: 'Sellchaze Beauty', logoUrl: undefined };
  if (themeId === 'karat') return { ...base, name: 'Sellchaze Fine Jewellery', logoUrl: undefined, phone: '+201000000000' };
  if (themeId === 'stride') return { ...base, name: 'Sellchaze Sport', logoUrl: undefined };
  const store = ['sphinx-v3', 'elite-furniture', 'pure-furniture', 'nature-kids', 'blast-pets', 'nature-pets', 'hype-perfumes'].includes(themeId ?? '')
    ? { ...base, currency: 'EGP', baseCurrency: 'EGP', supportedCurrencies: ['EGP', 'USD', 'SAR'], currencyMultipliers: { EGP: 1, USD: 0.0206, SAR: 0.0773 } }
    : base;
  if (themeId === 'hype-perfumes') return { ...store, name: 'Sellchaze Fragrances', logoUrl: undefined, email: 'hello@example.test', phone: '+201000000000', shipping: { enabled: true, currency: 'EGP', free_over: '5000.00' } };
  if (themeId !== 'nature-kids' && themeId !== 'blast-pets' && themeId !== 'nature-pets') return store;
  return { ...store, ...((themeId === 'blast-pets' || themeId === 'nature-pets') ? { name: 'Sellchaze Pets', logoUrl: undefined, shipping: { enabled: true, currency: 'EGP', free_over: '5000.00' } } : {}), email: 'hello@example.test', phone: '+201000000000', merchantInformation: { email: 'hello@example.test', phone: '+201000000000', address: 'Cairo, Egypt', policies: [
    { kind: 'shipping', title: 'Shipping & Delivery Policy', url: '/policies/shipping', content_html: '<p>Delivery options and charges are confirmed before placing an order.</p>' },
    { kind: 'returns', title: 'Returns & Refund Policy', url: '/policies/returns', content_html: '<p>Contact the store to request a return and review the applicable conditions.</p>' },
    { kind: 'cod', title: 'Cash on Delivery (COD) Policy', url: '/policies/cod', content_html: '<p>Available payment methods are shown at checkout.</p>' },
  ] } };
}
