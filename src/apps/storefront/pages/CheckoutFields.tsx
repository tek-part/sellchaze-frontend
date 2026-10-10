import { useMemo, useState, type ReactElement } from 'react';
import { Button, Input, Select, Spinner } from '../foundation/components';
import { apiGet } from '../api/client';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { countryOptions } from '../utils/countries';
import { formatMoney } from '../utils/format';
import { resolveShipping } from '../utils/shipping';
import type { ShippingConfiguration, ShippingSelection } from '../types/shipping';
import { checkoutContact, type CheckoutField, type Values } from './checkout-contact';

export function useCheckoutFields(paymentMethod: string, productIds: ReadonlyArray<number>) {
  const { locale } = useLocale();
  const [values, setValues] = useState<Values>({});
  const [chosenShipping, setChosenShipping] = useState<ShippingSelection>({});
  const basketKey = JSON.stringify([...new Set(productIds)].sort((a, b) => a - b));
  const query = useAsync(async () => {
    const params = new URLSearchParams({ payment_method: paymentMethod });
    (JSON.parse(basketKey) as number[]).forEach((id) => params.append('product_ids[]', String(id)));
    return { paymentMethod, basketKey, ...(await apiGet<{ data: CheckoutField[]; shipping: ShippingConfiguration; requires_shipping: boolean; has_digital: boolean }>(`/checkout/fields?${params.toString()}`)) };
  }, [paymentMethod, basketKey]);
  const ready = !query.loading && !query.error && query.data?.paymentMethod === paymentMethod && query.data?.basketKey === basketKey;
  const fields = ready ? query.data?.data ?? [] : [];
  const shipping = ready ? query.data?.shipping : undefined;
  const resolved = resolveShipping(shipping, chosenShipping);
  return { fields, ready, query, values, setValues, locale, shipping, requiresShipping: ready ? query.data?.requires_shipping : undefined, hasDigital: ready && query.data?.has_digital, shippingReady: ready && resolved.ready,
    shippingSelection: resolved.selection, setChosenShipping, payload: () => ({ ...checkoutContact(fields, values), ...resolved.selection }) };
}

export function CheckoutFieldsForm({ model }: { model: ReturnType<typeof useCheckoutFields> }): ReactElement {
  const { locale, values, setValues, fields, ready, query } = model;
  const lang = locale === 'ar' ? 'ar' : 'en';
  const countries = useMemo(() => [{ value: '', label: lang === 'ar' ? 'اختر الدولة' : 'Choose country' }, ...countryOptions(locale)], [locale, lang]);
  if (query.error) return <div role="alert"><p>{lang === 'ar' ? 'تعذّر تحميل نموذج الطلب.' : 'Unable to load checkout fields.'}</p><Button type="button" onClick={query.reload}>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Button></div>;
  if (!ready) return <Spinner label={lang === 'ar' ? 'جارٍ تحميل النموذج…' : 'Loading checkout fields…'} />;
  return <>{fields.filter((field) => field.enabled).map((field) => {
    const label = `${field.label[lang]}${field.required ? ' *' : ''}`;
    const hint = [field.hint[lang], field.payment_required ? (lang === 'ar' ? 'مطلوب لطريقة الدفع المحددة.' : 'Required for the selected payment method.') : '', field.digital_required ? (lang === 'ar' ? 'مطلوب لاستلام المنتج الرقمي بعد تأكيد الدفع.' : 'Required to receive the digital product after payment confirmation.') : ''].filter(Boolean).join(' ');
    const change = (event: { target: { value: string } }): void => setValues((current) => ({ ...current, [field.key]: event.target.value }));
    if (field.shipping_region) return <Select key={field.key} label={label} hint={hint} required value={model.shippingSelection.shipping_region_id ?? ''}
      onChange={(event) => model.setChosenShipping((current) => ({ ...current, shipping_region_id: event.target.value }))}
      options={[{ value: '', label: lang === 'ar' ? 'اختر منطقة التوصيل' : 'Choose delivery region' }, ...(model.shipping?.regions ?? []).map((region) => ({ value: region.id, label: region.name[lang] }))]} />;
    if (field.key === 'country') return <Select key={field.key} label={label} hint={hint} value={values.country ?? ''} onChange={change} required={field.required} options={countries} autoComplete="country" />;
    const autoComplete = { name: 'name', phone: 'tel', email: 'email', address: 'street-address', city: 'address-level2', postal_code: 'postal-code', phone_alt: 'off', notes: 'off', national_address: 'off' }[field.key];
    return <Input key={field.key} label={label} hint={hint} value={values[field.key] ?? ''} onChange={change} required={field.required}
      type={field.key === 'email' ? 'email' : field.key === 'phone' || field.key === 'phone_alt' ? 'tel' : 'text'} autoComplete={autoComplete}
      maxLength={field.key === 'notes' ? 2000 : field.key === 'phone' || field.key === 'phone_alt' ? 50 : field.key === 'postal_code' ? 32 : field.key === 'city' ? 120 : 255} />;
  })}
    {model.shipping?.enabled && model.shipping.options.length ? <fieldset style={{ display: 'grid', gap: '.75rem', border: 0, padding: 0, margin: 0 }}>
      <legend style={{ marginBottom: '.5rem', fontWeight: 600 }}>{lang === 'ar' ? 'خيار الشحن *' : 'Shipping option *'}</legend>
      {model.shipping.options.map((option) => <label key={option.id} className="sf-account__panel" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem', cursor: 'pointer' }}>
        <input type="radio" name="shipping_option" required value={option.id} checked={model.shippingSelection.shipping_option_id === option.id}
          onChange={() => model.setChosenShipping((current) => ({ ...current, shipping_option_id: option.id }))} />
        {option.icon_url ? <img src={option.icon_url} alt="" width={40} height={40} style={{ objectFit: 'contain' }} /> : null}
        <span style={{ flex: 1 }}><strong>{option.name[lang]}</strong>{option.description[lang] ? <small style={{ display: 'block' }}>{option.description[lang]}</small> : null}</span>
        <span>{formatMoney(Number(option.rate), model.shipping?.currency ?? '', locale)}</span>
      </label>)}
      {model.shipping.free_over !== null ? <small>{lang === 'ar' ? 'الشحن مجاني عندما تصل قيمة المنتجات بعد الخصم إلى ' : 'Free shipping when products after discounts reach '}{formatMoney(Number(model.shipping.free_over), model.shipping.currency, locale)}</small> : null}
    </fieldset> : null}
    {ready && !model.shippingReady ? <p role="status">{lang === 'ar' ? 'اختر تفاصيل التوصيل لحساب الإجمالي.' : 'Choose delivery details to calculate your total.'}</p> : null}
  </>;
}
