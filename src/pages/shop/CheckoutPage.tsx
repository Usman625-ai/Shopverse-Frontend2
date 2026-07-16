import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Plus, CreditCard, Truck, Check, Tag, X, Package, ShoppingBag, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import type { Address, Order, ApiResponse, PaymentMethod } from '../../types';
import { cn, formatPrice } from '../../lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Field, Modal, Badge, SmartImage } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCart } from '../../store/cartSlice';
import EmptyState from '../../components/shop/EmptyState';

interface AddrForm {
  fullName: string; phoneNumber: string; addressLine1: string; addressLine2: string;
  city: string; state: string; pincode: string; country: string; defaultAddress: boolean;
}
const emptyAddr: AddrForm = { fullName: '', phoneNumber: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'Pakistan', defaultAddress: false };

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { cart } = useAppSelector((s) => s.cart);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order[] | null>(null);
  const [addrForm, setAddrForm] = useState<AddrForm>(emptyAddr);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Address[]>>('/api/customer/addresses');
      const list = res.data.data || [];
      setAddresses(list);
      const def = list.find((a) => a.defaultAddress);
      setSelectedAddress(def?.id || list[0]?.id || null);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const loadCart = useCallback(async () => { if (isAuthenticated) await dispatch(fetchCart()); }, [dispatch, isAuthenticated]);

  useEffect(() => { loadAddresses(); loadCart(); }, [loadAddresses, loadCart]);

  const openAddAddress = () => { setEditingAddress(null); setAddrForm(emptyAddr); setShowAddressModal(true); };
  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddrForm({ fullName: addr.fullName, phoneNumber: addr.phoneNumber, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country, defaultAddress: addr.defaultAddress });
    setShowAddressModal(true);
  };

  const saveAddress = async () => {
    if (!addrForm.fullName || !addrForm.addressLine1 || !addrForm.city || !addrForm.phoneNumber) { toast.error('Please fill all required fields'); return; }
    try {
      if (editingAddress) {
        await api.put(`/api/customer/addresses/${editingAddress.id}`, addrForm);
        toast.success('Address updated');
      } else {
        await api.post('/api/customer/addresses', addrForm);
        toast.success('Address added');
      }
      setShowAddressModal(false); loadAddresses();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to save address');
    }
  };

  const deleteAddress = async (id: number) => {
    try { await api.delete(`/api/customer/addresses/${id}`); toast.success('Address deleted'); loadAddresses(); }
    catch { toast.error('Failed to delete address'); }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    if (!cart) return;
    setCouponLoading(true);
    try {
      await api.post('/api/customer/coupons/validate', { couponCode: couponCode, orderAmount: cart.subtotal });
      setAppliedCoupon(couponCode); toast.success('Coupon applied');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Invalid coupon');
    } finally { setCouponLoading(false); }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a shipping address'); return; }
    if (!cart || cart.items.length === 0) { toast.error('Your cart is empty'); return; }
    setPlacing(true);
    try {
      const res = await api.post<ApiResponse<Order[]>>('/api/customer/orders/checkout', { addressId: selectedAddress, paymentMethod, couponCode: appliedCoupon, notes });
      const orders = res.data.data || [];
      if (paymentMethod === 'JAZZCASH' && orders.length > 0) {
        try {
          const payRes = await api.post<ApiResponse<{ hostedPageUrl: string; formParams: Record<string, string>; orderNumber: string }>>(`/api/customer/orders/${orders[0].id}/payment/initiate`);
          const payData = payRes.data.data;
          if (payData?.hostedPageUrl) { window.location.href = payData.hostedPageUrl; return; }
        } catch { toast.error('Payment initiation failed. Order placed with pending payment.'); }
      }
      await dispatch(fetchCart());
      setSuccessOrder(orders); toast.success('Order placed successfully!');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  if (!isAuthenticated) return <EmptyState icon={ShoppingBag} title="Please login to checkout" description="You need to be logged in to place an order." actionLabel="Login" onAction={() => navigate('/login')} />;
  if (loading) return <div className="space-y-6 pb-8"><div className="h-8 w-48 rounded bg-muted animate-pulse" /><div className="grid gap-6 lg:grid-cols-3"><div className="space-y-3 lg:col-span-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div><div className="h-64 rounded-xl bg-muted animate-pulse" /></div></div>;

  if (successOrder) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pb-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success"><Check className="h-10 w-10" /></motion.div>
          <h1 className="mt-6 font-editorial text-3xl font-normal tracking-tight">Order Placed Successfully!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your order{successOrder.length > 1 ? 's have' : ' has'} been placed.</p>
          <div className="mt-4 space-y-2">
            {successOrder.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3 text-sm">
                <span className="font-medium">Order #{o.orderNumber}</span>
                <Badge variant={o.paymentStatus === 'PAID' ? 'success' : 'warning'}>{o.paymentStatus}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/shop/orders')}>View Orders</Button>
            <Button className="flex-1" onClick={() => navigate('/shop/products')}>Continue Shopping</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Add items to your cart before checking out." actionLabel="Start Shopping" onAction={() => navigate('/shop/products')} />;

  const shipping = cart.total > 5000 ? 0 : 200;
  const grandTotal = cart.total + shipping;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/shop/cart')} className="rounded-lg p-1 hover:bg-accent"><ArrowLeft className="h-5 w-5" /></button>
        <div><h1 className="font-editorial text-3xl font-normal tracking-tight">Checkout</h1><p className="text-sm text-muted-foreground">Complete your order</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Shipping Address</CardTitle>
              <Button size="sm" variant="outline" onClick={openAddAddress}><Plus className="h-4 w-4" /> Add New</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No addresses found. Please add a shipping address.</p>
              ) : (
                addresses.map((addr) => (
                  <motion.div key={addr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className={cn('cursor-pointer rounded-lg border-2 p-4 transition-all', selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')} onClick={() => setSelectedAddress(addr.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <div className={cn('mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2', selectedAddress === addr.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground')}>{selectedAddress === addr.id && <Check className="h-3 w-3" />}</div>
                          <div>
                            <div className="flex items-center gap-2"><span className="font-medium">{addr.fullName}</span>{addr.defaultAddress && <Badge variant="default">Default</Badge>}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.pincode}, {addr.country}</p>
                            <p className="text-sm text-muted-foreground">Phone: {addr.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEditAddress(addr); }} className="rounded p-1 text-xs text-primary hover:bg-primary/10">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }} className="rounded p-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Payment Method</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {([['CASH_ON_DELIVERY', 'Cash on Delivery', Truck], ['JAZZCASH', 'JazzCash', CreditCard]] as const).map(([val, label, Icon]) => (
                <div key={val} className={cn('cursor-pointer rounded-lg border-2 p-4 transition-all', paymentMethod === val ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')} onClick={() => setPaymentMethod(val)}>
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', paymentMethod === val ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground')}>{paymentMethod === val && <Check className="h-3 w-3" />}</div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{val === 'CASH_ON_DELIVERY' ? 'Pay when you receive your order' : 'Pay securely online'}</p></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Order Notes (Optional)</CardTitle></CardHeader>
            <CardContent><Textarea rows={3} placeholder="Any special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} /></CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.productImage ? <SmartImage src={item.productImage} alt={item.productName} className="rounded-lg" fallbackIcon={<Package className="h-6 w-6" />} /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-6 w-6" /></div>}
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.effectivePrice)}</p></div>
                    <span className="text-sm font-medium">{formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-success" /><span className="font-medium text-success">{appliedCoupon}</span></div>
                    <button onClick={() => { setAppliedCoupon(undefined); setCouponCode(''); }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <Button variant="outline" onClick={applyCoupon} loading={couponLoading}>Apply</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
                {cart.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatPrice(cart.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? <Badge variant="success">FREE</Badge> : formatPrice(shipping)}</span></div>
              </div>
              <div className="flex justify-between border-t border-border pt-4"><span className="font-semibold">Total</span><span className="text-xl font-editorial font-medium text-primary">{formatPrice(grandTotal)}</span></div>
              <Button size="lg" className="w-full" onClick={placeOrder} loading={placing} disabled={!selectedAddress}>
                {placing ? 'Placing Order...' : `Place Order · ${formatPrice(grandTotal)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title={editingAddress ? 'Edit Address' : 'Add New Address'} size="lg"
        footer={<><Button variant="outline" onClick={() => setShowAddressModal(false)}>Cancel</Button><Button onClick={saveAddress}>{editingAddress ? 'Update' : 'Add'} Address</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required><Input placeholder="John Doe" value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} /></Field>
          <Field label="Phone Number" required><Input placeholder="03XX-XXXXXXX" value={addrForm.phoneNumber} onChange={(e) => setAddrForm({ ...addrForm, phoneNumber: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Address Line 1" required><Input placeholder="House #, Street, Area" value={addrForm.addressLine1} onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Address Line 2"><Input placeholder="Apt, Floor (optional)" value={addrForm.addressLine2} onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })} /></Field></div>
          <Field label="City" required><Input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></Field>
          <Field label="State/Province"><Input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></Field>
          <Field label="Pincode"><Input value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} /></Field>
          <Field label="Country"><Input value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={addrForm.defaultAddress} onChange={(e) => setAddrForm({ ...addrForm, defaultAddress: e.target.checked })} className="rounded" /> Set as default address</label>
        </div>
      </Modal>
    </div>
  );
}
