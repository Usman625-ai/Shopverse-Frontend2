import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Store, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { register as registerAction, verifyEmail, clearError } from '../../store/authSlice';
import { Button, Input, Field, Select } from '../../components/ui';
import api from '../../lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name must be between 2 and 100 characters').max(100),
  email: z.string().min(1, 'Email is required').email('Please provide a valid email address').max(150),
  password: z.string().min(8, 'Password must be 8-50 characters').max(50)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'Password must contain at least one uppercase, one lowercase, and one digit'),
  role: z.enum(['CUSTOMER', 'SELLER'], { errorMap: () => ({ message: 'Role is required' }) }),
  shopName: z.string().optional(),
  contactNumber: z.string().optional().refine(
    (v) => !v || /^(\+92|0)[0-9]{9,10}$/.test(v),
    'Enter a valid Pakistan phone number (e.g. 0311-1234567)'
  ),
});
type FormData = z.infer<typeof schema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface P { onBack?: () => void; onSwitchToLogin?: () => void; }

export default function RegisterPage(_props: P) {
  const [sp, setSp] = useState(false);
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CUSTOMER' },
  });
  const role = watch('role');

  const onSubmit = async (d: FormData) => {
    dispatch(clearError());
    try {
      await dispatch(registerAction(d)).unwrap();
      setEmail(d.email);
      setStep('otp');
      toast.success('Registration successful! Please verify your email.');
    } catch (e) {
      toast.error(e as string);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 4) { toast.error('Please enter a valid OTP'); return; }
    try {
      await dispatch(verifyEmail({ email, otp })).unwrap();
      toast.success('Email verified! You can now login.');
      window.location.href = '/login';
    } catch (e) {
      toast.error(e as string);
    }
  };

  if (step === 'otp') return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="surface-panel rounded-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-editorial text-2xl font-medium tracking-tight">Verify Your Email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent an OTP to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <Input
              type="text"
              placeholder="Enter OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            <Button onClick={handleVerify} className="w-full" loading={isLoading}>Verify Email</Button>
            <button
              onClick={async () => {
                try {
                  await api.post('/api/auth/resend-otp', null, { params: { email } });
                  toast.success('OTP resent to ' + email);
                } catch {
                  toast.error('Failed to resend OTP');
                }
              }}
              className="w-full text-sm text-primary hover:underline"
            >
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-primary-foreground font-editorial text-xl font-medium">S</div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join ShopVerse today</p>
        </div>
        <div className="surface-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Full Name" error={errors.name?.message} required>
              <div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="John Doe" className="pl-10" error={!!errors.name} {...register('name')} /></div>
            </Field>
            <Field label="Email" error={errors.email?.message} required>
              <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" className="pl-10" error={!!errors.email} {...register('email')} /></div>
            </Field>
            <Field label="Password" error={errors.password?.message} required>
              <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type={sp ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" error={!!errors.password} {...register('password')} />
                <button type="button" onClick={() => setSp(!sp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {sp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button></div>
            </Field>
            <Field label="Account Type" error={errors.role?.message} required>
              <Select error={!!errors.role} {...register('role')}>
                <option value="CUSTOMER">Customer - Shop products</option>
                <option value="SELLER">Seller - Sell products</option>
              </Select>
            </Field>
            {role === 'SELLER' && (
              <Field label="Shop Name" error={errors.shopName?.message} required>
                <div className="relative"><Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="My Shop" className="pl-10" error={!!errors.shopName} {...register('shopName')} /></div>
              </Field>
            )}
            <Field label="Contact Number" error={errors.contactNumber?.message}>
              <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="0311-1234567" className="pl-10" error={!!errors.contactNumber} {...register('contactNumber')} /></div>
            </Field>
            <Button type="submit" className="w-full" loading={isLoading}>Create Account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
          </p>
          <p className="mt-2 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
