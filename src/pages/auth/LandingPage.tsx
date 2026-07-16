import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Store, ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import { useAppSelector } from '../../store';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'SELLER' ? '/seller/dashboard' : '/shop';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const features = [
    { icon: Shield, t: 'Secure Payments', d: 'JazzCash & Cash on Delivery' },
    { icon: Truck, t: 'Fast Delivery', d: 'Nationwide shipping' },
    { icon: Store, t: 'Verified Sellers', d: 'Quality you can trust' },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">
        <span className="font-editorial text-2xl font-medium tracking-tight">Shop<span className="italic text-primary">Verse</span></span>
        <div className="hidden items-center gap-3 sm:flex">
          <button onClick={() => navigate('/login')} className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">Sign in</button>
          <button onClick={() => navigate('/register')} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-600">Create account</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-20 pt-8 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <span className="eyebrow inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Multi-vendor marketplace</span>
            <h1 className="mt-5 font-editorial text-5xl font-normal leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.2rem]">
              Shop from <span className="italic text-primary">thousands</span> of sellers, all in one place
            </h1>
            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-muted-foreground">
              Join ShopVerse as a customer to discover curated goods, or as a seller to grow your business nationwide.
            </p>

            <div className="mt-10 space-y-5">
              {features.map((f, i) => {
                const I = f.icon;
                return (
                  <motion.div key={f.t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }} className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary"><I className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
                    <div><p className="text-sm font-medium">{f.t}</p><p className="text-sm text-muted-foreground">{f.d}</p></div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex justify-center lg:justify-end">
          <div className="w-full max-w-sm surface-panel rounded-2xl p-9">
            <h2 className="text-center font-editorial text-2xl font-medium">Welcome to ShopVerse</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Choose an option to get started</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="group flex w-full items-center justify-between rounded-lg bg-primary px-5 py-4 text-primary-foreground shadow-luxury transition-all duration-300 hover:shadow-luxury-lg"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  <span className="text-sm font-medium">Login</span>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="group flex w-full items-center justify-between rounded-lg border border-border bg-transparent px-5 py-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-[18px] w-[18px]" />
                  <span className="text-sm font-medium">Create Account</span>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div className="divider-fade my-6" />
            <p className="text-center text-xs leading-relaxed text-muted-foreground">By continuing, you agree to ShopVerse's Terms of Service and Privacy Policy.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
