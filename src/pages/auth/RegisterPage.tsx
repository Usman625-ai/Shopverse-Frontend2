import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Store, Phone, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
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

const OTP_COOLDOWN = 60;

export default function RegisterPage() {
  const [sp, setSp] = useState(false);
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CUSTOMER' },
  });
  const role = watch('role');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  const onSubmit = async (d: FormData) => {
    dispatch(clearError());
    try {
      await dispatch(registerAction(d)).unwrap();
      setEmail(d.email);
      setStep('otp');
      setCooldown(OTP_COOLDOWN);
      toast.success('Registration initiated! Please verify your email with the OTP sent.');
    } catch (e) {
      toast.error(e as string);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 6) { toast.error('Please enter the 6-digit OTP'); return; }
    try {
      await dispatch(verifyEmail({ email, otp })).unwrap();
      toast.success('Email verified! Welcome to ShopVerse.');
      window.location.href = '/';
    } catch (e) {
      toast.error(e as string);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/api/auth/resend-otp', null, { params: { email } });
      toast.success('A new OTP has been sent to ' + email);
      setCooldown(OTP_COOLDOWN);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
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
              We've sent a 6-digit OTP to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
            />
            <Button onClick={handleVerify} className="w-full" loading={isLoading}>Verify Email</Button>
            <div className="flex items-center justify-center gap-2 text-sm">
              {cooldown > 0 ? (
                <span className="text-muted-foreground">
                  Resend OTP in <span className="font-medium text-foreground">{cooldown}s</span>
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Resend OTP
                </button>
              )}
            </div>
            <button
              onClick={() => setStep('register')}
              className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to registration
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
            <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>Create Account</Button>
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
