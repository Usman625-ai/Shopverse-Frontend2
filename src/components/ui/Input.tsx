import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const fieldBase = 'flex w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { error?: boolean; }
const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, 'h-10', error && 'border-destructive focus-visible:ring-destructive/30', className)} {...props} />
));
Input.displayName = 'Input';
export default Input;

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { error?: boolean; }
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, 'min-h-[96px]', error && 'border-destructive focus-visible:ring-destructive/30', className)} {...props} />
));
Textarea.displayName = 'Textarea';
export { Textarea };

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { error?: boolean; }
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, 'h-10 cursor-pointer', error && 'border-destructive focus-visible:ring-destructive/30', className)} {...props}>{children}</select>
));
Select.displayName = 'Select';
export { Select };

const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-[0.8rem] font-medium leading-none text-foreground/90 mb-1.5 block tracking-wide', className)} {...props} />
));
Label.displayName = 'Label';
export { Label };

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}
export function Field({ label, error, children, required }: { label?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="w-full">
      {label && <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>}
      {children}
      <FieldError message={error} />
    </div>
  );
}
