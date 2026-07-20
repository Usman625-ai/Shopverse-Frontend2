import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface Crumb { label: string; to?: string }

interface PageHeaderProps {
  icon?: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  right?: ReactNode;
}

export default function PageHeader({ icon: Icon, eyebrow, title, subtitle, crumbs, right }: PageHeaderProps) {
  return (
    <section className="relative border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-6 sm:px-6 lg:px-8">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/shop" className="transition-colors hover:text-foreground">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {c.to ? <Link to={c.to} className="transition-colors hover:text-foreground">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
              <span className="eyebrow">{eyebrow}</span>
            </div>
            <h1 className="mt-2 font-editorial text-3xl font-normal tracking-tight sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </div>
      <div className="h-[3px] w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
    </section>
  );
}