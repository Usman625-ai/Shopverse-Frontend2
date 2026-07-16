import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
interface P { children: ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLElement>) => void; }
export function Table({ children, className }: P) { return <div className={cn('w-full overflow-x-auto scrollbar-thin', className)}><table className="w-full caption-bottom text-sm">{children}</table></div>; }
export function TableHeader({ children }: P) { return <thead className="border-b border-border bg-muted/40">{children}</thead>; }
export function TableBody({ children }: P) { return <tbody className="divide-y divide-border/70">{children}</tbody>; }
export function TableRow({ children, className, onClick }: P) { return <tr className={cn('transition-colors hover:bg-primary/[0.03]', onClick && 'cursor-pointer', className)} onClick={onClick}>{children}</tr>; }
export function TableHead({ children, className }: P) { return <th className={cn('h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground', className)}>{children}</th>; }
export function TableCell({ children, className, onClick }: P) { return <td className={cn('p-4 align-middle', className)} onClick={onClick}>{children}</td>; }
