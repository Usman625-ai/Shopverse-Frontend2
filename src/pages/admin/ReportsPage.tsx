import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileSpreadsheet, Download, Calendar, TrendingUp, Loader2, BarChart3,
} from 'lucide-react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Field } from '../../components/ui';
import { downloadBlob, formatDate, cn } from '../../lib/utils';

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!from || !to) { toast.error('Please select both from and to dates'); return; }
    if (new Date(from) > new Date(to)) { toast.error('From date cannot be after to date'); return; }
    setDownloading(true);
    try {
      const res = await api.get('/api/admin/reports/sales', { params: { from, to }, responseType: 'blob' });
      const filename = `sales-report_${from}_to_${to}.xlsx`;
      downloadBlob(res.data, filename);
      toast.success('Report downloaded successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      // Blob error responses need text parsing
      let msg = e.response?.data?.error || e.response?.data?.message || 'Failed to download report';
      if (e.response?.data instanceof Blob) {
        try { const text = await e.response.data.text(); const parsed = JSON.parse(text); msg = parsed.error || parsed.message || msg; } catch { /* keep default */ }
      }
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  const setPreset = (days: number) => {
    const t = new Date();
    const f = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setFrom(f.toISOString().slice(0, 10));
    setTo(t.toISOString().slice(0, 10));
  };

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const rangeDays = from && to ? Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Download sales reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Date range selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Sales Report</CardTitle>
                  <CardDescription>Download an Excel report of sales within a date range</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="From Date" required>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to} />
                  </Field>
                  <Field label="To Date" required>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} max={today} />
                  </Field>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPreset(p.days)}
                      className={cn(
                        'rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                        from === new Date(Date.now() - p.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) && 'border-primary bg-primary/10 text-primary'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {from && to && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Report covers <span className="font-medium text-foreground">{rangeDays} day{rangeDays !== 1 ? 's' : ''}</span> from {formatDate(from)} to {formatDate(to)}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleDownload} loading={downloading} disabled={!from || !to} size="lg">
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloading ? 'Generating...' : 'Download Excel Report'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <FileSpreadsheet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Excel Format</p>
                  <p className="text-xs text-muted-foreground">.xlsx spreadsheet file</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                The report includes order details, revenue breakdown, product performance, and customer summaries for the selected period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">What's Included</p>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" /> Total sales and revenue</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" /> Order count and status breakdown</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" /> Top-selling products</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" /> Seller performance metrics</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
