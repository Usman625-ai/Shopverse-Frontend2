import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye, Star, Package } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../types';
import { cn, formatPrice, getEffectivePrice, getDiscountPercentage, getProductImages, truncate } from '../../lib/utils';
import { Button, Badge, SmartImage } from '../ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart } from '../../store/cartSlice';
import api from '../../lib/api';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  index?: number;
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      >
        <Link to={`/shop/product/${product.slug}`} className="block">
          <div className="group flex gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-luxury transition-all duration-300 hover:shadow-luxury-lg">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
              <SmartImage src={image} alt={product.name} className="rounded-lg transition-transform duration-300 group-hover:scale-105" fallbackIcon={<Package className="h-8 w-8" />} />
              {discount > 0 && <Badge variant="destructive" className="absolute left-1 top-1">-{discount}%</Badge>}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{product.brand || 'Generic'}</p>
                  <h3 className="truncate font-medium text-foreground">{product.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted-foreground">({product.totalReviews || 0})</span>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.shortDescription || truncate(product.description, 120)}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold font-editorial text-primary">{formatPrice(effectivePrice)}</span>
                  {discount > 0 && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleWishlist} title="Add to wishlist"><Heart className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={handleAddToCart} disabled={outOfStock} loading={false}><ShoppingCart className="h-4 w-4" />Add</Button>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="h-full"
    >
      <Link to={`/shop/product/${product.slug}`} className="group block h-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-luxury-lg hover:-translate-y-1">
          <div className="relative aspect-[4/5] overflow-hidden">
            <SmartImage src={image} alt={product.name} className="transition-transform duration-500 group-hover:scale-110" fallbackIcon={<Package className="h-10 w-10" />} />
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
              {discount > 0 && <Badge variant="destructive" className="shadow-sm">-{discount}%</Badge>}
              {product.featured && <Badge variant="default" className="shadow-sm">Featured</Badge>}
            </div>
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <Badge variant="secondary">Out of Stock</Badge>
              </div>
            )}
            <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <button onClick={handleWishlist} className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-primary" title="Add to wishlist"><Heart className="h-4 w-4" /></button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur"><Eye className="h-4 w-4" /></span>
            </div>
          </div>
          <div className="flex flex-1 flex-col p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{product.brand || 'Generic'}</p>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
              <span className="text-muted-foreground">({product.totalReviews || 0})</span>
            </div>
            <div className="mt-auto flex items-end justify-between pt-2.5">
              <div className="flex flex-col">
                <span className="text-base font-semibold font-editorial text-primary">{formatPrice(effectivePrice)}</span>
                {discount > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
              </div>
              <Button size="icon" variant="default" onClick={handleAddToCart} disabled={outOfStock} className="h-9 w-9 rounded-full" title="Add to cart"><ShoppingCart className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
