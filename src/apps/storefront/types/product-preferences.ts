export interface ProductPreferences {
  is_skip_cart?: boolean;
  buy_now_text?: string;
  is_fixed_bottom_buy?: boolean;
  is_reviews_enabled?: boolean;
  is_one_page_checkout?: boolean;
  is_free_shipping?: boolean;
  is_fake_visitors?: boolean;
  fake_visitors_min?: number;
  fake_visitors_max?: number;
  is_fake_stock?: boolean;
  fake_stock_count?: number;
  is_fake_timer?: boolean;
  fake_timer_hours?: number;
  is_header_hidden?: boolean;
  is_quantity_hidden?: boolean;
  is_checkout_before_description?: boolean;
  hide_related_products?: boolean;
}

export function productPreferences(value: unknown): ProductPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>; const result: Record<string, unknown> = {};
  for (const key of ['is_skip_cart', 'is_fixed_bottom_buy', 'is_reviews_enabled', 'is_one_page_checkout', 'is_free_shipping', 'is_fake_visitors', 'is_fake_stock', 'is_fake_timer', 'is_header_hidden', 'is_quantity_hidden', 'is_checkout_before_description', 'hide_related_products']) {
    if (typeof input[key] === 'boolean') result[key] = input[key];
  }
  if (typeof input['buy_now_text'] === 'string' && input['buy_now_text'].trim()) result['buy_now_text'] = input['buy_now_text'].trim().slice(0, 120);
  for (const key of ['fake_visitors_min', 'fake_visitors_max', 'fake_stock_count', 'fake_timer_hours']) {
    const number = input[key];
    if (typeof number === 'number' && Number.isInteger(number) && number >= (key === 'fake_timer_hours' ? 1 : 0) && number <= (key === 'fake_timer_hours' ? 720 : 1_000_000)) result[key] = number;
  }
  return result as ProductPreferences;
}
