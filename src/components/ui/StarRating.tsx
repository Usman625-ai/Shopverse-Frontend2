import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
interface P { rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void; className?: string; }
export default function StarRating({ rating, size = 16, interactive = false, onChange, className }: P) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={!interactive} onClick={() => interactive && onChange?.(s)} className={cn(interactive && 'cursor-pointer hover:scale-110 transition-transform', !interactive && 'cursor-default')}>
          <Star size={size} className={cn(s <= Math.round(rating) ? 'fill-warning text-warning' : 'fill-muted text-muted-foreground')} />
        </button>
      ))}
    </div>
  );
}
