import { describe, expect, it } from 'vitest';
import { emptyGiftCardForm, giftCardAdjustPayload, giftCardIssuePayload, giftCardReasonLabel, giftCardStateLabel, giftCardStateTone, maskGiftCardCode } from './giftCards';

describe('gift cards', () => {
  it('labels states and ledger reasons in both languages', () => {
    expect(giftCardStateLabel('depleted', false)).toBe('Used up');
    expect(giftCardStateLabel('disabled', true)).toBe('معطلة');
    expect(giftCardStateTone('active')).toBe('is-success');
    expect(giftCardStateTone('expired')).toBe('is-warning');
    expect(giftCardReasonLabel('restored', false)).toBe('Restored from order');
    expect(giftCardReasonLabel('redeemed', true)).toBe('استخدام في طلب');
    expect(maskGiftCardCode('AB12')).toBe('•••• AB12');
  });

  it('sends blank optional fields as null', () => {
    expect(giftCardIssuePayload({ ...emptyGiftCardForm(), initial_value: ' 250 ', customer_email: ' mona@example.test ' })).toEqual({
      initial_value: '250', expires_at: null, customer_name: null, customer_email: 'mona@example.test', customer_phone: null, note: null,
    });
  });

  it('signs adjustments and refuses an empty reason or a non-positive amount', () => {
    expect(giftCardAdjustPayload('remove', '30.5', ' Damaged ')).toEqual({ amount: '-30.5', reason: 'Damaged' });
    expect(giftCardAdjustPayload('add', '10', 'Goodwill')).toEqual({ amount: '10', reason: 'Goodwill' });
    expect(giftCardAdjustPayload('add', '0', 'x')).toBeNull();
    expect(giftCardAdjustPayload('add', '-5', 'x')).toBeNull();
    expect(giftCardAdjustPayload('add', '1.234', 'x')).toBeNull();
    expect(giftCardAdjustPayload('add', '5', '  ')).toBeNull();
  });
});
