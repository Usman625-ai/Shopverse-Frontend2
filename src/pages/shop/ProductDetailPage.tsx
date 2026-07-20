import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShoppingCart, Heart, Minus, Plus, Package, Truck, Shield, RotateCcw, ChevronLeft, MessageSquare } from 'lucide-react';
import api from '../../lib/api';
import type { Product, Review, ApiResponse, PagedResponse } from '../../types';
import { cn, formatPrice, formatDate, getEffectivePrice, getDiscountPercentage, getProductImages, truncate } from '../../lib/utils';
import { Button, Badge, StarRating, Card, CardContent, Skeleton, Textarea, Field, SmartImage, SkeletonCard } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart } from '../../store/cartSlice';
import EmptyState from '../../components/shop/EmptyState';
import ProductCard from '../../components/shop/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewPage, setReviewPage] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [wished, setWished] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const loadProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Product>>(`/api/products/slug/${slug}`);
      setProduct(res.data.data);
      setActiveImage(0);
      setQuantity(1);
    } catch { setProduct(null); } finally { setLoading(false); }
  }, [slug]);

  const loadReviews = useCallback(async () => {
    if (!product) return;
    setReviewsLoading(true);
    try {
      const res = await api.get<ApiResponse<PagedResponse<Review>>>(`/api/products/${product.id}/reviews`, { params: { page: reviewPage, size: 5 } });
      setReviews(res.data.data.content || []);
      setTotalReviewPages(res.data.data.totalPages || 0);
    } catch { setReviews([]); } finally { setReviewsLoading(false); }
  }, [product, reviewPage]);

  const loadRelated = useCallback(async () => {
    if (!product) return;
    setRelatedLoading(true);
    try {
      const categoryId = product.categoryId || product.category?.id;
      const res = await api.get<ApiResponse<PagedResponse<Product>>>('/api/products', {
        params: { page: 0, size: 8, ...(categoryId ? { categoryId } : {}), sortBy: 'createdAt', sortDir: 'DESC' },
      });
      setRelatedProducts((res.data.data.content || []).filter((p) => p.id !== product.id).slice(0, 6));
    } catch { setRelatedProducts([]); } finally { setRelatedLoading(false); }
  }, [product]);

  useEffect(() => { loadProduct(); }, [loadProduct]);
  useEffect(() => { if (product) loadReviews(); }, [product, loadReviews]);
  useEffect(() => { if (product) loadRelated(); }, [product, loadRelated]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    if (!product || product.stockQuantity <= 0) { toast.error('Product is out of stock'); return; }
    try {
      await dispatch(addToCart({ productId: product.id, quantity })).unwrap();
      toast.success(`${quantity} item(s) added to cart`);
    } catch (err) { toast.error(err as string); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login to use wishlist'); return; }
    if (!product) return;
    try {
      if (wished) {
        await api.delete(`/api/customer/wishlist/${product.id}`);
        setWished(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/api/customer/wishlist/${product.id}`);
        setWished(true);
        toast.success('Added to wishlist');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Wishlist action failed');
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) { toast.error('Please login to write a review'); return; }
    if (!product) return;
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/api/customer/reviews', { productId: product.id, rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted successfully');
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      loadReviews();
      loadProduct();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <EmptyState icon={Package} title="Product not found" description="The product you're looking for doesn't exist or has been removed." actionLabel="Browse Products" onAction={() => navigate('/shop/products')} />;
  }

  const images = getProductImages(product);
  const effectivePrice = getEffectivePrice(product);
  const discount = getDiscountPercentage(product.price, product.discountedPrice);
  const outOfStock = product.stockQuantity <= 0;
  const specs = product.specifications ? (typeof product.specifications === 'string' ? (() => { try { return JSON.parse(product.specifications); } catch { return null; } })() : product.specifications) : null;

  return (
    <div className="pb-10">
      {/* Editorial header band */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-[#1a1410] via-[#15110d] to-[#0d0a07]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#d4a857 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-white/55 transition-colors hover:text-white"><ChevronLeft className="h-4 w-4" /> Back to collection</button>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">{product.categoryName || product.category?.name || 'Uncategorized'}</Badge>
                {product.featured && <Badge variant="default">Featured</Badge>}
              </div>
              <h1 className="mt-3 font-editorial text-4xl font-normal italic tracking-tight text-white sm:text-5xl">{product.name}</h1>
              <p className="mt-2 text-sm text-white/55">{product.brand || 'Generic'} · SKU: {product.sku || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating || 0} size={18} />
                <span className="text-sm font-medium text-white">{product.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-sm text-white/45">({product.totalReviews || 0})</span>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div className="flex items-baseline gap-2">
                <span className="font-editorial text-3xl font-medium text-primary-300">{formatPrice(effectivePrice)}</span>
                {discount > 0 && <span className="text-base text-white/40 line-through">{formatPrice(product.price)}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">

      {/* Product Main */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-square overflow-hidden rounded-xl border border-border">
            {images[activeImage] ? (
              <SmartImage src={images[activeImage]} alt={product.name} className="rounded-xl" fallbackIcon={<Package className="h-16 w-16" />} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-16 w-16" /></div>
            )}
            {discount > 0 && <Badge variant="destructive" className="absolute left-3 top-3 text-sm">-{discount}% OFF</Badge>}
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={cn('h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all', i === activeImage ? 'border-primary' : 'border-border hover:border-primary/50')}>
                  <SmartImage src={img} alt={`${product.name} ${i + 1}`} className="rounded-lg" fallbackIcon={<Package className="h-6 w-6" />} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{product.categoryName || product.category?.name || 'Uncategorized'}</Badge>
              {product.featured && <Badge variant="default">Featured</Badge>}
            </div>
            <h1 className="mt-2 font-editorial text-3xl font-normal tracking-tight sm:text-3xl">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.brand || 'Generic'} · SKU: {product.sku || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <StarRating rating={product.averageRating || 0} size={18} />
              <span className="text-sm font-medium">{product.averageRating?.toFixed(1) || '0.0'}</span>
            </div>
            <span className="text-sm text-muted-foreground">{product.totalReviews || 0} reviews</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-editorial font-medium text-primary">{formatPrice(effectivePrice)}</span>
            {discount > 0 && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>}
            {discount > 0 && <Badge variant="success">Save {formatPrice(product.price - effectivePrice)}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{product.shortDescription || truncate(product.description, 200)}</p>
          <div className="flex items-center gap-2">
            {outOfStock ? <Badge variant="destructive">Out of Stock</Badge> : <Badge variant="success">In Stock ({product.stockQuantity} available)</Badge>}
          </div>

          {/* Quantity + Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center hover:bg-accent rounded-l-lg" disabled={outOfStock}><Minus className="h-4 w-4" /></button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))} className="flex h-10 w-10 items-center justify-center hover:bg-accent rounded-r-lg" disabled={outOfStock}><Plus className="h-4 w-4" /></button>
            </div>
            <Button size="lg" onClick={handleAddToCart} disabled={outOfStock} className="flex-1"><ShoppingCart className="h-5 w-5" /> Add to Cart</Button>
            <Button size="lg" variant="outline" onClick={handleWishlist}><Heart className={cn('h-5 w-5', wished && 'fill-destructive text-destructive')} /></Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[{ icon: Truck, t: 'Fast Delivery' }, { icon: Shield, t: 'Secure Payment' }, { icon: RotateCcw, t: 'Easy Returns' }].map((f) => { const I = f.icon; return (
              <div key={f.t} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-center">
                <I className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">{f.t}</span>
              </div>
            ); })}
          </div>
        </div>
      </div>

      {/* Description + Specs */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <h2 className="mb-3 font-editorial text-xl font-medium">Description</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 font-editorial text-xl font-medium">Specifications</h2>
            {specs && typeof specs === 'object' ? (
              <dl className="space-y-2">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd></div>
                ))}
              </dl>
            ) : <p className="text-sm text-muted-foreground">No specifications available.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-normal tracking-tight">Customer Reviews ({product.totalReviews || 0})</h2>
          {isAuthenticated && user?.role === 'CUSTOMER' && (
            <Button variant="outline" onClick={() => setShowReviewForm((s) => !s)}><MessageSquare className="h-4 w-4" /> {showReviewForm ? 'Cancel' : 'Write a Review'}</Button>
          )}
        </div>

        {showReviewForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Field label="Your Rating">
                  <StarRating rating={reviewRating} size={28} interactive onChange={setReviewRating} />
                </Field>
                <Field label="Your Review">
                  <Textarea rows={4} placeholder="Share your experience with this product..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                </Field>
                <Button onClick={submitReview} loading={submittingReview}>Submit Review</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {reviewsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to review this product." />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{(r.userName || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium">{r.userName || 'Anonymous'}</p>
                          <div className="flex items-center gap-2"><StarRating rating={r.rating} size={14} /><span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span></div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {totalReviewPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={reviewPage === 0} onClick={() => setReviewPage((p) => p - 1)}>Previous</Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">Page {reviewPage + 1} of {totalReviewPages}</span>
                <Button variant="outline" size="sm" disabled={reviewPage >= totalReviewPages - 1} onClick={() => setReviewPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* You may also like */}
      {(relatedLoading || relatedProducts.length > 0) && (
        <div>
          <div className="mb-5">
            <span className="eyebrow">More to explore</span>
            <h2 className="mt-1.5 font-editorial text-2xl font-normal tracking-tight">You May Also Like</h2>
          </div>
          {relatedLoading ? (
            <div className="grid grid-cols-np2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
