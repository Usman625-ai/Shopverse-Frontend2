import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  Store, Users, Package, DollarSign, TrendingUp, CalendarDays, AlertCircle, ShieldCheck, Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { DashboardStats, ApiResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton } from '../../components/ui';
import { formatPrice, formatNumber } from '../../lib/utils';

const cardConfig = [
  { key: 'totalSellers', label: 'Total Sellers', icon: Store, gradient: 'from-primary-400 to-primary-700' },
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, gradient: 'from-success to-primary-800' },
  { key: 'totalProducts', label: 'Total Products', icon: Package, gradient: 'from-warning to-primary-700' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, gradient: 'from-primary-500 to-primary-800' },
  { key: 'todayRevenue', label: "Today's Revenue", icon: TrendingUp, gradient: 'from-success to-primary-600' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: CalendarDays, gradient: 'from-primary-400 to-primary-900' },
] as const;

const statusColors: Record<string, string> = {
  PENDING: '#c98a2c',
  PROCESSING: '#6b7fa3',
  SHIPPED: '#8b6f47',
  DELIVERED: '#3f6b52',
  CANCELLED: '#a4423a',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats');
        if (!cancelled) setStats(res.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string; message?: string } } };
        const msg = e.response?.data?.error || e.response?.data?.message || 'Failed to load dashboard stats';
        if (!cancelled) { setError(msg); toast.error(msg); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dailyRevenueData = stats?.dailyRevenue
    ? Object.entries(stats.dailyRevenue).map(([date, amount]) => ({ date, amount }))
    : [];
  const ordersByStatusData = stats?.ordersByStatus
    ? Object.entries(stats.ordersByStatus).map(([status, count]) => ({ status, count }))
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-6 w-20" /><Skeleton className="h-4 w-16" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card><CardContent className="pt-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="mt-4 text-lg font-medium text-foreground">{error}</p>
        <p className="mt-1 text-sm text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <h1 className="text-[1.4rem] font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your platform performance</p>
        </div>
      </div>

      {/* Stat cards — gradient icon chips */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cardConfig.map((c, i) => {
          const Icon = c.icon;
          const value = stats ? (stats as unknown as Record<string, number>)[c.key] : 0;
          const isRevenue = c.key.includes('Revenue');
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <p className="mt-3.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {isRevenue ? formatPrice(value) : formatNumber(value)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Approved Sellers', value: stats?.approvedSellers ?? 0, icon: ShieldCheck },
          { label: 'Pending Approvals', value: stats?.pendingSellerApprovals ?? 0, icon: Clock3 },
          { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: Package },
          { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: Clock3 },
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users },
        ].map((s, i) => {
          const I = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.03 }} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground"><I className="h-4 w-4" /></div>
              <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-semibold text-foreground">{formatNumber(s.value)}</p></div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Revenue trend over recent days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenueData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No revenue data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyRevenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(v: number) => [formatPrice(v), 'Revenue']}
                    labelFormatter={(l) => { const d = new Date(l as string); return d.toLocaleDateString(); }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersByStatusData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No order data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersByStatusData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                    {ordersByStatusData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status] || 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
