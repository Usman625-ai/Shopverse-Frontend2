import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package, Search, Eye, Power, ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import api from '../../lib/api';
import type { Product, PagedResponse, ApiResponse } from '../../types';
import {
  Card, CardContent, Button, Input, Select, Badge, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, StarRating,
} from '../../components/ui';
import { formatPrice, formatDate, getProductImages, getEffectivePrice, cn } from '../../lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const size = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Product>>>('/api/admin/products', {
        params: {
          page,
          size,
          q: search.trim() || undefined,
          active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        },
      });
      const pr = res.data.data;
      if (!pr) return;
      setProducts(pr.content || []);
      setTotalPages(pr.totalPages);
      setTotalElements(pr.totalElements);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleActive = async (product: Product) => {
    setActionLoading(product.id);
    try {
      await api.put(`/api/admin/products/${product.id}/status`, { active: !product.active });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
      if (selected?.id === product.id) setSelected({ ...selected, active: !selected.active });
      toast.success(`Product ${!product.active ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to update product status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all products across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-full pl-9 sm:w-64" />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="w-36">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const images = getProductImages(p);
                    const price = getEffectivePrice(p);
                    return (
                      <TableRow key={p.id} onClick={() => setSelected(p)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                              {images[0] ? <img src={images[0]} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.sku || p.brand || '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.categoryName || p.category?.name || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{p.shopName || p.sellerName || p.seller?.shopName || '—'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{formatPrice(price)}</p>
                            {p.discountedPrice && p.discountedPrice < p.price && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className={cn('text-sm font-medium', p.stockQuantity === 0 ? 'text-destructive' : p.stockQuantity < 10 ? 'text-warning' : 'text-foreground')}>{p.stockQuantity}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.active ? 'success' : 'destructive'}>{p.active ? 'Active' : 'Inactive'}</Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" title="View" onClick={() => setSelected(p)}><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant={p.active ? 'outline' : 'success'} title={p.active ? 'Deactivate' : 'Activate'} loading={actionLoading === p.id} onClick={() => toggleActive(p)}>
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{totalElements} product{totalElements !== 1 ? 's' : ''} total</p>
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

      {/* Product details modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Product Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {getProductImages(selected)[0] ? <img src={getProductImages(selected)[0]} alt={selected.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">{selected.categoryName || selected.category?.name} • {selected.shopName || selected.sellerName || selected.seller?.shopName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={selected.averageRating} size={14} />
                  <span className="text-xs text-muted-foreground">{(selected.averageRating ?? 0).toFixed(1)} ({selected.totalReviews ?? 0} reviews)</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={selected.active ? 'success' : 'destructive'}>{selected.active ? 'Active' : 'Inactive'}</Badge>
                  {selected.featured && <Badge variant="default">Featured</Badge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoRow label="Price" value={formatPrice(selected.price)} />
              <InfoRow label="Discounted Price" value={selected.discountedPrice ? formatPrice(selected.discountedPrice) : '—'} />
              <InfoRow label="Stock" value={String(selected.stockQuantity)} />
              <InfoRow label="SKU" value={selected.sku || '—'} />
              <InfoRow label="Brand" value={selected.brand || '—'} />
              <InfoRow label="Created" value={formatDate(selected.createdAt)} />
            </div>
            {selected.shortDescription && <div><p className="text-xs text-muted-foreground">Short Description</p><p className="mt-0.5 text-sm text-foreground">{selected.shortDescription}</p></div>}
            {selected.description && <div><p className="text-xs text-muted-foreground">Description</p><p className="mt-0.5 text-sm text-foreground">{selected.description}</p></div>}
            {selected.tags && <div><p className="text-xs text-muted-foreground">Tags</p><p className="mt-0.5 text-sm text-foreground">{selected.tags}</p></div>}
            <div className="flex gap-2 border-t border-border pt-4">
              <Button variant={selected.active ? 'outline' : 'success'} loading={actionLoading === selected.id} onClick={() => toggleActive(selected)}>
                <Power className="h-4 w-4" /> {selected.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

