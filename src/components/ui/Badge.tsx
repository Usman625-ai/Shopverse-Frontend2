import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type V = 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'secondary';
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: V; }
const vc: Record<V, string> = {
  default: 'bg-primary/10 text-primary-700 dark:text-primary-300 border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  outline: 'border-border text-foreground',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
};
export default function Badge({ className, variant = 'default', ...p }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide transition-colors', vc[variant], className)} {...p} />;
}
