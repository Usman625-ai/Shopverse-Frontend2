import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      {/* Trust strip */}
      <div className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          {[
            { icon: Truck, t: 'Nationwide Delivery', s: 'Fast shipping across Pakistan' },
            { icon: ShieldCheck, t: 'Verified Sellers', s: 'Quality checked marketplace' },
            { icon: CreditCard, t: 'Secure Checkout', s: 'JazzCash & Cash on Delivery' },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3 px-6 py-5">
              <f.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
              <div><p className="text-sm font-medium">{f.t}</p><p className="text-xs text-muted-foreground">{f.s}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">S</span>
              <span className="font-editorial text-xl font-medium tracking-tight">Shop<span className="italic text-primary">Verse</span></span>
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Your trusted multi-vendor marketplace. Curated goods from thousands of sellers across Pakistan.</p>
            <div className="mt-5 flex gap-2">
              <a href="#" className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>
          <div><h3 className="eyebrow">Shop</h3><ul className="mt-4 space-y-2.5 text-sm"><li><Link to="/shop/products" className="text-muted-foreground hover:text-foreground transition-colors">All Products</Link></li><li><Link to="/shop/cart" className="text-muted-foreground hover:text-foreground transition-colors">Cart</Link></li><li><Link to="/shop/wishlist" className="text-muted-foreground hover:text-foreground transition-colors">Wishlist</Link></li><li><Link to="/shop/orders" className="text-muted-foreground hover:text-foreground transition-colors">Track Order</Link></li></ul></div>
          <div><h3 className="eyebrow">Account</h3><ul className="mt-4 space-y-2.5 text-sm"><li><Link to="/shop/profile" className="text-muted-foreground hover:text-foreground transition-colors">Profile</Link></li><li><Link to="/shop/orders" className="text-muted-foreground hover:text-foreground transition-colors">Order History</Link></li><li><Link to="/shop/notifications" className="text-muted-foreground hover:text-foreground transition-colors">Notifications</Link></li></ul></div>
          <div><h3 className="eyebrow">Contact</h3><ul className="mt-4 space-y-3 text-sm"><li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> support@shopverse.pk</li><li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> +92 300 1234567</li><li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> Karachi, Pakistan</li></ul></div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs tracking-wide text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} ShopVerse. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
