/**
 * Marketing > Email campaigns: block model, audience model and request bodies. Only active e-mail
 * newsletter subscribers are ever reached (the backend enforces it); the audience narrows them.
 */
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
export type BlockType = 'heading' | 'text' | 'image' | 'button' | 'products' | 'divider' | 'coupon';
export type Align = 'start' | 'center' | 'end';

export interface CampaignBlock {
  id: string;
  type: BlockType;
  text?: string | null;
  size?: 'large' | 'medium';
  html?: string;
  src?: string;
  alt?: string | null;
  url?: string | null;
  label?: string;
  align?: Align;
  product_ids?: number[];
  coupon_id?: number | null;
}

export interface SegmentFilters {
  orders_min?: string | number;
  orders_max?: string | number;
  spent_min?: string | number;
  spent_max?: string | number;
  last_order_from?: string;
  last_order_to?: string;
  first_order_from?: string;
  account?: '' | 'registered' | 'guest';
  tag?: string[];
}

export type Audience = { type: 'all' } | { type: 'tags'; tags: string[] } | { type: 'segment'; filters: SegmentFilters };

export interface CampaignForm {
  name: string;
  subject: string;
  preheader: string;
  from_name: string;
  reply_to: string;
  locale: 'ar' | 'en';
  content: CampaignBlock[];
  audience: Audience;
}

export const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed'];
export const BLOCK_TYPES: BlockType[] = ['heading', 'text', 'image', 'button', 'products', 'coupon', 'divider'];
export const MAX_BLOCKS = 40;
export const MAX_PRODUCTS = 12;

const STATUS_LABELS: Record<CampaignStatus, [string, string]> = {
  draft: ['مسودة', 'Draft'], scheduled: ['مجدولة', 'Scheduled'], sending: ['قيد الإرسال', 'Sending'],
  sent: ['تم الإرسال', 'Sent'], cancelled: ['ملغاة', 'Cancelled'], failed: ['فشلت', 'Failed'],
};
const BLOCK_LABELS: Record<BlockType, [string, string]> = {
  heading: ['عنوان', 'Heading'], text: ['نص', 'Text'], image: ['صورة', 'Image'], button: ['زر', 'Button'],
  products: ['منتجات', 'Products'], coupon: ['كود خصم', 'Discount code'], divider: ['فاصل', 'Divider'],
};

export function campaignStatusLabel(status: string, ar: boolean): string {
  const pair = STATUS_LABELS[status as CampaignStatus];
  return pair ? pair[ar ? 0 : 1] : status;
}

/** Badge tone for the shared index table. */
export function campaignStatusTone(status: string): string {
  return status === 'sent' ? 'is-success' : status === 'scheduled' || status === 'sending' ? 'is-info' : status === 'failed' ? 'is-critical' : status === 'cancelled' ? 'is-warning' : '';
}

export function blockLabel(type: string, ar: boolean): string {
  const pair = BLOCK_LABELS[type as BlockType];
  return pair ? pair[ar ? 0 : 1] : type;
}

let sequence = 0;
export function blockId(): string {
  sequence += 1;
  return `b${Date.now().toString(36)}${sequence.toString(36)}`;
}

export function newBlock(type: BlockType, id: string = blockId()): CampaignBlock {
  switch (type) {
    case 'heading': return { id, type, text: '', size: 'large', align: 'start' };
    case 'text': return { id, type, html: '', align: 'start' };
    case 'image': return { id, type, src: '', alt: '', url: '' };
    case 'button': return { id, type, label: '', url: '', align: 'center' };
    case 'products': return { id, type, product_ids: [] };
    case 'coupon': return { id, type, coupon_id: null, text: '' };
    default: return { id, type: 'divider' };
  }
}

/** Move the block at `index` by `delta` (-1 up, +1 down); out-of-range moves return the same list. */
export function moveBlock<T>(blocks: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (index < 0 || index >= blocks.length || target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item as T);
  return next;
}

/** Drag-and-drop reorder: the dragged block lands at the drop target's position. */
export function reorderBlock<T>(blocks: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return blocks;
  const next = [...blocks];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

export const emptyCampaignForm = (locale: 'ar' | 'en' = 'en'): CampaignForm => ({
  name: '', subject: '', preheader: '', from_name: '', reply_to: '', locale,
  content: [newBlock('heading'), newBlock('text'), newBlock('button')],
  audience: { type: 'all' },
});

const trimmed = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const optional = (value: unknown): string | null => trimmed(value) || null;

/** The audience the API expects: blank segment filters are dropped. */
export function audiencePayload(audience: Audience): Audience {
  if (audience.type === 'tags') return { type: 'tags', tags: audience.tags.map((tag) => tag.trim()).filter(Boolean) };
  if (audience.type === 'segment') {
    const filters: SegmentFilters = {};
    for (const [key, value] of Object.entries(audience.filters ?? {})) {
      if (Array.isArray(value)) { if (value.length) (filters as Record<string, unknown>)[key] = value; continue; }
      if (value !== '' && value !== null && value !== undefined) (filters as Record<string, unknown>)[key] = typeof value === 'string' ? value.trim() : value;
    }
    return { type: 'segment', filters };
  }
  return { type: 'all' };
}

/** One block as the API expects it (only that block type's fields, trimmed). */
export function blockPayload(block: CampaignBlock): CampaignBlock {
  const base = { id: block.id, type: block.type };
  switch (block.type) {
    case 'heading': return { ...base, text: trimmed(block.text), size: block.size === 'medium' ? 'medium' : 'large', align: block.align ?? 'start' };
    case 'text': return { ...base, html: block.html ?? '', align: block.align ?? 'start' };
    case 'image': return { ...base, src: trimmed(block.src), alt: optional(block.alt), url: optional(block.url) };
    case 'button': return { ...base, label: trimmed(block.label), url: trimmed(block.url), align: block.align ?? 'center' };
    case 'products': return { ...base, product_ids: [...new Set(block.product_ids ?? [])] };
    case 'coupon': return { ...base, coupon_id: block.coupon_id ?? null, text: optional(block.text) };
    default: return base;
  }
}

export function campaignPayload(form: CampaignForm): Record<string, unknown> {
  return {
    name: form.name.trim(),
    subject: optional(form.subject),
    preheader: optional(form.preheader),
    from_name: optional(form.from_name),
    reply_to: optional(form.reply_to),
    locale: form.locale,
    content: form.content.map(blockPayload),
    audience: audiencePayload(form.audience),
  };
}

/** A campaign from the API as editable form state. */
export function campaignForm(campaign: Record<string, unknown>, fallbackLocale: 'ar' | 'en' = 'en'): CampaignForm {
  const audience = (campaign.audience as Audience | undefined) ?? { type: 'all' };
  return {
    name: String(campaign.name ?? ''),
    subject: String(campaign.subject ?? ''),
    preheader: String(campaign.preheader ?? ''),
    from_name: String(campaign.from_name ?? ''),
    reply_to: String(campaign.reply_to ?? ''),
    locale: campaign.locale === 'ar' || campaign.locale === 'en' ? campaign.locale : fallbackLocale,
    content: Array.isArray(campaign.content) ? (campaign.content as CampaignBlock[]).map((block) => ({ ...block, id: block.id || blockId() })) : [],
    audience: audience.type === 'segment' ? { type: 'segment', filters: { ...(audience.filters ?? {}) } } : audience.type === 'tags' ? { type: 'tags', tags: [...(audience.tags ?? [])] } : { type: 'all' },
  };
}

/** Problems that block scheduling; the server checks the same, this only explains it earlier. */
export function sendBlockers(form: CampaignForm, ar: boolean): string[] {
  const text = (a: string, e: string): string => (ar ? a : e);
  const problems: string[] = [];
  if (!form.subject.trim()) problems.push(text('أضف سطر الموضوع.', 'Add a subject line.'));
  if (!form.content.length) problems.push(text('أضف محتوى واحدًا على الأقل.', 'Add at least one content block.'));
  return problems;
}

export const percent = (value: number | null | undefined, ar: boolean): string => (value === null || value === undefined ? '—' : `${new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { maximumFractionDigits: 1 }).format(value)}%`);
