import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, type MotionStyle } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Shield, Headphones, ArrowRight, Package, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import type { Product, Category, ApiResponse, PagedResponse } from '../../types';
import { SkeletonCard, Button, SmartImage } from '../../components/ui';
import ProductCard from '../../components/shop/ProductCard';
import EmptyState from '../../components/shop/EmptyState';

interface Slide { eyebrow: string; title: string; subtitle: string; cta: string; bg: string; accent: string; }

const slides: Slide[] = [
  { eyebrow: 'Limited time', title: 'The Season Edit', subtitle: 'Up to 70% off on top brands across Pakistan', cta: 'Shop the Sale', bg: 'from-[#241812] via-[#1a120d] to-[#0f0b08]', accent: 'text-primary-300' },
  { eyebrow: 'Just landed', title: 'New Arrivals', subtitle: 'Discover the latest products from verified sellers', cta: 'Explore Now', bg: 'from-[#1a1f1a] via-[#141712] to-[#0b0d0a]', accent: 'text-emerald-300' },
  { eyebrow: 'On every order', title: 'Free Nationwide Shipping', subtitle: 'On all orders above PKR 5,000', cta: 'Start Shopping', bg: 'from-[#20140f] via-[#180f0b] to-[#0d0908]', accent: 'text-amber-300' },
];

const features = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Nationwide shipping' },
  { icon: Shield, title: 'Secure Payments', desc: 'JazzCash & COD' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
  { icon: ShoppingBag, title: 'Verified Sellers', desc: 'Quality guaranteed' },
];

const cardGradient = 'bg-gradient-to-t from-[#1a120d]/95 via-[#2a1d14]/70 to-[#2a1d14]/20';

/* 3D tilt that follows the cursor — used for hero tiles & category cards. */
function TiltCard({ children, className, max = 8, glare = true }: { children: ReactNode; className?: string; max?: number; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 150, damping: 18 });
  const gx = useTransform(mx, [0, 1], ['0%', '100%']);
  const gy = useTransform(my, [0, 1], ['0%', '100%']);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => { mx.set(0.5); my.set(0.5); };

  const glareStyle: MotionStyle = glare ? { background: useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.18), transparent 45%)`) } : {};

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
      {glare && <motion.div aria-hidden style={glareStyle} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
    </motion.div>
  );
}

/* Word-by-word mask reveal for hero titles. */
function RevealText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ delay: delay + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* Infinite horizontal marquee. */
function Marquee({ children, speed = 28 }: { children: ReactNode; speed?: number }) {
  return (
    <div className="relative flex overflow-hidden">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        className="flex shrink-0"
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [featRes, catRes] = await Promise.all([
        api.get<ApiResponse<PagedResponse<Product>>>('/api/products', { params: { page: 0, size: 12, sortBy: 'createdAt', sortDir: 'DESC' } }),
        api.get<ApiResponse<Category[]>>('/api/categories'),
      ]);
      setFeatured(featRes.data.data.content || []);
      setCategories(catRes.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, []);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  return (
    <div className="space-y-20 pb-20 pt-6">
      {/* Scroll progress bar */}
      <motion.div style={{ scaleX: scrollYProgress }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-amber-400 to-primary" />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={heroRef}>
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="relative overflow-hidden rounded-lg lg:col-span-2">
            <div className={`relative h-80 sm:h-96 lg:h-[30rem] bg-gradient-to-br ${slides[currentSlide].bg}`}>
              <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <motion.div
                aria-hidden
                animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative flex h-full flex-col items-start justify-end px-7 pb-10 text-left text-white sm:px-10 sm:pb-12"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${slides[currentSlide].accent}`}
                  >
                    {slides[currentSlide].eyebrow}
                  </motion.span>
                  <h1 className="mt-4 font-editorial text-4xl font-normal italic tracking-tight sm:text-5xl">
                    <RevealText text={slides[currentSlide].title} delay={0.15} />
                  </h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 max-w-md text-base text-white/70"
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link to="/shop/products">
                      <Button size="lg" variant="default" className="mt-7 bg-white text-[#1a1510] hover:bg-white/90">
                        {slides[currentSlide].cta} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
              <button onClick={prevSlide} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15" aria-label="Previous slide"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15" aria-label="Next slide"><ChevronRight className="h-5 w-5" /></button>
              <div className="absolute right-7 top-7 flex gap-2 sm:right-10 sm:top-8">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-7 bg-primary-300' : 'w-1.5 bg-white/30'}`} aria-label={`Go to slide ${i + 1}`} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stacked collection tiles with 3D tilt */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { title: 'New Arrivals', sub: 'Fresh drops weekly', href: '/shop/products?sortBy=createdAt,DESC', tone: 'from-[#241812] to-[#0f0b08]' },
              { title: 'Top Rated', sub: 'Loved by customers', href: '/shop/products?sortBy=averageRating,DESC', tone: 'from-[#1a1f1a] to-[#0b0d0a]' },
              { title: 'Best Value', sub: 'Great deals, low prices', href: '/shop/products?sortBy=price,ASC', tone: 'from-[#20140f] to-[#0d0908]' },
            ].map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="h-full [transform-style:preserve-3d]"
              >
                <TiltCard className="group relative h-full" max={10}>
                  <Link to={b.href} className={`relative flex h-full min-h-[9rem] flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br ${b.tone} p-5 text-white`}>
                    <div className="pointer-events-none absolute inset-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <motion.div
                      aria-hidden
                      animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                      className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-2xl"
                    />
                    <p className="relative font-editorial text-xl italic">{b.title}</p>
                    <p className="relative text-sm text-white/60">{b.sub}</p>
                    <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-white/50 transition-transform group-hover:translate-x-1" />
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — infinite marquee ticker */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <Marquee speed={26}>
            {features.concat(features).map((f, i) => {
              const I = f.icon;
              return (
                <div key={i} className="flex items-center gap-3 px-8">
                  <motion.div whileHover={{ rotate: 8, scale: 1.12 }} transition={{ type: 'spring', stiffness: 300 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary"><I className="h-4 w-4" strokeWidth={1.75} /></motion.div>
                  <div><p className="text-sm font-medium">{f.title}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
                  <span className="ml-6 text-primary/30">•</span>
                </div>
              );
            })}
          </Marquee>
        </div>
      </section>

      {/* Categories — Editorial Mosaic with 3D tilt */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-7 flex items-end justify-between"
        >
          <div>
            <span className="eyebrow">Explore</span>
            <h2 className="mt-1.5 font-editorial text-3xl font-normal tracking-tight">Shop by Category</h2>
          </div>
          <Link to="/shop/products" className="group flex items-center gap-1 text-sm font-medium text-primary">View all<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
        </motion.div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Package} title="No categories yet" description="Categories will appear here once sellers add them." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: Math.min(i * 0.05, 0.35), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full [transform-style:preserve-3d]"
              >
                <TiltCard className="group h-full" max={9}>
                  <Link to={`/shop/products?categoryId=${cat.id}`} className="block h-full">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border/60 bg-card">
                      {cat.imageUrl ? (
                        <SmartImage src={cat.imageUrl} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" fallbackIcon={<Package className="h-10 w-10 text-primary/40" />} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/10">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}>
                            <Package className="h-10 w-10 text-primary/40" />
                          </motion.div>
                        </div>
                      )}
                      <div className={`absolute inset-0 ${cardGradient}`} />
                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="truncate text-sm font-medium text-white">{cat.name}</p>
                        <p className="mt-0.5 flex translate-y-1 items-center gap-1 text-[11px] text-primary-300 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">Shop now <ArrowRight className="h-2.5 w-2.5" /></p>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products — smaller cards, blur-to-sharp reveal */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-7 flex items-end justify-between"
        >
          <div>
            <span className="eyebrow">Curated</span>
            <h2 className="mt-1.5 font-editorial text-3xl font-normal tracking-tight">Featured Products</h2>
          </div>
          <Link to="/shop/products" className="group flex items-center gap-1 text-sm font-medium text-primary">View all<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
        </motion.div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : featured.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No products yet" description="Products will appear here once sellers list them." actionLabel="Browse All" onAction={() => window.location.assign('/shop/products')} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProductCard product={p} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter / trust band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#241812] via-[#1a120d] to-[#0f0b08] px-6 py-12 text-center text-white sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <motion.div aria-hidden animate={{ x: [-20, 30, -20], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute left-1/4 top-0 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <motion.div aria-hidden animate={{ x: [20, -30, 20], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative">
            <motion.span initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300"><Sparkles className="h-3.5 w-3.5" /> Stay in the loop</motion.span>
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="mt-3 font-editorial text-3xl font-normal italic tracking-tight sm:text-4xl">Never miss a deal</motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }} className="mx-auto mt-2 max-w-md text-sm text-white/60">New arrivals, exclusive discounts, and seller spotlights — straight to your inbox.</motion.p>
            <motion.form initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24 }} onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
              <input type="email" placeholder="you@example.com" className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary-300/40" />
              <Button size="lg" className="bg-white text-[#1a1510] hover:bg-white/90">Subscribe</Button>
            </motion.form>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
