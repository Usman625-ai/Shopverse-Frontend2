import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { CustomerLayout, DashboardLayout, ProtectedRoute } from './components/layout';
import { LandingPage, LoginPage, RegisterPage, UnauthorizedPage } from './pages/auth';

// Route-level code splitting: each page below is its own chunk, only
// downloaded when that route is actually visited. Auth pages stay eager
// above since they're on the critical first-load path for most visitors.

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const SellersPage = lazy(() => import('./pages/admin/SellersPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const CouponsPage = lazy(() => import('./pages/admin/CouponsPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Seller
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const SellerProductsPage = lazy(() => import('./pages/seller/ProductsPage'));
const SellerOrdersPage = lazy(() => import('./pages/seller/OrdersPage'));
const RevenuePage = lazy(() => import('./pages/seller/RevenuePage'));
const SellerSettingsPage = lazy(() => import('./pages/seller/SettingsPage'));
const SellerReportsPage = lazy(() => import('./pages/seller/ReportsPage'));

// Shop (customer-facing)
const HomePage = lazy(() => import('./pages/shop/HomePage'));
const ProductsPage = lazy(() => import('./pages/shop/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/shop/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/shop/CartPage'));
const CheckoutPage = lazy(() => import('./pages/shop/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/shop/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/shop/ProfilePage'));
const WishlistPage = lazy(() => import('./pages/shop/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/shop/NotificationsPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onBack={() => window.history.back()} onSwitchToRegister={() => { window.location.href = '/register'; }} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="sellers" element={<SellersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="/seller" element={<ProtectedRoute allowedRoles={['SELLER']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="settings" element={<SellerSettingsPage />} />
            <Route path="reports" element={<SellerReportsPage />} />
          </Route>

          <Route path="/shop" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerLayout /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="product/:slug" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
