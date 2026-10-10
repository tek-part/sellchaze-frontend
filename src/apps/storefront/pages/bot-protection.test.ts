import { describe, expect, it } from 'vitest';
import { usableBotProof } from './useBotProtection';

describe('checkout bot proof', () => {
  const nonce = 'a'.repeat(64);
  const expires_at = '2026-10-10T12:00:00Z';
  const deadline = Date.parse(expires_at);
  it('requires successful server validation and a strictly unexpired deadline', () => {
    expect(usableBotProof({ nonce, state: 'verified', expires_at }, nonce, deadline - 1)).toBe(nonce);
    expect(usableBotProof({ nonce, state: 'verified', expires_at }, nonce, deadline)).toBeUndefined();
  });
  it('does not transfer a proof to a replacement widget/settings nonce', () => {
    expect(usableBotProof({ nonce, state: 'verified', expires_at }, 'b'.repeat(64), deadline - 1)).toBeUndefined();
  });
  it('rejects pending, failed, used and malformed responses', () => {
    for (const state of ['checking', 'failed', 'used']) expect(usableBotProof({ nonce, state, expires_at }, nonce, deadline - 1)).toBeUndefined();
    expect(usableBotProof({ nonce, state: 'verified', expires_at: null }, nonce, deadline - 1)).toBeUndefined();
    expect(usableBotProof({ nonce, state: 'verified', expires_at: 'invalid' }, nonce, deadline - 1)).toBeUndefined();
    expect(usableBotProof({ nonce: 'bad', state: 'verified', expires_at }, 'bad', deadline - 1)).toBeUndefined();
    expect(usableBotProof(undefined, nonce, deadline - 1)).toBeUndefined();
  });
});
