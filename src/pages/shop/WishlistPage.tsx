import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import api from '../../lib/api';
import type { Product, ApiResponse, PagedResponse } from '../../types';
import { Button, Skeleton, Badge, SmartImage } from '../../components/ui';
import { useAppDispatch } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { formatPrice, getEffectivePrice, getProductImages, getDiscountPercentage } from '../../lib/utils';
import EmptyState from '../../components/shop/EmptyState';
import Pagination from '../../components/shop/Pagination';

export default function WishlistPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [movingIds, setMovingIds] = useState<number[]>([]);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Product>>>('/api/customer/wishlist', { params: { page, size: 12 } });
      setItems(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const removeFromWishlist = async (productId: number) => {
    try {
      await api.delete(`/api/customer/wishlist/${productId}`);
      setItems((prev) => prev.filter((p) => p.id !== productId));
      setTotalElements((prev) => prev - 1);
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed to remove from wishlist'); }
  };

  const moveToCart = async (product: Product) => {
    setMovingIds((p) => [...p, product.id]);
    try {
      await dispatch(addToCart({ productId: product.id, quantity: 1 })).unwrap();
      await api.delete(`/api/customer/wishlist/${product.id}`);
      setItems((prev) => prev.filter((p) => p.id !== product.id));
      setTotalElements((prev) => prev - 1);
      toast.success('Moved to cart');
    } catch (err) { toast.error(err as string); } finally { setMovingIds((p) => p.filter((id) => id !== product.id)); }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState icon={Heart} title="Your wishlist is empty" description="Save items you love to your wishlist for later." actionLabel="Browse Products" onAction={() => navigate('/shop/products')} />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-editorial text-3xl font-normal tracking-tight">My Wishlist</h1>
        <p className="text-sm text-muted-foreground">{totalElements} item{totalElements !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence>
          {items.map((product, i) => {
            const images = getProductImages(product);
            const image = images[0] || '';
            const effPrice = getEffectivePrice(product);
            const discount = getDiscountPercentage(product.price, product.discountedPrice);
            const outOfStock = product.stockQuantity <= 0;
            const isMoving = movingIds.includes(product.id);
            return (
              <motion.div key={product.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-luxury transition-all hover:shadow-md">
                  <button onClick={() => navigate(`/shop/product/${product.slug}`)} className="relative aspect-square overflow-hidden bg-muted">
                    {image ? <SmartImage src={image} alt={product.name} className="transition-transform group-hover:scale-105" fallbackIcon={<Package className="h-10 w-10" />} /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-10 w-10" /></div>}
                    {discount > 0 && <Badge variant="destructive" className="absolute left-2 top-2">-{discount}%</Badge>}
                    {outOfStock && <div className="absolute inset-0 flex items-center justify-center bg-background/60"><Badge variant="secondary">Out of Stock</Badge></div>}
                  </button>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-xs text-muted-foreground">{product.brand || 'Generic'}</p>
                    <button onClick={() => navigate(`/shop/product/${product.slug}`)} className="mt-0.5 line-clamp-2 text-left text-sm font-medium hover:text-primary">{product.name}</button>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div><span className="text-base font-semibold text-primary">{formatPrice(effPrice)}</span>{discount > 0 && <span className="ml-1 text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}</div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => moveToCart(product)} disabled={outOfStock || isMoving} loading={isMoving}><ShoppingCart className="h-3.5 w-3.5" /> {isMoving ? 'Moving...' : 'Move to Cart'}</Button>
                      <Button size="sm" variant="outline" onClick={() => removeFromWishlist(product.id)} title="Remove"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {totalPages > 1 && <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />}
    </div>
  );
}
