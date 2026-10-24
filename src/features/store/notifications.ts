// Pure helpers for the merchant "Notifications" settings page and order card.
// Kept framework-free so they can be unit tested in the node environment.

export type Channel = 'email' | 'whatsapp';
export type Localized = { ar?: string; en?: string } | string | null | undefined;

export interface NotificationEventSettings {
  email_enabled: boolean;
  email_subject: string;
  email_body: string;
  whatsapp_enabled?: boolean;
  whatsapp_body?: string;
}

export interface NotificationSettings {
  sender_name: string | null;
  reply_to: string | null;
  staff_recipients: string[];
  events: Record<string, NotificationEventSettings>;
}

export interface CatalogEntry {
  key: string;
  audience: 'customer' | 'staff' | string;
  group: string;
  channels: Channel[];
  label?: Localized;
  description?: Localized;
}

export interface NotificationDelivery {
  id: string;
  event: string;
  channel: Channel;
  recipient: string | null;
  state: string;
  created_at: string | null;
  sent_at: string | null;
}

export const LIMITS = { senderName: 100, subject: 200, emailBody: 6000, whatsappBody: 3000, staffRecipients: 5 } as const;

export const DEFAULT_VARIABLES = ['customer_name', 'order_number', 'order_total', 'store_name', 'order_url', 'items', 'payment_method', 'shipping_address', 'tracking_number', 'carrier'];

/** Order in which catalog groups are rendered; unknown groups follow in catalog order. */
export const GROUP_ORDER = ['orders', 'shipping', 'staff'];

const TOKEN = /\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;

export const isEmail = (value: unknown): boolean => typeof value === 'string' && value.length <= 254 && EMAIL.test(value.trim());

/** E.164: leading +, country code, 8–15 digits total. Spaces, dashes and brackets are ignored. */
export const normalizePhone = (value: string): string => value.replace(/[\s\-().]/g, '');
export const isInternationalPhone = (value: unknown): boolean => typeof value === 'string' && PHONE.test(normalizePhone(value));

export function pickLocalized(value: Localized, ar: boolean, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (!value) return fallback;
  return (ar ? value.ar || value.en : value.en || value.ar) || fallback;
}

/** Every `{variable}` token used in a template, in order of first appearance. */
export function templateTokens(template: string | null | undefined): string[] {
  const seen = new Set<string>();
  for (const match of String(template ?? '').matchAll(TOKEN)) seen.add(match[1] as string);
  return [...seen];
}

/** Tokens used in the template that the server does not know about. */
export function unknownVariables(template: string | null | undefined, variables: readonly string[]): string[] {
  const known = new Set(variables);
  return templateTokens(template).filter((token) => !known.has(token));
}

/**
 * Inserts `{variable}` replacing the [start, end) selection. Returns the new value and
 * the caret position right after the inserted token. Out-of-range positions are clamped
 * and a missing selection appends at the end. `maxLength` refuses inserts that would overflow.
 */
export function insertVariable(value: string, variable: string, start?: number | null, end?: number | null, maxLength?: number): { value: string; caret: number } | null {
  const text = value ?? '';
  const from = Math.min(Math.max(start ?? text.length, 0), text.length);
  const to = Math.min(Math.max(end ?? from, from), text.length);
  const token = `{${variable}}`;
  const next = text.slice(0, from) + token + text.slice(to);
  if (maxLength !== undefined && next.length > maxLength) return null;
  return { value: next, caret: from + token.length };
}

export type ValidationIssue =
  | { field: string; code: 'required' }
  | { field: string; code: 'too_long'; max: number }
  | { field: string; code: 'unknown_variable'; tokens: string[] }
  | { field: string; code: 'invalid_email'; value: string }
  | { field: string; code: 'too_many'; max: number }
  | { field: string; code: 'duplicate'; value: string };

/** Validates one event's templates against the channels the catalog says it supports. */
export function validateEvent(key: string, value: NotificationEventSettings | undefined, channels: readonly Channel[], variables: readonly string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!value) return issues;
  const check = (field: keyof NotificationEventSettings, max: number, required: boolean) => {
    const name = `events.${key}.${field}`;
    const text = String(value[field] ?? '');
    if (required && !text.trim()) issues.push({ field: name, code: 'required' });
    if (text.length > max) issues.push({ field: name, code: 'too_long', max });
    const unknown = unknownVariables(text, variables);
    if (unknown.length) issues.push({ field: name, code: 'unknown_variable', tokens: unknown });
  };
  if (channels.includes('email')) {
    check('email_subject', LIMITS.subject, value.email_enabled);
    check('email_body', LIMITS.emailBody, value.email_enabled);
  }
  if (channels.includes('whatsapp') && value.whatsapp_body !== undefined) check('whatsapp_body', LIMITS.whatsappBody, Boolean(value.whatsapp_enabled));
  return issues;
}

/** Whole-page validation run before PUT. `ownerEmail` is always a recipient and never counted. */
export function validateSettings(settings: NotificationSettings, catalog: readonly CatalogEntry[], variables: readonly string[], ownerEmail?: string | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if ((settings.sender_name ?? '').length > LIMITS.senderName) issues.push({ field: 'sender_name', code: 'too_long', max: LIMITS.senderName });
  if (settings.reply_to && !isEmail(settings.reply_to)) issues.push({ field: 'reply_to', code: 'invalid_email', value: settings.reply_to });
  const recipients = settings.staff_recipients ?? [];
  if (recipients.length > LIMITS.staffRecipients) issues.push({ field: 'staff_recipients', code: 'too_many', max: LIMITS.staffRecipients });
  const seen = new Set<string>([String(ownerEmail ?? '').trim().toLowerCase()].filter(Boolean));
  recipients.forEach((email, index) => {
    const field = `staff_recipients.${index}`;
    const normalized = String(email ?? '').trim().toLowerCase();
    if (!isEmail(normalized)) issues.push({ field, code: 'invalid_email', value: email });
    else if (seen.has(normalized)) issues.push({ field, code: 'duplicate', value: email });
    seen.add(normalized);
  });
  for (const entry of catalog) issues.push(...validateEvent(entry.key, settings.events?.[entry.key], entry.channels, variables));
  return issues;
}

export const issuesFor = (issues: readonly ValidationIssue[], prefix: string): ValidationIssue[] => issues.filter((issue) => issue.field === prefix || issue.field.startsWith(`${prefix}.`));

/** Groups catalog rows into ordered sections; staff-audience rows always land in "staff". */
export function groupCatalog(catalog: readonly CatalogEntry[]): { group: string; entries: CatalogEntry[] }[] {
  const groups = new Map<string, CatalogEntry[]>();
  for (const entry of catalog) {
    const group = entry.audience === 'staff' ? 'staff' : entry.group || 'orders';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(entry);
  }
  const rank = (group: string) => { const index = GROUP_ORDER.indexOf(group); return index === -1 ? GROUP_ORDER.length : index; };
  return [...groups.entries()].map(([group, entries]) => ({ group, entries })).sort((a, b) => rank(a.group) - rank(b.group));
}

/**
 * Display-safe recipient. The API already masks values; this is a defensive second pass so
 * a raw email or phone never reaches the screen if the server ever returns one unmasked.
 */
export function maskRecipient(value: string | null | undefined): string {
  const text = String(value ?? '').trim();
  if (!text) return '—';
  if (text.includes('*')) return text;
  const at = text.lastIndexOf('@');
  if (at > 0) return `${text[0]}***${text.slice(at)}`;
  const digits = normalizePhone(text);
  if (/^\+?\d{6,}$/.test(digits)) return `${digits.startsWith('+') ? '+' : ''}***${digits.slice(-3)}`;
  return text.length > 4 ? `${text.slice(0, 2)}***` : '***';
}

/** Unique (event, channel) pairs the merchant may resend: customer events only, newest first. */
export function resendTargets(deliveries: readonly NotificationDelivery[], customerEvents: ReadonlySet<string>): { event: string; channel: Channel }[] {
  const seen = new Set<string>();
  const targets: { event: string; channel: Channel }[] = [];
  for (const row of deliveries) {
    if (!customerEvents.has(row.event) || (row.channel !== 'email' && row.channel !== 'whatsapp')) continue;
    const id = `${row.event}:${row.channel}`;
    if (seen.has(id)) continue;
    seen.add(id);
    targets.push({ event: row.event, channel: row.channel });
  }
  return targets;
}

/** Canonicalises staff recipients before saving: trimmed, lower-cased, de-duplicated, blanks dropped. */
export function normalizeRecipients(list: readonly string[]): string[] {
  return [...new Set(list.map((email) => String(email ?? '').trim().toLowerCase()).filter(Boolean))];
}

/** Pulls a template-only snapshot for one event (what "restore last saved" brings back). */
export function eventTemplate(value: NotificationEventSettings | undefined): Pick<NotificationEventSettings, 'email_subject' | 'email_body' | 'whatsapp_body'> {
  const template: Pick<NotificationEventSettings, 'email_subject' | 'email_body' | 'whatsapp_body'> = { email_subject: value?.email_subject ?? '', email_body: value?.email_body ?? '' };
  if (value?.whatsapp_body !== undefined) template.whatsapp_body = value.whatsapp_body;
  return template;
}

/** True when the event's saved templates differ from the edited ones (test sends use the saved copy). */
export function eventChanged(saved: NotificationEventSettings | undefined, current: NotificationEventSettings | undefined): boolean {
  return JSON.stringify(eventTemplate(saved)) !== JSON.stringify(eventTemplate(current));
}
