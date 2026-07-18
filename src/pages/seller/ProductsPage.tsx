import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Package, Search, Upload, X, AlertTriangle, ImageIcon, Loader2, Power,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Product, Category, PagedResponse, ApiResponse } from '../../types';
import {
  Button, Input, Textarea, Select, Field, Card, CardContent, Modal, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, SkeletonTable,
} from '../../components/ui';
import ImageUploader from '../../components/shared/ImageUploader';
import { formatPrice, formatDate, cn, getProductImages } from '../../lib/utils';

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  discountedPrice: string;
  stockQuantity: string;
  brand: string;
  categoryId: string;
  tags: string;
  specifications: string;
  featured: boolean;
  imageUrls: string[];
}

const emptyForm: ProductFormData = {
  name: '', description: '', shortDescription: '', price: '', discountedPrice: '',
  stockQuantity: '', brand: '', categoryId: '', tags: '', specifications: '',
  featured: false, imageUrls: [],
};

const LOW_STOCK_THRESHOLD = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stockModal, setStockModal] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [stockSaving, setStockSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  const fetchProducts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Product>>>('/api/seller/products', {
        params: { page: p, size: 10, includeInactive: true },
      });
      setProducts(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
      setPage(res.data.data.pageNumber ?? p);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Category[]>>('/api/categories');
      setCategories(res.data.data);
    } catch {
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => { fetchProducts(0); fetchCategories(); }, [fetchProducts, fetchCategories]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const imgs = getProductImages(product);
    setForm({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription || '',
      price: String(product.price),
      discountedPrice: product.discountedPrice ? String(product.discountedPrice) : '',
      stockQuantity: String(product.stockQuantity),
      brand: product.brand || '',
      categoryId: String(product.categoryId || product.category?.id || ''),
      tags: product.tags || '',
      specifications: product.specifications || '',
      featured: product.featured || false,
      imageUrls: imgs,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.description || !form.price || !form.stockQuantity || !form.categoryId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.imageUrls.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      shortDescription: form.shortDescription,
      price: parseFloat(form.price),
      discountedPrice: form.discountedPrice ? parseFloat(form.discountedPrice) : undefined,
      stockQuantity: parseInt(form.stockQuantity, 10),
      brand: form.brand,
      categoryId: parseInt(form.categoryId, 10),
      tags: form.tags,
      specifications: form.specifications,
      featured: form.featured,
      imageUrls: form.imageUrls,
    };
    try {
      if (editing) {
        await api.put(`/api/seller/products/${editing.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/api/seller/products', payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      fetchProducts(page);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || (editing ? 'Failed to update product' : 'Failed to create product'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    setStatusLoadingId(product.id);
    try {
      await api.put(`/api/seller/products/${product.id}/status`, { active: !product.active });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
      toast.success(`Product ${!product.active ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to update product status');
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/seller/products/${deleteId}`);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts(page);
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockModal || !stockValue) return;
    setStockSaving(true);
    try {
      await api.put(`/api/seller/products/${stockModal.id}/stock`, {
        quantity: parseInt(stockValue, 10),
      });
      toast.success('Stock updated');
      setStockModal(null);
      setStockValue('');
      fetchProducts(page);
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setStockSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display tracking-tight">My Products</h2>
          <p className="text-sm text-muted-foreground">{totalElements} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><SkeletonTable rows={6} /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-medium">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? 'Try a different search.' : 'Add your first product to get started.'}
              </p>
              {!search && (
                <Button onClick={openCreate} className="mt-4">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product, idx) => {
                  const imgs = getProductImages(product);
                  const isLow = product.stockQuantity < LOW_STOCK_THRESHOLD;
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {imgs[0] ? (
                              <img src={imgs[0]} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{product.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{product.brand || 'No brand'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.categoryName || product.category?.name || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          {product.discountedPrice && product.discountedPrice < product.price && (
                            <p className="text-xs text-success">
                              {formatPrice(product.discountedPrice)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => { setStockModal(product); setStockValue(String(product.stockQuantity)); }}
                          className="group inline-flex items-center gap-1.5"
                        >
                          <span className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                            isLow
                              ? 'border-warning/20 bg-warning/10 text-warning'
                              : 'border-success/20 bg-success/10 text-success',
                          )}>
                            {isLow && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {product.stockQuantity}
                          </span>
                          <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            edit
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant={product.active ? 'success' : 'secondary'}>
                            {product.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {product.featured && <Badge variant="default">Featured</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(product)}
                            loading={statusLoadingId === product.id}
                            className={product.active ? 'text-muted-foreground hover:text-warning' : 'text-muted-foreground hover:text-success'}
                            title={product.active ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(product.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => fetchProducts(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => fetchProducts(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        description={editing ? 'Update product details' : 'Create a new product listing'}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Product Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wireless Headphones"
              />
            </Field>
            <Field label="Brand">
              <Input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Sony"
              />
            </Field>
          </div>

          <Field label="Short Description">
            <Input
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="One-line summary"
            />
          </Field>

          <Field label="Description" required>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Full product description"
              rows={4}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Price (PKR)" required>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Discounted Price">
              <Input
                type="number"
                value={form.discountedPrice}
                onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Stock Quantity" required>
              <Input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" required>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tags (comma-separated)">
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="electronics, audio, wireless"
              />
            </Field>
          </div>

          <Field label="Specifications (JSON or text)">
            <Textarea
              value={form.specifications}
              onChange={(e) => setForm({ ...form, specifications: e.target.value })}
              placeholder='{"weight": "250g", "battery": "20h"}'
              rows={3}
            />
          </Field>

          <Field label="Product Images" required>
            <ImageUploader
              value={form.imageUrls}
              onChange={(urls) => setForm({ ...form, imageUrls: urls })}
              uploadUrl="/api/seller/uploads"
              maxFiles={8}
            />
          </Field>


          <label className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Featured Product</p>
              <p className="text-xs text-muted-foreground">Highlight this product on your shop</p>
            </div>
          </label>
        </div>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        open={!!stockModal}
        onClose={() => setStockModal(null)}
        title="Update Stock"
        description={stockModal?.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setStockModal(null)}>Cancel</Button>
            <Button onClick={handleStockUpdate} loading={stockSaving}>Update Stock</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Stock Quantity" required>
            <Input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              placeholder="0"
            />
          </Field>
          {stockModal && stockModal.stockQuantity < LOW_STOCK_THRESHOLD && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>This product is low on stock (below {LOW_STOCK_THRESHOLD} units).</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

