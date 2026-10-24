/**
 * Size / volume label for a beauty product card — "30 ml", "15 / 30 / 50 ml", "Travel · Full size".
 * Read from the variant option named size/volume first (that is what the shopper picks), then the
 * product's `sizes` facet. Units are localised for Arabic (ml → مل, g → غ). Pure + tested.
 */
import type { ProductCardModel } from '../../../types/catalog';

const SIZE_KEY = /size|volume|capacity|حجم|الحجم|مقاس|المقاس|السعة|سعة/i;
const VOLUME = /^\s*(\d+(?:[.,]\d+)?)\s*(ml|mL|ML|l|g|gm|gr|kg|oz|fl\.?\s?oz|مل|ملل|غ|غرام|جم|جرام|لتر)\s*$/;

const AR_WORDS: Readonly<Record<string, string>> = { travel: 'حجم السفر', 'travel size': 'حجم السفر', mini: 'ميني', 'full size': 'الحجم الكامل', refill: 'عبوة تعبئة' };

const AR_UNIT: Readonly<Record<string, string>> = { ml: 'مل', l: 'لتر', g: 'غ', gm: 'غ', gr: 'غ', kg: 'كغ', oz: 'أونصة' };

function unitFor(raw: string, ar: boolean): string {
  const key = raw.toLowerCase().replace(/\s|\./g, '');
  const normal = key === 'floz' ? 'fl oz' : key === 'gm' || key === 'gr' ? 'g' : key;
  if (!ar) return normal;
  return AR_UNIT[key] ?? (key === 'floz' ? 'أونصة' : raw);
}

export function sizeValues(product: ProductCardModel): ReadonlyArray<string> {
  const fromVariants: string[] = [];
  for (const v of product.variants ?? []) {
    const entry = Object.entries(v.options ?? {}).find(([k]) => SIZE_KEY.test(k));
    const value = entry?.[1]?.trim();
    if (value && !fromVariants.includes(value)) fromVariants.push(value);
  }
  if (fromVariants.length > 0) return fromVariants;
  return (product.sizes ?? []).map((s) => s.trim()).filter((s, i, all) => s !== '' && all.indexOf(s) === i);
}

export function sizeLabel(product: ProductCardModel, locale = 'en'): string {
  const values = sizeValues(product);
  if (values.length === 0) return '';
  const ar = locale.startsWith('ar');
  const parsed = values.map((v) => VOLUME.exec(v));
  if (parsed.every((m) => m !== null)) {
    const units = new Set(parsed.map((m) => unitFor(m![2]!, ar)));
    if (units.size === 1) {
      const unit = [...units][0]!;
      const nums = parsed.map((m) => m![1]!.replace(',', '.'));
      const shown = nums.length > 3 ? [nums[0]!, nums[nums.length - 1]!] : nums;
      return `${shown.join(nums.length > 3 ? ' – ' : ' / ')} ${unit}`;
    }
  }
  const words = ar ? values.map((v) => AR_WORDS[v.toLowerCase()] ?? v) : values;
  if (words.length > 3) return `${words[0]} – ${words[words.length - 1]}`;
  return words.join(' · ');
}
