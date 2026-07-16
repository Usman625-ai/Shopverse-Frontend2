import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-editorial text-xl font-medium tracking-tight">Shop<span className="italic text-primary">Verse</span></span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Your trusted multi-vendor marketplace. Curated goods from thousands of sellers across Pakistan.</p>
            <div className="mt-5 flex gap-2">
              <a href="#" className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>
          <div><h3 className="eyebrow">Shop</h3><ul className="mt-4 space-y-2.5 text-sm"><li><Link to="/shop/products" className="text-muted-foreground hover:text-foreground transition-colors">All Products</Link></li><li><Link to="/shop/cart" className="text-muted-foreground hover:text-foreground transition-colors">Cart</Link></li><li><Link to="/shop/wishlist" className="text-muted-foreground hover:text-foreground transition-colors">Wishlist</Link></li><li><Link to="/shop/orders" className="text-muted-foreground hover:text-foreground transition-colors">Track Order</Link></li></ul></div>
          <div><h3 className="eyebrow">Account</h3><ul className="mt-4 space-y-2.5 text-sm"><li><Link to="/shop/profile" className="text-muted-foreground hover:text-foreground transition-colors">Profile</Link></li><li><Link to="/shop/orders" className="text-muted-foreground hover:text-foreground transition-colors">Order History</Link></li><li><Link to="/shop/notifications" className="text-muted-foreground hover:text-foreground transition-colors">Notifications</Link></li></ul></div>
          <div><h3 className="eyebrow">Contact</h3><ul className="mt-4 space-y-3 text-sm"><li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> support@shopverse.pk</li><li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> +92 300 1234567</li><li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> Karachi, Pakistan</li></ul></div>
        </div>
        <div className="divider-fade mt-10" />
        <div className="mt-6 text-center text-xs tracking-wide text-muted-foreground"><p>&copy; {new Date().getFullYear()} ShopVerse. All rights reserved.</p></div>
      </div>
    </footer>
  );
}
