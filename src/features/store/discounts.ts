// Pure helpers for the merchant "Discounts" pages (list + form). The API still lives under
// `/coupons`; a discount is redeemed with a code or applies automatically. Framework-free so the
// summaries, payload and error mapping are unit tested in the node environment.

export type DiscountMethod = 'code' | 'automatic';
export type DiscountType = 'fixed' | 'percentage' | 'free_shipping' | 'buy_x_get_y';
export type DiscountScope = 'all' | 'products' | 'categories';
export type Requirement = 'none' | 'amount' | 'quantity';

export const DISCOUNT_TYPES: DiscountType[] = ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'];
export const DISCOUNT_SCOPES: DiscountScope[] = ['all', 'products', 'categories'];

export interface DiscountBxgy {
  buy_quantity: number;
  buy_applies_to?: DiscountScope | null;
  buy_ids?: number[] | null;
  get_quantity: number;
  get_applies_to?: DiscountScope | null;
  get_ids?: number[] | null;
  get_percent: number;
  max_uses_per_order?: number | null;
}

/** A discount as the API returns it (CouponResource). */
export interface Discount {
  id?: number;
  method?: DiscountMethod | null;
  code?: string | null;
  title?: string | null;
  type: DiscountType;
  value?: string | number | null;
  applies_to?: DiscountScope | null;
  target_ids?: number[] | null;
  minimum_quantity?: number | null;
  minimum_order_amount?: string | number | null;
  bxgy?: DiscountBxgy | null;
  starts_at?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  max_uses_per_customer?: number | null;
  is_active?: boolean;
  used_count?: number;
}

/** Names of the products/categories a summary may mention, keyed by id. */
export interface DiscountNames {
  products?: Record<string, string>;
  categories?: Record<string, string>;
}

export interface SummaryOptions {
  ar: boolean;
  money: (value: number) => string;
  names?: DiscountNames;
}

const words = (ar: boolean) => (a: string, e: string): string => (ar ? a : e);

export function discountTypeLabel(type: string, ar: boolean): string {
  const text = words(ar);
  switch (type) {
    case 'percentage': return text('نسبة مئوية', 'Percentage');
    case 'fixed': return text('مبلغ ثابت', 'Fixed amount');
    case 'free_shipping': return text('شحن مجاني', 'Free shipping');
    case 'buy_x_get_y': return text('اشترِ X واحصل على Y', 'Buy X get Y');
    default: return type;
  }
}

export function discountMethodLabel(method: string | null | undefined, ar: boolean): string {
  return method === 'automatic' ? words(ar)('تلقائي', 'Automatic') : words(ar)('كود خصم', 'Code');
}

/** What shoppers and the list show: the title, else the code. */
export function discountName(discount: Pick<Discount, 'title' | 'code'>): string {
  return (discount.title ?? '').trim() || (discount.code ?? '').trim() || '—';
}

/** "Tops", "Tops, Shoes", "3 products" — names when known and short, otherwise a count. */
export function scopeText(scope: DiscountScope | null | undefined, ids: ReadonlyArray<number> | null | undefined, options: SummaryOptions, allText?: string): string {
  const text = words(options.ar);
  const list = Array.isArray(ids) ? ids : [];
  if (!scope || scope === 'all' || !list.length) return allText ?? text('الطلب بالكامل', 'entire order');
  const map = scope === 'categories' ? options.names?.categories : options.names?.products;
  const named = list.map((id) => map?.[String(id)]).filter((name): name is string => Boolean(name));
  if (named.length === list.length && list.length <= 2) return named.join(options.ar ? '، ' : ', ');
  if (scope === 'categories') return list.length === 1 ? text('قسم واحد', '1 category') : text(`${list.length} أقسام`, `${list.length} categories`);
  return list.length === 1 ? text('منتج واحد', '1 product') : text(`${list.length} منتجات`, `${list.length} products`);
}

/** A plain-language summary, e.g. "10% off Tops · min 3 items" or "Buy 2 get 1 free". */
export function summarizeDiscount(discount: Discount, options: SummaryOptions): string {
  const text = words(options.ar);
  const parts: string[] = [];
  const minQty = Number(discount.minimum_quantity) || 0;
  const minAmount = Number(discount.minimum_order_amount) || 0;
  const value = Number(discount.value) || 0;

  if (discount.type === 'buy_x_get_y') {
    const config = discount.bxgy;
    const buy = Number(config?.buy_quantity) || 1;
    const get = Number(config?.get_quantity) || 1;
    const percent = Number(config?.get_percent) || 100;
    const from = (scope?: DiscountScope | null, ids?: number[] | null): string => (scope && scope !== 'all' && ids?.length ? ` ${text('من', 'from')} ${scopeText(scope, ids, options)}` : '');
    const reward = percent >= 100 ? text('مجانًا', 'free') : text(`بخصم ${percent}%`, `at ${percent}% off`);
    parts.push(options.ar
      ? `اشترِ ${buy}${from(config?.buy_applies_to, config?.buy_ids)} واحصل على ${get}${from(config?.get_applies_to, config?.get_ids)} ${reward}`
      : `Buy ${buy}${from(config?.buy_applies_to, config?.buy_ids)} get ${get}${from(config?.get_applies_to, config?.get_ids)} ${reward}`);
    if (config?.max_uses_per_order) parts.push(text(`حتى ${config.max_uses_per_order} مرات لكل طلب`, `up to ${config.max_uses_per_order} per order`));
    return parts.join(' · ');
  }

  if (discount.type === 'free_shipping') {
    parts.push(minAmount > 0 ? text(`شحن مجاني للطلبات فوق ${options.money(minAmount)}`, `Free shipping over ${options.money(minAmount)}`) : text('شحن مجاني', 'Free shipping'));
    if (minQty > 0) parts.push(text(`حد أدنى ${minQty} قطع`, `min ${minQty} items`));
    return parts.join(' · ');
  }

  const amount = discount.type === 'percentage' ? `${value}%` : options.money(value);
  const scope = scopeText(discount.applies_to, discount.target_ids, options);
  parts.push(options.ar ? `خصم ${amount} على ${scope}` : `${amount} off ${scope}`);
  if (minAmount > 0) parts.push(text(`حد أدنى للطلب ${options.money(minAmount)}`, `min order ${options.money(minAmount)}`));
  if (minQty > 0) parts.push(text(`حد أدنى ${minQty} قطع`, `min ${minQty} items`));
  return parts.join(' · ');
}

/** The editable form state; numbers stay strings while typing. */
export interface DiscountForm {
  method: DiscountMethod;
  type: DiscountType;
  code: string;
  title: string;
  value: string;
  applies_to: DiscountScope;
  target_ids: number[];
  requirement: Requirement;
  minimum_order_amount: string;
  minimum_quantity: string;
  buy_quantity: string;
  buy_applies_to: DiscountScope;
  buy_ids: number[];
  get_quantity: string;
  get_applies_to: DiscountScope;
  get_ids: number[];
  get_free: boolean;
  get_percent: string;
  max_uses_per_order: string;
  max_uses: string;
  max_uses_per_customer: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

export function emptyDiscountForm(): DiscountForm {
  return {
    method: 'code', type: 'percentage', code: '', title: '', value: '', applies_to: 'all', target_ids: [],
    requirement: 'none', minimum_order_amount: '', minimum_quantity: '',
    buy_quantity: '1', buy_applies_to: 'all', buy_ids: [], get_quantity: '1', get_applies_to: 'all', get_ids: [], get_free: true, get_percent: '50', max_uses_per_order: '',
    max_uses: '', max_uses_per_customer: '', starts_at: '', expires_at: '', is_active: true,
  };
}

const str = (value: unknown): string => (value === null || value === undefined ? '' : String(value));
const ids = (value: unknown): number[] => (Array.isArray(value) ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0) : []);
const scope = (value: unknown): DiscountScope => (value === 'products' || value === 'categories' ? value : 'all');
const day = (value: unknown): string => (value ? String(value).slice(0, 10) : '');

export function discountFormFromApi(discount: Discount): DiscountForm {
  const base = emptyDiscountForm();
  const bxgy = discount.bxgy;
  const percent = Number(bxgy?.get_percent) || 100;
  const minAmount = Number(discount.minimum_order_amount) || 0;
  const minQty = Number(discount.minimum_quantity) || 0;
  return {
    ...base,
    method: discount.method === 'automatic' ? 'automatic' : 'code',
    type: DISCOUNT_TYPES.includes(discount.type) ? discount.type : 'percentage',
    code: str(discount.code), title: str(discount.title),
    value: discount.type === 'fixed' || discount.type === 'percentage' ? str(discount.value) : '',
    applies_to: scope(discount.applies_to), target_ids: ids(discount.target_ids),
    requirement: minQty > 0 ? 'quantity' : minAmount > 0 ? 'amount' : 'none',
    minimum_order_amount: minAmount > 0 ? str(discount.minimum_order_amount) : '',
    minimum_quantity: minQty > 0 ? String(minQty) : '',
    ...(bxgy ? {
      buy_quantity: str(bxgy.buy_quantity || 1), buy_applies_to: scope(bxgy.buy_applies_to), buy_ids: ids(bxgy.buy_ids),
      get_quantity: str(bxgy.get_quantity || 1), get_applies_to: scope(bxgy.get_applies_to), get_ids: ids(bxgy.get_ids),
      get_free: percent >= 100, get_percent: percent >= 100 ? base.get_percent : String(percent), max_uses_per_order: str(bxgy.max_uses_per_order),
    } : {}),
    max_uses: str(discount.max_uses), max_uses_per_customer: str(discount.max_uses_per_customer),
    starts_at: day(discount.starts_at), expires_at: day(discount.expires_at), is_active: discount.is_active !== false,
  };
}

const intOrNull = (value: string): number | null => (value.trim() === '' ? null : Number(value));

/** The StoreCouponRequest payload: fields that do not apply to the chosen method/type are cleared. */
export function discountPayload(form: DiscountForm): Record<string, unknown> {
  const valued = form.type === 'fixed' || form.type === 'percentage';
  const bxgy = form.type === 'buy_x_get_y';
  const requirement = bxgy ? 'none' : form.requirement;
  return {
    method: form.method,
    code: form.method === 'code' ? form.code.trim().toUpperCase() : null,
    title: form.title.trim() || null,
    type: form.type,
    value: valued ? form.value : null,
    applies_to: valued ? form.applies_to : 'all',
    target_ids: valued && form.applies_to !== 'all' ? form.target_ids : null,
    minimum_order_amount: requirement === 'amount' && form.minimum_order_amount !== '' ? form.minimum_order_amount : null,
    minimum_quantity: requirement === 'quantity' ? intOrNull(form.minimum_quantity) : null,
    bxgy: bxgy ? {
      buy_quantity: Number(form.buy_quantity),
      buy_applies_to: form.buy_applies_to,
      buy_ids: form.buy_applies_to === 'all' ? null : form.buy_ids,
      get_quantity: Number(form.get_quantity),
      get_applies_to: form.get_applies_to,
      get_ids: form.get_applies_to === 'all' ? null : form.get_ids,
      get_percent: form.get_free ? 100 : Number(form.get_percent),
      max_uses_per_order: intOrNull(form.max_uses_per_order),
    } : null,
    starts_at: form.starts_at || null,
    expires_at: form.expires_at || null,
    max_uses: intOrNull(form.max_uses),
    max_uses_per_customer: intOrNull(form.max_uses_per_customer),
    is_active: form.is_active,
  };
}

/** The live summary for the form (same wording as the list). */
export function summarizeForm(form: DiscountForm, options: SummaryOptions): string {
  const payload = discountPayload(form) as unknown as Discount;
  return summarizeDiscount(payload, options);
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A readable random code (no 0/O/1/I). */
export function generateDiscountCode(length = 8, random: (max: number) => number = secureRandom): string {
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}

function secureRandom(max: number): number {
  const cryptoApi = (globalThis as { crypto?: { getRandomValues?: (array: Uint32Array) => Uint32Array } }).crypto;
  if (cryptoApi?.getRandomValues) return cryptoApi.getRandomValues(new Uint32Array(1))[0]! % max;
  return Math.floor(Math.random() * max);
}

/**
 * Laravel 422 `errors` → first message per form field. Array entries (`target_ids.0`,
 * `bxgy.get_ids.2`) fold onto their list field so the picker shows them.
 */
export function discountFieldErrors(errors: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!errors || typeof errors !== 'object') return out;
  for (const [key, messages] of Object.entries(errors as Record<string, unknown>)) {
    const field = key.replace(/\.\d+$/, '');
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (typeof message === 'string' && !(field in out)) out[field] = message;
  }
  return out;
}
