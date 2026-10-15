import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abCheckoutToken, abVisitor, saveAbAssignment } from './ab-assignment';

beforeEach(() => { vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn() }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('A/B browser capability hints', () => {
  it('keeps visitors stable inside one store and separates stores', () => {
    expect(abVisitor(1001)).toBe(abVisitor(1001));
    expect(abVisitor(1001)).not.toBe(abVisitor(1002));
  });
  it('renews the visitor window after thirty days', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2029-01-01T00:00:00Z'));
    const first = abVisitor(4001);
    vi.setSystemTime(new Date('2029-02-01T00:00:00Z'));
    expect(abVisitor(4001)).not.toBe(first);
  });
  it('only attaches a current capability when its product is in the basket', () => {
    const token = 'a'.repeat(64); const expires_at = '2030-01-01T00:00:00Z';
    saveAbAssignment(2001, { token, product_id: 10, expires_at });
    expect(abCheckoutToken(2001, [10], Date.parse('2029-01-01'))).toBe(token);
    expect(abCheckoutToken(2001, [11], Date.parse('2029-01-01'))).toBeUndefined();
    expect(abCheckoutToken(2002, [10], Date.parse('2029-01-01'))).toBeUndefined();
    expect(abCheckoutToken(2001, [10], Date.parse(expires_at))).toBeUndefined();
  });
  it('ignores corrupt storage and invalid capabilities', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('{bad');
    expect(abCheckoutToken(3001, [1])).toBeUndefined();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    saveAbAssignment(3001, { token: '<script>', product_id: 1, expires_at: '2030-01-01T00:00:00Z' });
    expect(abCheckoutToken(3001, [1])).toBeUndefined();
  });
});
