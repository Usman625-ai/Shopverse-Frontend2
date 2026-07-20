import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Bell, CheckCheck, ShoppingBag, CreditCard, Info, Star, PackageX, XCircle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import type { Notification, NotificationType, ApiResponse, PagedResponse } from '../../types';
import { cn, formatDateTime } from '../../lib/utils';
import { Button, Card, CardContent, Skeleton, Badge } from '../../components/ui';
import EmptyState from '../../components/shop/EmptyState';
import Pagination from '../../components/shop/Pagination';
import PageHeader from '../../components/shop/PageHeader';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  ORDER_PLACED: { icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', label: 'Order' },
  ORDER_CONFIRMED: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', label: 'Order' },
  ORDER_SHIPPED: { icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', label: 'Shipped' },
  ORDER_DELIVERED: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Delivered' },
  ORDER_CANCELLED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' },
  PAYMENT_SUCCESS: { icon: CreditCard, color: 'text-success', bg: 'bg-success/10', label: 'Payment' },
  PAYMENT_FAILED: { icon: CreditCard, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Payment' },
  SELLER_APPROVED: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Account' },
  SELLER_REJECTED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Account' },
  NEW_REVIEW: { icon: Star, color: 'text-warning', bg: 'bg-warning/10', label: 'Review' },
  LOW_STOCK: { icon: PackageX, color: 'text-warning', bg: 'bg-warning/10', label: 'Stock' },
  GENERAL: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted', label: 'General' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [marking, setMarking] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Notification>>>('/api/customer/notifications', { params: { page, size: 10 } });
      const list = res.data.data.content || [];
      setNotifications(list);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch { setNotifications([]); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.put('/api/customer/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark notifications as read'); } finally { setMarking(false); }
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try { await api.put(`/api/customer/notifications/${notif.id}/read`); } catch { /* silent */ }
    }
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications about your orders and promotions will appear here." />;
  }

  return (
    <div className="pb-10">
      <PageHeader
        icon={Bell}
        eyebrow="Updates"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : "You're all caught up!"}
        crumbs={[{ label: 'Notifications' }]}
        right={unreadCount > 0 ? <Button variant="outline" onClick={markAllRead} loading={marking}><CheckCheck className="h-4 w-4" /> Mark All Read</Button> : undefined}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <AnimatePresence>
          {notifications.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.GENERAL;
            const Icon = cfg.icon;
            return (
              <motion.div key={notif.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className={cn('cursor-pointer transition-colors hover:border-primary/30', !notif.read && 'border-primary/30 bg-primary/5')} onClick={() => handleClick(notif)}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
                      <Icon className={cn('h-5 w-5', cfg.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notif.title}</p>
                          {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <Badge variant="outline" className="shrink-0">{cfg.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">{formatDateTime(notif.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {totalPages > 1 && <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />}
      </div>
    </div>
  );
}