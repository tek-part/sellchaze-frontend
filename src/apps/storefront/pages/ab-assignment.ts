type Assignment = { token: string; product_id: number; expires_at: string };
const memory = new Map<string, string>();
const prefix = 'sf:ab:v1:';
function read(key: string): string | null {
  try { return localStorage.getItem(prefix + key) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; }
}
function write(key: string, value: string): void {
  memory.set(key, value);
  try { localStorage.setItem(prefix + key, value); } catch { /* In-memory fallback for restricted storage. */ }
}
export function abVisitor(store: number | string): string {
  const key = `${store}:visitor`;
  try {
    const value = JSON.parse(read(key) ?? 'null') as { id: string; expires: number } | null;
    if (value && /^[a-f0-9-]{36}$/i.test(value.id) && value.expires > Date.now()) return value.id;
  } catch { /* Invalid or expired visitor state starts a new observation window. */ }
  const visitor = crypto.randomUUID(); write(key, JSON.stringify({ id: visitor, expires: Date.now() + 30 * 86400000 })); return visitor;
}
export function saveAbAssignment(store: number | string, assignment: Assignment): void {
  if (/^[a-f0-9]{64}$/.test(assignment.token) && Number.isSafeInteger(assignment.product_id) && assignment.product_id > 0 && Number.isFinite(Date.parse(assignment.expires_at))) {
    write(`${store}:assignment`, JSON.stringify(assignment));
  }
}
export function abCheckoutToken(store: number | string, productIds: ReadonlyArray<number>, now = Date.now()): string | undefined {
  try {
    const value = JSON.parse(read(`${store}:assignment`) ?? 'null') as Assignment | null;
    if (value && /^[a-f0-9]{64}$/.test(value.token) && Date.parse(value.expires_at) > now && productIds.includes(value.product_id)) return value.token;
  } catch { /* An invalid client hint is ignored; the server owns attribution. */ }
  return undefined;
}
