import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, FileSpreadsheet, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import {
  Button, Input, Field, Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '../../components/ui';
import { downloadBlob, formatDate, cn } from '../../lib/utils';

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthAgoStr = monthAgo.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(monthAgoStr);
  const [toDate, setToDate] = useState(today);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both dates');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('From date cannot be after to date');
      return;
    }
    setDownloading(true);
    try {
      const res = await api.get('/api/seller/reports/sales', {
        params: { from: fromDate, to: toDate },
        responseType: 'blob',
      });
      const filename = `sales-report_${fromDate}_to_${toDate}.xlsx`;
      downloadBlob(res.data, filename);
      toast.success('Report downloaded successfully');
    } catch (err: any) {
      // Blob error responses need manual parsing
      let message = 'Failed to download report';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          message = json?.message || json?.error || message;
        } catch { /* use default message */ }
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const setQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFromDate(from.toISOString().split('T')[0]);
    setToDate(to.toISOString().split('T')[0]);
  };

  const rangeDays = fromDate && toDate
    ? Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold font-display tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">Download sales reports for your shop</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Sales Report</CardTitle>
            <CardDescription>
              Generate an Excel report of your sales within a date range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick ranges */}
            <div>
              <p className="mb-2 text-sm font-medium">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 30 days', days: 30 },
                  { label: 'Last 90 days', days: 90 },
                  { label: 'This year', days: 365 },
                ].map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setQuickRange(r.days)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date inputs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="From Date" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Field>
              <Field label="To Date" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={today}
                    onChange={(e) => setToDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Field>
            </div>

            {/* Range summary */}
            {rangeDays > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {rangeDays} day{rangeDays !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(fromDate)} — {formatDate(toDate)}
                  </p>
                </div>
              </div>
            )}

            {/* Download button */}
            <div className="flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <FileSpreadsheet className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Excel Format (.xlsx)</p>
                  <p className="text-xs text-muted-foreground">
                    Includes product, order, and revenue details
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDownload}
                loading={downloading}
                size="lg"
                className="w-full sm:w-auto"
                disabled={!fromDate || !toDate}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloading ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">About Sales Reports</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Reports are generated in Excel (.xlsx) format</li>
                  <li>• Data includes all orders within the selected date range</li>
                  <li>• Revenue figures reflect completed and pending orders</li>
                  <li>• Use the downloaded file for accounting and tax purposes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
