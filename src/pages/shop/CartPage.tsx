import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Package, Truck } from 'lucide-react';
import api from '../../lib/api';
import type { Cart } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { Button, Skeleton, Badge, SmartImage } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCart, updateCartItem, removeFromCart } from '../../store/cartSlice';
import EmptyState from '../../components/shop/EmptyState';
import CouponSelector, { type AppliedCoupon } from '../../components/shop/CouponSelector';
import PageHeader from '../../components/shop/PageHeader';

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { cart, isLoading } = useAppSelector((s) => s.cart);
  const [localCart, setLocalCart] = useState<Cart | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | undefined>();
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) return;
    await dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  useEffect(() => { loadCart(); }, [loadCart]);
  useEffect(() => { setLocalCart(cart); }, [cart]);

  const handleQuantity = async (itemId: number, quantity: number, stock: number) => {
    if (quantity < 1) return;
    if (quantity > stock) { toast.error('Cannot exceed available stock'); return; }
    setUpdatingIds((p) => [...p, itemId]);
    try {
      await dispatch(updateCartItem({ itemId, quantity })).unwrap();
      await dispatch(fetchCart());
    } catch (err) { toast.error(err as string); } finally { setUpdatingIds((p) => p.filter((id) => id !== itemId)); }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      await dispatch(fetchCart());
      toast.success('Item removed from cart');
    } catch (err) { toast.error(err as string); }
  };

  const removeCoupon = () => {
    setAppliedCoupon(undefined);
    toast.success('Coupon removed');
  };

  if (!isAuthenticated) {
    return <EmptyState icon={ShoppingBag} title="Please login to view your cart" description="You need to be logged in to access your shopping cart." actionLabel="Login" onAction={() => navigate('/login')} />;
  }

  if (isLoading && !localCart) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!localCart || !localCart.items || localCart.items.length === 0) {
    return <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Looks like you haven't added anything to your cart yet." actionLabel="Start Shopping" onAction={() => navigate('/shop/products')} />;
  }

  const discount = appliedCoupon?.discount || 0;
  const discountedSubtotal = Math.max(0, localCart.total - discount);
  const shipping = discountedSubtotal > FREE_SHIPPING_THRESHOLD ? 0 : 200;
  const grandTotal = discountedSubtotal + shipping;
  const shippingProgress = Math.min(100, (discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="pb-10">
      <PageHeader
        icon={ShoppingBag}
        eyebrow="Your Selections"
        title="Shopping Cart"
        subtitle={`${localCart.items.length} item${localCart.items.length !== 1 ? 's' : ''} reserved for you`}
        crumbs={[{ label: 'Cart' }]}
        right={<div className="flex items-baseline gap-2"><span className="text-sm text-muted-foreground">Subtotal</span><span className="font-editorial text-3xl font-medium text-primary">{formatPrice(localCart.subtotal)}</span></div>}
      />

      <div className="mx-auto max-w-7xl space-y-7 px-4 pt-8 sm:px-6 lg:px-8">

      {/* Free shipping progress */}
      <div className="surface-panel rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 shrink-0 text-primary" />
          {shipping === 0 ? (
            <span className="font-medium text-success">You've unlocked free shipping!</span>
          ) : (
            <span>Add <strong className="text-foreground">{formatPrice(FREE_SHIPPING_THRESHOLD - discountedSubtotal)}</strong> more for free shipping</span>
          )}
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div initial={{ width: 0 }} animate={{ width: `${shippingProgress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className={cn('h-full rounded-full', shipping === 0 ? 'bg-success' : 'bg-primary')} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y divide-border/70 border-y border-border/70">
            <AnimatePresence>
              {localCart.items.map((item) => {
                const isUpdating = updatingIds.includes(item.id);
                return (
                  <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex gap-4 py-5">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-28">
                      {item.productImage
                        ? <SmartImage src={item.productImage} alt={item.productName} className="rounded-lg" fallbackIcon={<Package className="h-8 w-8" />} />
                        : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-editorial text-lg font-medium leading-snug">{item.productName}</p>
                          {!item.inStock && <p className="mt-0.5 text-xs text-destructive">Out of stock</p>}
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Remove"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <div className="flex items-center rounded-full border border-border">
                          <button onClick={() => handleQuantity(item.id, item.quantity - 1, item.availableStock)} className="flex h-9 w-9 items-center justify-center rounded-l-full hover:bg-accent" disabled={isUpdating}><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-9 text-center text-sm font-medium">{isUpdating ? '…' : item.quantity}</span>
                          <button onClick={() => handleQuantity(item.id, item.quantity + 1, item.availableStock)} className="flex h-9 w-9 items-center justify-center rounded-r-full hover:bg-accent" disabled={isUpdating}><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{formatPrice(item.effectivePrice)} each</p>
                          <p className="font-editorial text-lg font-medium text-primary">{formatPrice(item.itemTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="mt-5 flex justify-between">
            <Link to="/shop/products"><Button variant="outline">Continue Shopping</Button></Link>
            <Button variant="ghost" onClick={async () => { try { await api.delete('/api/customer/cart/clear'); await dispatch(fetchCart()); toast.success('Cart cleared'); } catch { toast.error('Failed to clear cart'); } }}><Trash2 className="h-4 w-4" /> Clear Cart</Button>
          </div>
        </div>

        {/* Receipt-style order summary */}
        <div>
          <div className="sticky top-20 md:top-28 lg:top-36 overflow-hidden rounded-lg border border-border/70 bg-card shadow-luxury">
            <div className="border-b border-dashed border-border p-5">
              <h2 className="font-editorial text-xl font-medium">Order Summary</h2>
            </div>
            <div className="space-y-4 p-5">
              <CouponSelector orderAmount={localCart.total} appliedCoupon={appliedCoupon} onApply={setAppliedCoupon} onRemove={removeCoupon} />
              <div className="space-y-2 border-t border-dashed border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatPrice(localCart.subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-success"><span>Discount ({appliedCoupon?.code})</span><span>-{formatPrice(discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-medium">{shipping === 0 ? <Badge variant="success">FREE</Badge> : formatPrice(shipping)}</span></div>
              </div>
              <div className="flex justify-between border-t border-dashed border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-editorial text-2xl font-medium text-primary">{formatPrice(grandTotal)}</span>
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate('/shop/checkout', { state: appliedCoupon ? { couponCode: appliedCoupon.code } : undefined })}>Proceed to Checkout <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}