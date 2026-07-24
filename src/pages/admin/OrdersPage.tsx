import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShoppingBag, Eye, ChevronLeft, ChevronRight, Package, MapPin, CreditCard } from 'lucide-react';
import api from '../../lib/api';
import type { Order, PagedResponse, ApiResponse, OrderStatus, PaymentStatus } from '../../types';
import { Card, CardContent, Button, Badge, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton } from '../../components/ui';
import { formatPrice, formatDate, formatDateTime, cn } from '../../lib/utils';

const orderStatusVariant: Record<OrderStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning', CONFIRMED: 'default', PROCESSING: 'default',
  SHIPPED: 'default', DELIVERED: 'success', CANCELLED: 'destructive',
};
const paymentStatusVariant: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning', PAID: 'success', FAILED: 'destructive', REFUNDED: 'default',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const size = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Order>>>('/api/admin/orders', { params: { page, size } });
      const pr = res.data.data;
      if (!pr) return;
      setOrders(pr.content || []);
      setTotalPages(pr.totalPages || 0);
      setTotalElements(pr.totalElements || 0);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load orders');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (order: Order) => {
    setSelected(order);
    setDetailLoading(true);
    try {
      const res = await api.get<ApiResponse<Order>>(`/api/admin/orders/${order.id}`);
      setSelected(res.data.data);
    } catch { /* keep list version */ } finally { setDetailLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and manage all platform orders</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border p-4">
                  <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-20" /><div className="flex-1" /><Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">No orders found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead className="hidden lg:table-cell">Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} onClick={() => viewOrder(o)}>
                      <TableCell className="font-medium text-primary">{o.orderNumber}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-foreground">{o.customerName || '—'}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {(o.orderItems || []).length} item{(o.orderItems || []).length !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{formatPrice(o.finalAmount)}</TableCell>
                      <TableCell><Badge variant={orderStatusVariant[o.orderStatus] || 'default'}>{o.orderStatus}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant={paymentStatusVariant[o.paymentStatus] || 'default'}>{o.paymentStatus}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" title="View" onClick={() => viewOrder(o)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{totalElements} order{totalElements !== 1 ? 's' : ''} total</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {Math.max(totalPages, 1)}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details" size="xl">
        {selected && (
          <div className="space-y-4">
            {detailLoading && <div className="flex items-center justify-center py-4"><Skeleton className="h-4 w-32" /></div>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selected.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">{formatDateTime(selected.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={orderStatusVariant[selected.orderStatus] || 'default'}>{selected.orderStatus}</Badge>
                <Badge variant={paymentStatusVariant[selected.paymentStatus] || 'default'}>{selected.paymentStatus}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Customer</p>
                <p className="mt-1 text-sm font-medium text-foreground">{selected.customerName || '—'}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><MapPin className="h-3 w-3" /> Shipping Address</p>
                <p className="mt-1 text-sm text-foreground">{selected.shippingAddress || 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Package className="h-3 w-3" /> Items</p>
              <div className="mt-2 space-y-2">
                {(selected.orderItems || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><CreditCard className="h-3 w-3" /> Payment</p>
                <p className="mt-1 text-sm text-foreground">{selected.paymentMethod}</p>
                {selected.trackingNumber && <p className="text-sm text-muted-foreground">Tracking: {selected.trackingNumber}</p>}
                {selected.notes && <p className="mt-1 text-sm text-muted-foreground">Notes: {selected.notes}</p>}
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <Row label="Subtotal" value={formatPrice(selected.subtotalAmount)} />
                {selected.discountAmount > 0 && <Row label="Discount" value={`- ${formatPrice(selected.discountAmount)}`} className="text-success" />}
                <Row label="Shipping" value={formatPrice(selected.shippingAmount)} />
                <div className="border-t border-border pt-1"><Row label="Total" value={formatPrice(selected.finalAmount)} bold /></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className={cn('text-sm', bold ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{label}</p>
      <p className={cn('text-sm', bold ? 'font-bold text-foreground' : 'text-foreground', className)}>{value}</p>
    </div>
  );
}
