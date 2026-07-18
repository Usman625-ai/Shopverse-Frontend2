import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Menu, LogOut, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from '../shared/NotificationBell';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleTheme } from '../../store/uiSlice';
import { logout } from '../../store/authSlice';
import { cn, getInitials } from '../../lib/utils';

interface P { title?: string; subtitle?: string; }
export default function DashboardLayout({ title, subtitle }: P) {
  const [sc, setSc] = useState(false); const [ms, setMs] = useState(false); const [um, setUm] = useState(false);
  const dispatch = useAppDispatch(); const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth); const { theme } = useAppSelector((s) => s.ui);
  const handleLogout = async () => { await dispatch(logout()); navigate('/'); };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sc} onClose={ms ? () => setMs(false) : undefined} onToggleCollapse={() => setSc(!sc)} />
      <div className={cn('flex flex-col transition-all duration-300', sc ? 'lg:pl-20' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-7">
          <div className="flex items-center gap-4">
            <button onClick={() => setMs(true)} className="rounded-lg p-2 hover:bg-accent lg:hidden"><Menu className="h-5 w-5" /></button>
            <div>{title && <h1 className="text-[1.15rem] font-semibold tracking-tight">{title}</h1>}{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => dispatch(toggleTheme())} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">{theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>
            <NotificationBell basePath={user?.role === 'ADMIN' ? '/api/admin' : '/api/seller'} />
            <div className="ml-1.5 h-6 w-px bg-border" />
            <div className="relative">
              <button onClick={() => setUm(!um)} className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-accent transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[0.8rem] font-semibold text-primary-foreground">{getInitials(user?.name || 'U')}</div>
                <div className="hidden text-left sm:block"><p className="text-sm font-medium leading-tight">{user?.name || 'User'}</p><p className="text-[0.7rem] leading-tight text-muted-foreground capitalize">{user?.role?.toLowerCase() || 'role'}</p></div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
              </button>
              <AnimatePresence>
                {um && <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <div className="border-b border-border p-3"><p className="text-sm font-medium">{user?.name}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
                  <div className="p-1">
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"><LogOut className="h-4 w-4" />Logout</button>
                  </div>
                </motion.div>}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-7">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}><Outlet /></motion.div>
        </main>
      </div>
    </div>
  );
}
