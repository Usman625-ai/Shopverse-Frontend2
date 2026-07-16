# ShopVerse Frontend

Production-ready, responsive frontend for the ShopVerse multi-vendor e-commerce platform.

## Tech Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS 3.4 + Framer Motion 11
- Redux Toolkit 2.2
- React Hook Form 7.51 + Zod 3.22
- Recharts 2.12, Axios 1.6, Lucide React, Sonner, date-fns 3.6

## Getting Started

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend
npm run dev            # runs on http://localhost:5173
```

## Backend CORS

Your Spring Boot `SecurityConfig.java` already allows `http://localhost:5173`. No changes needed.

## Project Structure

```
src/
├── components/{layout,ui,shop}/
├── lib/{api.ts,utils.ts}
├── pages/{auth,admin,seller,shop}/
├── store/{authSlice,cartSlice,uiSlice,index}.ts
├── types/index.ts
├── App.tsx
└── main.tsx
```

## Features

- **Auth:** Landing page, Login/Register with OTP, role-based redirect, JWT refresh
- **Admin:** Dashboard with charts, seller/product/order/category/coupon management, settings, reports
- **Seller:** Dashboard, product CRUD with image upload, order management, revenue, shop settings, reports
- **Shop:** Homepage, product listing with filters, product detail with reviews, cart, checkout (COD/JazzCash), orders, wishlist, notifications, profile
- **UI:** Dark/light mode, responsive, animations, skeletons, toasts

## Suggested Backend Enhancements

1. `PUT /api/admin/products/{id}/status` — admin product activation toggle
2. `GET/PUT /api/admin/settings` — site name, contact email, currency symbol
3. `GET /api/seller/revenue/monthly` — monthly revenue chart data
4. `GET /api/products/featured` — homepage featured products
5. `GET /api/orders/{id}/status-history` — order tracking timeline
