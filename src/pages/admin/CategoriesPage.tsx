import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Folder, FolderPlus, Pencil, Trash2, ChevronRight, ChevronDown, AlertCircle, Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import type { Category, ApiResponse } from '../../types';
import {
  Card, CardContent, Button, Input, Textarea, Modal, Skeleton, Field,
} from '../../components/ui';
import ImageUploader from '../../components/shared/ImageUploader';
import { cn } from '../../lib/utils';

interface FormState { name: string; slug: string; description: string; imageUrl: string; parentId: string; }

const emptyForm: FormState = { name: '', slug: '', description: '', imageUrl: '', parentId: '' };

function slugify(s: string): string { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Category[]>>('/api/admin/categories');
      setCategories(res.data.data || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const openCreate = (parentId?: number) => {
    setEditing(null);
    setForm({ ...emptyForm, parentId: parentId ? String(parentId) : '' });
    setModalOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', imageUrl: cat.imageUrl || '', parentId: cat.parentId != null ? String(cat.parentId) : '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    if (!form.slug.trim()) { toast.error('Slug is required'); return; }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : null,
    };
    try {
      if (editing) {
        const res = await api.put<ApiResponse<Category>>(`/api/admin/categories/${editing.id}`, body);
        const updated = res.data.data;
        setCategories((prev) => replaceCategory(prev, updated));
        toast.success('Category updated');
      } else {
        const res = await api.post<ApiResponse<Category>>('/api/admin/categories', body);
        setCategories((prev) => [...prev, res.data.data]);
        toast.success('Category created');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/categories/${deleteTarget.id}`);
      setCategories((prev) => removeCategory(prev, deleteTarget.id));
      toast.success('Category deleted');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  // Build tree from flat list
  const buildTree = (cats: Category[], parentId: number | null = null): Category[] => {
    return cats.filter((c) => (c.parentId ?? null) === parentId).map((c) => ({ ...c, children: buildTree(cats, c.id) }));
  };
  const tree = buildTree(categories);

  // Flat list of potential parents (exclude editing category and its descendants)
  const getDescendantIds = (cats: Category[], id: number): Set<number> => {
    const ids = new Set<number>([id]);
    cats.filter((c) => c.parentId === id).forEach((c) => { getDescendantIds(cats, c.id).forEach((d) => ids.add(d)); });
    return ids;
  };
  const excludedIds = editing ? getDescendantIds(categories, editing.id) : new Set<number>();
  const parentOptions = categories.filter((c) => !excludedIds.has(c.id));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product categories and hierarchy</p>
        </div>
        <Button onClick={() => openCreate()}><FolderPlus className="h-4 w-4" /> Add Category</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Folder className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">No categories yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first category to get started</p>
              <Button className="mt-4" onClick={() => openCreate()}><FolderPlus className="h-4 w-4" /> Add Category</Button>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((cat) => (
                <CategoryNode
                  key={cat.id}
                  category={cat}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onAddChild={openCreate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); }}
        title={editing ? 'Edit Category' : 'New Category'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input placeholder="e.g. Electronics" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) })); }} />
          </Field>
          <Field label="Slug" required>
            <Input placeholder="e.g. electronics" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </Field>
          <Field label="Parent Category">
            <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
              <option value="">None (Top-level)</option>
              {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <Textarea placeholder="Category description..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </Field>
          <Field label="Category Image">
            <ImageUploader
              value={form.imageUrl ? [form.imageUrl] : []}
              onChange={(urls) => setForm((f) => ({ ...f, imageUrl: urls[0] || '' }))}
              uploadUrl="/api/admin/uploads"
              maxFiles={1}
            />
          </Field>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all subcategories.`}
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
          <p className="text-sm text-foreground">This action cannot be undone. Products in this category may be affected.</p>
        </div>
      </Modal>
    </motion.div>
  );
}

function CategoryNode({
  category, depth, expanded, onToggle, onEdit, onDelete, onAddChild,
}: {
  category: Category; depth: number; expanded: Set<number>;
  onToggle: (id: number) => void; onEdit: (c: Category) => void; onDelete: (c: Category) => void; onAddChild: (parentId: number) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expanded.has(category.id);
  return (
    <div>
      <div
        className={cn('flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40', depth > 0 && 'ml-6')}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <button onClick={() => hasChildren && onToggle(category.id)} className={cn('flex-shrink-0', !hasChildren && 'invisible')}>
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Folder className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
          <p className="truncate text-xs text-muted-foreground">/{category.slug}{hasChildren ? ` • ${category.children!.length} subcategor${category.children!.length === 1 ? 'y' : 'ies'}` : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" title="Add subcategory" onClick={() => onAddChild(category.id)}><FolderPlus className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" title="Edit" onClick={() => onEdit(category)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" onClick={() => onDelete(category)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {category.children!.map((child) => (
              <CategoryNode key={child.id} category={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function replaceCategory(cats: Category[], updated: Category): Category[] {
  return cats.map((c) => {
    if (c.id === updated.id) return { ...updated, children: c.children };
    if (c.children) return { ...c, children: replaceCategory(c.children, updated) };
    return c;
  });
}
function removeCategory(cats: Category[], id: number): Category[] {
  return cats.filter((c) => c.id !== id).map((c) => (c.children ? { ...c, children: removeCategory(c.children, id) } : c));
}
