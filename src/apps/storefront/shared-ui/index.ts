/**
 * Shared storefront UI — ONE implementation of primitives every theme needs, with all visual
 * decisions delegated to the theme via the class namespace (see ./ns).
 *
 * Rule: a primitive belongs here when its *behaviour* is identical across themes (keyboard handling,
 * ARIA wiring, range maths, sorting) and only its *skin* differs. Anything whose structure is part
 * of a theme's identity — hero, product card, gallery — stays in the theme.
 */
export { block, el, mod, DEFAULT_NS, type ClassNamespace } from './ns';
export { Pagination, buildRange, type PaginationProps } from './Pagination';
export { EmptyState, ErrorState, type EmptyStateProps, type ErrorStateProps } from './StateMessage';
export { SortSelect, type SortSelectProps } from './SortSelect';
export { sortProducts, toSortKey, SORT_OPTIONS, type SortKey } from './sort';
export {
  useNewsletter,
  isValidEmail,
  pendingSubscribers,
  type NewsletterStatus,
  type UseNewsletterResult,
} from './useNewsletter';
export {
  useMenuNavigation,
  isActiveRoute,
  isBranchActive,
  type MenuNavigation,
} from './useMenuNavigation';
export { RangeSlider, type RangeSliderProps } from './RangeSlider';
export { FilterPanel, FilterChips, type FilterPanelProps, type FilterChipsProps } from './FilterPanel';
export {
  EMPTY_FILTERS,
  LIST_FACETS,
  deriveFacets,
  applyFilters,
  activeFilterCount,
  filterChips,
  removeChip,
  toggleFacetValue,
  discountPercent,
  filtersToParams,
  filtersFromParams,
  type FilterState,
  type FilterChip,
  type Facets,
  type FacetOption,
  type ListFacetKey,
  type PriceRange,
} from './filters';
export { useShopControls, type ShopControls, type ViewMode } from './useShopControls';
export { LanguageSwitcher, type LanguageSwitcherProps } from './LanguageSwitcher';
