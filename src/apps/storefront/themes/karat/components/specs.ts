/**
 * Jewellery facts for the Karat card — metal, karat (purity) and weight — read only from data the
 * product actually carries: variant options (`Metal` / `Karat` / `Weight`, English or Arabic keys),
 * the product `material` and tags such as `18k` or `4.2g`. Nothing is inferred or invented; a
 * product with none of these shows no spec line.
 */
import type { ProductCardModel } from '../../../types/catalog';

export interface JewelSpecs {
  readonly metal?: string;
  readonly karat?: string;
  readonly weight?: string;
}

const METAL_KEY = /metal|material|معدن|خامة|المادة/i;
const KARAT_KEY = /karat|carat|purity|fineness|عيار|قيراط|نقاء/i;
const WEIGHT_KEY = /weight|grams?|وزن|الوزن/i;
const KARAT_TAG = /^(\d{1,2})\s*(k|kt|karat|ct|قيراط)$/i;
const WEIGHT_TAG = /^(\d+(?:[.,]\d+)?)\s*(g|gr|gm|grams?|جم|جرام|غرام)$/i;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/** Distinct values of the first option key matching `re`, in variant order. */
function optionValues(product: ProductCardModel, re: RegExp): string[] {
  const out: string[] = [];
  for (const variant of product.variants ?? []) {
    for (const [key, raw] of Object.entries(variant.options ?? {})) {
      if (!re.test(key)) continue;
      const v = clean(raw);
      if (v && !out.includes(v)) out.push(v);
    }
  }
  return out;
}

/** "18K" / "18K · 21K" — at most two values so the line never wraps into a list. */
function summarise(values: ReadonlyArray<string>): string | undefined {
  if (values.length === 0) return undefined;
  return values.length > 2 ? `${values.slice(0, 2).join(' / ')} +` : values.join(' / ');
}

export function jewelSpecs(product: ProductCardModel): JewelSpecs {
  const tags = (product.tags ?? []).map(clean);
  const karatTag = tags.map((t) => KARAT_TAG.exec(t)).find(Boolean);
  const weightTag = tags.map((t) => WEIGHT_TAG.exec(t)).find(Boolean);

  const metal = summarise(optionValues(product, METAL_KEY)) ?? (clean(product.material) || undefined);
  const karat = summarise(optionValues(product, KARAT_KEY)) ?? (karatTag ? `${karatTag[1]}K` : undefined);
  const weight = summarise(optionValues(product, WEIGHT_KEY)) ?? (weightTag ? `${weightTag[1]!.replace(',', '.')} g` : undefined);

  return {
    ...(metal ? { metal } : {}),
    // Skip the karat when the metal already states it ("18K Gold").
    ...(karat && !(metal && metal.toLowerCase().includes(karat.toLowerCase())) ? { karat } : {}),
    ...(weight ? { weight } : {}),
  };
}

/** The spec line in display order: karat · metal · weight. */
export function specLine(specs: JewelSpecs): ReadonlyArray<string> {
  return [specs.karat, specs.metal, specs.weight].filter((v): v is string => Boolean(v));
}
