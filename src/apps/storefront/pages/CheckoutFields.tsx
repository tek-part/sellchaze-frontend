import { Fragment, useMemo, useState, type ReactElement } from 'react';
import { Button, Input, Select, Spinner } from '../foundation/components';
import { apiGet } from '../api/client';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { countryOptions } from '../utils/countries';
import { formatMoney } from '../utils/format';
import { resolveShipping, resolveZoneShipping } from '../utils/shipping';
import type { QuoteShipping, ShippingConfiguration, ShippingSelection, ZoneRate } from '../types/shipping';
import { checkoutContact, type CheckoutField, type Values } from './checkout-contact';
import { usePhoneVerification, type PhoneVerificationConfiguration } from './usePhoneVerification';
import { CheckoutPhoneVerification } from './CheckoutPhoneVerification';
import { useBotProtection, type BotConfiguration } from './useBotProtection';
import { CheckoutBotProtection } from './CheckoutBotProtection';
import { countryAccepted, countryPolicyText, type CountryRestriction } from './country-restriction';
import './checkout/checkout.css';

export function useCheckoutFields(paymentMethod: string, productIds: ReadonlyArray<number>) {
  const { locale } = useLocale();
  const [values, setValues] = useState<Values>({});
  const [chosenShipping, setChosenShipping] = useState<ShippingSelection>({});
  const basketKey = JSON.stringify([...new Set(productIds)].sort((a, b) => a - b));
  const query = useAsync(async () => {
    const params = new URLSearchParams({ payment_method: paymentMethod });
    (JSON.parse(basketKey) as number[]).forEach((id) => params.append('product_ids[]', String(id)));
    return { paymentMethod, basketKey, ...(await apiGet<{ data: CheckoutField[]; shipping: ShippingConfiguration; requires_shipping: boolean; has_digital: boolean; phone_verification?: PhoneVerificationConfiguration; bot_protection?: BotConfiguration; country_restriction?: CountryRestriction | null }>(`/checkout/fields?${params.toString()}`)) };
  }, [paymentMethod, basketKey]);
  const ready = !query.loading && !query.error && query.data?.paymentMethod === paymentMethod && query.data?.basketKey === basketKey;
  const fields = ready ? query.data?.data ?? [] : [];
  const shipping = ready ? query.data?.shipping : undefined;
  const zonesEnabled = shipping?.enabled === true && shipping.zones_enabled === true;
  const country = (values.country ?? '').trim().toUpperCase();
  const zone = resolveZoneShipping(zonesEnabled ? shipping : undefined, chosenShipping, country);
  // Zone rates for the current address; refetched whenever the country or region changes.
  const addressKey = zonesEnabled && zone.selection.shipping_country && !zone.unsupported ? JSON.stringify([basketKey, zone.selection.shipping_country, zone.selection.shipping_region_id ?? '']) : '';
  const addressQuery = useAsync(async () => {
    if (!addressKey) return null;
    const [ids, code, region] = JSON.parse(addressKey) as [string, string, string];
    const params = new URLSearchParams({ payment_method: paymentMethod, shipping_country: code });
    if (region) params.set('shipping_region_id', region);
    (JSON.parse(ids) as number[]).forEach((id) => params.append('product_ids[]', String(id)));
    return { key: addressKey, shipping: (await apiGet<{ shipping: ShippingConfiguration }>(`/checkout/fields?${params.toString()}`)).shipping };
  }, [addressKey]);
  const addressShipping = !addressQuery.loading && addressQuery.data?.key === addressKey ? addressQuery.data.shipping : undefined;
  const legacy = resolveShipping(shipping, chosenShipping);
  // The store's delivery-country policy; the quote and placement enforce it again on the server.
  const countryRestriction = ready ? query.data?.country_restriction ?? null : null;
  const countryField = fields.some((field) => field.enabled && field.key === 'country');
  // Older single-zone stores ignore the country for rates; it selects a tax override and lets the quote apply the country policy.
  const resolved = zonesEnabled ? zone : { ...legacy, selection: { ...legacy.selection, ...(country && (shipping?.enabled || (countryRestriction && countryField)) ? { shipping_country: country } : {}) } };
  const phoneVerification = usePhoneVerification(query.data?.phone_verification, values.phone ?? '', locale);
  const botProtection = useBotProtection(query.data?.bot_protection, locale);
  return { fields, ready, query, values, setValues, locale, shipping, phoneVerification, botProtection, paymentMethod, zonesEnabled, zone, addressShipping, addressLoading: addressQuery.loading && !!addressKey,
    countryRestriction, countryAllowed: countryAccepted(countryRestriction, country || undefined),
    resetRate: () => setChosenShipping((current) => { const { shipping_rate_id: _rate, ...rest } = current; return rest; }), requiresShipping: ready ? query.data?.requires_shipping : undefined, hasDigital: ready && query.data?.has_digital, shippingReady: ready && resolved.ready,
    shippingSelection: resolved.selection, shippingStale: resolved.stale === true, setChosenShipping, resetShipping: () => setChosenShipping({}), payload: () => ({ ...checkoutContact(fields, values), ...resolved.selection, ...(phoneVerification.proof ? { phone_verification: phoneVerification.proof } : {}), ...(botProtection.proof ? { bot_proof: botProtection.proof } : {}) }) };
}

/**
 * The quote's rates win over the address rates: they are filtered by the cart's subtotal and weight.
 * The last quote (even while the next one loads) is used as long as it is for the address's zone.
 */
function zoneRates(model: ReturnType<typeof useCheckoutFields>, quoteShipping: QuoteShipping | null | undefined): ZoneRate[] {
  const addressZone = model.addressShipping?.zone?.id;
  if (quoteShipping?.mode === 'zone' && (!addressZone || addressZone === quoteShipping.zone?.id)) return quoteShipping.rates;
  return model.addressShipping?.rates ?? [];
}

export function CheckoutFieldsForm({ model, quote }: { model: ReturnType<typeof useCheckoutFields>; quote?: { shipping?: QuoteShipping | null } | null }): ReactElement {
  const { locale, values, setValues, fields, ready, query } = model;
  const lang = locale === 'ar' ? 'ar' : 'en';
  const served = model.zonesEnabled ? model.shipping?.countries?.map((row) => row.code) : undefined;
  const countries = useMemo(() => [{ value: '', label: lang === 'ar' ? 'اختر الدولة' : 'Choose country' }, ...countryOptions(locale).filter((row) => !served || served.includes(row.value))], [locale, lang, served]);
  if (query.error) return <div role="alert"><p>{lang === 'ar' ? 'تعذّر تحميل نموذج الطلب.' : 'Unable to load checkout fields.'}</p><Button type="button" onClick={query.reload}>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Button></div>;
  if (!ready) return <Spinner label={lang === 'ar' ? 'جارٍ تحميل النموذج…' : 'Loading checkout fields…'} />;
  return <>{fields.filter((field) => field.enabled).map((field) => {
    const label = `${field.label[lang]}${field.required ? ' *' : ''}`;
    const hint = [field.hint[lang], field.payment_required ? (lang === 'ar' ? 'مطلوب لطريقة الدفع المحددة.' : 'Required for the selected payment method.') : '', field.digital_required ? (lang === 'ar' ? 'مطلوب لاستلام المنتج الرقمي بعد تأكيد الدفع.' : 'Required to receive the digital product after payment confirmation.') : ''].filter(Boolean).join(' ');
    const change = (event: { target: { value: string } }): void => setValues((current) => ({ ...current, [field.key]: event.target.value }));
    if (field.shipping_region) return <Select key={field.key} label={label} hint={hint} required value={model.shippingSelection.shipping_region_id ?? ''}
      onChange={(event) => model.setChosenShipping((current) => ({ ...current, shipping_region_id: event.target.value }))}
      options={[{ value: '', label: lang === 'ar' ? 'اختر منطقة التوصيل' : 'Choose delivery region' }, ...(model.shipping?.regions ?? []).map((region) => ({ value: region.id, label: region.name[lang] }))]} />;
    const countryHint = [hint, model.countryRestriction ? countryPolicyText(model.countryRestriction, locale) : ''].filter(Boolean).join(' ');
    const refusal = model.countryAllowed === false && model.countryRestriction ? <p className="sf-field__error" role="alert">{model.countryRestriction.message}</p> : null;
    if (field.key === 'country' && model.zonesEnabled) {
      const { regions, regionRequired, unsupported } = model.zone;
      return <div key={field.key} className="sf-co-zone-address" style={{ display: 'contents' }}>
        <Select label={label} hint={countryHint} value={values.country ?? ''} required options={countries} autoComplete="country"
          onChange={(event) => { change(event); model.setChosenShipping(({ shipping_region_id: _region, shipping_rate_id: _rate, ...rest }) => rest); }} />
        {refusal}
        {regions.length ? <Select label={`${lang === 'ar' ? 'المنطقة / المحافظة' : 'Region / governorate'}${regionRequired ? ' *' : ''}`} required={regionRequired} value={model.shippingSelection.shipping_region_id ?? ''}
          onChange={(event) => model.setChosenShipping(({ shipping_rate_id: _rate, ...rest }) => ({ ...rest, shipping_region_id: event.target.value || undefined }))}
          options={[{ value: '', label: regionRequired ? (lang === 'ar' ? 'اختر المنطقة' : 'Choose region') : (lang === 'ar' ? 'مناطق أخرى' : 'Other areas') }, ...regions.map((region) => ({ value: region.id, label: region.name[lang] }))]} /> : null}
        {unsupported ? <p role="alert" className="sf-field__error">{lang === 'ar' ? 'لا يتوفر التوصيل إلى هذه الدولة حاليًا. اختر دولة أخرى.' : 'Delivery to this country is not available yet. Choose another country.'}</p> : null}
      </div>;
    }
    if (field.key === 'country') return <Fragment key={field.key}>
      <Select label={label} hint={countryHint} value={values.country ?? ''} onChange={change} required={field.required} options={countries} autoComplete="country" />
      {refusal}
    </Fragment>;
    const autoComplete = { name: 'name', phone: 'tel', email: 'email', address: 'street-address', city: 'address-level2', postal_code: 'postal-code', phone_alt: 'off', notes: 'off', national_address: 'off' }[field.key];
    return <Input key={field.key} label={label} hint={hint} value={values[field.key] ?? ''} onChange={change} required={field.required}
      type={field.key === 'email' ? 'email' : field.key === 'phone' || field.key === 'phone_alt' ? 'tel' : 'text'} autoComplete={autoComplete}
      maxLength={field.key === 'notes' ? 2000 : field.key === 'phone' || field.key === 'phone_alt' ? 50 : field.key === 'postal_code' ? 32 : field.key === 'city' ? 120 : 255} />;
  })}
    {fields.some((field) => field.enabled && ['phone', 'email'].includes(field.key)) ? <p className="sf-field__hint">{lang === 'ar' ? 'يستخدم المتجر بيانات التواصل لمساعدتك إذا لم يكتمل الطلب.' : 'The store may use your contact details to help you complete an unfinished order.'}</p> : null}
    <CheckoutPhoneVerification model={model.phoneVerification} locale={locale} />
    <CheckoutBotProtection model={model.botProtection} locale={locale} />
    {model.zonesEnabled && model.shippingReady ? <ZoneRateChoices model={model} quoteShipping={quote?.shipping} /> : null}
    {model.shipping?.enabled && model.shipping.options.length ? <fieldset className="sf-co-shipping" style={{ display: 'grid', gap: '.75rem', border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend style={{ marginBottom: '.5rem', fontWeight: 600 }}>{lang === 'ar' ? 'طريقة الشحن *' : 'Shipping method *'}</legend>
      <div className="sf-co-choices">{model.shipping.options.map((option) => {
        const selected = model.shippingSelection.shipping_option_id === option.id;
        return <label key={option.id} className={`sf-co-choice ${selected ? 'is-selected' : ''}`}>
          <input type="radio" name="shipping_option" required value={option.id} checked={selected}
            onChange={() => model.setChosenShipping((current) => ({ ...current, shipping_option_id: option.id }))} />
          <span className="sf-co-choice__label"><strong>{option.name[lang]}</strong>{option.description[lang] ? <small>{option.description[lang]}</small> : null}</span>
          <span className="sf-co-choice__aside">{option.icon_url ? <img src={option.icon_url} alt="" width={40} height={24} /> : null}{Number(option.rate) > 0 ? formatMoney(Number(option.rate), model.shipping?.currency ?? '', locale) : (lang === 'ar' ? 'مجاني' : 'Free')}</span>
        </label>;
      })}</div>
      {model.shipping.free_over !== null ? <small className="sf-co-free">{lang === 'ar' ? 'الشحن مجاني عندما تصل قيمة المنتجات بعد الخصم إلى ' : 'Free shipping when products after discounts reach '}{formatMoney(Number(model.shipping.free_over), model.shipping.currency, locale)}</small> : null}
    </fieldset> : null}
    {ready && model.shippingStale ? <div role="alert"><p>{lang === 'ar' ? 'تغيّرت منطقة أو طريقة التوصيل التي اخترتها. أعد الاختيار لحساب الإجمالي الحالي.' : 'Your selected delivery region or method changed. Choose again to calculate the current total.'}</p><Button type="button" variant="secondary" onClick={model.resetShipping}>{lang === 'ar' ? 'إعادة اختيار التوصيل' : 'Choose delivery again'}</Button></div> : ready && !model.shippingReady ? <p role="status">{lang === 'ar' ? 'اختر تفاصيل التوصيل لحساب الإجمالي.' : 'Choose delivery details to calculate your total.'}</p> : null}
  </>;
}

function ZoneRateChoices({ model, quoteShipping }: { model: ReturnType<typeof useCheckoutFields>; quoteShipping: QuoteShipping | null | undefined }): ReactElement | null {
  const lang = model.locale === 'ar' ? 'ar' : 'en';
  const rates = zoneRates(model, quoteShipping);
  const currency = model.shipping?.currency ?? '';
  const selectedId = model.shippingSelection.shipping_rate_id ?? (quoteShipping?.mode === 'zone' ? quoteShipping.rate_id : null);
  if (!rates.length) return model.addressLoading ? <Spinner label={lang === 'ar' ? 'جارٍ تحميل أسعار الشحن…' : 'Loading shipping rates…'} /> : null;
  return <fieldset className="sf-co-shipping" data-shipping-zone={model.addressShipping?.zone?.id ?? quoteShipping?.zone?.id ?? ''} style={{ display: 'grid', gap: '.75rem', border: 0, padding: 0, margin: 0, minWidth: 0 }}>
    <legend style={{ marginBottom: '.5rem', fontWeight: 600 }}>{lang === 'ar' ? 'طريقة الشحن *' : 'Shipping method *'}</legend>
    <div className="sf-co-choices">{rates.map((rate) => {
      const selected = selectedId === rate.id;
      const cod = model.paymentMethod === 'cod' && rate.cod_fee !== null && Number(rate.cod_fee) > 0;
      return <label key={rate.id} className={`sf-co-choice ${selected ? 'is-selected' : ''}`} data-shipping-rate={rate.id}>
        <input type="radio" name="shipping_rate" required value={rate.id} checked={selected} onChange={() => model.setChosenShipping((current) => ({ ...current, shipping_rate_id: rate.id }))} />
        <span className="sf-co-choice__label"><strong>{rate.name[lang]}</strong>{rate.delivery_time[lang] ? <small>{rate.delivery_time[lang]}</small> : null}
          {cod ? <small>{lang === 'ar' ? 'رسوم الدفع عند الاستلام: ' : 'Cash on delivery fee: '}{formatMoney(Number(rate.cod_fee), currency, model.locale)}</small> : null}</span>
        <span className="sf-co-choice__aside">{Number(rate.amount) > 0 ? formatMoney(Number(rate.amount), currency, model.locale) : (lang === 'ar' ? 'مجاني' : 'Free')}</span>
      </label>;
    })}</div>
    {rates.filter((rate) => rate.free_over !== null && Number(rate.amount) > 0).slice(0, 1).map((rate) => <small key={rate.id} className="sf-co-free">{lang === 'ar' ? `الشحن (${rate.name.ar}) مجاني عندما تصل قيمة المنتجات بعد الخصم إلى ` : `${rate.name.en} is free when products after discounts reach `}{formatMoney(Number(rate.free_over), currency, model.locale)}</small>)}
  </fieldset>;
}
