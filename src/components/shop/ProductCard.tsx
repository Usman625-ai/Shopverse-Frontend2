import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, type MotionStyle } from 'framer-motion';
import { ShoppingCart, Heart, Eye, Star, Package } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../types';
import { formatPrice, getEffectivePrice, getDiscountPercentage, getProductImages, truncate } from '../../lib/utils';
import { Button, Badge, SmartImage } from '../ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart } from '../../store/cartSlice';
import api from '../../lib/api';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  index?: number;
}

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 150, damping: 18 });
  const gx = useTransform(mx, [0, 1], ['0%', '100%']);
  const gy = useTransform(my, [0, 1], ['0%', '100%']);
  const glare: MotionStyle = { background: useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.16), transparent 45%)`) };

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} className={className}>
      {children}
      <motion.div aria-hidden style={glare} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}

export default function ProductCard({ product, layout = 'grid', index = 0 }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const images = getProductImages(product);
  const image = images[0] || '';
  const effectivePrice = getEffectivePrice(product);
  const discount = getDiscountPercentage(product.price, product.discountedPrice);
  const outOfStock = product.stockQuantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); return; }
    if (outOfStock) { toast.error('Product is out of stock'); return; }
    try {
      await dispatch(addToCart({ productId: product.id, quantity: 1 })).unwrap();
      toast.success('Added to cart');
    } catch (err) { toast.error(err as string); }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to use wishlist'); return; }
    try {
      await api.post(`/api/customer/wishlist/${product.id}`);
      toast.success('Added to wishlist');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      toast.error(e2.response?.data?.error || 'Failed to add to wishlist');
    }
  };

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to={`/shop/product/${product.slug}`} className="block">
          <div className="group flex gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-luxury transition-all duration-300 hover:shadow-luxury-lg">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
              <SmartImage src={image} alt={product.name} className="rounded-lg transition-transform duration-500 group-hover:scale-110" fallbackIcon={<Package className="h-8 w-8" />} />
              {discount > 0 && <Badge variant="destructive" className="absolute left-1 top-1 px-1.5 py-0 text-[0.6rem]">-{discount}%</Badge>}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{product.brand || 'Generic'}</p>
                  <h3 className="truncate text-sm font-medium text-foreground">{product.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted-foreground">({product.totalReviews || 0})</span>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.shortDescription || truncate(product.description, 100)}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold font-editorial text-primary">{formatPrice(effectivePrice)}</span>
                  {discount > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" onClick={handleWishlist} className="h-8 w-8" title="Add to wishlist"><Heart className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" onClick={handleAddToCart} disabled={outOfStock} loading={false} className="h-8 px-3 text-xs"><ShoppingCart className="h-3.5 w-3.5" />Add</Button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="h-full [transform-style:preserve-3d]"
    >
      <TiltCard className="group relative h-full">
        <Link to={`/shop/product/${product.slug}`} className="block h-full">
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-luxury-lg">
            <div className="relative aspect-square overflow-hidden">
              <SmartImage src={image} alt={product.name} className="transition-transform duration-700 group-hover:scale-110" fallbackIcon={<Package className="h-8 w-8" />} />
              <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                {discount > 0 && <Badge variant="destructive" className="px-1.5 py-0 text-[0.6rem] shadow-sm">-{discount}%</Badge>}
                {product.featured && <Badge variant="default" className="px-1.5 py-0 text-[0.6rem] shadow-sm">Featured</Badge>}
              </div>
              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <Badge variant="secondary" className="text-[0.65rem]">Out of Stock</Badge>
                </div>
              )}
              <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
                <button onClick={handleWishlist} className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-primary" title="Add to wishlist"><Heart className="h-3.5 w-3.5" /></button>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur"><Eye className="h-3.5 w-3.5" /></span>
              </div>
              {/* Hover sheen sweep */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </div>
            <div className="flex flex-1 flex-col p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{product.brand || 'Generic'}</p>
              <h3 className="mt-0.5 line-clamp-2 text-xs font-medium text-foreground">{product.name}</h3>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-muted-foreground">({product.totalReviews || 0})</span>
              </div>
              <div className="mt-auto flex items-end justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold font-editorial text-primary">{formatPrice(effectivePrice)}</span>
                  {discount > 0 && <span className="text-[0.65rem] text-muted-foreground line-through">{formatPrice(product.price)}</span>}
                </div>
                <Button size="icon" variant="default" onClick={handleAddToCart} disabled={outOfStock} className="h-8 w-8 rounded-full" title="Add to cart"><ShoppingCart className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}
