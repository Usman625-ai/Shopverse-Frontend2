import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings, Save, Wrench, Globe, Mail, DollarSign, Loader2, AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';
import type { ApiResponse } from '../../types';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Field, Skeleton,
} from '../../components/ui';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [settings, setSettings] = useState({ siteName: '', contactEmail: '', currencySymbol: 'PKR' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<boolean>>('/api/admin/settings/maintenance');
        setMaintenance(res.data.data);
      } catch {
        // maintenance endpoint may not be ready; ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await api.post<ApiResponse<boolean>>(`/api/admin/settings/maintenance?enable=${!maintenance}`);
      setMaintenance(res.data.data);
      toast.success(`Maintenance mode ${!maintenance ? 'enabled' : 'disabled'}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to toggle maintenance mode');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.siteName.trim()) { toast.error('Site name is required'); return; }
    if (!settings.contactEmail.trim()) { toast.error('Contact email is required'); return; }
    setSaving(true);
    try {
      await api.put('/api/admin/settings', settings);
      toast.success('Settings saved');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-72" /></div>
        <Card><CardContent className="pt-6 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage platform-wide configuration</p>
      </div>

      {/* Maintenance mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', maintenance ? 'bg-warning/10' : 'bg-muted')}>
              <Wrench className={cn('h-5 w-5', maintenance ? 'text-warning' : 'text-muted-foreground')} />
            </div>
            <div>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Temporarily disable customer access to the platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors', maintenance ? 'bg-warning' : 'bg-muted')} onClick={() => !maintenanceLoading && toggleMaintenance()}>
                <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform', maintenance ? 'translate-x-6' : 'translate-x-1')} />
                {maintenanceLoading && <Loader2 className="absolute left-1/2 h-4 w-4 -translate-x-1/2 animate-spin text-foreground/50" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{maintenance ? 'Maintenance mode is active' : 'Platform is live'}</p>
                <p className="text-xs text-muted-foreground">{maintenance ? 'Customers will see a maintenance page' : 'All customers can access the platform normally'}</p>
              </div>
            </div>
            <Button variant={maintenance ? 'outline' : 'destructive'} onClick={toggleMaintenance} loading={maintenanceLoading} disabled={maintenanceLoading}>
              <Wrench className="h-4 w-4" /> {maintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
            </Button>
          </div>
          {maintenance && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
              <p className="text-sm text-foreground">The platform is currently in maintenance mode. Only admins can access the system.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic platform information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Site Name" required>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ShopVerse" value={settings.siteName} onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))} className="pl-10" />
              </div>
            </Field>
            <Field label="Contact Email" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" placeholder="support@shopverse.com" value={settings.contactEmail} onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))} className="pl-10" />
              </div>
            </Field>
            <Field label="Currency Symbol">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="PKR" value={settings.currencySymbol} onChange={(e) => setSettings((s) => ({ ...s, currencySymbol: e.target.value }))} className="pl-10" />
              </div>
            </Field>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={saveSettings} loading={saving}><Save className="h-4 w-4" /> Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
