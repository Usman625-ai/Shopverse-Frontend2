import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, ShoppingBag, CreditCard, Info, Star, PackageX, XCircle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import type { Notification, NotificationType, ApiResponse, PagedResponse } from '../../types';
import { cn, formatDateTime } from '../../lib/utils';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  ORDER_PLACED: { icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
  ORDER_CONFIRMED: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  ORDER_SHIPPED: { icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
  ORDER_DELIVERED: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  ORDER_CANCELLED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  PAYMENT_SUCCESS: { icon: CreditCard, color: 'text-success', bg: 'bg-success/10' },
  PAYMENT_FAILED: { icon: CreditCard, color: 'text-destructive', bg: 'bg-destructive/10' },
  SELLER_APPROVED: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  SELLER_REJECTED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  NEW_REVIEW: { icon: Star, color: 'text-warning', bg: 'bg-warning/10' },
  LOW_STOCK: { icon: PackageX, color: 'text-warning', bg: 'bg-warning/10' },
  GENERAL: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' },
};

interface Props {
  basePath: '/api/customer' | '/api/seller' | '/api/admin';
  /** dark chrome (dashboard sidebar/topbar) needs different icon-button styling */
  variant?: 'light' | 'dark';
  className?: string;
}

export default function NotificationBell({ basePath, variant = 'light', className }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<number>>(`${basePath}/notifications/unread-count`);
      setUnreadCount(res.data.data || 0);
    } catch { /* silent - non-critical */ }
  }, [basePath]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Notification>>>(`${basePath}/notifications`, { params: { page: 0, size: 8 } });
      setNotifications(res.data.data.content || []);
    } catch { setNotifications([]); } finally { setLoading(false); }
  }, [basePath]);

  useEffect(() => {
    loadUnreadCount();
    const t = setInterval(loadUnreadCount, 45000);
    return () => clearInterval(t);
  }, [loadUnreadCount]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  };

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.put(`${basePath}/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ } finally { setMarking(false); }
  };

  const handleClickNotification = async (n: Notification) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try { await api.put(`${basePath}/notifications/${n.id}/read`); } catch { /* silent */ }
    }
    setOpen(false);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const btnClasses = variant === 'dark'
    ? 'relative rounded-lg p-2 text-white/70 hover:bg-white/10 transition-colors'
    : 'relative rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors';

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button onClick={handleToggle} className={btnClasses} aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-none text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed left-3 right-3 top-[76px] z-50 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[22rem] sm:max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-border/70 bg-card shadow-luxury-lg"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} disabled={marking} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="space-y-1 p-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">You're all caught up</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = typeConfig[n.type] || typeConfig.GENERAL;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClickNotification(n)}
                      className={cn('flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent', !n.read && 'bg-primary/[0.04]')}
                    >
                      <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', cfg.bg)}><Icon className={cn('h-4 w-4', cfg.color)} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{n.title}</p>
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-[0.7rem] text-muted-foreground/70">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

