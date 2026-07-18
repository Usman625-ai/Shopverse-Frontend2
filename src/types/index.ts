export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'JAZZCASH' | 'BANK_TRANSFER' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type NotificationType =
  | 'ORDER_PLACED' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED'
  | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED'
  | 'SELLER_APPROVED' | 'SELLER_REJECTED'
  | 'NEW_REVIEW' | 'LOW_STOCK' | 'GENERAL';
export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface User {
  id: number; name: string; email: string; role: UserRole;
  active: boolean; verified: boolean; contactNumber?: string;
  profileImage?: string; createdAt: string;
}
export interface Seller extends User {
  shopName?: string; shopDescription?: string; shopLogo?: string;
  shopBanner?: string; gstNumber?: string; panNumber?: string;
  sellerStatus: SellerStatus; rejectionReason?: string;
}

export interface Address {
  id: number;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  defaultAddress: boolean;
  fullAddress?: string;
}

export interface Category {
  id: number; name: string; slug: string; description?: string;
  imageUrl?: string; parentId?: number | null; children?: Category[];
  active?: boolean; displayOrder?: number; productCount?: number; depth?: number;
}

export interface ProductImage {
  id: number; imageUrl: string; primary: boolean; displayOrder: number;
}

export interface Product {
  id: number; name: string; slug: string; description: string; shortDescription?: string;
  price: number; discountedPrice?: number; effectivePrice?: number;
  stockQuantity: number; inStock?: boolean; sku?: string; brand?: string;
  images: ProductImage[];
  primaryImageUrl?: string;
  categoryId?: number; categoryName?: string;
  sellerId?: number; sellerName?: string; shopName?: string;
  category?: Category; seller?: Seller;
  averageRating: number; totalReviews: number; totalSold?: number;
  active: boolean; featured?: boolean; tags?: string; specifications?: string; createdAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  unitPrice: number;
  effectivePrice: number;
  quantity: number;
  itemTotal: number;
  availableStock: number;
  inStock: boolean;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  status: OrderStatus; comment?: string; updatedBy?: string; createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number; customerName?: string; customerEmail?: string;
  sellerId?: number; sellerName?: string; shopName?: string;
  orderItems: OrderItem[];
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount?: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress?: string;
  trackingNumber?: string;
  couponCode?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  cancellationReason?: string;
  statusHistory?: OrderStatusHistory[];
  cancellable?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: number; productId: number; userId: number; userName: string;
  rating: number; comment: string; verifiedPurchase?: boolean;
  helpfulCount?: number; createdAt: string;
}

export interface Coupon {
  id: number; code: string; description?: string;
  discountType: DiscountType; discountValue: number;
  minOrderValue: number; maxDiscount?: number;
  validFrom: string; validUntil: string;
  usageLimit?: number; usedCount: number;
  active: boolean; valid?: boolean; applicableDiscount?: number;
}

export interface Notification { id: number; title: string; message: string; type: NotificationType; read: boolean; createdAt: string; actionUrl?: string; }

export interface DashboardStats {
  totalUsers: number; totalSellers: number; approvedSellers: number; pendingSellerApprovals: number;
  totalCustomers: number; totalProducts: number; totalOrders: number; pendingOrders: number;
  totalRevenue: number; monthlyRevenue: number; todayRevenue: number;
  dailyRevenue: Record<string, number>;
  ordersByStatus: Record<string, number>;
}

export interface SellerDashboardStats {
  totalProducts: number; lowStockProducts: number; outOfStockProducts?: number;
  totalOrders: number; pendingOrders: number; activeOrders?: number;
  deliveredOrders?: number; cancelledOrders?: number;
  totalRevenue: number; monthlyRevenue?: number; todayRevenue?: number;
  shopName?: string; sellerStatus?: string;
  dailyRevenue: Record<string, number>;
  ordersByStatus?: Record<string, number>;
}

export interface PagedResponse<T> {
  content: T[]; totalElements: number; totalPages: number;
  pageSize: number; pageNumber: number; first: boolean; last: boolean;
}

export interface ApiResponse<T> { success: boolean; message: string; data: T; error?: string; }

export interface AuthResponse {
  userId: number; name: string; email: string; role: UserRole;
  accessToken: string; refreshToken: string; tokenType: string;
  expiresIn: number; verified: boolean; sellerApproved: boolean;
}

export interface JazzCashPaymentResponse { hostedPageUrl: string; formParams: Record<string, string>; orderNumber: string; }
export interface SystemSettings { maintenanceMode: boolean; allowSellerRegistration?: boolean; }