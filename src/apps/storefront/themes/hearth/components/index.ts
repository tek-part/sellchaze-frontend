/**
 * Theme 03 — Hearth component library · public surface.
 *
 * The reusable, token-driven, bespoke primitives Hearth's sections/layouts/pages compose from.
 * Every component is skinned by `../theme.css` and reads only `var(--token)`. Grouped by taxonomy;
 * later phases add Forms, Cards, Overlays, Navigation, Media, Commerce and Feedback.
 */

/* Actions */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { ButtonLink, type ButtonLinkProps } from './ButtonLink';
export { LinkButton, type LinkButtonProps, type LinkButtonVariant } from './LinkButton';
export {
  IconButton,
  type IconButtonProps,
  type IconButtonVariant,
  type IconButtonSize,
} from './IconButton';

/* Layout */
export { Container, type ContainerProps } from './Container';
export { Section, type SectionProps, type SectionBg } from './Section';
export { SectionHead, type SectionHeadProps } from './SectionHead';

/* Typography */
export {
  SectionLabel,
  type SectionLabelProps,
  Heading,
  type HeadingProps,
  Text,
  type TextProps,
} from './Typography';

/* Commerce */
export { Price, type PriceProps } from './Price';
export { Tag, type TagProps, type TagTone, DiscountBadge, type DiscountBadgeProps } from './Badge';
export { Rating, type RatingProps } from './Rating';
export { ProductCard, type ProductCardProps } from './ProductCard';
export { CategoryCard, type CategoryCardProps } from './CategoryCard';
export { ProductGallery, type ProductGalleryProps } from './ProductGallery';
export { VariantPicker, type VariantPickerProps } from './VariantPicker';
export { QuantityStepper, type QuantityStepperProps } from './QuantityStepper';

export { HorizontalProductCard, type HorizontalProductCardProps } from './HorizontalProductCard';
export { WishlistButton, type WishlistButtonProps } from './WishlistButton';

/* Forms */
export { Input, type InputProps } from './Input';
export {
  Textarea,
  type TextareaProps,
  Select,
  type SelectProps,
  type SelectOption,
  Checkbox,
  type CheckboxProps,
} from './Field';

/* Structure */
export { Divider, type DividerProps, Chip, type ChipProps, Breadcrumb, type BreadcrumbProps, type Crumb } from './Misc';

/* Motion */
export { Reveal, type RevealProps } from './Reveal';
export { useReveal } from './useReveal';

/* Media & feedback */
export { StoreImage, type StoreImageProps } from './Image';
export { Spinner, type SpinnerProps } from './Spinner';
export { EmptyState, type EmptyStateProps, type EmptyStateVariant, ErrorState } from './EmptyState';
export {
  Skeleton,
  type SkeletonProps,
  type SkeletonVariant,
  ProductCardSkeleton,
  type ProductCardSkeletonProps,
} from './Skeleton';
