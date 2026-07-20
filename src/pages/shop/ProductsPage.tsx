import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Grid, List, X, Package, Search, Sparkles, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import type { Product, Category, ApiResponse, PagedResponse } from '../../types';
import { cn } from '../../lib/utils';
import { Button, Input, SkeletonCard, Badge } from '../../components/ui';
import ProductCard from '../../components/shop/ProductCard';
import Pagination from '../../components/shop/Pagination';
import EmptyState from '../../components/shop/EmptyState';
import PageHeader from '../../components/shop/PageHeader';

const sortOptions = [
  { value: 'createdAt,DESC', label: 'Newest' },
  { value: 'price,ASC', label: 'Price: Low to High' },
  { value: 'price,DESC', label: 'Price: High to Low' },
  { value: 'averageRating,DESC', label: 'Top Rated' },
  { value: 'name,ASC', label: 'Name: A-Z' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showRefine, setShowRefine] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});

  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sortBy') || 'createdAt,DESC';

  // Find the active category name by walking the tree (parents + children).
  const activeCategoryName = useMemo(() => {
    if (!categoryId) return '';
    let found = '';
    const walk = (list: Category[]) => {
      list.forEach((c) => {
        if (String(c.id) === categoryId) found = c.name;
        if (c.children?.length) walk(c.children);
      });
    };
    walk(categoryTree);
    return found;
  }, [categoryId, categoryTree]);

  const loadCategoriesAndBrands = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get<ApiResponse<Category[]>>('/api/categories'),
        api.get<ApiResponse<string[]>>('/api/brands'),
      ]);
      // Keep the nested tree so the sidebar can render parents with
      // collapsible child dropdowns instead of a flat hardcoded list.
      setCategoryTree(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch { /* ignore */ }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortDir] = sort.split(',');
      const params: Record<string, string | number> = { page, size: 12, sortBy, sortDir: sortDir || 'DESC' };
      if (q) params.q = q;
      if (categoryId) params.categoryId = categoryId;
      if (brand) params.brand = brand;
      const res = await api.get<ApiResponse<PagedResponse<Product>>>('/api/products', { params });
      setProducts(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [q, categoryId, brand, sort, page]);

  useEffect(() => { loadCategoriesAndBrands(); }, [loadCategoriesAndBrands]);
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(0); }, [q, categoryId, brand, sort]);

  // Auto-expand the parent that contains the active subcategory.
  useEffect(() => {
    if (!categoryId) return;
    const parentOfActive = (() => {
      let parent: number | null = null;
      const walk = (list: Category[], p: number | null) => {
        list.forEach((c) => {
          if (String(c.id) === categoryId) parent = p;
          if (c.children?.length) walk(c.children, c.id);
        });
      };
      walk(categoryTree, null);
      return parent;
    })();
    if (parentOfActive != null) setExpandedParents((prev) => ({ ...prev, [parentOfActive]: true }));
  }, [categoryId, categoryTree]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const activeFilterCount = useMemo(() => [categoryId, brand, q].filter(Boolean).length, [categoryId, brand, q]);

  const toggleParent = (id: number) => setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));

  const CategoryList = () => (
    <div>
      <h3 className="eyebrow mb-3">Category</h3>
      <div className="space-y-0.5">
        <button
          onClick={() => updateParam('categoryId', '')}
          className={cn(
            'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
            !categoryId ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          All Products
        </button>
        {categoryTree.map((parent) => {
          const hasChildren = parent.children && parent.children.length > 0;
          const isParentActive = categoryId === String(parent.id);
          const isExpanded = !!expandedParents[parent.id];
          const childActive = hasChildren && parent.children!.some((c) => String(c.id) === categoryId);
          return (
            <div key={parent.id}>
              <div className="flex items-stretch">
                <button
                  onClick={() => updateParam('categoryId', String(parent.id))}
                  className={cn(
                    'flex flex-1 items-center rounded-md px-3 py-2 text-left text-sm transition-colors',
                    isParentActive ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-accent'
                  )}
                >
                  {parent.name}
                </button>
                {hasChildren && (
                  <button
                    onClick={() => toggleParent(parent.id)}
                    className={cn(
                      'flex w-8 items-center justify-center rounded-md transition-colors hover:bg-accent',
                      childActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
                  </button>
                )}
              </div>
              <AnimatePresence initial={false}>
                {hasChildren && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 space-y-0.5 border-l border-border/60 pl-2">
                      {parent.children!.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => updateParam('categoryId', String(child.id))}
                          className={cn(
                            'flex w-full items-center rounded-md px-3 py-1.5 text-left text-[0.8rem] transition-colors',
                            categoryId === String(child.id) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  const RefinePanel = () => (
    <div className="space-y-7">
      <div>
        <h3 className="eyebrow mb-3">Brand</h3>
        {brands.length === 0 ? <p className="text-sm text-muted-foreground">No brands available</p> : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => updateParam('brand', '')} className={cn('rounded-md border px-3.5 py-1.5 text-xs font-medium transition-colors', !brand ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40')}>All</button>
            {brands.map((b) => (
              <button key={b} onClick={() => updateParam('brand', b)} className={cn('rounded-md border px-3.5 py-1.5 text-xs font-medium transition-colors', brand === b ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40')}>{b}</button>
            ))}
          </div>
        )}
      </div>
      {brand && <Button variant="outline" className="w-full" onClick={() => updateParam('brand', '')}><X className="h-4 w-4" />Clear Brand</Button>}
    </div>
  );

  return (
    <div className="pb-12">
      <PageHeader
        icon={Sparkles}
        eyebrow="The Collection"
        title={activeCategoryName || 'All Products'}
        subtitle={loading ? 'Curating pieces…' : `${totalElements} item${totalElements !== 1 ? 's' : ''} crafted by verified sellers`}
        crumbs={[{ label: 'Products' }]}
        right={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search the collection…" value={q} onChange={(e) => updateParam('q', e.target.value)} className="pl-10" />
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar (desktop) — scrolls naturally with the page */}
          <aside className="hidden lg:block">
            <div className="space-y-7 rounded-lg border border-border bg-card p-5">
              <CategoryList />
              <div className="divider-fade" />
              <RefinePanel />
            </div>
          </aside>

          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <Button variant="outline" size="md" onClick={() => setShowRefine(true)} className="gap-1.5 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {activeFilterCount > 0 && <Badge variant="default" className="ml-0.5">{activeFilterCount}</Badge>}
              </Button>
              <p className="hidden text-sm text-muted-foreground lg:block">{loading ? 'Loading…' : `Showing ${products.length} of ${totalElements}`}</p>
              <div className="ml-auto flex items-center gap-2">
                <select value={sort} onChange={(e) => updateParam('sortBy', e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                  {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex items-center rounded-md border border-border">
                  <button onClick={() => setLayout('grid')} className={cn('flex h-10 w-10 items-center justify-center rounded-l-md transition-colors', layout === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} aria-label="Grid view"><Grid className="h-4 w-4" /></button>
                  <button onClick={() => setLayout('list')} className={cn('flex h-10 w-10 items-center justify-center rounded-r-md transition-colors', layout === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} aria-label="List view"><List className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-4 text-sm">
                <span className="text-muted-foreground">Active:</span>
                {q && <Badge variant="secondary" className="gap-1">"{q}"<button onClick={() => updateParam('q', '')}><X className="h-3 w-3" /></button></Badge>}
                {categoryId && <Badge variant="secondary" className="gap-1">{activeCategoryName}<button onClick={() => updateParam('categoryId', '')}><X className="h-3 w-3" /></button></Badge>}
                {brand && <Badge variant="secondary" className="gap-1">{brand}<button onClick={() => updateParam('brand', '')}><X className="h-3 w-3" /></button></Badge>}
                <button onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">Clear all</button>
              </div>
            )}

            {/* Products */}
            <div className="pt-6">
              {loading ? (
                <div className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3' : 'space-y-4')}>
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <EmptyState icon={Package} title="No products found" description="Try adjusting your filters or search terms." actionLabel="Clear Filters" onAction={clearFilters} />
              ) : (
                <motion.div layout className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3' : 'space-y-4')}>
                  {products.map((p, i) => <ProductCard key={p.id} product={p} layout={layout} index={i} />)}
                </motion.div>
              )}
              {!loading && totalPages > 1 && (
                <div className="mt-10"><Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} /></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters slide-over (mobile) */}
      <AnimatePresence>
        {showRefine && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRefine(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }} className="absolute right-0 top-0 h-full w-96 max-w-[90vw] overflow-y-auto bg-card p-6 shadow-luxury-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-editorial text-2xl font-medium">Filters</h2>
                <button onClick={() => setShowRefine(false)} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-7">
                <CategoryList />
                <div className="divider-fade" />
                <RefinePanel />
              </div>
              <Button className="mt-8 w-full" onClick={() => setShowRefine(false)}>Show {totalElements} results</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
