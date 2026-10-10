import { useMemo, useState, type ReactElement } from 'react';
import { Button, Input, Select, Spinner } from '../foundation/components';
import { apiGet } from '../api/client';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { countryOptions } from '../utils/countries';
import { checkoutContact, type CheckoutField, type Values } from './checkout-contact';

export function useCheckoutFields(paymentMethod: string) {
  const { locale } = useLocale();
  const [values, setValues] = useState<Values>({});
  const query = useAsync(async () => ({ paymentMethod, ...(await apiGet<{ data: CheckoutField[] }>(`/checkout/fields?payment_method=${encodeURIComponent(paymentMethod)}`)) }), [paymentMethod]);
  const ready = !query.loading && !query.error && query.data?.paymentMethod === paymentMethod;
  const fields = ready ? query.data?.data ?? [] : [];
  return { fields, ready, query, values, setValues, locale, payload: () => checkoutContact(fields, values) };
}

export function CheckoutFieldsForm({ model }: { model: ReturnType<typeof useCheckoutFields> }): ReactElement {
  const { locale, values, setValues, fields, ready, query } = model;
  const lang = locale === 'ar' ? 'ar' : 'en';
  const countries = useMemo(() => [{ value: '', label: lang === 'ar' ? 'اختر الدولة' : 'Choose country' }, ...countryOptions(locale)], [locale, lang]);
  if (query.error) return <div role="alert"><p>{lang === 'ar' ? 'تعذّر تحميل نموذج الطلب.' : 'Unable to load checkout fields.'}</p><Button type="button" onClick={query.reload}>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Button></div>;
  if (!ready) return <Spinner label={lang === 'ar' ? 'جارٍ تحميل النموذج…' : 'Loading checkout fields…'} />;
  return <>{fields.filter((field) => field.enabled).map((field) => {
    const label = `${field.label[lang]}${field.required ? ' *' : ''}`;
    const hint = [field.hint[lang], field.payment_required ? (lang === 'ar' ? 'مطلوب لطريقة الدفع المحددة.' : 'Required for the selected payment method.') : ''].filter(Boolean).join(' ');
    const change = (event: { target: { value: string } }): void => setValues((current) => ({ ...current, [field.key]: event.target.value }));
    if (field.key === 'country') return <Select key={field.key} label={label} hint={hint} value={values.country ?? ''} onChange={change} required={field.required} options={countries} autoComplete="country" />;
    const autoComplete = { name: 'name', phone: 'tel', email: 'email', address: 'street-address', city: 'address-level2', postal_code: 'postal-code', phone_alt: 'off', notes: 'off', national_address: 'off' }[field.key];
    return <Input key={field.key} label={label} hint={hint} value={values[field.key] ?? ''} onChange={change} required={field.required}
      type={field.key === 'email' ? 'email' : field.key === 'phone' || field.key === 'phone_alt' ? 'tel' : 'text'} autoComplete={autoComplete}
      maxLength={field.key === 'notes' ? 2000 : field.key === 'phone' || field.key === 'phone_alt' ? 50 : field.key === 'postal_code' ? 32 : field.key === 'city' ? 120 : 255} />;
  })}</>;
}
