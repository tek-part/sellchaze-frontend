import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderReceiptPanel } from './OrderReceiptPanel';

const state = vi.hoisted(() => ({ status: 'pending', paid: false }));
vi.mock('./order-receipt', () => ({ readOrderReceipt: () => 'SYNTHETIC-RECEIPT' }));
vi.mock('../api/useAsync', () => ({ useAsync: () => ({ loading: false, data: {
  data: { number: 'DEMO-RETURN', status: state.status, total: '20.00', currency: 'USD', payment_status: state.paid ? 'paid' : 'pending', payment_method: 'transfer_receipt', items: [] },
  bank_transfer: { fields: { iban: 'FIXTURE-BANK-DETAILS' }, notes: '', test_mode: true },
} }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { id: 1 } }) }));
vi.mock('../foundation/components', () => ({
  Section: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
  Container: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Button: ({ children }: { children?: ReactNode }) => createElement('button', null, children),
  Spinner: () => null,
}));
vi.mock('./TransferReceiptUpload', () => ({ default: ({ canUpload }: { canUpload: boolean }) => createElement('div', { 'data-can-upload': String(canUpload) }) }));

beforeEach(() => { state.status = 'pending'; state.paid = false; vi.stubGlobal('window', { location: { origin: 'https://fixture.test', search: '' } }); });
afterEach(() => vi.unstubAllGlobals());
const render = () => renderToStaticMarkup(createElement(OrderReceiptPanel, { number: 'DEMO-RETURN' }));

describe('private receipt during physical returns', () => {
  it('keeps the receipt and payment truth visible while closing new transfer instructions and uploads for every return stage', () => {
    for (const status of ['returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded']) {
      state.status = status;
      const html = render();
      expect(html).toContain('DEMO-RETURN');
      expect(html).toContain('Recorded payment status: ');
      expect(html).toContain('Awaiting confirmation');
      expect(html).toContain('data-can-upload="false"');
      expect(html).not.toContain('FIXTURE-BANK-DETAILS');
      expect(html).not.toContain('Bank transfer instructions');
    }
  });
  it('retains the confirmed payment record for a returned order', () => {
    state.status = 'refunded'; state.paid = true;
    expect(render()).toContain('Returned');
    expect(render()).toContain('Payment confirmed');
    expect(render()).not.toContain('FIXTURE-BANK-DETAILS');
  });
  it('keeps pending active transfer instructions available', () => {
    expect(render()).toContain('FIXTURE-BANK-DETAILS');
    expect(render()).toContain('data-can-upload="true"');
  });
});
