import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { login, logout, clearError } from '../../store/authSlice';
import { Button, Input, Field } from '../../components/ui';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

// Keep these props for backward compat with App.tsx /login route
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface P { onBack?: () => void; onSwitchToRegister?: () => void; }

export default function LoginPage(_props: P) {
  const [sp, setSp] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: FormData) => {
    dispatch(clearError());
    try {
      const user = await dispatch(login(d)).unwrap();
      if (!user.verified) {
        toast.error('Your email is not verified. Please check your inbox and verify first.');
        await dispatch(logout());
        return;
      }
      toast.success('Login successful!');
      const dest = user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'SELLER' ? '/seller/dashboard' : '/shop';
      navigate(dest, { replace: true });
    } catch (e) {
      toast.error(e as string);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-primary-foreground font-editorial text-xl font-medium">S</div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Login to your ShopVerse account</p>
        </div>
        <div className="surface-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Email" error={errors.email?.message} required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" className="pl-10" error={!!errors.email} {...register('email')} />
              </div>
            </Field>
            <Field label="Password" error={errors.password?.message} required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type={sp ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" error={!!errors.password} {...register('password')} />
                <button type="button" onClick={() => setSp(!sp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {sp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" loading={isLoading}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Login
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
          </p>
          <p className="mt-2 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
