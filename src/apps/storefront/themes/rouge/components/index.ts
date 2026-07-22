/**
 * Rouge component library — public surface. Rouge's OWN components, skinned by `../theme.css`
 * (`.rge-*`), reusing only shared utilities and data contracts. No other theme's component is
 * imported. Grows by phase.
 */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { ButtonLink, type ButtonLinkProps } from './ButtonLink';
export { IconButton, type IconButtonProps } from './IconButton';
export { LinkButton, type LinkButtonProps } from './LinkButton';
export { Spinner, type SpinnerProps } from './Spinner';
export { Container, type ContainerProps } from './Container';
export { Section, type SectionProps } from './Section';
export { Divider, type DividerProps } from './Divider';
export { VisuallyHidden, type VisuallyHiddenProps } from './VisuallyHidden';
export { Eyebrow, type EyebrowProps, Heading, type HeadingProps, Text, type TextProps, Script, type ScriptProps } from './Typography';
export { Price, type PriceProps } from './Price';
export { Badge, type BadgeProps, type BadgeVariant } from './Badge';
export { StoreImage, type StoreImageProps } from './Image';
export { Rating, type RatingProps } from './Rating';
export { ShadeDots, type ShadeDotsProps } from './ShadeDots';
export { SectionHead, type SectionHeadProps } from './SectionHead';
export { WishlistButton, type WishlistButtonProps } from './WishlistButton';
export { QuantityStepper, type QuantityStepperProps } from './QuantityStepper';
export { Input, type InputProps } from './Input';
export { Select, type SelectProps, type SelectOption } from './Select';
export { Textarea, type TextareaProps } from './Textarea';
export { ProductCard, type ProductCardProps } from './ProductCard';
export { ProductCardSkeleton } from './ProductCardSkeleton';
export { CompactProductCard, type CompactProductCardProps } from './CompactProductCard';
export { CategoryCard, type CategoryCardProps } from './CategoryCard';
export { ProductGallery, type ProductGalleryProps } from './ProductGallery';
export { Breadcrumb, type BreadcrumbProps, type Crumb } from './Breadcrumb';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
export { Accordion, type AccordionProps, type AccordionItem } from './Accordion';
export { Carousel, type CarouselProps } from './Carousel';
export { Countdown, type CountdownProps } from './Countdown';
export { Reveal, type RevealProps } from './Reveal';
export { useReveal } from './useReveal';
export { ShareButton, type ShareButtonProps, type ShareResult } from './ShareButton';
export { VariantPicker, type VariantPickerProps } from './VariantPicker';
export { Avatar, type AvatarProps } from './Avatar';
export { ReviewSummary, type ReviewSummaryProps, ReviewList, type ReviewListProps, ReviewCard } from './Reviews';
export { Portal } from './overlay/Portal';
export { Drawer, type DrawerProps } from './overlay/Drawer';
export { useScrollLock } from './overlay/useScrollLock';
export { useFocusTrap } from './overlay/useFocusTrap';
export { ToastProvider } from './toast/ToastProvider';
export { useToast } from './toast/useToast';
export type { ToastApi, ToastOptions, ToastVariant } from './toast/toast-context';
export * as Icons from './icons';
export type { IconProps } from './icons';
export { EmptyState, ErrorState, type EmptyStateProps, type ErrorStateProps } from './StateMessage';
