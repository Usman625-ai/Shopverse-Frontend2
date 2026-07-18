import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ShoppingCart, DollarSign, AlertTriangle, Clock, TrendingUp, ArrowUpRight, Store,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { SellerDashboardStats, ApiResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton, Badge } from '../../components/ui';
import { formatPrice, formatNumber } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
  subtitle?: string;
}

function StatCard({ title, value, icon, gradient, delay, subtitle }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>{icon}</div>
          <p className="mt-3.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<SellerDashboardStats>>('/api/seller/dashboard/stats');
        if (active) setStats(res.data.data);
      } catch {
        if (active) toast.error('Failed to load dashboard stats');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Unable to load dashboard data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.dailyRevenue
    ? Object.entries(stats.dailyRevenue).slice(-7).map(([date, amount]) => ({ date: date.slice(5), amount }))
    : [];
  const maxSale = chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Store className="h-5 w-5" /></div>
        <div>
          <h1 className="text-[1.4rem] font-semibold tracking-tight text-foreground">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground">Quick overview of your shop performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Products"
          value={formatNumber(stats.totalProducts)}
          icon={<Package className="h-5 w-5" />}
          gradient="from-primary-400 to-primary-700"
          delay={0}
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrders)}
          icon={<ShoppingCart className="h-5 w-5" />}
          gradient="from-primary-500 to-primary-800"
          delay={0.05}
          subtitle={`${stats.pendingOrders} pending`}
        />
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          gradient="from-success to-primary-700"
          delay={0.1}
        />
        <StatCard
          title="Low Stock"
          value={formatNumber(stats.lowStockProducts)}
          icon={<AlertTriangle className="h-5 w-5" />}
          gradient="from-warning to-primary-700"
          delay={0.15}
          subtitle="Items below 10 units"
        />
        <StatCard
          title="Pending Orders"
          value={formatNumber(stats.pendingOrders)}
          icon={<Clock className="h-5 w-5" />}
          gradient="from-primary-400 to-primary-900"
          delay={0.2}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Weekly Sales</CardTitle>
              <CardDescription>Revenue over the last 7 days</CardDescription>
            </div>
            <Badge variant="success" className="gap-1">
              <TrendingUp className="h-3 w-3" /> Trending
            </Badge>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No sales data for this week yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
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
                    formatter={(value: number) => [formatPrice(value), 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#salesGradient)"
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Highlights</CardTitle>
            <CardDescription>Quick overview of your shop performance</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4 text-success" />
                <span>Best day this week</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">{formatPrice(maxSale)}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4 text-primary" />
                <span>Active products</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">{formatNumber(stats.totalProducts)}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>Orders to fulfill</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">{formatNumber(stats.pendingOrders)}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Restock needed</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">{formatNumber(stats.lowStockProducts)}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

