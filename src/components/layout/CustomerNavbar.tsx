import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, User, Menu, X, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleTheme } from '../../store/uiSlice';
import { logout } from '../../store/authSlice';
import { cn, getInitials } from '../../lib/utils';
import NotificationBell from '../shared/NotificationBell';

export default function CustomerNavbar() {
  const [scrolled, setScrolled] = useState(false); const [mm, setMm] = useState(false); const [um, setUm] = useState(false); const [sq, setSq] = useState('');
  const navigate = useNavigate(); const loc = useLocation(); const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth); const { itemCount } = useAppSelector((s) => s.cart); const { theme } = useAppSelector((s) => s.ui);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 10); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => { setMm(false); setUm(false); }, [loc.pathname]);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (sq.trim()) navigate(`/shop/products?q=${encodeURIComponent(sq)}`); };
  const handleLogout = async () => { await dispatch(logout()); navigate('/'); };
  const links = [{ to: '/shop', label: 'Home' }, { to: '/shop/products', label: 'Products' }, { to: '/shop/orders', label: 'Orders' }, { to: '/shop/wishlist', label: 'Wishlist' }];
  return (
    <header className={cn('sticky top-0 z-40 w-full transition-all duration-300', scrolled ? 'bg-background/90 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-md' : 'bg-background')}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMm(true)} className="rounded-lg p-2 hover:bg-accent lg:hidden"><Menu className="h-5 w-5" /></button>
            <Link to="/shop" className="flex items-center gap-0.5">
              <span className="font-editorial text-[1.6rem] font-medium tracking-tight text-foreground">Shop<span className="italic text-primary">Verse</span></span>
            </Link>
          </div>
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="group relative py-2 text-[0.85rem] font-medium tracking-wide text-foreground/75 transition-colors hover:text-foreground">
                {l.label}
                <span className={cn('absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100', loc.pathname === l.to && 'scale-x-100')} />
              </Link>
            ))}
          </nav>
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xs md:block">
            <div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Search products..." className="h-10 w-full rounded-full border border-input bg-secondary/60 pl-10 pr-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:bg-card" /></div>
          </form>
          <div className="flex items-center gap-1">
            <button onClick={() => dispatch(toggleTheme())} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">{theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>
            <Link to="/shop/wishlist" className="hidden rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors sm:block"><Heart className="h-[18px] w-[18px]" /></Link>
            <NotificationBell basePath="/api/customer" />
            <Link to="/shop/cart" className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"><ShoppingCart className="h-[18px] w-[18px]" />{itemCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground">{itemCount}</motion.span>}</Link>
            <div className="relative ml-1">
              <button onClick={() => setUm(!um)} className="flex items-center gap-1.5 rounded-full p-1 hover:bg-accent transition-colors"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[0.8rem] font-semibold text-primary-foreground">{getInitials(user?.name || 'U')}</div><ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" /></button>
              <AnimatePresence>
                {um && <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute right-0 top-12 w-56 overflow-hidden rounded-lg border border-border/70 bg-card shadow-luxury-lg">
                  <div className="border-b border-border/70 p-3"><p className="text-sm font-medium">{user?.name}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
                  <div className="p-1">
                    <Link to="/shop/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"><User className="h-4 w-4" />Profile</Link>
                    <Link to="/shop/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"><ShoppingCart className="h-4 w-4" />Orders</Link>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"><LogOut className="h-4 w-4" />Logout</button>
                  </div>
                </motion.div>}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mm && <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMm(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-border bg-card p-4 lg:hidden">
            <div className="mb-6 flex items-center justify-between"><span className="font-editorial text-lg font-medium">Menu</span><button onClick={() => setMm(false)} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSearch} className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Search..." className="h-10 w-full rounded-full border border-input bg-secondary/60 pl-10 pr-4 text-sm" /></div></form>
            <nav className="space-y-1">{links.map((l) => <Link key={l.to} to={l.to} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">{l.label}</Link>)}</nav>
          </motion.div>
        </>}
      </AnimatePresence>
    </header>
  );
}
