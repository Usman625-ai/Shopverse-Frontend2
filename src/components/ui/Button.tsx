import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'success' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean;
}

const vc: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary-600 shadow-sm hover:shadow-luxury',
  outline: 'border border-border bg-transparent hover:border-primary/40 hover:bg-primary/5 text-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
  success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm',
  link: 'text-primary underline-offset-4 hover:underline',
};
const sc: Record<Size, string> = { sm: 'h-9 px-3.5 text-sm', md: 'h-10 px-5 text-sm', lg: 'h-12 px-8 text-[0.9rem] tracking-wide', icon: 'h-10 w-10' };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
        vc[variant], sc[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
export default Button;
