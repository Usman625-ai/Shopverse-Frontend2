import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Package, ChevronDown, ChevronUp, Truck, MapPin, X, Clock, CheckCircle, XCircle, CreditCard, ClipboardList } from 'lucide-react';
import api from '../../lib/api';
import type { Order, ApiResponse, PagedResponse, OrderStatus } from '../../types';
import { cn, formatPrice, formatDateTime } from '../../lib/utils';
import { Button, Card, CardContent, Badge, Skeleton, Modal, Textarea, Field, SmartImage } from '../../components/ui';
import EmptyState from '../../components/shop/EmptyState';
import Pagination from '../../components/shop/Pagination';
import PageHeader from '../../components/shop/PageHeader';

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive'; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'default', icon: CheckCircle },
  PROCESSING: { label: 'Processing', variant: 'default', icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'default', icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const trackSteps: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: 'PENDING', label: 'Order Placed', icon: Clock },
  { status: 'PROCESSING', label: 'Processing', icon: Package },
  { status: 'SHIPPED', label: 'Shipped', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

const filterTabs: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Order>>>('/api/customer/orders', {
        params: { page, size: 10, status: statusFilter === 'ALL' ? undefined : statusFilter },
      });
      setOrders(res.data.data?.content || []);
      setTotalPages(res.data.data?.totalPages || 0);
      setTotalElements(res.data.data?.totalElements || 0);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { setPage(0); }, [statusFilter]);

  const handleCancel = async () => {
    if (!cancelOrder) return;
    if (!cancelReason.trim()) { toast.error('Please provide a reason for cancellation'); return; }
    setCancelling(true);
    try {
      await api.put(`/api/customer/orders/${cancelOrder.id}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled successfully');
      setCancelOrder(null); setCancelReason('');
      loadOrders();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to cancel order');
    } finally { setCancelling(false); }
  };

  const getTrackStepIndex = (status: OrderStatus) => {
    if (status === 'CANCELLED') return -1;
    return trackSteps.findIndex((s) => s.status === status);
  };

  return (
    <div className="pb-10">
      <PageHeader
        icon={ClipboardList}
        eyebrow="Order History"
        title="My Orders"
        subtitle={`${totalElements} order${totalElements !== 1 ? 's' : ''} total`}
        crumbs={[{ label: 'Orders' }]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/30 p-1 scrollbar-thin">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="accent-tab shrink-0"
              data-active={statusFilter === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && orders.length === 0 ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={Package} title={statusFilter === 'ALL' ? 'No orders yet' : `No ${statusFilter.toLowerCase()} orders`} description="When you place orders, they will appear here." actionLabel="Start Shopping" onAction={() => navigate('/shop/products')} />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order) => {
                const isExpanded = expandedId === order.id;
                const statusCfg = statusConfig[order.orderStatus] || { label: order.orderStatus, variant: 'default' as const, icon: Clock };
                const StatusIcon = statusCfg.icon;
                const stepIdx = getTrackStepIndex(order.orderStatus);
                const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'PROCESSING';
                const items = order.orderItems || [];
                return (
                  <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
                    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-luxury">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/15"><StatusIcon className="h-5 w-5" /></div>
                            <div>
                              <p className="font-medium">Order #{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                            </div>
                          </div>

                          {/* Item thumbnail preview strip */}
                          {!isExpanded && items.length > 0 && (
                            <div className="hidden items-center -space-x-2 sm:flex">
                              {items.slice(0, 4).map((item) => (
                                <div key={item.id} className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-card bg-muted ring-1 ring-border/50">
                                  {item.productImage
                                    ? <SmartImage src={item.productImage} alt={item.productName} fallbackIcon={<Package className="h-3.5 w-3.5" />} />
                                    : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-3.5 w-3.5" /></div>}
                                </div>
                              ))}
                              {items.length > 4 && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-card bg-secondary text-[11px] font-medium text-muted-foreground ring-1 ring-border/50">+{items.length - 4}</div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                            <span className="text-lg font-semibold text-primary">{formatPrice(order.finalAmount)}</span>
                            <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="rounded-lg p-1.5 hover:bg-accent">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="mt-4 space-y-4 border-t border-border pt-4">
                                {order.orderStatus !== 'CANCELLED' ? (
                                  <div>
                                    <h4 className="mb-3 text-sm font-semibold">Order Tracking</h4>
                                    <div className="flex items-center justify-between">
                                      {trackSteps.map((step, i) => {
                                        const StepIcon = step.icon;
                                        const completed = i <= stepIdx;
                                        const isCurrent = i === stepIdx;
                                        return (
                                          <div key={step.status} className="flex flex-1 flex-col items-center">
                                            <div className="flex w-full items-center">
                                              {i > 0 && <div className={cn('h-0.5 flex-1', i <= stepIdx ? 'bg-primary' : 'bg-border')} />}
                                              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors', completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground', isCurrent && 'ring-2 ring-primary/30 ring-offset-2')}>
                                                <StepIcon className="h-4 w-4" />
                                              </div>
                                              {i < trackSteps.length - 1 && <div className={cn('h-0.5 flex-1', i < stepIdx ? 'bg-primary' : 'bg-border')} />}
                                            </div>
                                            <span className={cn('mt-1.5 text-xs', completed ? 'font-medium text-foreground' : 'text-muted-foreground')}>{step.label}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {order.trackingNumber && <p className="mt-3 text-center text-xs text-muted-foreground">Tracking #: <span className="font-medium text-foreground">{order.trackingNumber}</span></p>}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"><XCircle className="h-4 w-4" /> This order has been cancelled{order.cancellationReason ? `: ${order.cancellationReason}` : ''}</div>
                                )}

                                <div>
                                  <h4 className="mb-2 text-sm font-semibold">Items ({items.length})</h4>
                                  <div className="space-y-2">
                                    {items.map((item) => (
                                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:bg-accent/40">
                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                                          {item.productImage
                                            ? <SmartImage src={item.productImage} alt={item.productName} className="rounded-lg" fallbackIcon={<Package className="h-6 w-6" />} />
                                            : <div className="flex h-full w-full items-center justify-center bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>}
                                        </div>
                                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p></div>
                                        <span className="text-sm font-medium">{formatPrice(item.totalPrice)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="rounded-lg border border-border p-3">
                                    <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" /> Shipping Address</p>
                                    <p className="text-sm text-muted-foreground">{order.shippingAddress || 'N/A'}</p>
                                  </div>
                                  <div className="rounded-lg border border-border p-3">
                                    <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><CreditCard className="h-4 w-4 text-primary" /> Payment</p>
                                    <p className="text-sm text-muted-foreground">{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : order.paymentMethod === 'JAZZCASH' ? 'JazzCash' : order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Wallet'}</p>
                                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'FAILED' ? 'destructive' : 'warning'} className="mt-1">{order.paymentStatus}</Badge>
                                  </div>
                                </div>

                                <div className="space-y-1 rounded-lg bg-muted/30 p-3 text-sm">
                                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotalAmount)}</span></div>
                                  {order.discountAmount > 0 && <div className="flex justify-between text-success"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span>-{formatPrice(order.discountAmount)}</span></div>}
                                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(order.shippingAmount)}</span></div>
                                  <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span className="text-primary">{formatPrice(order.finalAmount)}</span></div>
                                </div>

                                {order.notes && <p className="text-sm text-muted-foreground">Note: {order.notes}</p>}
                                {canCancel && <Button variant="destructive" onClick={() => setCancelOrder(order)}><X className="h-4 w-4" /> Cancel Order</Button>}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />}
      </div>

      <Modal open={!!cancelOrder} onClose={() => setCancelOrder(null)} title="Cancel Order" description={`Order #${cancelOrder?.orderNumber}`} footer={<><Button variant="outline" onClick={() => setCancelOrder(null)}>Keep Order</Button><Button variant="destructive" onClick={handleCancel} loading={cancelling}>Confirm Cancellation</Button></>}>
        <Field label="Reason for cancellation" required>
          <Textarea rows={3} placeholder="Please tell us why you're cancelling this order..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
