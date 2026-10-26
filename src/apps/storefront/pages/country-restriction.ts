/** The store's delivery-country policy as published by `/checkout/fields`; placement enforces it again. */
export interface CountryRestriction { mode: 'allow' | 'block'; countries: ReadonlyArray<string>; message: string }

export function countryAccepted(restriction: CountryRestriction | null | undefined, country: string | undefined): boolean {
  if (!restriction || !country) return true;
  const listed = restriction.countries.includes(country.toUpperCase());
  return restriction.mode === 'allow' ? listed : !listed;
}

export function countryPolicyText(restriction: CountryRestriction, locale: string): string {
  const ar = locale === 'ar';
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames([ar ? 'ar' : 'en'], { type: 'region' }); } catch { names = null; }
  const list = restriction.countries.map((code) => names?.of(code) ?? code).join(ar ? '، ' : ', ');
  return restriction.mode === 'allow'
    ? (ar ? `يوصّل هذا المتجر الطلبات إلى: ${list}.` : `This store delivers to: ${list}.`)
    : (ar ? `لا يوصّل هذا المتجر الطلبات إلى: ${list}.` : `This store does not deliver to: ${list}.`);
}
