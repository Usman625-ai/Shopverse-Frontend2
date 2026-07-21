import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Category } from '../types';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

/**
 * The category endpoints return a nested tree (root categories with a
 * `children` array populated recursively). Some UI needs a flat list of
 * EVERY category — parents and all levels of subcategories — for example
 * to populate a "select a category" dropdown or a filter rail. This walks
 * the tree and returns every node as a flat array, tagging each with its
 * `depth` (0 = root) so callers can indent/label subcategories.
 */
export function flattenCategories(cats: Category[] = []): Array<Category & { depth: number }> {
  const out: Array<Category & { depth: number }> = [];
  const walk = (list: Category[], depth: number) => {
    list.forEach((c) => {
      // Drop the nested `children` reference on the flat entry itself —
      // consumers that rebuild a tree (e.g. buildTree by parentId) should
      // recompute it fresh rather than carry around a stale nested subtree.
      const { children, ...rest } = c;
      out.push({ ...rest, depth });
      if (children && children.length > 0) walk(children, depth + 1);
    });
  };
  walk(cats, 0);
  return out;
}

export function formatPrice(price: number | string, currency: string = 'PKR'): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}
export function formatNumber(num: number): string { return new Intl.NumberFormat('en-US').format(num); }
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}
export function truncate(str: string, length: number): string {
  if (!str) return ''; if (str.length <= length) return str; return str.slice(0, length) + '...';
}
export function getInitials(name: string): string {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
export function getDiscountPercentage(price: number, discountedPrice?: number): number {
  if (!discountedPrice || discountedPrice >= price) return 0;
  return Math.round(((price - discountedPrice) / price) * 100);
}
export function getEffectivePrice(product: { price: number; discountedPrice?: number }): number {
  return product.discountedPrice && product.discountedPrice < product.price ? product.discountedPrice : product.price;
}
export function getProductImages(product?: { images?: Array<string | { url?: string; imageUrl?: string }>; imageUrls?: string[]; primaryImageUrl?: string }): string[] {
  if (!product) return [];
  if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
  if (!product.images || product.images.length === 0) {
    return product.primaryImageUrl ? [product.primaryImageUrl] : [];
  }
  return product.images.map((img) => {
    if (typeof img === 'string') return img;
    return img.imageUrl || img.url || '';
  }).filter(Boolean);
}

/**
 * Cloudinary lets you request a resized/optimized variant just by inserting
 * a transform segment into the existing URL — no re-upload needed. We
 * always uploaded originals at up to 1200px, so a 96px cart thumbnail was
 * downloading the same bytes as the full product-detail hero image.
 * Non-Cloudinary URLs (fallback/local/dev images) are returned unchanged.
 */
export function cloudinaryResize(url: string, width: number): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto,c_limit/`);
}
export const storage = {
  get: (key: string) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : null; } catch { return null; } },
  set: (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove: (key: string) => { try { localStorage.removeItem(key); } catch {} },
};
export function downloadBlob(data: BlobPart, filename: string) {
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}