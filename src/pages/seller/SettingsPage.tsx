import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Phone, FileText, Image as ImageIcon, Save, Upload, Loader2, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Seller, ApiResponse } from '../../types';
import {
  Button, Input, Textarea, Field, Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton,
} from '../../components/ui';
import { cn } from '../../lib/utils';

interface ShopForm {
  shopName: string;
  shopDescription: string;
  shopLogo: string;
  shopBanner: string;
  contactNumber: string;
  gstNumber: string;
  panNumber: string;
}

export default function SettingsPage() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ShopForm>({
    shopName: '', shopDescription: '', shopLogo: '', shopBanner: '',
    contactNumber: '', gstNumber: '', panNumber: '',
  });
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<Seller>>('/api/seller/profile');
        if (active) {
          const s = res.data.data;
          if (!s) { setLoading(false); return; }
          setSeller(s);
          setForm({
            shopName: s.shopName || '',
            shopDescription: s.shopDescription || '',
            shopLogo: s.shopLogo || '',
            shopBanner: s.shopBanner || '',
            contactNumber: s.contactNumber || '',
            gstNumber: s.gstNumber || '',
            panNumber: s.panNumber || '',
          });
        }
      } catch {
        if (active) toast.error('Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!form.shopName) {
      toast.error('Shop name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<ApiResponse<Seller>>('/api/seller/profile', {
        shopName: form.shopName,
        shopDescription: form.shopDescription,
        shopLogo: form.shopLogo,
        shopBanner: form.shopBanner,
        contactNumber: form.contactNumber,
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
      });
      setSeller(res.data.data);
      toast.success('Shop profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    file: File,
    field: 'shopLogo' | 'shopBanner',
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await api.post<ApiResponse<string[]>>('/api/seller/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data?.[0];
      if (url) {
        setForm((f) => ({ ...f, [field]: url }));
        toast.success(`${field === 'shopLogo' ? 'Logo' : 'Banner'} uploaded`);
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <div className="lg:col-span-2"><Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold font-display tracking-tight">Shop Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your shop profile and business details</p>
      </div>

      {seller?.sellerStatus && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                seller.sellerStatus === 'APPROVED' ? 'bg-success/10' : 'bg-warning/10',
              )}>
                <Store className={cn(
                  'h-5 w-5',
                  seller.sellerStatus === 'APPROVED' ? 'text-success' : 'text-warning',
                )} />
              </div>
              <div>
                <p className="text-sm font-medium">Seller Status: {seller.sellerStatus}</p>
                <p className="text-xs text-muted-foreground">
                  {seller.sellerStatus === 'APPROVED'
                    ? 'Your shop is active and visible to customers.'
                    : seller.sellerStatus === 'PENDING'
                    ? 'Your shop is awaiting approval.'
                    : seller.rejectionReason || 'Contact support for more information.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Media column */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shop Media</CardTitle>
              <CardDescription>Logo and banner images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              <div>
                <p className="mb-2 text-sm font-medium">Shop Logo</p>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    {form.shopLogo ? (
                      <img src={form.shopLogo} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={logoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f, 'shopLogo', setUploadingLogo);
                        if (logoRef.current) logoRef.current.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                    </Button>
                    {form.shopLogo && (
                      <button
                        onClick={() => setForm({ ...form, shopLogo: '' })}
                        className="ml-2 text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <p className="mb-2 text-sm font-medium">Shop Banner</p>
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                  {form.shopBanner ? (
                    <img src={form.shopBanner} alt="Banner" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    ref={bannerRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, 'shopBanner', setUploadingBanner);
                      if (bannerRef.current) bannerRef.current.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bannerRef.current?.click()}
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload Banner
                  </Button>
                  {form.shopBanner && (
                    <button
                      onClick={() => setForm({ ...form, shopBanner: '' })}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shop Details</CardTitle>
              <CardDescription>Basic information about your shop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Shop Name" required>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    placeholder="My Awesome Shop"
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field label="Shop Description">
                <Textarea
                  value={form.shopDescription}
                  onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                  placeholder="Tell customers about your shop..."
                  rows={4}
                />
              </Field>

              <Field label="Contact Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="pl-10"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="GST Number">
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.gstNumber}
                      onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                      placeholder="GST123456789"
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="PAN Number">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.panNumber}
                      onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                      placeholder="ABCDE1234F"
                      className="pl-10"
                    />
                  </div>
                </Field>
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
