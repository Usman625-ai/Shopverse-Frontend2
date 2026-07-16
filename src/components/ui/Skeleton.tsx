import { cn } from '../../lib/utils';
export function Skeleton({ className }: { className?: string }) { return <div className={cn('skeleton h-4 w-full', className)} />; }
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-1">{Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}</div>;
}
