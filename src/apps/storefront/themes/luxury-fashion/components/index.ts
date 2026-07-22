/**
 * Theme 01 component library — public surface.
 *
 * The reusable, token-driven primitives the theme's sections/layouts/pages compose from. Every
 * component is skinned by `../theme.css` and reads only `var(--token)`, so a scheme/settings change
 * restyles them with no re-render. Grouped by the design-bible taxonomy (Actions, Layout,
 * Typography, Commerce, Feedback). Later phases add Forms, Cards, Overlays, Navigation and Media.
 */

/* Actions */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { ButtonLink, type ButtonLinkProps } from './ButtonLink';
export { IconButton, type IconButtonProps, type IconButtonVariant } from './IconButton';
export { LinkButton, type LinkButtonProps, type LinkButtonVariant } from './LinkButton';

/* Layout */
export { Container, type ContainerProps } from './Container';
export { Section, type SectionProps } from './Section';

/* Typography */
export {
  Eyebrow,
  type EyebrowProps,
  Heading,
  type HeadingProps,
  Text,
  type TextProps,
} from './Typography';

/* Commerce */
export { Price, type PriceProps } from './Price';
export { Badge, type BadgeProps, type BadgeVariant, DiscountBadge, type DiscountBadgeProps } from './Badge';
export { Rating, type RatingProps } from './Rating';
export { WishlistButton, type WishlistButtonProps } from './WishlistButton';
export { CompareButton, type CompareButtonProps } from './CompareButton';
export { ShareButton, type ShareButtonProps, type ShareOutcome } from './ShareButton';
export {
  VariantGroup,
  type VariantGroupProps,
  ColorSwatches,
  type ColorSwatchesProps,
  type ColorOption,
  SizeSelector,
  type SizeSelectorProps,
  type SizeOption,
} from './VariantPicker';

/* Icons */
export * as Icons from './icons';
export type { IconProps } from './icons';

/* Forms */
export { Input, type InputProps } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Select, type SelectProps, type SelectOption } from './Select';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { Radio, type RadioProps, RadioGroup, type RadioGroupProps } from './Radio';
export { Switch, type SwitchProps } from './Switch';
export { QuantityStepper, type QuantityStepperProps } from './QuantityStepper';

/* Structure */
export { SectionHead, type SectionHeadProps } from './SectionHead';
export { Stepper, type StepperProps, type StepItem } from './Stepper';

/* Commerce composites */
export { Newsletter, type NewsletterProps, type NewsletterStatus } from './Newsletter';
export { Countdown, type CountdownProps } from './Countdown';
export { QuickView, type QuickViewProps } from './QuickView';
export {
  ReviewSummary,
  type ReviewSummaryProps,
  type RatingDistribution,
  ReviewList,
  type ReviewListProps,
} from './Reviews';

/* Media */
export { StoreImage, type StoreImageProps } from './Image';
export { Carousel, type CarouselProps } from './Carousel';
export { ImageZoom, type ImageZoomProps } from './ImageZoom';
export { ProductGallery, type ProductGalleryProps } from './ProductGallery';

/* Cards */
export { ProductCard, type ProductCardProps } from './ProductCard';
export { ProductCardSkeleton } from './ProductCardSkeleton';
export { HorizontalProductCard, type HorizontalProductCardProps } from './HorizontalProductCard';
export { CompactProductCard, type CompactProductCardProps } from './CompactProductCard';
export { CategoryCard, type CategoryCardProps } from './CategoryCard';
export { CollectionCard, type CollectionCardProps } from './CollectionCard';
export { EditorialCard, type EditorialCardProps } from './EditorialCard';
export { BlogCard, type BlogCardProps } from './BlogCard';
export { ReviewCard, type ReviewCardProps } from './ReviewCard';
export { PromoCard, type PromoCardProps } from './PromoCard';
export { FeatureCard, type FeatureCardProps } from './FeatureCard';

/* Search */
export { SearchBar, type SearchBarProps } from './SearchBar';
export { SearchOverlay, type SearchOverlayProps } from './SearchOverlay';

/* Filters & sort */
export { RangeSlider, type RangeSliderProps } from './RangeSlider';
export { FilterGroup, type FilterGroupProps, FilterPanel, type FilterPanelProps } from './Filters';
export { SortSelect, type SortSelectProps, type SortKey } from './SortSelect';

/* Navigation */
export { Breadcrumb, type BreadcrumbProps, type Crumb } from './Breadcrumb';
export { Pagination, type PaginationProps } from './Pagination';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
export { Accordion, type AccordionProps, type AccordionItemData } from './Accordion';
export { Chip, type ChipProps, FilterChip, type FilterChipProps, Tag, type TagProps } from './Chip';
export { Avatar, type AvatarProps, type AvatarSize, AvatarStack, type AvatarStackProps } from './Avatar';

/* Floating (tooltip / popover / dropdown) */
export { Tooltip, type TooltipProps, type TooltipPlacement } from './Tooltip';
export { Popover, type PopoverProps, type FloatingPlacement } from './Popover';
export { DropdownMenu, type DropdownMenuProps, type DropdownItem } from './DropdownMenu';

/* Toast system */
export { ToastProvider } from './toast/ToastProvider';
export { useToast } from './toast/useToast';
export type { ToastApi, ToastOptions, ToastVariant, ToastAction } from './toast/toast-context';

/* Overlays */
export { Modal, type ModalProps } from './Modal';
export { Drawer, type DrawerProps } from './Drawer';
export { Sheet, type SheetProps } from './Sheet';
export { Overlay, OverlayBody, OverlayFooter, type OverlayProps, type OverlayVariant } from './overlay/Overlay';
export { Portal } from './overlay/Portal';
export { useFocusTrap } from './overlay/useFocusTrap';
export { useScrollLock } from './overlay/useScrollLock';

/* Feedback & structure */
export { Spinner, type SpinnerProps } from './Spinner';
export { Skeleton, type SkeletonProps, type SkeletonVariant } from './Skeleton';
export {
  EmptyState,
  type EmptyStateProps,
  type EmptyStateVariant,
  ErrorState,
  type ErrorStateProps,
} from './StateMessage';
export { Divider, type DividerProps } from './Divider';
export { VisuallyHidden, type VisuallyHiddenProps } from './VisuallyHidden';
