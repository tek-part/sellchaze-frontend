import { describe, expect, it } from 'vitest';
import { verifiedPhoneProof, type PhoneChallenge } from './usePhoneVerification';

const now = Date.parse('2026-10-10T12:00:00Z');
const challenge: PhoneChallenge = { phone: '01001234567', token: 'a'.repeat(64), result: { state: 'verified', phone: '+201001234567',
  expires_at: '2026-10-10T12:05:00Z', resend_at: '2026-10-10T12:01:00Z', proof_expires_at: '2026-10-10T12:05:00Z' } };

describe('phone verification proof submitted with checkout', () => {
  it('permits a verified current phone before the proof deadline', () => { expect(verifiedPhoneProof(challenge, ' 01001234567 ', now)).toBe(challenge.token); });
  it('never submits a proof for a changed phone', () => { expect(verifiedPhoneProof(challenge, '+201001234568', now)).toBeUndefined(); });
  it('rejects exact expiry and missing or invalid deadlines', () => {
    expect(verifiedPhoneProof(challenge, challenge.phone, now + 300000)).toBeUndefined();
    for (const value of [null, 'invalid']) expect(verifiedPhoneProof({ ...challenge, result: { ...challenge.result!, proof_expires_at: value } }, challenge.phone, now)).toBeUndefined();
  });
  it('never treats sending, uncertain delivery or used proof as verification', () => {
    for (const state of ['dispatching', 'sent', 'uncertain', 'failed', 'superseded', 'used']) expect(verifiedPhoneProof({ ...challenge, result: { ...challenge.result!, state } }, challenge.phone, now)).toBeUndefined();
    expect(verifiedPhoneProof({ ...challenge, token: 'short' }, challenge.phone, now)).toBeUndefined();
    expect(verifiedPhoneProof(undefined, challenge.phone, now)).toBeUndefined();
  });
});
