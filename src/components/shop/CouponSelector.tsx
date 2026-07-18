import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tag, X, ChevronDown, Check, BadgePercent } from 'lucide-react';
import api from '../../lib/api';
import type { Coupon, ApiResponse } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { Button, Input } from '../ui';

export interface AppliedCoupon {
  code: string;
  discount: number;
}

interface CouponSelectorProps {
  orderAmount: number;
  appliedCoupon?: AppliedCoupon;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}

/**
 * Coupon picker used on Cart & Checkout.
 * - Shows a dropdown of all currently-available coupons (with live discount preview).
 * - Also allows manual code entry.
 * - Only ONE coupon may be applied at a time — applying a new one replaces the old one,
 *   and the input/dropdown is hidden once a coupon is active (must remove first).
 */
export default function CouponSelector({ orderAmount, appliedCoupon, onApply, onRemove }: CouponSelectorProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [applying, setApplying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const loadCoupons = async () => {
    setLoadingList(true);
    try {
      const res = await api.get<ApiResponse<Coupon[]>>('/api/customer/coupons/active', { params: { orderAmount } });
      setCoupons(res.data.data || []);
    } catch {
      // silently ignore — dropdown just shows empty
    } finally {
      setLoadingList(false);
    }
  };

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) loadCoupons();
  };

  const applyCode = async (code: string) => {
    if (!code.trim()) { toast.error('Enter a coupon code'); return; }
    setApplying(true);
    try {
      const res = await api.post<ApiResponse<Coupon>>('/api/customer/coupons/validate', {
        couponCode: code.trim(),
        orderAmount,
      });
      const data = res.data.data;
      if (!data) throw new Error('Invalid response');
      onApply({ code: data.code, discount: data.applicableDiscount || 0 });
      toast.success(`Coupon ${data.code} applied — you saved ${formatPrice(data.applicableDiscount || 0)}`);
      setOpen(false);
      setManualCode('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Invalid or expired coupon code');
    } finally {
      setApplying(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-success" />
          <span className="font-medium text-success">{appliedCoupon.code}</span>
          <span className="text-xs text-success/80">· saved {formatPrice(appliedCoupon.discount)}</span>
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive" title="Remove coupon">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Coupon code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') applyCode(manualCode); }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => applyCode(manualCode)} loading={applying}>Apply</Button>
        <button
          type="button"
          onClick={handleOpen}
          title="View available coupons"
          className={cn(
            'flex shrink-0 items-center justify-center gap-1 rounded-lg border border-border px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            open && 'bg-accent text-foreground'
          )}
        >
          <BadgePercent className="h-4 w-4" />
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-20 mt-1 max-h-72 w-full min-w-[280px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-luxury"
          >
            {loadingList ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading coupons…</div>
            ) : coupons.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No coupons available right now.</div>
            ) : (
              coupons.map((c) => {
                const eligible = orderAmount >= c.minOrderValue;
                return (
                  <button
                    key={c.id}
                    disabled={!eligible || applying}
                    onClick={() => applyCode(c.code)}
                    className={cn(
                      'flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      eligible ? 'hover:bg-accent' : 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">{c.code}</span>
                        <span className="text-xs text-success">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `${formatPrice(c.discountValue)} off`}
                        </span>
                      </div>
                      {c.description && <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {eligible
                          ? `Min. order ${formatPrice(c.minOrderValue)}${typeof c.applicableDiscount === 'number' ? ` · save ${formatPrice(c.applicableDiscount)}` : ''}`
                          : `Requires min. order ${formatPrice(c.minOrderValue)}`}
                      </p>
                    </div>
                    {eligible && <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}