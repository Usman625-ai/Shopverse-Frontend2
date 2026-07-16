import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { CustomerLayout, DashboardLayout, ProtectedRoute } from './components/layout';
import { LandingPage, LoginPage, RegisterPage, UnauthorizedPage } from './pages/auth';
import {
  AdminDashboard, SellersPage, CategoriesPage, CouponsPage,
  OrdersPage as AdminOrdersPage, ProductsPage as AdminProductsPage,
  ReportsPage as AdminReportsPage, SettingsPage as AdminSettingsPage,
} from './pages/admin';
import {
  SellerDashboard, ProductsPage as SellerProductsPage,
  OrdersPage as SellerOrdersPage, RevenuePage,
  SettingsPage as SellerSettingsPage, ReportsPage as SellerReportsPage,
} from './pages/seller';
import {
  HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage,
  OrdersPage, ProfilePage, WishlistPage, NotificationsPage,
} from './pages/shop';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onBack={() => window.history.back()} onSwitchToRegister={() => { window.location.href = '/register'; }} />} />
        <Route path="/register" element={<RegisterPage onBack={() => window.history.back()} onSwitchToLogin={() => { window.location.href = '/login'; }} />} />
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
    </ErrorBoundary>
  );
}
