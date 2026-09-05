import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';
import FormField, { INPUT_CLASS, INPUT_ERROR_CLASS } from '../../../components/ui/FormField';
import SaveBar from '../../../components/ui/SaveBar';
import SettingsCard from '../../../components/ui/SettingsCard';
import Toggle from '../../../components/ui/Toggle';
import useStoreContext from '../../../hooks/useStoreContext';
import useStoreSettings, { useDirty } from '../../../hooks/useStoreSettings';

const num = (value, fallback = '') => (value === null || value === undefined || value === '' ? fallback : String(value));

/** Reads the nested `tax.*` / `shipping.*` resource shape; writes the flat request keys. */
function fromStore(store) {
    return {
        tax_enabled: Boolean(store?.tax?.enabled),
        tax_rate: num(store?.tax?.rate, '0'),
        tax_prices_include: Boolean(store?.tax?.prices_include_tax),
        shipping_enabled: Boolean(store?.shipping?.enabled),
        shipping_flat_rate: num(store?.shipping?.flat_rate, '0'),
        shipping_free_over: num(store?.shipping?.free_over, ''),
    };
}

function Suffix({ children }) {
    return <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-semibold text-slate-400">{children}</span>;
}

export default function StoreShippingTaxSettingsPage() {
    const { t } = useTranslation();
    const { store } = useStoreContext();
    const { save, saving, errors, clearErrors } = useStoreSettings();
    const initial = useMemo(() => fromStore(store), [store]);
    const [values, setValues] = useState(initial);
    useEffect(() => { setValues(initial); }, [initial]);

    const dirty = useDirty(initial, values);
    const currency = store?.currency || '';
    const err = (key) => errors?.[key];
    const cls = (key) => `${INPUT_CLASS} pe-14 ${err(key) ? INPUT_ERROR_CLASS : ''}`;
    const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            await save({
                tax_enabled: values.tax_enabled,
                tax_rate: values.tax_rate === '' ? 0 : Number(values.tax_rate),
                tax_prices_include: values.tax_prices_include,
                shipping_enabled: values.shipping_enabled,
                shipping_flat_rate: values.shipping_flat_rate === '' ? 0 : Number(values.shipping_flat_rate),
                shipping_free_over: values.shipping_free_over === '' ? null : Number(values.shipping_free_over),
            });
        } catch {
            /* surfaced by the hook */
        }
    };

    return (
        <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
            <PageHeader
                title={t('store_shipping_title', 'Shipping & tax')}
                subtitle={t('store_shipping_subtitle', 'A flat shipping rate and a single tax rate applied at checkout.')}
            />

            <SettingsCard
                title={t('store_tax_title', 'Tax')}
                description={t('store_tax_hint', 'Applied to every order at checkout. Turn it off if you are not tax-registered.')}
                actions={<Toggle checked={values.tax_enabled} onChange={(v) => setField('tax_enabled', v)} size="sm" />}
            >
                <div className={`grid gap-5 sm:grid-cols-2 ${values.tax_enabled ? '' : 'opacity-60'}`}>
                    <FormField label={t('store_tax_rate', 'Tax rate')} htmlFor="tax-rate" error={err('tax_rate')}>
                        <div className="relative">
                            <input
                                id="tax-rate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.001"
                                inputMode="decimal"
                                value={values.tax_rate}
                                onChange={(e) => setField('tax_rate', e.target.value)}
                                disabled={!values.tax_enabled}
                                className={cls('tax_rate')}
                                dir="ltr"
                            />
                            <Suffix>%</Suffix>
                        </div>
                    </FormField>
                    <div className="sm:pt-7">
                        <Toggle
                            checked={values.tax_prices_include}
                            onChange={(v) => setField('tax_prices_include', v)}
                            disabled={!values.tax_enabled}
                            label={t('store_tax_included', 'Prices include tax')}
                            description={t('store_tax_included_hint', 'Tax is shown as part of the price rather than added on top.')}
                        />
                    </div>
                </div>
            </SettingsCard>

            <SettingsCard
                title={t('store_shipping_flat_title', 'Flat-rate shipping')}
                description={t('store_shipping_flat_hint', 'One rate for every order, with an optional free-shipping threshold.')}
                actions={<Toggle checked={values.shipping_enabled} onChange={(v) => setField('shipping_enabled', v)} size="sm" />}
            >
                <div className={`grid gap-5 sm:grid-cols-2 ${values.shipping_enabled ? '' : 'opacity-60'}`}>
                    <FormField label={t('store_shipping_rate', 'Flat shipping rate')} htmlFor="shipping-rate" error={err('shipping_flat_rate')}>
                        <div className="relative">
                            <input
                                id="shipping-rate"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={values.shipping_flat_rate}
                                onChange={(e) => setField('shipping_flat_rate', e.target.value)}
                                disabled={!values.shipping_enabled}
                                className={cls('shipping_flat_rate')}
                                dir="ltr"
                            />
                            <Suffix>{currency}</Suffix>
                        </div>
                    </FormField>
                    <FormField
                        label={t('store_shipping_free_over', 'Free shipping over')}
                        htmlFor="shipping-free-over"
                        error={err('shipping_free_over')}
                        hint={t('store_shipping_free_over_hint', 'Leave empty to never waive shipping.')}
                    >
                        <div className="relative">
                            <input
                                id="shipping-free-over"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={values.shipping_free_over}
                                onChange={(e) => setField('shipping_free_over', e.target.value)}
                                disabled={!values.shipping_enabled}
                                placeholder={t('optional', 'Optional')}
                                className={cls('shipping_free_over')}
                                dir="ltr"
                            />
                            <Suffix>{currency}</Suffix>
                        </div>
                    </FormField>
                </div>
            </SettingsCard>

            <SaveBar dirty={dirty} saving={saving} onReset={() => { setValues(initial); clearErrors(); }} />
        </form>
    );
}
