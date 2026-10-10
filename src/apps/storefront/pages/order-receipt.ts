const memory = new Map<string, string>();
const key = (number: string): string => `sf:order-receipt:v1:${window.location.origin}:${number}`;
const valid = (token: string): boolean => token.length <= 1000 && /^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(token);

export function saveOrderReceipt(number: string, token: string): void {
  if (!valid(token)) return;
  memory.set(key(number), token);
  try { sessionStorage.setItem(key(number), token); } catch { /* Keep the current tab receipt available. */ }
}

export function readOrderReceipt(number: string | null): string | undefined {
  if (!number) return undefined;
  const fragment = new URLSearchParams(window.location.hash.slice(1)).get('receipt');
  if (fragment && valid(fragment)) {
    saveOrderReceipt(number, fragment);
    return fragment;
  }
  try {
    const token = sessionStorage.getItem(key(number));
    if (token && valid(token)) return token;
  } catch { /* Storage may be unavailable. */ }
  return memory.get(key(number));
}
