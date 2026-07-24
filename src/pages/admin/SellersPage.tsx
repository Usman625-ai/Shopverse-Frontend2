import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Store, CheckCircle, XCircle, Ban, RotateCcw, Search, Eye, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../../lib/api';
import type { Seller, PagedResponse, ApiResponse, SellerStatus } from '../../types';
import {
  Card, CardContent, Button, Input, Select, Badge, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, Field, Textarea,
} from '../../components/ui';
import { formatDate, getInitials, cn } from '../../lib/utils';

const statusVariant: Record<SellerStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  SUSPENDED: 'default',
};

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Seller | null>(null);
  const [rejectSeller, setRejectSeller] = useState<Seller | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<ApiResponse<PagedResponse<Seller>>>('/api/admin/sellers', { params });
      const pr = res.data.data;
      if (!pr) return;
      let list = pr.content || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.shopName || '').toLowerCase().includes(q));
      }
      setSellers(list);
      setTotalPages(pr.totalPages);
      setTotalElements(pr.totalElements);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load sellers');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const handleAction = async (seller: Seller, action: 'approve' | 'reject' | 'suspend' | 'reinstate') => {
    if (action === 'reject') {
      setRejectSeller(seller);
      return;
    }
    setActionLoading(seller.id);
    try {
      let res;
      if (action === 'approve') {
        res = await api.put<ApiResponse<Seller>>(`/api/admin/sellers/${seller.id}/approve`);
      } else if (action === 'suspend') {
        res = await api.put<ApiResponse<Seller>>(`/api/admin/sellers/${seller.id}/status?enable=false`);
      } else {
        res = await api.put<ApiResponse<Seller>>(`/api/admin/sellers/${seller.id}/status?enable=true`);
      }
      const updated = res.data.data;
      setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selected?.id === updated.id) setSelected(updated);
      toast.success(`Seller ${action === 'approve' ? 'approved' : action === 'suspend' ? 'suspended' : 'reinstated'} successfully`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || `Failed to ${action} seller`);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectSeller) return;
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setActionLoading(rejectSeller.id);
    try {
      const res = await api.put<ApiResponse<Seller>>(`/api/admin/sellers/${rejectSeller.id}/reject`, { reason: rejectReason });
      const updated = res.data.data;
      setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selected?.id === updated.id) setSelected(updated);
      toast.success('Seller rejected');
      setRejectSeller(null);
      setRejectReason('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to reject seller');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Sellers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage seller applications and status</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search sellers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-full pl-9 sm:w-64" />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="w-36">
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : sellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">No sellers found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead className="hidden md:table-cell">Shop</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map((s) => (
                    <TableRow key={s.id} onClick={() => setSelected(s)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{getInitials(s.name)}</div>
                          <div>
                            <p className="font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-foreground">{s.shopName || '—'}</p>
                        {s.gstNumber && <p className="text-xs text-muted-foreground">GST: {s.gstNumber}</p>}
                      </TableCell>
                      <TableCell><Badge variant={statusVariant[s.sellerStatus]}>{s.sellerStatus}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {s.sellerStatus === 'PENDING' && (
                            <>
                              <Button size="icon" variant="success" title="Approve" loading={actionLoading === s.id} onClick={() => handleAction(s, 'approve')}><CheckCircle className="h-4 w-4" /></Button>
                              <Button size="icon" variant="destructive" title="Reject" onClick={() => handleAction(s, 'reject')}><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                          {s.sellerStatus === 'APPROVED' && (
                            <Button size="icon" variant="outline" title="Suspend" loading={actionLoading === s.id} onClick={() => handleAction(s, 'suspend')}><Ban className="h-4 w-4" /></Button>
                          )}
                          {s.sellerStatus === 'SUSPENDED' && (
                            <Button size="icon" variant="success" title="Reinstate" loading={actionLoading === s.id} onClick={() => handleAction(s, 'reinstate')}><RotateCcw className="h-4 w-4" /></Button>
                          )}
                          <Button size="icon" variant="ghost" title="View details" onClick={() => setSelected(s)}><Eye className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{totalElements} seller{totalElements !== 1 ? 's' : ''} total</p>
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

      {/* Seller details modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Seller Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">{getInitials(selected.name)}</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                <Badge variant={statusVariant[selected.sellerStatus]} className="mt-1">{selected.sellerStatus}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Shop Name" value={selected.shopName} />
              <InfoRow label="Contact Number" value={selected.contactNumber} />
              <InfoRow label="GST Number" value={selected.gstNumber} />
              <InfoRow label="PAN Number" value={selected.panNumber} />
              <InfoRow label="Verified" value={selected.verified ? 'Yes' : 'No'} />
              <InfoRow label="Active" value={selected.active ? 'Yes' : 'No'} />
              <InfoRow label="Joined" value={formatDate(selected.createdAt)} />
              <InfoRow label="Shop Description" value={selected.shopDescription} />
            </div>
            {selected.rejectionReason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">Rejection Reason</p>
                <p className="mt-1 text-sm text-foreground">{selected.rejectionReason}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {selected.sellerStatus === 'PENDING' && (
                <>
                  <Button variant="success" loading={actionLoading === selected.id} onClick={() => handleAction(selected, 'approve')}><CheckCircle className="h-4 w-4" /> Approve</Button>
                  <Button variant="destructive" onClick={() => { setRejectSeller(selected); setSelected(null); }}><XCircle className="h-4 w-4" /> Reject</Button>
                </>
              )}
              {selected.sellerStatus === 'APPROVED' && (
                <Button variant="outline" loading={actionLoading === selected.id} onClick={() => handleAction(selected, 'suspend')}><Ban className="h-4 w-4" /> Suspend</Button>
              )}
              {selected.sellerStatus === 'SUSPENDED' && (
                <Button variant="success" loading={actionLoading === selected.id} onClick={() => handleAction(selected, 'reinstate')}><RotateCcw className="h-4 w-4" /> Reinstate</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectSeller}
        onClose={() => { setRejectSeller(null); setRejectReason(''); }}
        title="Reject Seller"
        description={`Provide a reason for rejecting ${rejectSeller?.name || ''}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRejectSeller(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" loading={actionLoading === rejectSeller?.id} onClick={confirmReject}><XCircle className="h-4 w-4" /> Reject Seller</Button>
          </>
        }
      >
        <Field label="Rejection Reason" required error={!rejectReason.trim() && rejectSeller ? 'Reason is required' : undefined}>
          <Textarea placeholder="Explain why this seller application is being rejected..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} error={!rejectReason.trim() && !!rejectSeller} />
        </Field>
      </Modal>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-sm text-foreground', !value && 'text-muted-foreground')}>{value || '—'}</p>
    </div>
  );
}