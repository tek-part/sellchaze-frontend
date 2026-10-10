import type { ReactElement } from 'react';
import { Button, Input } from '../foundation/components';
import type { usePhoneVerification } from './usePhoneVerification';

export function CheckoutPhoneVerification({ model, locale }: { model: ReturnType<typeof usePhoneVerification>; locale: string }): ReactElement | null {
  if (!model.required) return null;
  const text = (ar: string, en: string): string => locale === 'ar' ? ar : en;
  return <section className="sf-account__panel" aria-label={text('تأكيد رقم الهاتف', 'Verify phone number')} style={{ display: 'grid', gap: '.75rem', padding: '1rem' }}>
    <h3>{text('تأكيد رقم الهاتف عبر واتساب', 'Verify phone through WhatsApp')}</h3>
    <p>{text('سنرسل رمزًا صالحًا لمدة 5 دقائق إلى رقمك. التأكيد مطلوب قبل إنشاء الطلب.', 'We will send a code valid for5 minutes to your number. Verification is required before placing the order.')}</p>
    {model.verified ? <p role="status">{text('تم تأكيد الهاتف لهذا الطلب.', 'Phone verified for this order.')}</p> : <>
      <Button type="button" variant="secondary" loading={model.busy} disabled={model.resendIn > 0} onClick={() => void model.send()}>
        {model.resendIn > 0 ? text(`إعادة الإرسال بعد ${model.resendIn} ثانية`, `Resend in ${model.resendIn}s`) : text('إرسال رمز عبر واتساب', 'Send code through WhatsApp')}
      </Button>
      {model.sent ? <>
        <Input label={text('رمز التأكيد', 'Verification code')} autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={model.code}
          onChange={(event) => model.setCode(event.target.value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632)).replace(/[^0-9]/g, '').slice(0, 6))} />
        <Button type="button" loading={model.busy} disabled={model.code.length !== 6} onClick={() => void model.verify()}>{text('تأكيد الرمز', 'Verify code')}</Button>
      </> : null}
    </>}
    {model.error ? <p role="alert" className="sf-field__error">{model.error}</p> : null}
  </section>;
}
