import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Grid, List, X, Package, Search, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import type { Product, Category, ApiResponse, PagedResponse } from '../../types';
import { cn, flattenCategories } from '../../lib/utils';
import { Button, Input, SkeletonCard, Badge } from '../../components/ui';
import ProductCard from '../../components/shop/ProductCard';
import Pagination from '../../components/shop/Pagination';
import EmptyState from '../../components/shop/EmptyState';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showRefine, setShowRefine] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sortBy') || 'createdAt,DESC';

  const activeCategory = categories.find((c) => String(c.id) === categoryId);

  const loadCategoriesAndBrands = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get<ApiResponse<Category[]>>('/api/categories'),
        api.get<ApiResponse<string[]>>('/api/brands'),
      ]);
      // API returns a nested tree — flatten it so the category rail below
      // lets shoppers filter by subcategories too (products are assigned
      // to subcategories, so filtering by parent-only hid everything).
      setCategories(flattenCategories(catRes.data.data || []));
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
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (brand) params.brand = brand;
      const res = await api.get<ApiResponse<PagedResponse<Product>>>('/api/products', { params });
      setProducts(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
      setTotalElements(res.data.data.totalElements || 0);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [q, categoryId, minPrice, maxPrice, brand, sort, page]);

  useEffect(() => { loadCategoriesAndBrands(); }, [loadCategoriesAndBrands]);
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(0); }, [q, categoryId, minPrice, maxPrice, brand, sort]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());
  const scrollRail = (dir: 1 | -1) => railRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });

  const activeFilterCount = useMemo(() => [categoryId, minPrice, maxPrice, brand, q].filter(Boolean).length, [categoryId, minPrice, maxPrice, brand, q]);
  const refineCount = useMemo(() => [minPrice, maxPrice, brand].filter(Boolean).length, [minPrice, maxPrice, brand]);

  const RefinePanel = () => (
    <div className="space-y-7">
      <div>
        <h3 className="eyebrow mb-3">Price Range (PKR)</h3>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} className="h-10" />
          <span className="text-muted-foreground">—</span>
          <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} className="h-10" />
        </div>
      </div>
      <div className="divider-fade" />
      <div>
        <h3 className="eyebrow mb-3">Brand</h3>
        {brands.length === 0 ? <p className="text-sm text-muted-foreground">No brands available</p> : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => updateParam('brand', '')} className={cn('rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors', !brand ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40')}>All</button>
            {brands.map((b) => (
              <button key={b} onClick={() => updateParam('brand', b)} className={cn('rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors', brand === b ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40')}>{b}</button>
            ))}
          </div>
        )}
      </div>
      {refineCount > 0 && <Button variant="outline" className="w-full" onClick={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); updateParam('brand', ''); }}><X className="h-4 w-4" />Clear Refinements</Button>}
    </div>
  );

  return (
    <div className="pb-12">
      {/* Editorial header band */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-[#1a1410] via-[#15110d] to-[#0d0a07]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#d4a857 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary-300" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-300">The Collection</span>
              </div>
              <h1 className="mt-3 font-editorial text-4xl font-normal italic tracking-tight text-white sm:text-5xl">
                {activeCategory ? activeCategory.name : 'All Products'}
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/55">
                {loading ? 'Curating pieces…' : `${totalElements} item${totalElements !== 1 ? 's' : ''} crafted by verified sellers`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input type="text" placeholder="Search the collection…" value={q} onChange={(e) => updateParam('q', e.target.value)} className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus-visible:border-primary/50 focus-visible:bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky toolbar */}
      <div className="sticky top-[72px] z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category rail */}
          {categories.length > 0 && (
            <div className="relative -mx-1 flex items-center py-3">
              <button onClick={() => scrollRail(-1)} className="absolute left-0 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-luxury md:flex"><ChevronLeft className="h-4 w-4" /></button>
              <div ref={railRef} className="flex flex-1 gap-2 overflow-x-auto scroll-smooth px-1 scrollbar-thin md:px-9">
                <button onClick={() => updateParam('categoryId', '')} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all', !categoryId ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card hover:border-primary/40')}>All</button>
                {categories.map((c) => (
                  <button key={c.id} onClick={() => updateParam('categoryId', String(c.id))} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all', categoryId === String(c.id) ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card hover:border-primary/40')}>{c.depth ? `${'—'.repeat(c.depth)} ` : ''}{c.name}</button>
                ))}
              </div>
              <button onClick={() => scrollRail(1)} className="absolute right-0 z-10 hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-luxury md:flex"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}

          {/* Sort + layout + refine row */}
          <div className="flex items-center justify-between gap-2 py-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={() => setShowRefine(true)} className="gap-1.5">
                <SlidersHorizontal className="h-4 w-4" /> Refine
                {refineCount > 0 && <Badge variant="default" className="ml-0.5">{refineCount}</Badge>}
              </Button>
              <select value={sort} onChange={(e) => updateParam('sortBy', e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setLayout('grid')} className={cn('flex h-10 w-10 items-center justify-center rounded-l-md transition-colors', layout === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} aria-label="Grid view"><Grid className="h-4 w-4" /></button>
              <button onClick={() => setLayout('list')} className={cn('flex h-10 w-10 items-center justify-center rounded-r-md transition-colors', layout === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} aria-label="List view"><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Active:</span>
            {q && <Badge variant="secondary" className="gap-1">"{q}"<button onClick={() => updateParam('q', '')}><X className="h-3 w-3" /></button></Badge>}
            {categoryId && <Badge variant="secondary" className="gap-1">{activeCategory?.name}<button onClick={() => updateParam('categoryId', '')}><X className="h-3 w-3" /></button></Badge>}
            {brand && <Badge variant="secondary" className="gap-1">{brand}<button onClick={() => updateParam('brand', '')}><X className="h-3 w-3" /></button></Badge>}
            {(minPrice || maxPrice) && <Badge variant="secondary" className="gap-1">Price {minPrice || '0'}–{maxPrice || '∞'}<button onClick={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); }}><X className="h-3 w-3" /></button></Badge>}
            <button onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">Clear all</button>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4' : 'space-y-4')}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products found" description="Try adjusting your filters or search terms." actionLabel="Clear Filters" onAction={clearFilters} />
        ) : (
          <motion.div layout className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4' : 'space-y-4')}>
            {products.map((p, i) => <ProductCard key={p.id} product={p} layout={layout} index={i} />)}
          </motion.div>
        )}
        {!loading && totalPages > 1 && (
          <div className="mt-10"><Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} /></div>
        )}
      </div>

      {/* Refine slide-over */}
      <AnimatePresence>
        {showRefine && (
          <div className="fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRefine(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }} className="absolute right-0 top-0 h-full w-96 max-w-[90vw] overflow-y-auto bg-card p-6 shadow-luxury-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-editorial text-2xl font-medium">Refine</h2>
                <button onClick={() => setShowRefine(false)} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
              </div>
              <RefinePanel />
              <Button className="mt-8 w-full" onClick={() => setShowRefine(false)}>Show {totalElements} results</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
