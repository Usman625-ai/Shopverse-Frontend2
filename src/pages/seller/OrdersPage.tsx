import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, Eye, Truck, Package, CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Order, OrderStatus, PagedResponse, ApiResponse } from '../../types';
import {
  Button, Input, Textarea, Select, Field, Card, CardContent, Modal, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, SkeletonTable,
} from '../../components/ui';
import { formatPrice, formatDate, formatDateTime, cn } from '../../lib/utils';

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: <Clock className="h-3.5 w-3.5" /> },
  CONFIRMED: { label: 'Confirmed', variant: 'default', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  PROCESSING: { label: 'Processing', variant: 'default', icon: <Loader className="h-3.5 w-3.5" /> },
  SHIPPED: { label: 'Shipped', variant: 'default', icon: <Truck className="h-3.5 w-3.5" /> },
  DELIVERED: { label: 'Delivered', variant: 'success', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [statusForm, setStatusForm] = useState({ status: '' as OrderStatus, trackingNumber: '', comment: '' });
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Order>>>('/api/seller/orders', { params: { page: p, size: 10 } });
      const pr = res.data.data;
      if (!pr) return;
      setOrders(pr.content || []);
      setTotalPages(pr.totalPages || 0);
      setTotalElements(pr.totalElements || 0);
      setPage(pr.pageNumber ?? p);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(0); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openStatusModal = (order: Order) => {
    setStatusModal(order);
    setStatusForm({ status: order.orderStatus, trackingNumber: order.trackingNumber || '', comment: '' });
  };

  const handleStatusUpdate = async () => {
    if (!statusModal) return;
    setSaving(true);
    try {
      await api.put(`/api/seller/orders/${statusModal.id}/status`, {
        status: statusForm.status,
        trackingNumber: statusForm.trackingNumber || undefined,
        comment: statusForm.comment || undefined,
      });
      toast.success('Order status updated');
      setStatusModal(null);
      fetchOrders(page);
    } catch { toast.error('Failed to update order status'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display tracking-tight">Orders</h2>
          <p className="text-sm text-muted-foreground">{totalElements} total orders</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><SkeletonTable rows={6} /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-medium">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">{search || statusFilter ? 'Try adjusting your filters.' : 'Orders will appear here once customers buy.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead>
                  <TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order, idx) => {
                  const cfg = statusConfig[order.orderStatus] || { label: order.orderStatus, variant: 'secondary' as const, icon: null };
                  return (
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: idx * 0.03 }} className="border-b border-border transition-colors hover:bg-muted/30">
                      <TableCell><span className="font-mono text-sm font-medium">{order.orderNumber}</span></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{order.customerName || '—'}</p>
                      </TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span></TableCell>
                      <TableCell><span className="text-sm">{(order.orderItems || []).length} item(s)</span></TableCell>
                      <TableCell><span className="font-medium">{formatPrice(order.finalAmount)}</span></TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant as 'default' | 'success' | 'warning' | 'destructive' | 'secondary'} className="gap-1">{cfg.icon}{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewOrder(order)} title="View"><Eye className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => openStatusModal(order)}><Package className="h-4 w-4" /> Update</Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => fetchOrders(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => fetchOrders(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.orderNumber || ''}`} description={viewOrder ? formatDateTime(viewOrder.createdAt) : ''} size="lg"
        footer={<><Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>{viewOrder && <Button onClick={() => { openStatusModal(viewOrder); setViewOrder(null); }}><Package className="h-4 w-4" /> Update Status</Button>}</>}>
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium">{viewOrder.customerName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-medium">{viewOrder.paymentMethod}</p>
                <Badge variant={viewOrder.paymentStatus === 'PAID' ? 'success' : 'warning'} className="mt-1">{viewOrder.paymentStatus}</Badge>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Shipping Address</p>
              <p className="text-sm">{viewOrder.shippingAddress || 'N/A'}</p>
            </div>
            {viewOrder.trackingNumber && (
              <div><p className="mb-1 text-xs text-muted-foreground">Tracking Number</p><p className="font-mono text-sm">{viewOrder.trackingNumber}</p></div>
            )}
            <div>
              <p className="mb-2 text-sm font-medium">Items</p>
              <div className="space-y-2">
                {(viewOrder.orderItems || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 border-t border-border pt-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(viewOrder.subtotalAmount)}</span></div>
              {viewOrder.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-success">-{formatPrice(viewOrder.discountAmount)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(viewOrder.shippingAmount)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span>{formatPrice(viewOrder.finalAmount)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Update Order Status" description={statusModal?.orderNumber} size="md"
        footer={<><Button variant="outline" onClick={() => setStatusModal(null)}>Cancel</Button><Button onClick={handleStatusUpdate} loading={saving}>Update Status</Button></>}>
        <div className="space-y-4">
          <Field label="Status" required>
            <Select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as OrderStatus })}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </Select>
          </Field>
          <Field label="Tracking Number">
            <Input value={statusForm.trackingNumber} onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })} placeholder="e.g. TCS-123456789" />
          </Field>
          <Field label="Comment / Note">
            <Textarea value={statusForm.comment} onChange={(e) => setStatusForm({ ...statusForm, comment: e.target.value })} placeholder="Optional note for this status update" rows={3} />
          </Field>
          {statusModal && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Current status:</span>
              <Badge variant={(statusConfig[statusModal.orderStatus] || { variant: 'secondary' as const }).variant} className="gap-1">
                {(statusConfig[statusModal.orderStatus] || {}).icon}
                {(statusConfig[statusModal.orderStatus] || { label: statusModal.orderStatus }).label}
              </Badge>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

