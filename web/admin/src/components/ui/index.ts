// src/components/ui/index.ts — barrel for design-system primitives (04 §7.1).
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { Input, type InputProps } from './Input';
export { PasswordField, type PasswordFieldProps } from './PasswordField';
export { Select, type SelectProps, type SelectOption } from './Select';
export { Textarea, type TextareaProps } from './Textarea';
export { Switch, type SwitchProps } from './Switch';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { Badge, type BadgeProps, type BadgeColor } from './Badge';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from './Card';
export {
  Dialog,
  ConfirmDialog,
  type DialogProps,
  type ConfirmDialogProps,
} from './Dialog';
export {
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  type SortOrder,
} from './Table';
export { Pagination, type PaginationProps } from './Pagination';
export { Skeleton, type SkeletonProps } from './Skeleton';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
export { Tooltip, type TooltipProps, type TooltipSide } from './Tooltip';
