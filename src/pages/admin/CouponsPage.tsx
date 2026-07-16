import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Ticket, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, AlertCircle, Copy,
} from 'lucide-react';
import api from '../../lib/api';
import type { Coupon, PagedResponse, ApiResponse } from '../../types';
import {
  Card, CardContent, Button, Input, Select, Badge, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, Field,
} from '../../components/ui';
import { formatPrice, formatDate, cn } from '../../lib/utils';

interface FormState {
  code: string; type: 'PERCENTAGE' | 'FIXED'; value: string;
  minOrderValue: string; maxUses: string; validFrom: string; validUntil: string;
}
const emptyForm: FormState = { code: '', type: 'PERCENTAGE', value: '', minOrderValue: '', maxUses: '', validFrom: '', validUntil: '' };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const size = 10;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Coupon>>>('/api/admin/coupons', { params: { page, size } });
      const pr = res.data.data;
      if (!pr) return;
      setCoupons(pr.content || []);
      setTotalPages(pr.totalPages || 0);
      setTotalElements(pr.totalElements || 0);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.discountType, value: String(c.discountValue),
      minOrderValue: c.minOrderValue ? String(c.minOrderValue) : '', maxUses: c.usageLimit ? String(c.usageLimit) : '',
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '', validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Coupon code is required'); return; }
    if (!form.value) { toast.error('Value is required'); return; }
    if (!form.validFrom || !form.validUntil) { toast.error('Valid from and to dates are required'); return; }
    setSaving(true);
    const body = {
      code: form.code.trim().toUpperCase(),
      discountType: form.type,
      discountValue: Number(form.value),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      usageLimit: form.maxUses ? Number(form.maxUses) : undefined,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
    };
    try {
      if (editing) {
        const res = await api.put<ApiResponse<Coupon>>(`/api/admin/coupons/${editing.id}`, body);
        setCoupons((prev) => prev.map((c) => (c.id === editing.id ? res.data.data : c)));
        toast.success('Coupon updated');
      } else {
        const res = await api.post<ApiResponse<Coupon>>('/api/admin/coupons', body);
        setCoupons((prev) => [res.data.data, ...prev]);
        toast.success('Coupon created');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/coupons/${deleteTarget.id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success('Coupon deleted');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success('Code copied to clipboard'); };

  const isExpired = (c: Coupon) => new Date(c.validUntil) < new Date();
  const isExhausted = (c: Coupon) => (c.usageLimit ?? 0) > 0 && c.usedCount >= (c.usageLimit ?? 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Coupon</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex-1" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">No coupons yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first coupon to offer discounts</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" /> New Coupon</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="hidden md:table-cell">Min Order</TableHead>
                    <TableHead className="hidden sm:table-cell">Usage</TableHead>
                    <TableHead className="hidden lg:table-cell">Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => {
                    const expired = isExpired(c);
                    const exhausted = isExhausted(c);
                    const active = c.active && !expired && !exhausted;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">{c.code}</code>
                            <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={c.discountType === 'PERCENTAGE' ? 'default' : 'secondary'}>{c.discountType === 'PERCENTAGE' ? '%' : 'Fixed'}</Badge></TableCell>
                        <TableCell className="font-medium text-foreground">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatPrice(c.discountValue)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{c.minOrderValue ? formatPrice(c.minOrderValue) : '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {c.usedCount}{(c.usageLimit ?? 0) > 0 ? ` / ${c.usageLimit}` : ' / ∞'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(c.validFrom)} — {formatDate(c.validUntil)}
                        </TableCell>
                        <TableCell>
                          {expired ? <Badge variant="destructive">Expired</Badge> : exhausted ? <Badge variant="warning">Exhausted</Badge> : active ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-sm text-muted-foreground">{totalElements} coupon{totalElements !== 1 ? 's' : ''} total</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {Math.max(totalPages, 1)}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); }}
        title={editing ? 'Edit Coupon' : 'New Coupon'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create Coupon'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Coupon Code" required>
            <Input placeholder="e.g. SUMMER20" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="uppercase" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Type" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'PERCENTAGE' | 'FIXED' }))}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </Select>
            </Field>
            <Field label={form.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (PKR)'} required>
              <Input type="number" min="0" placeholder="20" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Order Value (PKR)">
              <Input type="number" min="0" placeholder="0" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} />
            </Field>
            <Field label="Max Uses (0 = unlimited)">
              <Input type="number" min="0" placeholder="0" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valid From" required>
              <Input type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} />
            </Field>
            <Field label="Valid To" required>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Coupon"
        description={`Delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="h-4 w-4" /> Delete</Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-sm text-foreground">Customers will no longer be able to use this coupon code.</p>
        </div>
      </Modal>
    </motion.div>
  );
}
