import { describe, expect, it } from 'vitest';
import { asciiDigits, codeFromHash, takeReturnedCode, newRequestToken, newVerifier, orderStatusKey, saveGoogleAttempt, sha256Hex, takeGoogleAttempt } from './customer-login';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('customer sign-in helpers', () => {
  it('creates request tokens and verifiers in the shapes the API accepts', () => {
    expect(newRequestToken()).toMatch(/^[a-f0-9]{64}$/);
    expect(newVerifier()).toMatch(/^[A-Za-z0-9]{64}$/);
    expect(newVerifier()).not.toBe(newVerifier());
  });

  it('hashes the verifier as lowercase hex SHA-256', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hands the Google attempt back once and only with a safe return path', () => {
    const storage = memoryStorage();
    const verifier = 'a'.repeat(64);
    saveGoogleAttempt({ verifier, next: '/checkout' }, storage);
    expect(takeGoogleAttempt(storage)).toEqual({ verifier, next: '/checkout' });
    expect(takeGoogleAttempt(storage)).toBeNull();
    saveGoogleAttempt({ verifier, next: '//evil.example' }, storage);
    expect(takeGoogleAttempt(storage)).toEqual({ verifier, next: '/account' });
    saveGoogleAttempt({ verifier: 'short', next: '/account' }, storage);
    expect(takeGoogleAttempt(storage)).toBeNull();
    storage.setItem('sf:google-login', '{not json');
    expect(takeGoogleAttempt(storage)).toBeNull();
  });

  it('reads only a well-formed one-time code from the fragment', () => {
    const code = 'Ab1'.repeat(21) + 'x';
    expect(codeFromHash(`#code=${code}`)).toBe(code);
    expect(codeFromHash('#code=short')).toBeNull();
    expect(codeFromHash('#code=' + '-'.repeat(64))).toBeNull();
    expect(codeFromHash('')).toBeNull();
  });

  it('takes the return code from the early inline script once, else from the fragment', () => {
    const code = 'Z9'.repeat(32);
    let stash: string | null = code;
    const take = (): string | null => { const value = stash; stash = null; return value; };
    const location = { hash: '' } as Location;
    expect(takeReturnedCode({ __sfGoogleCode: take, location })).toBe(code);
    expect(takeReturnedCode({ __sfGoogleCode: take, location })).toBeNull();
    expect(takeReturnedCode({ location: { hash: `#code=${code}` } as Location })).toBe(code);
    stash = 'not-a-code';
    expect(takeReturnedCode({ __sfGoogleCode: take, location: { hash: `#code=${code}` } as Location })).toBeNull();
  });

  it('turns Arabic-Indic digits into ASCII and maps order statuses to copy keys', () => {
    expect(asciiDigits('٠١٢٣٤٥٦٧٨٩ ۱۲')).toBe('0123456789 12');
    expect(orderStatusKey('shipped')).toBe('track.status_shipped');
    expect(orderStatusKey('placed')).toBe('track.status_placed');
    expect(orderStatusKey('future_status')).toBe('track.status_other');
  });
});
