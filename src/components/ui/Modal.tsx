import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean; onClose: () => void; title?: string; description?: string;
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: ReactNode;
}
const sz = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export default function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className={cn('relative z-50 w-full rounded-xl border border-border/70 bg-card shadow-luxury-lg', sz[size])}>
            {(title || description) && (
              <div className="flex items-start justify-between p-6 pb-4">
                <div>
                  {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent transition-colors"><X className="h-5 w-5" /></button>
              </div>
            )}
            <div className="p-6 pt-0">{children}</div>
            {footer && <div className="flex justify-end gap-3 p-6 pt-0">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body
  );
}
