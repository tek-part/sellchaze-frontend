import type { ReactElement } from 'react';
import { Button } from '../foundation/components';
import { useLocale } from '../i18n/useLocale';
import type { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';

/** Recovery must remain accessible even if the cart is empty or the product has sold out. */
export function CheckoutRecovery({ flow }: { flow: ReturnType<typeof useCheckoutPaymentFlow> }): ReactElement | null {
  const { locale } = useLocale();
  if (!flow.unresolved) return null;
  const ar = locale === 'ar';
  return <div className="sf-account__panel" aria-live="polite">
    <p>{flow.paymentRetry
      ? (ar ? `تم حفظ طلبك${flow.paymentRetry.orderNumber ? ` ${flow.paymentRetry.orderNumber}` : ''}. يمكنك متابعة الدفع لنفس الطلب.` : `Your order${flow.paymentRetry.orderNumber ? ` ${flow.paymentRetry.orderNumber}` : ''} is saved. Continue payment for this order.`)
      : (ar ? 'لديك محاولة طلب لم تصل نتيجتها بعد. استعد نتيجتها قبل إرسال طلب آخر.' : 'A checkout attempt is awaiting confirmation. Recover its result before placing another order.')}</p>
    {flow.error ? <p className="sf-field__error" role="alert">{flow.error}</p> : null}
    <Button type="button" block loading={flow.busy} disabled={flow.busy} onClick={() => void (flow.paymentRetry ? flow.submit({}) : flow.recover())}>
      {flow.paymentRetry ? (ar ? 'متابعة الدفع لنفس الطلب' : 'Continue payment for this order') : (ar ? 'استعادة نتيجة الطلب' : 'Recover checkout result')}
    </Button>
    {flow.paymentRetry ? <Button type="button" variant="secondary" block disabled={flow.busy} onClick={() => void flow.recover()}>
      {ar ? 'تحديث حالة الطلب' : 'Refresh order status'}
    </Button> : null}
  </div>;
}
