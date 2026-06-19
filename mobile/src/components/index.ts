// src/components/index.ts
// Barrel export for the reusable UI components (Foundation B). Import from
// '../components' instead of deep paths.
export { ScreenContainer } from './ScreenContainer';
export type { ScreenContainerProps } from './ScreenContainer';

export { PrimaryButton } from './PrimaryButton';
export type { PrimaryButtonProps } from './PrimaryButton';

export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';

export { ServiceCard } from './ServiceCard';
export type { ServiceCardProps } from './ServiceCard';

export { BookingCard } from './BookingCard';
export type { BookingCardProps } from './BookingCard';

export { LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';

export { ErrorState } from './ErrorState';
export type { ErrorStateProps } from './ErrorState';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { colors, spacing, radius } from './theme';
