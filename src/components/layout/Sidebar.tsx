import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Package, ShoppingCart, FolderTree, Ticket, Settings, FileBarChart, Store, LogOut, X, ChevronLeft, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/authSlice';
import { cn } from '../../lib/utils';

interface P { collapsed: boolean; mobileOpen?: boolean; onClose?: () => void; onToggleCollapse?: () => void; }

interface NavGroup { label: string; items: { to: string; label: string; icon: typeof LayoutDashboard }[]; }

const adminNav: NavGroup[] = [
  { label: 'Overview', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Marketplace', items: [
    { to: '/admin/sellers', label: 'Sellers', icon: Store },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  ] },
  { label: 'Insights', items: [{ to: '/admin/reports', label: 'Reports', icon: FileBarChart }] },
  { label: 'System', items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }] },
];
const sellerNav: NavGroup[] = [
  { label: 'Overview', items: [{ to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Shop', items: [
    { to: '/seller/products', label: 'Products', icon: Package },
    { to: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  ] },
  { label: 'Insights', items: [
    { to: '/seller/revenue', label: 'Revenue', icon: FileBarChart },
    { to: '/seller/reports', label: 'Reports', icon: FileBarChart },
  ] },
  { label: 'System', items: [{ to: '/seller/settings', label: 'Shop Settings', icon: Settings }] },
];

export default function Sidebar({ collapsed, mobileOpen, onClose, onToggleCollapse }: P) {
  const dispatch = useAppDispatch(); const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const groups = user?.role === 'ADMIN' ? adminNav : sellerNav;
  const handleLogout = async () => { await dispatch(logout()); navigate('/'); };
  return (
    <>
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />}
      </AnimatePresence>
      <aside className={cn('fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#15110d] transition-transform duration-300 border-r border-white/[0.06]', collapsed ? 'w-20' : 'w-64', mobileOpen ? 'translate-x-0' : '-translate-x-full', 'lg:translate-x-0')}>
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary-400 to-primary-600 font-editorial text-base font-semibold text-primary-foreground">S</div>
            {!collapsed && (
              <div className="leading-tight">
                <span className="block font-editorial text-lg font-medium tracking-tight text-[#f0e9dd]">Shop<span className="italic text-primary-400">Verse</span></span>
                <span className="flex items-center gap-1 text-[0.65rem] font-medium text-primary-300"><Sparkles className="h-2.5 w-2.5" />{user?.role === 'ADMIN' ? 'Administration' : 'Seller Console'}</span>
              </div>
            )}
          </div>
          {mobileOpen && <button onClick={onClose} className="rounded-lg p-1 text-[#f0e9dd] hover:bg-white/5 lg:hidden"><X className="h-5 w-5" /></button>}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-3">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/30">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map((i) => { const I = i.icon; return (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive ? 'bg-white/[0.07] text-primary-300' : 'text-white/55 hover:bg-white/[0.04] hover:text-white/90',
                      collapsed && 'justify-center'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <motion.span layoutId={`active-pill-${user?.role}`} className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-400" />}
                        <I className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                        {!collapsed && <span>{i.label}</span>}
                      </>
                    )}
                  </NavLink>
                ); })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <button onClick={handleLogout} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-destructive/10 hover:text-destructive', collapsed && 'justify-center')}>
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />{!collapsed && <span>Logout</span>}
          </button>
          {onToggleCollapse && <button onClick={onToggleCollapse} className="mt-1 hidden w-full items-center justify-center rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/70 lg:flex"><ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} /></button>}
        </div>
      </aside>
    </>
  );
}



