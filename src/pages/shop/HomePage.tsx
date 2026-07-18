import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Shield, Headphones, ArrowRight, Package } from 'lucide-react';
import api from '../../lib/api';
import type { Product, Category, ApiResponse, PagedResponse } from '../../types';
import { Card, CardContent, SkeletonCard, Button, SmartImage } from '../../components/ui';
import ProductCard from '../../components/shop/ProductCard';
import EmptyState from '../../components/shop/EmptyState';

interface Slide { eyebrow: string; title: string; subtitle: string; cta: string; bg: string; }

const slides: Slide[] = [
  { eyebrow: 'Limited time', title: 'The Season Edit', subtitle: 'Up to 70% off on top brands across Pakistan', cta: 'Shop the Sale', bg: 'from-[#241812] via-[#1a120d] to-[#0f0b08]' },
  { eyebrow: 'Just landed', title: 'New Arrivals', subtitle: 'Discover the latest products from verified sellers', cta: 'Explore Now', bg: 'from-[#1a1f1a] via-[#141712] to-[#0b0d0a]' },
  { eyebrow: 'On every order', title: 'Free Nationwide Shipping', subtitle: 'On all orders above PKR 5,000', cta: 'Start Shopping', bg: 'from-[#20140f] via-[#180f0b] to-[#0d0908]' },
];

const features = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Nationwide shipping' },
  { icon: Shield, title: 'Secure Payments', desc: 'JazzCash & COD' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
  { icon: ShoppingBag, title: 'Verified Sellers', desc: 'Quality guaranteed' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [featRes, catRes] = await Promise.all([
        api.get<ApiResponse<PagedResponse<Product>>>('/api/products', { params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'DESC' } }),
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
    <div className="space-y-16 pb-16 pt-6">
      {/* Hero Carousel */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl">
          <div className={`relative h-80 sm:h-96 md:h-[28rem] bg-gradient-to-br ${slides[currentSlide].bg}`}>
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">{slides[currentSlide].eyebrow}</span>
                <h1 className="mt-4 font-editorial text-4xl font-normal italic tracking-tight sm:text-5xl md:text-6xl">{slides[currentSlide].title}</h1>
                <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{slides[currentSlide].subtitle}</p>
                <Link to="/shop/products">
                  <Button size="lg" variant="default" className="mt-8 bg-white text-[#1a1510] hover:bg-white/90">
                    {slides[currentSlide].cta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </AnimatePresence>
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15" aria-label="Previous slide"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15" aria-label="Next slide"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-7 bg-primary-300' : 'w-1.5 bg-white/30'}`} aria-label={`Go to slide ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {features.map((f, i) => {
            const I = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                whileHover={{ y: -3 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Card className="flex items-center gap-3 p-4 transition-shadow duration-300 hover:shadow-luxury">
                  <motion.div whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: 'spring', stiffness: 300 }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary"><I className="h-[18px] w-[18px]" strokeWidth={1.75} /></motion.div>
                  <div><p className="text-sm font-medium">{f.title}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Collection banners */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
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
              whileHover={{ scale: 1.02 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link to={b.href} className={`group relative flex h-32 flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-br ${b.tone} p-5 text-white`}>
                <div className="pointer-events-none absolute inset-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <p className="font-editorial text-xl italic">{b.title}</p>
                <p className="text-sm text-white/60">{b.sub}</p>
                <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-white/50 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories — Editorial Mosaic */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <span className="eyebrow">Explore</span>
            <h2 className="mt-1.5 font-editorial text-3xl font-normal tracking-tight">Shop by Category</h2>
          </div>
          <Link to="/shop/products" className="group flex items-center gap-1 text-sm font-medium text-primary">View all<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Package} title="No categories yet" description="Categories will appear here once sellers add them." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -4 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.4 }}
              >
                <Link to={`/shop/products?categoryId=${cat.id}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/40 via-secondary/20 to-transparent">
                    {cat.imageUrl ? (
                      <SmartImage src={cat.imageUrl} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" fallbackIcon={<Package className="h-10 w-10 text-primary/40" />} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="truncate text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">Shop now <ArrowRight className="h-2.5 w-2.5" /></p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products — Editorial Spotlight */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <span className="eyebrow">Curated</span>
            <h2 className="mt-1.5 font-editorial text-3xl font-normal tracking-tight">Featured Products</h2>
          </div>
          <Link to="/shop/products" className="group flex items-center gap-1 text-sm font-medium text-primary">View all<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : featured.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No products yet" description="Products will appear here once sellers list them." actionLabel="Browse All" onAction={() => window.location.assign('/shop/products')} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
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
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#241812] via-[#1a120d] to-[#0f0b08] px-6 py-12 text-center text-white sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Stay in the loop</span>
            <h2 className="mt-3 font-editorial text-3xl font-normal italic tracking-tight sm:text-4xl">Never miss a deal</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">New arrivals, exclusive discounts, and seller spotlights — straight to your inbox.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
              <input type="email" placeholder="you@example.com" className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary-300/40" />
              <Button size="lg" className="bg-white text-[#1a1510] hover:bg-white/90">Subscribe</Button>
            </form>
          </div>
        </motion.div>
      </section>
    </div>
  );
}