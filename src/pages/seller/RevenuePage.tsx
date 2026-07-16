import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Order, PagedResponse, ApiResponse } from '../../types';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton, Badge,
} from '../../components/ui';
import { formatPrice, formatNumber, cn } from '../../lib/utils';

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

export default function RevenuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        // Fetch a large page to aggregate revenue locally
        const res = await api.get<ApiResponse<PagedResponse<Order>>>('/api/seller/orders', {
          params: { page: 0, size: 500 },
        });
        if (active) setOrders(res.data.data.content);
      } catch {
        if (active) toast.error('Failed to load revenue data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const monthlyData: MonthlyData[] = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number; sortKey: number }>();
    const now = new Date();
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      map.set(key, { revenue: 0, orders: 0, sortKey: i });
      // store label in a parallel structure
    }
    const labels = new Map<string, string>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.set(key, d.toLocaleDateString('en-US', { month: 'short' }));
    }

    orders.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = map.get(key);
      if (entry) {
        entry.revenue += (order.finalAmount ?? 0);
        entry.orders += 1;
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .map(([key, val]) => ({
        month: labels.get(key) || key,
        revenue: val.revenue,
        orders: val.orders,
      }));
  }, [orders]);

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.finalAmount ?? 0), 0), [orders]);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const revenueChange = currentMonth && prevMonth && prevMonth.revenue > 0
    ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
    : 0;
  const isUp = revenueChange >= 0;

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold font-display tracking-tight">Revenue</h2>
        <p className="text-sm text-muted-foreground">Track your earnings over time</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="mt-2 text-2xl font-semibold font-display tracking-tight">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success">
                  <DollarSign className="h-5 w-5 text-success-foreground" />
                </div>
              </div>
              {revenueChange !== 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    isUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}>
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(revenueChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="mt-2 text-2xl font-semibold font-display tracking-tight">{formatNumber(totalOrders)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                  <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">All-time orders received</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                  <p className="mt-2 text-2xl font-semibold font-display tracking-tight">{formatPrice(avgOrderValue)}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Per order average</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Last 6 months performance</CardDescription>
            </div>
            <Badge variant="default">6 Months</Badge>
          </CardHeader>
          <CardContent>
            {monthlyData.every((d) => d.revenue === 0) ? (
              <div className="flex h-80 flex-col items-center justify-center text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No revenue data yet.</p>
                <p className="text-xs text-muted-foreground">Sales will appear here once orders come in.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [formatPrice(value), 'Revenue'];
                      return [`${value} orders`, 'Orders'];
                    }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {monthlyData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={entry.revenue === maxRevenue ? 'hsl(var(--primary))' : 'hsl(var(--primary-400))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Detailed view of revenue and orders per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyData.slice().reverse().map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/15 font-semibold">
                      {d.month.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.month}</p>
                      <p className="text-xs text-muted-foreground">{d.orders} order(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold font-display tracking-tight">{formatPrice(d.revenue)}</p>
                    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
