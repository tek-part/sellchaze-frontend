/**
 * Filter panel and active-filter chips.
 *
 * One implementation for all four themes; every visual decision belongs to the theme via `ns`.
 * Groups render only when the derived facet has options, so a sparse live catalogue shows a short
 * honest panel rather than a wall of empty accordions.
 *
 * Groups are native `<details>`: open/closed state, keyboard operation and screen-reader semantics
 * come for free, and the panel still works if JavaScript for the surrounding page is slow to boot.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../shared/utils/cn';
import { block, el, mod, DEFAULT_NS, type ClassNamespace } from './ns';
import { RangeSlider } from './RangeSlider';
import {
  LIST_FACETS,
  activeFilterCount,
  filterChips,
  removeChip,
  toggleFacetValue,
  type FacetOption,
  type Facets,
  type FilterState,
  type ListFacetKey,
} from './filters';

const GROUP_LABELS: Record<ListFacetKey, string> = {
  categories: 'Category',
  brands: 'Brand',
  colors: 'Colour',
  sizes: 'Size',
  materials: 'Material',
  tags: 'Tag',
};

export interface FilterPanelProps {
  facets: Facets;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  currency: string;
  ns?: ClassNamespace;
  className?: string;
  /** Formats prices in the range slider and its chip. */
  formatPrice?: (n: number) => string;
}

function CheckboxRow(props: {
  ns: ClassNamespace;
  option: FacetOption;
  checked: boolean;
  onToggle: () => void;
}): ReactElement {
  const { ns, option, checked, onToggle } = props;
  return (
    <li>
      <label className={el('filters', 'row', ns)}>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        {option.swatch ? (
          <span className={el('filters', 'swatch', ns)} style={{ background: option.swatch }} aria-hidden />
        ) : null}
        <span className={el('filters', 'label', ns)}>{option.label}</span>
        <span className={el('filters', 'count', ns)}>{option.count}</span>
      </label>
    </li>
  );
}

export function FilterPanel(props: FilterPanelProps): ReactElement {
  const { facets, filters, onChange, currency, ns = DEFAULT_NS, className, formatPrice } = props;
  const fmt = formatPrice ?? ((n: number): string => `${currency === 'USD' ? '$' : ''}${Math.round(n)}`);
  const bounds = facets.priceBounds;

  return (
    <div className={cn(block('filters', ns), className)}>
      {/* Availability & offers — the two toggles shoppers reach for most, so they lead. */}
      <details className={el('filters', 'group', ns)} open>
        <summary className={el('filters', 'summary', ns)}>Availability</summary>
        <ul className={el('filters', 'list', ns)}>
          <li>
            <label className={el('filters', 'row', ns)}>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
              />
              <span className={el('filters', 'label', ns)}>In stock only</span>
              <span className={el('filters', 'count', ns)}>{facets.inStockCount}</span>
            </label>
          </li>
          {facets.onSaleCount > 0 ? (
            <li>
              <label className={el('filters', 'row', ns)}>
                <input
                  type="checkbox"
                  checked={filters.onSaleOnly}
                  onChange={() => onChange({ ...filters, onSaleOnly: !filters.onSaleOnly })}
                />
                <span className={el('filters', 'label', ns)}>On sale</span>
                <span className={el('filters', 'count', ns)}>{facets.onSaleCount}</span>
              </label>
            </li>
          ) : null}
        </ul>
      </details>

      {bounds.max > bounds.min ? (
        <details className={el('filters', 'group', ns)} open>
          <summary className={el('filters', 'summary', ns)}>Price</summary>
          <RangeSlider
            ns={ns}
            min={bounds.min}
            max={bounds.max}
            step={Math.max(1, Math.round((bounds.max - bounds.min) / 100))}
            value={filters.price ?? bounds}
            format={fmt}
            onChange={(price) => onChange({ ...filters, price })}
          />
        </details>
      ) : null}

      {LIST_FACETS.map((facet) =>
        facets[facet].length > 0 ? (
          <details key={facet} className={el('filters', 'group', ns)} open={facet === 'categories' || facet === 'brands'}>
            <summary className={el('filters', 'summary', ns)}>{GROUP_LABELS[facet]}</summary>
            <ul className={cn(el('filters', 'list', ns), facet === 'colors' && mod('filters', 'swatches', ns))}>
              {facets[facet].map((option) => (
                <CheckboxRow
                  key={option.value}
                  ns={ns}
                  option={option}
                  checked={filters[facet].includes(option.value)}
                  onToggle={() => onChange(toggleFacetValue(filters, facet, option.value))}
                />
              ))}
            </ul>
          </details>
        ) : null,
      )}

      {facets.ratings.length > 0 ? (
        <details className={el('filters', 'group', ns)}>
          <summary className={el('filters', 'summary', ns)}>Rating</summary>
          <ul className={el('filters', 'list', ns)}>
            {facets.ratings.map((option) => (
              <li key={option.value}>
                <label className={el('filters', 'row', ns)}>
                  <input
                    type="radio"
                    name={`${ns}-rating`}
                    checked={filters.minRating === Number(option.value)}
                    onChange={() => onChange({ ...filters, minRating: Number(option.value) })}
                  />
                  <span className={el('filters', 'label', ns)}>{option.label}</span>
                  <span className={el('filters', 'count', ns)}>{option.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {facets.discounts.length > 0 ? (
        <details className={el('filters', 'group', ns)}>
          <summary className={el('filters', 'summary', ns)}>Discount</summary>
          <ul className={el('filters', 'list', ns)}>
            {facets.discounts.map((option) => (
              <li key={option.value}>
                <label className={el('filters', 'row', ns)}>
                  <input
                    type="radio"
                    name={`${ns}-discount`}
                    checked={filters.minDiscount === Number(option.value)}
                    onChange={() => onChange({ ...filters, minDiscount: Number(option.value) })}
                  />
                  <span className={el('filters', 'label', ns)}>{option.label}</span>
                  <span className={el('filters', 'count', ns)}>{option.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export interface FilterChipsProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  currency: string;
  ns?: ClassNamespace;
  className?: string;
}

export function FilterChips(props: FilterChipsProps): ReactElement | null {
  const { filters, onChange, onClear, currency, ns = DEFAULT_NS, className } = props;
  const chips = filterChips(filters, currency);
  if (chips.length === 0) return null;

  return (
    <div className={cn(block('chips', ns), className)}>
      {/*
        aria-live so removing a chip is announced — a sighted user sees the grid change, a screen
        reader user would otherwise get no confirmation the filter was dropped.
      */}
      <ul className={el('chips', 'list', ns)} aria-live="polite">
        {chips.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              className={el('chips', 'chip', ns)}
              onClick={() => onChange(removeChip(filters, chip))}
            >
              <span>{chip.label}</span>
              <span aria-hidden>×</span>
              <span className="sr-only">Remove filter</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={el('chips', 'clear', ns)} onClick={onClear}>
        Clear all ({activeFilterCount(filters)})
      </button>
    </div>
  );
}
