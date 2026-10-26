/**
 * Customer return requests on the account order page: shows every return's status and, for a
 * delivered order inside the store's return window, a form to choose items, a reason and a note.
 * The server re-checks every rule (window, delivery, ownership, one open request).
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, QuantityStepper, Select, Textarea } from '../foundation/components';
import { requestOrderReturn, type ApiOrder, type ApiReturnReason, type ApiReturnStatus } from '../api/storefront';
import { formatDate, formatMoney } from '../utils/format';

const REASONS: ReadonlyArray<[ApiReturnReason, string]> = [
  ['damaged', 'account.returnReasonDamaged'],
  ['wrong_item', 'account.returnReasonWrongItem'],
  ['not_as_described', 'account.returnReasonNotAsDescribed'],
  ['size_fit', 'account.returnReasonSizeFit'],
  ['changed_mind', 'account.returnReasonChangedMind'],
  ['other', 'account.returnReasonOther'],
];
const STATUS_KEYS: Record<ApiReturnStatus, string> = {
  requested: 'account.returnStatusRequested',
  approved: 'account.returnStatusApproved',
  received: 'account.returnStatusReceived',
  closed: 'account.returnStatusClosed',
  rejected: 'account.returnStatusRejected',
};
const RESOLUTION_KEYS = { refund: 'account.returnResolutionRefund', exchange: 'account.returnResolutionExchange', store_credit: 'account.returnResolutionStoreCredit' } as const;
const INELIGIBLE_KEYS = { window_expired: 'account.returnWindowClosed', disabled: 'account.returnDisabled', open_return: 'account.returnOpen' } as const;

export function OrderReturnSection({ order, currency, onChanged }: { order: ApiOrder; currency: string; onChanged: (order: ApiOrder) => void }): ReactElement | null {
  const { t } = useTranslation();
  const eligibility = order.return_eligibility;
  const returns = order.returns ?? [];
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState<ApiReturnReason>('damaged');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const refunded = Number(order.refunded_total ?? 0);
  if (!eligibility && returns.length === 0 && refunded <= 0) return null;
  const lines = (eligibility?.items ?? []).filter((line) => line.returnable_quantity > 0);
  const chosen = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ store_order_item_id: Number(id), quantity }));
  const notice = eligibility && !eligibility.eligible && eligibility.reason && eligibility.reason in INELIGIBLE_KEYS
    ? t(INELIGIBLE_KEYS[eligibility.reason as keyof typeof INELIGIBLE_KEYS]) : null;

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (status === 'saving') return;
    if (chosen.length === 0) {
      setError(t('account.returnChooseItems'));
      return;
    }
    setStatus('saving');
    setError(undefined);
    try {
      const result = await requestOrderReturn(order.number, { items: chosen, reason, note: note.trim() || null });
      setStatus('sent');
      setOpen(false);
      setQuantities({});
      setNote('');
      onChanged(result.data);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error && err.message ? err.message : t('account.returnError'));
    }
  };

  return (
    <section className="sf-return" aria-labelledby="sf-return-title">
      <h2 id="sf-return-title" className="sf-footer__group-title">{t('account.returns')}</h2>
      {refunded > 0 ? <p className="sf-card-row__meta">{t('account.refundedAmount', { amount: formatMoney(refunded, currency) })}</p> : null}
      {status === 'sent' ? <p className="sf-newsletter__success" role="status">{t('account.returnSent')}</p> : null}
      {returns.length > 0 ? (
        <ul className="sf-card-list sf-return__list">
          {returns.map((row) => (
            <li key={row.id} className="sf-card-row">
              <div>
                <div className="sf-return__title">{t('account.returnNumber', { id: row.id })}</div>
                <div className="sf-card-row__meta">{row.items.map((item) => `${item.name ?? ''} × ${item.quantity}`).join('، ')}</div>
                <div className="sf-card-row__meta">{formatDate(row.created_at) ?? ''}{row.resolution ? ` · ${t(RESOLUTION_KEYS[row.resolution])}` : ''}</div>
              </div>
              <Badge variant={row.status === 'rejected' ? 'outline' : 'solid'}>{t(STATUS_KEYS[row.status])}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {notice ? <p className="sf-card-row__meta">{notice}</p> : null}
      {eligibility?.eligible && eligibility.deadline ? <p className="sf-card-row__meta">{t('account.returnDeadline', { date: formatDate(eligibility.deadline ?? undefined) ?? '' })}</p> : null}
      {eligibility?.eligible && !open ? (
        <Button variant="secondary" onClick={() => { setOpen(true); setStatus('idle'); }}>{t('account.requestReturn')}</Button>
      ) : null}
      {eligibility?.eligible && open ? (
        <form className="sf-account__panel sf-return__form" onSubmit={(event) => void submit(event)} noValidate>
          <fieldset className="sf-return__items">
            <legend>{t('account.returnItemsLegend')}</legend>
            {lines.map((line) => (
              <div key={line.store_order_item_id} className="sf-return__line">
                <div>
                  <div className="sf-return__title">{line.name}</div>
                  {line.variant_name ? <div className="sf-card-row__meta">{line.variant_name}</div> : null}
                  <div className="sf-card-row__meta">{t('account.returnAvailable', { count: line.returnable_quantity, total: line.quantity })}</div>
                </div>
                <QuantityStepper
                  compact
                  min={0}
                  max={line.returnable_quantity}
                  value={quantities[line.store_order_item_id] ?? 0}
                  onChange={(next) => setQuantities((current) => ({ ...current, [line.store_order_item_id]: next }))}
                  label={line.name}
                  decrementLabel={t('account.returnDecrease', { name: line.name })}
                  incrementLabel={t('account.returnIncrease', { name: line.name })}
                  disabled={status === 'saving'}
                />
              </div>
            ))}
          </fieldset>
          <Select label={t('account.returnReason')} value={reason} onChange={(event) => setReason(event.target.value as ApiReturnReason)} options={REASONS.map(([value, key]) => ({ value, label: t(key) }))} />
          <Textarea label={t('account.returnNote')} value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} />
          {error ? <p className="sf-field__error" role="alert">{error}</p> : null}
          <div className="sf-pdp__row">
            <Button type="submit" loading={status === 'saving'}>{t('account.returnSubmit')}</Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(undefined); }}>{t('common.cancel')}</Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
