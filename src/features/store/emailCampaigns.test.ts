import { describe, expect, it } from 'vitest';
import {
  audiencePayload, blockLabel, campaignForm, campaignPayload, campaignStatusLabel, campaignStatusTone, emptyCampaignForm, moveBlock, newBlock, percent, reorderBlock, sendBlockers,
} from './emailCampaigns';

describe('email campaigns', () => {
  it('labels statuses and blocks in both languages', () => {
    expect(campaignStatusLabel('scheduled', false)).toBe('Scheduled');
    expect(campaignStatusLabel('sent', true)).toBe('تم الإرسال');
    expect(campaignStatusTone('sent')).toBe('is-success');
    expect(campaignStatusTone('failed')).toBe('is-critical');
    expect(campaignStatusTone('draft')).toBe('');
    expect(blockLabel('coupon', false)).toBe('Discount code');
    expect(blockLabel('products', true)).toBe('منتجات');
  });

  it('moves blocks up and down and reorders by drag', () => {
    const list = ['a', 'b', 'c'];
    expect(moveBlock(list, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveBlock(list, 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveBlock(list, 0, -1)).toBe(list);
    expect(moveBlock(list, 2, 1)).toBe(list);
    expect(reorderBlock(list, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(reorderBlock(list, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(reorderBlock(list, 1, 1)).toBe(list);
  });

  it('builds the API body with only each block type’s fields and a clean audience', () => {
    const form = { ...emptyCampaignForm('ar'), name: ' Eid ', subject: ' Eid sale ', reply_to: ' ', content: [
      { ...newBlock('heading', 'h'), text: ' Hello ', html: 'ignored' },
      { ...newBlock('button', 'b'), label: ' Shop ', url: ' https://shop.test ' },
      { ...newBlock('products', 'p'), product_ids: [3, 3, 4] },
      { ...newBlock('coupon', 'c'), coupon_id: 9, text: '' },
      newBlock('divider', 'd'),
    ], audience: { type: 'segment' as const, filters: { spent_min: '500', orders_min: '', account: '' as const, tag: [] } } };
    expect(campaignPayload(form)).toEqual({
      name: 'Eid', subject: 'Eid sale', preheader: null, from_name: null, reply_to: null, locale: 'ar',
      content: [
        { id: 'h', type: 'heading', text: 'Hello', size: 'large', align: 'start' },
        { id: 'b', type: 'button', label: 'Shop', url: 'https://shop.test', align: 'center' },
        { id: 'p', type: 'products', product_ids: [3, 4] },
        { id: 'c', type: 'coupon', coupon_id: 9, text: null },
        { id: 'd', type: 'divider' },
      ],
      audience: { type: 'segment', filters: { spent_min: '500' } },
    });
    expect(audiencePayload({ type: 'tags', tags: [' VIP ', ''] })).toEqual({ type: 'tags', tags: ['VIP'] });
  });

  it('round-trips a campaign from the API and explains what blocks sending', () => {
    const form = campaignForm({ name: 'X', subject: null, locale: 'xx', content: [{ id: 'h', type: 'heading', text: 'Hi' }], audience: { type: 'tags', tags: ['VIP'] } }, 'ar');
    expect(form.locale).toBe('ar');
    expect(form.audience).toEqual({ type: 'tags', tags: ['VIP'] });
    expect(sendBlockers(form, false)).toEqual(['Add a subject line.']);
    expect(sendBlockers({ ...form, subject: 'S', content: [] }, true)).toEqual(['أضف محتوى واحدًا على الأقل.']);
    expect(percent(12.5, false)).toBe('12.5%');
    expect(percent(null, false)).toBe('—');
  });
});
